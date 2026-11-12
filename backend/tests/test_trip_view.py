"""Trip view: mission states, chapter lock states, event messages and local event times."""

from datetime import datetime, timezone

import pytest

from app.logic.rules import TripState, apply_event, initial_state
from app.logic.trip_view import chapter_states, event_messages, local_time, mission_states
from app.models.flight import Flight
from app.program import get_program


@pytest.fixture
def program():
    return get_program()


@pytest.fixture
def flight() -> Flight:
    return Flight.model_validate({
        "carrier": "CX", "number": "500", "date": "2026-11-14",
        "origin": {"iata": "HKG", "city": "Hong Kong", "terminal": "1"},
        "destination": {"iata": "NRT", "city": "Tokyo", "terminal": "2"},
        "departure": {"local": "2026-11-14T15:25:00+08:00", "utc": "2026-11-14T07:25:00Z"},
        "arrival": {"local": "2026-11-14T20:20:00+09:00", "utc": "2026-11-14T11:20:00Z"},
        "durationMinutes": 235, "distanceKm": 2962,
        "aircraft": {"iata": "333", "name": "Airbus A330-300"},
        "gate": "23", "seat": "34K", "synthetic": ["gate", "seat"],
        "status": {}, "source": "fixture",
    })


def run(program, *types: str) -> TripState:
    state = initial_state(program)
    for t in types:
        state = apply_event(state, t, program).state
    return state


def states(program, state) -> dict[str, str]:
    return {m.id: s for m, s in mission_states(state, program)}


# --- mission states ----------------------------------------------------------

def test_new_trip_only_checkin_is_available(program):
    assert states(program, run(program, "junior_mode_on")) == {
        "checkin": "available", "boarding": "locked", "window": "locked", "arrival": "locked",
    }


def test_checkin_done_makes_boarding_available(program):
    s = states(program, run(program, "junior_mode_on", "checkin"))
    assert s["checkin"] == "done" and s["boarding"] == "available"


def test_departed_makes_window_and_arrival_available(program):
    s = states(program, run(program, "junior_mode_on", "checkin", "boarded", "departed"))
    assert s == {"checkin": "done", "boarding": "done", "window": "available", "arrival": "available"}


def test_landed_completes_arrival_but_window_stays_available(program):
    s = states(program, run(program, "junior_mode_on", "checkin", "boarded", "departed", "landed"))
    assert s["arrival"] == "done" and s["window"] == "available"


def test_boarded_without_checkin_still_shows_boarding_done(program):
    s = states(program, run(program, "boarded"))
    assert s["boarding"] == "done" and s["checkin"] == "available"


def test_mission_states_follow_program_order_and_titles(program):
    result = mission_states(initial_state(program), program)
    assert [m.id for m, _ in result] == [m.id for m in program.missions]
    assert [m.title for m, _ in result] == [m.title for m in program.missions]


# --- chapter states ----------------------------------------------------------

def test_chapters_have_fixed_keys_and_lock_states(program):
    chapters = chapter_states(run(program, "junior_mode_on", "boarded"))
    assert chapters == [
        {"number": 1, "key": "checkin", "locked": False},
        {"number": 2, "key": "boarding", "locked": False},
        {"number": 3, "key": "inflight", "locked": True},
        {"number": 4, "key": "landing", "locked": True},
    ]


# --- local time --------------------------------------------------------------

NOW = datetime(2026, 11, 14, 7, 31, tzinfo=timezone.utc)


def test_events_use_origin_offset(flight):
    assert local_time(NOW, flight, "boarded").isoformat() == "2026-11-14T15:31:00+08:00"


def test_landed_uses_destination_offset(flight):
    assert local_time(NOW, flight, "landed").isoformat() == "2026-11-14T16:31:00+09:00"


# --- messages ----------------------------------------------------------------

def msgs(program, flight, event_type, delay=0, gate=None, at=None):
    at = at or local_time(NOW, flight, event_type)
    return event_messages(event_type, "Mei", flight, program, delay_minutes=delay, new_gate=gate, at=at)


@pytest.mark.parametrize("event_type, child, parent", [
    ("junior_mode_on", "Hi Mei! Chapter 1 of your story is ready.", "Junior mode is on for Mei on CX 500"),
    ("checkin", "Check-in Champion collected!", "Mei is checked in for CX 500"),
    ("boarded", "Boarding Badge collected!", "Mei has boarded CX 500"),
    ("landed", "Arrival Explorer collected! Welcome to Tokyo.", "Mei has landed in Tokyo"),
])
def test_simple_messages(program, flight, event_type, child, parent):
    assert msgs(program, flight, event_type) == (child, parent)


def test_departed_message_shows_departure_and_scheduled_landing(program, flight):
    assert msgs(program, flight, "departed") == (
        "We're flying! Chapter 3 is ready.", "Departed 15:31, landing about 20:20",
    )


def test_departed_message_adds_delay_to_landing(program, flight):
    assert msgs(program, flight, "departed", delay=40)[1] == "Departed 15:31, landing about 21:00"


def test_delayed_message_with_and_without_gate(program, flight):
    assert msgs(program, flight, "delayed", delay=40, gate="23") == (
        "We have extra time!", "Delayed 40 min, new gate 23",
    )
    assert msgs(program, flight, "delayed", delay=40)[1] == "Delayed 40 min"


def test_unknown_event_type_raises(program, flight):
    with pytest.raises(ValueError):
        msgs(program, flight, "teleported", at=NOW)
