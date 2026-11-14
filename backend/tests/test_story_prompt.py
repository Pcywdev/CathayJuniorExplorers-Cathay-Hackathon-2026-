"""Story prompt (pure): only the four allowed inputs go in, and the rules match the age band."""

import inspect
import json

import pytest

from app.config import FIXTURES_DIR
from app.logic import story_prompt
from app.logic.story_prompt import READING_LEVELS, StoryInputs, build_prompt, flight_length_words
from app.models.story import Story

EXAMPLE = Story.model_validate(json.loads((FIXTURES_DIR / "stories" / "fallback.json").read_text(encoding="utf-8"))).chapters[0]
TOKYO = StoryInputs(city="Tokyo", duration_minutes=235, aircraft="Airbus A330-300", age_band="6-8")


def prompt(inputs: StoryInputs = TOKYO) -> str:
    system, user = build_prompt(inputs, example=EXAMPLE)
    return system + "\n" + user


@pytest.mark.parametrize("minutes, words", [
    (50, "less than an hour"), (60, "about 1 hour"), (95, "about 2 hours"), (235, "about 4 hours"), (780, "about 13 hours"),
])
def test_flight_length_in_words(minutes, words):
    assert flight_length_words(minutes) == words


def test_prompt_has_the_trip_inputs():
    text = prompt()
    assert "Tokyo" in text and "about 4 hours" in text and "Airbus A330-300" in text
    assert "6-8" in text


def test_child_name_cannot_be_passed_in():
    assert set(inspect.signature(StoryInputs).parameters) == {"city", "duration_minutes", "aircraft", "age_band"}
    assert "name" not in inspect.signature(build_prompt).parameters
    assert "{name}" in prompt()  # the model is told to write the placeholder instead


def test_reading_rules_follow_the_age_band():
    young, older = prompt(), prompt(StoryInputs("Tokyo", 235, "Airbus A330-300", "9-12"))
    assert f"{READING_LEVELS['6-8'].max_sentence_words} words" in young
    assert f"{READING_LEVELS['9-12'].max_sentence_words} words" in older
    assert young != older


def test_prompt_asks_for_all_seven_versions_as_json():
    text = prompt()
    for number, branch in [(1, "both"), (2, "on_time"), (2, "delayed"), (3, "on_time"), (3, "delayed"), (4, "on_time"), (4, "delayed")]:
        assert f'"number": {number}, "key": ' in text and f'"branch": "{branch}"' in text
    assert "JSON" in text


def test_prompt_states_the_safety_rules():
    text = prompt().lower()
    for rule in ("no real people", "no brands", "never scary", "extra time"):
        assert rule in text


def test_example_chapter_is_included():
    assert EXAMPLE.text["en"].pages[0] in prompt()


def test_unknown_age_band_raises():
    with pytest.raises(ValueError):
        build_prompt(StoryInputs("Tokyo", 235, "Airbus A330-300", "3-5"), example=EXAMPLE)


def test_module_does_no_io():
    source = inspect.getsource(story_prompt)
    assert "open(" not in source and "read_text" not in source and "httpx" not in source
