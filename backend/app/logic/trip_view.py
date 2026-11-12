"""How a trip looks on the phones: mission states, chapter lock states, event wording, event time.

Pure functions only: no I/O and no clock (the router passes `now` in). Mission titles come
from the Program (shared/program.json). Messages never contain miles; the UI shows
`mission.miles` from the event itself.
"""

from datetime import datetime, timedelta

from app.logic.rules import EVENT_TYPES, TripState
from app.models.flight import Flight
from app.models.program import Mission, Program

MissionState = str  # "locked" | "available" | "done"

# Story chapters in trip order (rules.EVENT_CHAPTER decides which event opens each one).
CHAPTER_KEYS: dict[int, str] = {1: "checkin", 2: "boarding", 3: "inflight", 4: "landing"}
DEPARTED_CHAPTER = 3


def mission_states(state: TripState, program: Program) -> list[tuple[Mission, MissionState]]:
    """Each mission with locked / available / done. Window Watcher has no trigger yet, so it never completes."""
    departed = DEPARTED_CHAPTER in state.chapters_unlocked
    unlocked_by = {
        "checkin": True,
        "boarding": "checkin" in state.missions_done,
        "window": departed,
        "arrival": departed,
    }
    result = []
    for m in program.missions:
        if m.id in state.missions_done:
            s = "done"
        elif unlocked_by.get(m.id, False):
            s = "available"
        else:
            s = "locked"
        result.append((m, s))
    return result


def chapter_states(state: TripState) -> list[dict]:
    return [
        {"number": n, "key": key, "locked": n not in state.chapters_unlocked}
        for n, key in CHAPTER_KEYS.items()
    ]


def local_time(now_utc: datetime, flight: Flight, event_type: str) -> datetime:
    """Event time in the airport's own offset: destination for `landed`, origin otherwise."""
    point = flight.arrival if event_type == "landed" else flight.departure
    return now_utc.astimezone(datetime.fromisoformat(point.local).tzinfo).replace(microsecond=0)


def event_messages(
    event_type: str,
    child_name: str,
    flight: Flight,
    program: Program,
    *,
    delay_minutes: int,
    new_gate: str | None,
    at: datetime,
) -> tuple[str, str]:
    """(childMessage, parentMessage). `delay_minutes`: this delay for `delayed`, total so far otherwise."""
    if event_type not in EVENT_TYPES:
        raise ValueError(f"Unknown event type: {event_type!r}")

    title = {m.id: m.title for m in program.missions}
    flight_code = f"{flight.carrier} {flight.number}"
    city = flight.destination.city

    if event_type == "junior_mode_on":
        return f"Hi {child_name}! Chapter 1 of your story is ready.", f"Junior mode is on for {child_name} on {flight_code}"
    if event_type == "checkin":
        return f"{title['checkin']} collected!", f"{child_name} is checked in for {flight_code}"
    if event_type == "boarded":
        return f"{title['boarding']} collected!", f"{child_name} has boarded {flight_code}"
    if event_type == "departed":
        landing = datetime.fromisoformat(flight.arrival.local) + timedelta(minutes=delay_minutes)
        return "We're flying! Chapter 3 is ready.", f"Departed {at:%H:%M}, landing about {landing:%H:%M}"
    if event_type == "delayed":
        parent = f"Delayed {delay_minutes} min" + (f", new gate {new_gate}" if new_gate else "")
        return "We have extra time!", parent
    # landed
    return f"{title['arrival']} collected! Welcome to {city}.", f"{child_name} has landed in {city}"
