"""Request and response shapes for trips and events (docs/api.md). camelCase on the wire."""

from typing import Literal

from pydantic import Field, model_validator

from app.models.flight import Flight
from app.models.program import CamelModel

AgeBand = Literal["6-8", "9-12"]
Language = Literal["en", "zh-Hant"]
EventType = Literal["junior_mode_on", "checkin", "boarded", "departed", "delayed", "landed"]
PostableEventType = Literal["checkin", "boarded", "departed", "delayed", "landed"]
EventSource = Literal["simulated", "oag", "system"]
Branch = Literal["on_time", "delayed"]

# The only child data we use (plan.md section 15). Shown on the parent's "Data used" panel.
DATA_USED = ["ageBand", "destination", "flightLength", "tripEvents"]


class CreateTripRequest(CamelModel):
    child_name: str = Field(min_length=1, max_length=30)
    age_band: AgeBand
    carrier: str = Field(pattern=r"^[A-Za-z0-9]{2}$")
    number: str = Field(pattern=r"^[0-9]{1,4}$")
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    language: Language = "en"


class EventRequest(CamelModel):
    type: PostableEventType
    source: EventSource = "simulated"
    delay_minutes: int | None = Field(default=None, ge=1, le=1440)
    new_gate: str | None = Field(default=None, pattern=r"^[A-Za-z0-9]{1,4}$")

    @model_validator(mode="after")
    def _delay_fields_only_for_delayed(self):
        if self.type != "delayed" and (self.delay_minutes is not None or self.new_gate is not None):
            raise ValueError("delayMinutes and newGate are only allowed for 'delayed' events")
        return self


class EventMission(CamelModel):
    id: str
    title: str
    miles: int  # what was actually awarded after the cap


class Cap(CamelModel):
    used: int
    limit: int


class Event(CamelModel):
    type: EventType
    at: str
    source: EventSource
    mission: EventMission | None
    cap: Cap
    chapter_unlocked: int | None
    branch: Branch
    child_message: str
    parent_message: str
    system_lines: list[str]


class MissionView(CamelModel):
    id: str
    title: str
    miles: int
    state: Literal["locked", "available", "done"]


class ChapterState(CamelModel):
    number: int
    key: str
    locked: bool


class Trip(CamelModel):
    id: str
    child_name: str
    age_band: AgeBand
    language: Language
    junior_mode: bool
    flight: Flight
    missions: list[MissionView]
    cap: Cap
    branch: Branch
    chapters: list[ChapterState]
    events: list[Event]
    last_event_id: int  # open the stream with ?after=<this> so nothing is sent twice
    data_used: list[str]
