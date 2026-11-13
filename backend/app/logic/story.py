"""Story logic: structure check, placeholder filling and the offline unlock time.

Pure functions only. A story is stored as a template with placeholders and filled when a
phone asks for it, so a later gate change still shows in the text. The child's name is only
ever put in at that point (never stored in the template, never sent to an LLM).
"""

import re
from datetime import datetime, timedelta, timezone

from app.models.flight import Flight
from app.models.story import ChapterVersion, Story, StoryText

PLACEHOLDERS = ("name", "city", "gate")
_PLACEHOLDER = re.compile(r"\{([a-zA-Z_]+)\}")

# The versions every story must have: chapter 1 once, chapters 2-4 on time + delayed
# (the demo delay comes before boarding, decisions.md 2026-11-13).
REQUIRED_VERSIONS = [(1, "both"), (2, "on_time"), (2, "delayed"), (3, "on_time"), (3, "delayed"), (4, "on_time"), (4, "delayed")]
# Each chapter's key and the trip event that opens it (rules.EVENT_CHAPTER).
CHAPTER_SPEC = {1: ("checkin", "junior_mode_on"), 2: ("boarding", "boarded"), 3: ("inflight", "departed"), 4: ("landing", "landed")}


class StoryInvalid(ValueError):
    """The story has the right JSON shape but not the right content structure."""


def validate_story(story: Story) -> None:
    """Raise StoryInvalid with a readable reason; return None if the story is usable."""
    seen = [(c.number, c.branch) for c in story.chapters]
    duplicates = {v for v in seen if seen.count(v) > 1}
    if duplicates:
        raise StoryInvalid(f"duplicate chapter versions: {sorted(duplicates)}")
    missing = [v for v in REQUIRED_VERSIONS if v not in seen]
    if missing:
        raise StoryInvalid("missing chapter versions: " + ", ".join(f"{n} {b}" for n, b in missing))
    extra = [v for v in seen if v not in REQUIRED_VERSIONS]
    if extra:
        raise StoryInvalid("unexpected chapter versions: " + ", ".join(f"{n} {b}" for n, b in extra))

    for c in story.chapters:
        key, unlock_on = CHAPTER_SPEC[c.number]
        if (c.key, c.unlock_on) != (key, unlock_on):
            raise StoryInvalid(f"chapter {c.number} must be key {key!r} unlocked on {unlock_on!r}")
        for text in c.text.values():
            for found in _PLACEHOLDER.findall(" ".join([text.title, *text.pages])):
                if found not in PLACEHOLDERS:
                    raise StoryInvalid(f"chapter {c.number} uses an unknown placeholder {{{found}}}")


def fill(story: Story, *, name: str, city: str, gate: str) -> Story:
    """A copy of the story with {name}, {city} and {gate} filled in. The template is unchanged."""
    values = {"name": name, "city": city, "gate": gate}

    def put(s: str) -> str:
        for key, value in values.items():
            s = s.replace("{" + key + "}", value)
        return s

    chapters = [
        c.model_copy(update={"text": {
            lang: StoryText(title=put(t.title), pages=[put(p) for p in t.pages]) for lang, t in c.text.items()
        }})
        for c in story.chapters
    ]
    return story.model_copy(update={
        "title": {lang: put(t) for lang, t in story.title.items()},
        "chapters": chapters,
    })


def unlock_at(chapter: ChapterVersion, flight: Flight, *, delay_minutes: int) -> str | None:
    """The landing chapter opens at scheduled arrival + delay so far (UTC), even with no Wi-Fi.

    Every other chapter opens on its trip event, so it has no time.
    """
    if chapter.key != "landing":
        return None
    arrival = datetime.fromisoformat(flight.arrival.utc.replace("Z", "+00:00"))
    when = (arrival + timedelta(minutes=delay_minutes)).astimezone(timezone.utc)
    return when.strftime("%Y-%m-%dT%H:%M:%SZ")


def prepare(story: Story, *, name: str, flight: Flight, delay_minutes: int) -> Story:
    """What a phone gets: placeholders filled from the trip, unlock times set, chapters in order."""
    filled = fill(story, name=name, city=flight.destination.city, gate=flight.gate)
    chapters = sorted(
        (c.model_copy(update={"unlock_at": unlock_at(c, flight, delay_minutes=delay_minutes)}) for c in filled.chapters),
        key=lambda c: REQUIRED_VERSIONS.index((c.number, c.branch)),
    )
    return filled.model_copy(update={"chapters": chapters})
