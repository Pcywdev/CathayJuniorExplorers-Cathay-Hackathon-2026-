"""Where a trip's story comes from. Fixture-first, like services/oag.py.

Order:  reviewed story fixture for this flight + age band
    ->  (only if LLM_LIVE) one AI call, then parse + safety checks + moderation
    ->  pre-written fallback.
Whatever is returned is a template: placeholders are filled only when a phone asks for it.
The AI is told four things only (destination, flight length, aircraft, age band), never the child.
"""

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

from pydantic import ValidationError

from app.config import Settings
from app.logic.story import StoryInvalid, validate_story
from app.logic.story_prompt import StoryInputs, build_prompt
from app.logic.story_safety import StoryRejected, check_story, parse_story
from app.models.flight import Flight
from app.models.story import GeneratedBy, Story
from app.services.llm import LlmUnavailable, complete_json, moderate

log = logging.getLogger(__name__)

# Manufacturer names are banned in stories (no brands), so the prompt doesn't carry them either.
_MAKERS = ("airbus", "boeing", "embraer", "bombardier")


@dataclass
class Generation:
    """One AI attempt: the story if it passed, otherwise the reasons. `raw` is the model's text."""

    story: Story | None
    reasons: list[str] = field(default_factory=list)
    raw: str = ""
    checks: list[str] = field(default_factory=list)


def story_for(flight: Flight, age_band: str, settings: Settings) -> tuple[Story, GeneratedBy]:
    fixture = fixture_path(settings.fixtures_dir, flight, age_band)
    if fixture.exists():
        try:
            # A saved fixture is a reviewed AI story (generated once on site, read by a person).
            return _load(fixture), "llm"
        except (ValueError, ValidationError) as exc:
            log.warning("Story fixture %s is unusable, using the fallback: %s", fixture.name, exc)
    if settings.llm_live:
        result = generate(flight, age_band, settings)
        if result.story is not None:
            return result.story, "llm"
        log.warning("AI story rejected, using the fallback: %s", "; ".join(result.reasons))
    return fallback_story(settings), "fallback"


def generate(flight: Flight, age_band: str, settings: Settings) -> Generation:
    """One AI call with every safety check. Never raises for AI or content problems."""
    inputs = StoryInputs(
        city=flight.destination.city,
        duration_minutes=flight.duration_minutes,
        aircraft=plain_aircraft(flight.aircraft.name),
        age_band=age_band,
    )
    example = fallback_story(settings).chapters[0]
    system, user = build_prompt(inputs, example=example)
    try:
        raw = complete_json(system, user, settings)
    except LlmUnavailable as exc:
        return Generation(None, [str(exc)])
    try:
        story = parse_story(raw)
    except StoryRejected as exc:
        return Generation(None, exc.reasons, raw)
    reasons = check_story(story, age_band)
    if reasons:
        return Generation(None, reasons, raw)
    checks = ["JSON shape passed", f"content rules for {age_band} passed"]
    try:
        checks.append(moderate(_all_text(story), settings))
    except LlmUnavailable as exc:
        return Generation(None, [str(exc)], raw)
    return Generation(story, [], raw, checks)


def plain_aircraft(name: str) -> str:
    words = name.split()
    if len(words) > 1 and words[0].lower() in _MAKERS:
        return " ".join(words[1:])
    return name


def fallback_story(settings: Settings) -> Story:
    """The pre-written story. If this file is broken, the app should fail loudly (tests check it)."""
    return _load(settings.fixtures_dir / "stories" / "fallback.json")


def fixture_path(fixtures_dir: Path, flight: Flight, age_band: str) -> Path:
    return fixtures_dir / "stories" / f"{flight.carrier}{flight.number}_{flight.date}_{age_band}.json"


def _all_text(story: Story) -> str:
    parts = list(story.title.values())
    for c in story.chapters:
        for t in c.text.values():
            parts += [t.title, *t.pages]
    return "\n".join(parts)


def _load(path: Path) -> Story:
    story = Story.model_validate(json.loads(path.read_text(encoding="utf-8")))
    validate_story(story)  # raises StoryInvalid (a ValueError)
    return story


__all__ = ["Generation", "StoryInvalid", "fallback_story", "fixture_path", "generate", "story_for"]
