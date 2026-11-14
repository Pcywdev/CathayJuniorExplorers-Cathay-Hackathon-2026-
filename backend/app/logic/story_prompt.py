"""The prompt that asks an AI to write a trip story. Pure: no I/O.

Only four inputs exist, and they are the whole of what the AI is told: destination city,
flight length, aircraft name (flight data) and age band. The child's name is never an input;
the AI writes the placeholder {name}, filled in by the backend when a phone asks.
"""

import json
from dataclasses import dataclass

from app.logic.story import CHAPTER_SPEC, REQUIRED_VERSIONS
from app.models.story import ChapterVersion


@dataclass(frozen=True)
class StoryInputs:
    city: str
    duration_minutes: int
    aircraft: str
    age_band: str


@dataclass(frozen=True)
class ReadingLevel:
    max_sentence_words: int
    max_page_words: int
    max_title_words: int
    style: str


# Shared with story_safety.check_story, so the prompt and the check use the same limits.
READING_LEVELS: dict[str, ReadingLevel] = {
    "6-8": ReadingLevel(14, 45, 8, "very simple words a 6 year old knows, short sentences, lots of rhythm"),
    "9-12": ReadingLevel(20, 70, 8, "simple, vivid words, a little more detail and humour"),
}


def flight_length_words(minutes: int) -> str:
    if minutes < 60:
        return "less than an hour"
    hours = round(minutes / 60)
    return f"about {hours} hour" + ("" if hours == 1 else "s")


def build_prompt(inputs: StoryInputs, *, example: ChapterVersion) -> tuple[str, str]:
    """(system, user) messages. `example` is one pre-written chapter, shown as a style sample."""
    level = READING_LEVELS.get(inputs.age_band)
    if level is None:
        raise ValueError(f"Unknown age band: {inputs.age_band!r}")

    system = "\n".join([
        "You write short, warm trip stories for children, read with a parent beside them.",
        "The guide is Pip, a small friendly bird. The child is the hero of the trip.",
        "Rules:",
        "- Warm and calm, never scary: no danger, accidents, illness, fear or sadness.",
        "- A delay is always good news: extra time for something fun. Never blame anyone.",
        "- No real people, no brands, no airline or company names, no logos.",
        "- Write {name} wherever the child's name goes. Never invent a name for the child.",
        "- You may also write {city} for the destination and {gate} for the gate number.",
        "- No other placeholders, no emoji, no markdown.",
        f"- Reading level for ages {inputs.age_band}: {level.style}.",
        f"- At most {level.max_sentence_words} words per sentence, {level.max_page_words} words per page,"
        f" {level.max_title_words} words per title.",
        "- English only.",
        "Reply with JSON only, no other text.",
    ])

    versions = []
    for number, branch in REQUIRED_VERSIONS:
        key, unlock_on = CHAPTER_SPEC[number]
        versions.append(
            f'{{"number": {number}, "key": "{key}", "branch": "{branch}", "unlockOn": "{unlock_on}", '
            '"text": {"en": {"title": "...", "pages": ["one page"]}}}'
        )
    moments = {
        1: "check-in: the trip begins, Pip asks to come along",
        2: "boarding the plane at the gate",
        3: "in the air, above the clouds",
        4: "landing and arriving in the city",
    }
    example_json = json.dumps(
        {"title": example.text["en"].title, "pages": example.text["en"].pages}, ensure_ascii=False
    )

    user = "\n".join([
        f"Trip: flying to {inputs.city}, a flight of {flight_length_words(inputs.duration_minutes)}"
        f" on an {inputs.aircraft}. Age band {inputs.age_band}.",
        "Write a story in 4 chapters, one per trip moment:",
        *(f"{n}. {text}" for n, text in moments.items()),
        "Chapter 1 has one version (branch \"both\"). Chapters 2, 3 and 4 each have an on-time version"
        " and a delayed version (the delayed one is about having extra time).",
        "Each version has exactly one page.",
        "Return exactly this JSON shape, with these 7 versions in this order:",
        '{"title": {"en": "story title"}, "chapters": [',
        ",\n".join(versions),
        "]}",
        f"Style sample (chapter 1 of another story): {example_json}",
    ])
    return system, user
