"""Where a trip's story comes from. Fixture-first, like services/oag.py.

Order today:  story fixture for this flight + age band  ->  pre-written fallback.
Milestone D adds "ask the LLM (with safety checks)" between the two. Whatever is
returned is a template: placeholders are filled only when a phone asks for it.
"""

import json
import logging
from pathlib import Path

from pydantic import ValidationError

from app.config import Settings
from app.logic.story import StoryInvalid, validate_story
from app.models.flight import Flight
from app.models.story import GeneratedBy, Story

log = logging.getLogger(__name__)


def story_for(flight: Flight, age_band: str, settings: Settings) -> tuple[Story, GeneratedBy]:
    fixture = _fixture_path(settings.fixtures_dir, flight, age_band)
    if fixture.exists():
        try:
            # A saved fixture is a reviewed LLM story (generated once on site, read by a person).
            return _load(fixture), "llm"
        except (ValueError, ValidationError) as exc:
            log.warning("Story fixture %s is unusable, using the fallback: %s", fixture.name, exc)
    return fallback_story(settings), "fallback"


def fallback_story(settings: Settings) -> Story:
    """The pre-written story. If this file is broken, the app should fail loudly (tests check it)."""
    return _load(settings.fixtures_dir / "stories" / "fallback.json")


def _fixture_path(fixtures_dir: Path, flight: Flight, age_band: str) -> Path:
    return fixtures_dir / "stories" / f"{flight.carrier}{flight.number}_{flight.date}_{age_band}.json"


def _load(path: Path) -> Story:
    story = Story.model_validate(json.loads(path.read_text(encoding="utf-8")))
    validate_story(story)  # raises StoryInvalid (a ValueError)
    return story


__all__ = ["StoryInvalid", "fallback_story", "story_for"]
