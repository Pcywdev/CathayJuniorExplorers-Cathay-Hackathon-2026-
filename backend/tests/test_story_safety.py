"""Story safety (pure): parse AI output, then length, readability, banned words and placeholders."""

import json

import pytest

from app.config import FIXTURES_DIR
from app.logic.story_safety import StoryRejected, check_story, parse_story

FALLBACK_TEXT = (FIXTURES_DIR / "stories" / "fallback.json").read_text(encoding="utf-8")


def raw_story() -> dict:
    return json.loads(FALLBACK_TEXT)


def with_page(page: str, title: str | None = None, index: int = 1) -> str:
    """The fallback story with one chapter's page (and optionally title) replaced, as AI-style text."""
    story = raw_story()
    text = story["chapters"][index]["text"]["en"]
    text["pages"] = [page]
    if title is not None:
        text["title"] = title
    return json.dumps(story)


def reasons(raw: str, age_band: str = "6-8") -> list[str]:
    return check_story(parse_story(raw), age_band)


# --- parse_story -------------------------------------------------------------

def test_good_json_parses():
    assert len(parse_story(FALLBACK_TEXT).chapters) == 7


def test_json_inside_code_fences_parses():
    assert len(parse_story("```json\n" + FALLBACK_TEXT + "\n```").chapters) == 7


@pytest.mark.parametrize("raw, why", [
    ("Once upon a time...", "not JSON"),
    ('{"title": {"en": "x"}}', "shape"),
    (json.dumps({**raw_story(), "chapters": raw_story()["chapters"][:-1]}), "missing chapter versions"),
])
def test_bad_output_is_rejected_with_a_reason(raw, why):
    with pytest.raises(StoryRejected) as exc:
        parse_story(raw)
    assert any(why in r for r in exc.value.reasons)


# --- check_story ---------------------------------------------------------------

@pytest.mark.parametrize("age_band", ["6-8", "9-12"])
def test_fallback_story_passes_every_check(age_band):
    assert reasons(FALLBACK_TEXT, age_band) == []


def test_long_sentence_fails_for_6_8_but_not_9_12():
    long = "Pip and {name} look out of the big round window and see the long grey runway shine in the sun."  # 20 words
    assert any("sentence" in r and "chapter 2" in r for r in reasons(with_page(long), "6-8"))
    assert reasons(with_page(long), "9-12") == []


def test_long_page_and_title_fail():
    page = " ".join(["Pip hops along the wing."] * 12)  # 60 words
    assert any("page" in r for r in reasons(with_page(page), "6-8"))
    title = "A very long title that just keeps on going and going"
    assert any("title" in r for r in reasons(with_page("Pip waves.", title=title)))


@pytest.mark.parametrize("word", ["crash", "Crashing", "scary", "DANGER", "died", "monsters", "Cathay", "Boeing"])
def test_banned_words_fail(word):
    assert any(word.lower() in r for r in reasons(with_page(f"Pip sees something {word} today.")))


@pytest.mark.parametrize("ok", ["Pip had a rehearsal.", "A diet of snacks.", "The scarf is blue.", "Pip sees a killer whale toy."])
def test_harmless_words_are_not_flagged_except_real_stems(ok):
    found = reasons(with_page(ok))
    # "killer" starts with the banned stem "kill" and is caught on purpose (word-start match).
    if "killer" in ok:
        assert any("kill" in r for r in found)
    else:
        assert found == []


def test_emoji_and_markdown_fail():
    assert any("emoji" in r for r in reasons(with_page("Pip waves ✈️ hello.")))
    assert any("markdown" in r for r in reasons(with_page("Pip **waves** hello.")))


def test_every_reason_names_where_it_is():
    found = reasons(with_page("Pip sees a crash.", index=3))
    assert found and all("chapter 3" in r for r in found)
