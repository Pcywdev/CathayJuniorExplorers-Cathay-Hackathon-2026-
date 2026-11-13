"""Shape of a trip story and of GET /api/trips/{id}/chapters (docs/api.md). camelCase on the wire.

Text is a map keyed by language. Today only "en" is written (decisions.md 2026-11-13);
"zh-Hant" can be added later without changing this shape.
"""

from typing import Literal

from pydantic import Field, field_validator

from app.models.program import CamelModel

StoryLanguage = Literal["en", "zh-Hant"]
ChapterKey = Literal["checkin", "boarding", "inflight", "landing"]
StoryBranch = Literal["both", "on_time", "delayed"]
UnlockOn = Literal["junior_mode_on", "checkin", "boarded", "departed", "landed"]
GeneratedBy = Literal["llm", "fallback"]


class StoryText(CamelModel):
    title: str = Field(min_length=1, max_length=80)
    pages: list[str] = Field(min_length=1, max_length=3)  # one page per chapter today

    @field_validator("pages")
    @classmethod
    def _pages_not_blank(cls, pages: list[str]) -> list[str]:
        if any(not p.strip() for p in pages):
            raise ValueError("pages must not be blank")
        return pages


class ChapterVersion(CamelModel):
    number: int = Field(ge=1, le=4)
    key: ChapterKey
    branch: StoryBranch
    unlock_on: UnlockOn
    unlock_at: str | None = None  # UTC ISO time; only the landing chapter has one (set when served)
    text: dict[StoryLanguage, StoryText]

    @field_validator("text")
    @classmethod
    def _needs_english(cls, text: dict) -> dict:
        if "en" not in text:
            raise ValueError("every chapter needs an 'en' text")
        return text


class Story(CamelModel):
    """A whole trip story. Stored with placeholders ({name}, {city}, {gate}); filled when served."""

    title: dict[StoryLanguage, str]
    chapters: list[ChapterVersion]


class TripChapters(CamelModel):
    """GET /api/trips/{id}/chapters: everything the phone stores for offline."""

    trip_id: str
    generated_by: GeneratedBy
    language: StoryLanguage  # the language the story is shown in by default
    title: dict[StoryLanguage, str]
    chapters: list[ChapterVersion]
