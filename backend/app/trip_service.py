"""One trip event, end to end: load state -> rules engine -> wording -> save -> publish.

Shared by the trips router (junior_mode_on) and the events router (the other five).
"""

from datetime import datetime

from sqlmodel import Session

from app import broker, store
from app.db import TripRow
from app.logic.rules import apply_event
from app.logic.trip_view import chapter_states, event_messages, local_time, mission_states
from app.models.program import Program
from app.models.trip import DATA_USED, Cap, ChapterState, Event, EventMission, MissionView, Trip


def fire_event(
    session: Session,
    row: TripRow,
    event_type: str,
    *,
    source: str,
    program: Program,
    now_utc: datetime,
    delay_minutes: int | None = None,
    new_gate: str | None = None,
) -> Event:
    state, total_delay = store.load_state(row)
    flight = store.load_flight(row)

    result = apply_event(state, event_type, program)
    lines = list(result.system_lines)

    if event_type == "delayed":
        total_delay += delay_minutes or 0
        if new_gate:
            flight = flight.model_copy(update={"gate": new_gate})
            lines.append(f"Gate changed to {new_gate}")

    at = local_time(now_utc, flight, event_type)
    child_msg, parent_msg = event_messages(
        event_type, row.child_name, flight, program,
        delay_minutes=(delay_minutes or 0) if event_type == "delayed" else total_delay,
        new_gate=new_gate, at=at,
    )
    m = result.mission
    event = Event(
        type=event_type,
        at=at.isoformat(),
        source=source,
        mission=EventMission(id=m.id, title=m.title, miles=m.miles) if m else None,
        cap=Cap(used=result.state.cap_used, limit=program.annual_earn_cap),
        chapter_unlocked=result.chapter_unlocked,
        branch=result.branch,
        child_message=child_msg,
        parent_message=parent_msg,
        system_lines=lines,
    )

    store.save_trip(session, row, result.state, total_delay, flight)
    seq = store.append_event(session, row.id, event)
    broker.publish(row.id, seq, event)
    return event


def build_trip(session: Session, row: TripRow, program: Program) -> Trip:
    state, _ = store.load_state(row)
    events = store.events_after(session, row.id)
    return Trip(
        id=row.id,
        child_name=row.child_name,
        age_band=row.age_band,
        language=row.language,
        junior_mode=True,
        flight=store.load_flight(row),
        missions=[
            MissionView(id=m.id, title=m.title, miles=m.miles, state=s)
            for m, s in mission_states(state, program)
        ],
        cap=Cap(used=state.cap_used, limit=program.annual_earn_cap),
        branch=state.branch,
        chapters=[ChapterState(**c) for c in chapter_states(state)],
        events=[e for _, e in events],
        last_event_id=events[-1][0] if events else 0,
        data_used=DATA_USED,
    )
