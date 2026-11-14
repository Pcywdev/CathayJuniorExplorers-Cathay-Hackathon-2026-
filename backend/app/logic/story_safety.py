"""Safety checks for an AI-written story. Pure: no I/O.

parse_story: raw model text -> a valid Story (JSON shape + chapter structure), else StoryRejected.
check_story: the content rules for an age band. Returns readable reasons; empty means it passed.
The reasons are also the wording for the architecture slide ("banned word 'crash' in chapter 3").
"""

import json
import re

from pydantic import ValidationError

from app.logic.story import StoryInvalid, validate_story
from app.logic.story_prompt import READING_LEVELS
from app.models.story import Story


class StoryRejected(ValueError):
    def __init__(self, reasons: list[str]):
        super().__init__("; ".join(reasons))
        self.reasons = reasons


# Matched as word starts ("crash" also catches "crashing"): harm, fear, real companies.
BANNED_STEMS = (
    "crash", "kill", "blood", "scare", "scary", "danger", "emergenc", "monster", "hurt", "injur",
    "death", "dead", "fire", "bomb", "weapon", "gun",
    "cathay", "airbus", "boeing", "emirates", "qantas", "lufthansa", "singapore airlines", "british airways",
)
# Short words matched exactly, so "diet" or "lostalgia"-style false hits can't happen.
BANNED_WORDS = ("die", "dies", "died", "dying", "lost", "alone", "sick")

_STEMS = re.compile(r"\b(?:" + "|".join(re.escape(s) for s in BANNED_STEMS) + r")[\w-]*", re.IGNORECASE)
_WORDS = re.compile(r"\b(?:" + "|".join(BANNED_WORDS) + r")\b", re.IGNORECASE)
_EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿️]")
_MARKDOWN = re.compile(r"\*\*|__|`|^#|^\s*[-*] ", re.MULTILINE)
_SENTENCE_END = re.compile(r"(?<=[.!?…])[”\"’']?\s+")
_WORD = re.compile(r"[\w{}’'-]+")
_FENCE = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)


def parse_story(raw: str) -> Story:
    text = raw.strip()
    fenced = _FENCE.match(text)
    if fenced:
        text = fenced.group(1)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise StoryRejected([f"not JSON ({exc.msg})"]) from exc
    try:
        story = Story.model_validate(data)
    except ValidationError as exc:
        problems = [f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors()[:3]]
        raise StoryRejected(["wrong shape: " + "; ".join(problems)]) from exc
    try:
        validate_story(story)
    except StoryInvalid as exc:
        raise StoryRejected([str(exc)]) from exc
    return story


def check_story(story: Story, age_band: str) -> list[str]:
    level = READING_LEVELS.get(age_band)
    if level is None:
        raise ValueError(f"Unknown age band: {age_band!r}")

    found: list[str] = []
    for title in story.title.values():
        found += _text_problems(title, "story title")
    for c in story.chapters:
        where = f"chapter {c.number} {c.branch}"
        for t in c.text.values():
            if len(_WORD.findall(t.title)) > level.max_title_words:
                found.append(f"title too long for {age_band} in {where} (max {level.max_title_words} words)")
            found += _text_problems(t.title, where)
            for page in t.pages:
                found += _text_problems(page, where)
                words = len(_WORD.findall(page))
                if words > level.max_page_words:
                    found.append(f"page too long for {age_band} in {where} ({words} words, max {level.max_page_words})")
                for sentence in _SENTENCE_END.split(page.strip()):
                    n = len(_WORD.findall(sentence))
                    if n > level.max_sentence_words:
                        found.append(
                            f"sentence too long for {age_band} in {where} ({n} words, max {level.max_sentence_words})"
                        )
    return found


def _text_problems(text: str, where: str) -> list[str]:
    found = [f"banned word '{m.group(0).lower()}' in {where}" for m in _STEMS.finditer(text)]
    found += [f"banned word '{m.group(0).lower()}' in {where}" for m in _WORDS.finditer(text)]
    if _EMOJI.search(text):
        found.append(f"emoji in {where}")
    if _MARKDOWN.search(text):
        found.append(f"markdown in {where}")
    return found
