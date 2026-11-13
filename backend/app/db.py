"""SQLite via SQLModel: one engine, two tables (trips and their events).

Rows keep JSON text for the flight, rule state and event payload, so the tables don't
need to change when the API shape grows.
"""

from collections.abc import Iterator
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from sqlalchemy import Engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Field, Session, SQLModel, create_engine

from app.config import get_settings


class TripRow(SQLModel, table=True):
    __tablename__ = "trips"

    id: str = Field(primary_key=True)
    created_at: datetime = Field(index=True)
    child_name: str
    age_band: str
    language: str
    flight_json: str
    state_json: str  # rules.TripState + delay_minutes


class StoryRow(SQLModel, table=True):
    __tablename__ = "stories"

    trip_id: str = Field(primary_key=True, foreign_key="trips.id")
    generated_by: str  # "llm" | "fallback"
    story_json: str  # Story template, placeholders not filled (filled when served)


class EventRow(SQLModel, table=True):
    __tablename__ = "events"

    seq: int | None = Field(default=None, primary_key=True)  # running number, the SSE `id:`
    trip_id: str = Field(foreign_key="trips.id", index=True)
    payload_json: str  # one Event, camelCase


def make_engine(url: str) -> Engine:
    if url in ("sqlite://", "sqlite:///:memory:"):
        # One shared in-memory database across threads (tests).
        return create_engine(url, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    if url.startswith("sqlite:///"):
        Path(url.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
    return create_engine(url, connect_args={"check_same_thread": False})


def create_tables(engine: Engine) -> None:
    SQLModel.metadata.create_all(engine)


@lru_cache
def get_engine() -> Engine:
    return make_engine(get_settings().database_url)


def get_session() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session
