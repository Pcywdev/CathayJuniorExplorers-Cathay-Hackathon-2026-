"""services/stories.story_for with the AI step: fixture -> (LLM_LIVE) AI + safety -> fallback. No network."""

import json

import pytest

from app.config import FIXTURES_DIR, Settings
from app.models.flight import Flight
from app.services import stories
from app.services.llm import LlmUnavailable

FALLBACK = json.loads((FIXTURES_DIR / "stories" / "fallback.json").read_text(encoding="utf-8"))


@pytest.fixture
def flight() -> Flight:
    # A date with no reviewed story fixture, so the AI step is reached.
    return Flight.model_validate({
        "carrier": "CX", "number": "500", "date": "2030-01-01",
        "origin": {"iata": "HKG", "city": "Hong Kong", "terminal": "1"},
        "destination": {"iata": "NRT", "city": "Tokyo", "terminal": "2"},
        "departure": {"local": "2030-01-01T15:25:00+08:00", "utc": "2030-01-01T07:25:00Z"},
        "arrival": {"local": "2030-01-01T20:20:00+09:00", "utc": "2030-01-01T11:20:00Z"},
        "durationMinutes": 235, "distanceKm": 2962,
        "aircraft": {"iata": "333", "name": "Airbus A330-300"},
        "gate": "23", "seat": "34K", "synthetic": ["gate", "seat"],
        "status": {}, "source": "fixture",
    })


def settings(**kw) -> Settings:
    return Settings(_env_file=None, **{"llm_provider": "fake", "llm_live": True, **kw})


def ai_story_with(text: str) -> str:
    data = json.loads(json.dumps(FALLBACK))
    data["chapters"][2]["text"]["en"]["pages"] = [text]
    return json.dumps(data)


@pytest.fixture
def prompts(monkeypatch):
    """Replace the AI with a recorder; set `prompts.reply` to choose what it returns."""
    seen = []

    class Recorder:
        reply: str | Exception = json.dumps(FALLBACK)

    def fake_complete(system, user, _settings):
        seen.append(system + "\n" + user)
        if isinstance(Recorder.reply, Exception):
            raise Recorder.reply
        return Recorder.reply

    monkeypatch.setattr(stories, "complete_json", fake_complete)
    Recorder.seen = seen
    return Recorder


def test_a_safe_ai_story_is_used(flight, prompts):
    story, by = stories.story_for(flight, "6-8", settings())
    assert by == "llm"
    assert len(story.chapters) == 7


def test_ai_is_not_called_when_llm_live_is_off(flight, prompts):
    _, by = stories.story_for(flight, "6-8", settings(llm_live=False))
    assert by == "fallback"
    assert prompts.seen == []


def test_a_story_that_fails_safety_falls_back_and_logs_reasons(flight, prompts, caplog):
    prompts.reply = ai_story_with("The scary storm made everyone hide.")
    _, by = stories.story_for(flight, "6-8", settings())
    assert by == "fallback"
    assert "banned word 'scary'" in caplog.text


def test_unparseable_ai_reply_falls_back(flight, prompts, caplog):
    prompts.reply = "Once upon a time"
    _, by = stories.story_for(flight, "6-8", settings())
    assert by == "fallback"
    assert "not JSON" in caplog.text


def test_ai_unavailable_falls_back(flight, prompts, caplog):
    prompts.reply = LlmUnavailable("AI call failed: APIConnectionError")
    _, by = stories.story_for(flight, "6-8", settings())
    assert by == "fallback"
    assert "APIConnectionError" in caplog.text


def test_prompt_never_contains_the_childs_name_or_the_manufacturer(flight, prompts):
    stories.story_for(flight, "6-8", settings())
    prompt = prompts.seen[0]
    assert "Mei" not in prompt
    assert "Airbus" not in prompt
    assert "A330-300" in prompt and "Tokyo" in prompt


def test_generate_returns_the_reasons_for_the_slide(flight, prompts):
    prompts.reply = ai_story_with("The scary storm made everyone hide.")
    result = stories.generate(flight, "6-8", settings())
    assert result.story is None
    assert any("scary" in r for r in result.reasons)
    assert result.raw == prompts.reply


def test_plain_aircraft_strips_known_makers():
    assert stories.plain_aircraft("Airbus A330-300") == "A330-300"
    assert stories.plain_aircraft("Boeing 777-300ER") == "777-300ER"
    assert stories.plain_aircraft("A350-900") == "A350-900"
