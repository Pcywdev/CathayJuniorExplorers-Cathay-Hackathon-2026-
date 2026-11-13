"""Story logic (pure): structure check, placeholder filling, offline unlock time, and the fallback file itself."""

import json

import pytest

from app.config import FIXTURES_DIR
from app.logic.story import StoryInvalid, fill, prepare, unlock_at, validate_story
from app.models.flight import Flight
from app.models.story import Story

FALLBACK = FIXTURES_DIR / "stories" / "fallback.json"
EXPECTED_VERSIONS = [(1, "both"), (2, "on_time"), (2, "delayed"), (3, "on_time"), (3, "delayed"), (4, "on_time"), (4, "delayed")]


@pytest.fixture
def flight() -> Flight:
    return Flight.model_validate({
        "carrier": "CX", "number": "500", "date": "2026-11-14",
        "origin": {"iata": "HKG", "city": "Hong Kong", "terminal": "1"},
        "destination": {"iata": "NRT", "city": "Tokyo", "terminal": "2"},
        "departure": {"local": "2026-11-14T15:25:00+08:00", "utc": "2026-11-14T07:25:00Z"},
        "arrival": {"local": "2026-11-14T20:20:00+09:00", "utc": "2026-11-14T11:20:00Z"},
        "durationMinutes": 235, "distanceKm": 2962,
        "aircraft": {"iata": "333", "name": "Airbus A330-300"},
        "gate": "23", "seat": "34K", "synthetic": ["gate", "seat"],
        "status": {}, "source": "fixture",
    })


def raw_fallback() -> dict:
    return json.loads(FALLBACK.read_text(encoding="utf-8"))


def story(**changes) -> Story:
    return Story.model_validate({**raw_fallback(), **changes})


def chapters_without(number: int, branch: str) -> list[dict]:
    return [c for c in raw_fallback()["chapters"] if (c["number"], c["branch"]) != (number, branch)]


# --- the fallback file -------------------------------------------------------

def test_fallback_file_is_a_valid_story():
    s = story()
    validate_story(s)
    assert [(c.number, c.branch) for c in s.chapters] == EXPECTED_VERSIONS
    assert all(len(c.text["en"].pages) == 1 for c in s.chapters)
    assert s.title["en"]


def test_fallback_uses_only_known_placeholders_and_mentions_the_trip():
    text = FALLBACK.read_text(encoding="utf-8")
    assert "{name}" in text and "{city}" in text and "{gate}" in text


# --- validate_story ----------------------------------------------------------

def test_missing_version_is_invalid():
    with pytest.raises(StoryInvalid, match="2 delayed"):
        validate_story(story(chapters=chapters_without(2, "delayed")))


def test_duplicate_version_is_invalid():
    chapters = raw_fallback()["chapters"]
    with pytest.raises(StoryInvalid, match="duplicate"):
        validate_story(story(chapters=chapters + [chapters[0]]))


def test_wrong_key_or_unlock_for_a_chapter_is_invalid():
    chapters = raw_fallback()["chapters"]
    chapters[0] = {**chapters[0], "unlockOn": "landed"}
    with pytest.raises(StoryInvalid, match="chapter 1"):
        validate_story(story(chapters=chapters))


def test_unknown_placeholder_is_invalid():
    chapters = raw_fallback()["chapters"]
    chapters[1] = {**chapters[1], "text": {"en": {"title": "Seat {seat}", "pages": ["Hi {name}."]}}}
    with pytest.raises(StoryInvalid, match="seat"):
        validate_story(story(chapters=chapters))


def test_missing_english_or_too_many_pages_fails_the_shape():
    chapters = raw_fallback()["chapters"]
    with pytest.raises(ValueError):
        story(chapters=[{**chapters[0], "text": {"zh-Hant": {"title": "t", "pages": ["p"]}}}] + chapters[1:])
    with pytest.raises(ValueError):
        story(chapters=[{**chapters[0], "text": {"en": {"title": "t", "pages": ["a", "b", "c", "d"]}}}] + chapters[1:])


# --- fill --------------------------------------------------------------------

def test_fill_replaces_every_placeholder_in_titles_and_pages():
    filled = fill(story(), name="Mei", city="Tokyo", gate="23")
    text = filled.model_dump_json()
    assert "{" not in text.replace('{"', "").replace("{}", "")  # no {placeholder} left
    assert "Mei" in text and "Tokyo" in text and "23" in text


def test_fill_does_not_touch_the_template():
    s = story()
    fill(s, name="Mei", city="Tokyo", gate="23")
    assert "{name}" in s.model_dump_json()


# --- unlock_at ---------------------------------------------------------------

def landing(s: Story):
    return next(c for c in s.chapters if c.key == "landing")


def test_landing_unlocks_at_scheduled_arrival_plus_delay(flight):
    s = story()
    assert unlock_at(landing(s), flight, delay_minutes=0) == "2026-11-14T11:20:00Z"
    assert unlock_at(landing(s), flight, delay_minutes=40) == "2026-11-14T12:00:00Z"


def test_other_chapters_have_no_unlock_time(flight):
    s = story()
    assert all(unlock_at(c, flight, delay_minutes=40) is None for c in s.chapters if c.key != "landing")


# --- prepare (what the endpoint serves) ---------------------------------------

def test_prepare_fills_and_sets_unlock_times(flight):
    served = prepare(story(), name="Mei", flight=flight, delay_minutes=40)

    assert [(c.number, c.branch) for c in served.chapters] == EXPECTED_VERSIONS
    assert [c.unlock_at for c in served.chapters if c.key == "landing"] == ["2026-11-14T12:00:00Z"] * 2
    assert "Mei" in served.chapters[0].text["en"].pages[0]
