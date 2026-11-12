"""Saving and loading trips and events. Converts between rows and the rules engine's TripState."""

import json
import secrets
from datetime import datetime

from sqlmodel import Session, col, select

from app.db import EventRow, TripRow
from app.logic.rules import TripState
from app.models.flight import Flight
from app.models.trip import Event


def new_trip_id() -> str:
    return f"trp_{secrets.token_hex(4)}"


def dump_state(state: TripState, delay_minutes: int) -> str:
    return json.dumps({
        "capUsed": state.cap_used,
        "missionsDone": sorted(state.missions_done),
        "chaptersUnlocked": sorted(state.chapters_unlocked),
        "branch": state.branch,
        "delayMinutes": delay_minutes,
    })


def load_state(row: TripRow) -> tuple[TripState, int]:
    d = json.loads(row.state_json)
    state = TripState(
        cap_used=d["capUsed"],
        missions_done=frozenset(d["missionsDone"]),
        chapters_unlocked=frozenset(d["chaptersUnlocked"]),
        branch=d["branch"],
    )
    return state, d["delayMinutes"]


def load_flight(row: TripRow) -> Flight:
    return Flight.model_validate_json(row.flight_json)


def create_trip(
    session: Session, *, child_name: str, age_band: str, language: str,
    flight: Flight, state: TripState, now: datetime,
) -> TripRow:
    row = TripRow(
        id=new_trip_id(), created_at=now, child_name=child_name, age_band=age_band, language=language,
        flight_json=flight.model_dump_json(by_alias=True), state_json=dump_state(state, 0),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def get_trip(session: Session, trip_id: str) -> TripRow | None:
    return session.get(TripRow, trip_id)


def latest_trip(session: Session) -> TripRow | None:
    return session.exec(select(TripRow).order_by(col(TripRow.created_at).desc())).first()


def save_trip(session: Session, row: TripRow, state: TripState, delay_minutes: int, flight: Flight) -> None:
    row.state_json = dump_state(state, delay_minutes)
    row.flight_json = flight.model_dump_json(by_alias=True)
    session.add(row)
    session.commit()


def append_event(session: Session, trip_id: str, event: Event) -> int:
    row = EventRow(trip_id=trip_id, payload_json=event.model_dump_json(by_alias=True))
    session.add(row)
    session.commit()
    session.refresh(row)
    return row.seq


def events_after(session: Session, trip_id: str, after_seq: int = 0) -> list[tuple[int, Event]]:
    rows = session.exec(
        select(EventRow)
        .where(EventRow.trip_id == trip_id, col(EventRow.seq) > after_seq)
        .order_by(col(EventRow.seq))
    ).all()
    return [(r.seq, Event.model_validate_json(r.payload_json)) for r in rows]
