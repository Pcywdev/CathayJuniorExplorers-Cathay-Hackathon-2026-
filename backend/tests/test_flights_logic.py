"""Flight normalisation: OAG payload -> child-friendly Flight (pure, no I/O besides reading fixtures)."""

import copy
import json
import re
from pathlib import Path

import pytest

from app.logic.flights import (
    FlightNotFound,
    build_flight,
    parse_variation_minutes,
    synthetic_gate_seat,
)

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures" / "oag"
DEMO_OVERRIDES = {"CX500_2026-11-14": {"gate": "23", "seat": "34K"}}


def load(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


@pytest.fixture
def scheduled() -> dict:
    return load("CX500_2026-11-14.json")


@pytest.fixture
def operated() -> dict:
    return load("CX500_2026-11-11.json")


# --- the demo flight (schedule only) ----------------------------------------

def test_scheduled_flight_basics(scheduled):
    f = build_flight(scheduled, source="fixture", overrides=DEMO_OVERRIDES)

    assert (f.carrier, f.number, f.date) == ("CX", "500", "2026-11-14")
    assert (f.origin.iata, f.origin.city, f.origin.terminal) == ("HKG", "Hong Kong", "1")
    assert (f.destination.iata, f.destination.city, f.destination.terminal) == ("NRT", "Tokyo", "2")
    assert f.duration_minutes == 235
    assert f.distance_km == 2962
    assert (f.aircraft.iata, f.aircraft.name) == ("333", "Airbus A330-300")
    assert f.source == "fixture"


def test_times_carry_their_own_utc_offset(scheduled):
    f = build_flight(scheduled, source="fixture", overrides={})

    assert f.departure.local == "2026-11-14T15:25:00+08:00"
    assert f.departure.utc == "2026-11-14T07:25:00Z"
    assert f.arrival.local == "2026-11-14T20:20:00+09:00"
    assert f.arrival.utc == "2026-11-14T11:20:00Z"


def test_schedule_only_flight_has_no_status(scheduled):
    f = build_flight(scheduled, source="fixture", overrides={})

    assert f.status.oag_state is None
    assert f.status.departure_delay_minutes is None
    assert f.status.arrival_delay_minutes is None


# --- gate and seat ----------------------------------------------------------

def test_demo_override_pins_gate_and_seat_and_labels_them_synthetic(scheduled):
    f = build_flight(scheduled, source="fixture", overrides=DEMO_OVERRIDES)

    assert (f.gate, f.seat) == ("23", "34K")
    assert f.synthetic == ["gate", "seat"]


def test_without_override_gate_and_seat_are_stable_and_plausible(scheduled):
    a = build_flight(scheduled, source="fixture", overrides={})
    b = build_flight(scheduled, source="fixture", overrides={})

    assert (a.gate, a.seat) == (b.gate, b.seat)
    assert 1 <= int(a.gate) <= 70
    assert re.fullmatch(r"(3\d|4\d|50)[ACDEGHJK]", a.seat)
    assert a.synthetic == ["gate", "seat"]


def test_synthetic_gate_seat_differs_across_flights():
    seen = {synthetic_gate_seat("CX", "500", f"2026-11-{d:02d}") for d in range(1, 29)}

    assert len(seen) > 5


def test_real_gate_from_oag_is_used_and_not_labelled_synthetic(operated):
    f = build_flight(operated, source="fixture", overrides=DEMO_OVERRIDES)

    assert f.gate == "42"
    assert f.synthetic == ["seat"]  # OAG never provides passenger seats


# --- operated flight (status data) ------------------------------------------

def test_operated_flight_status_and_delays(operated):
    f = build_flight(operated, source="fixture", overrides={})

    assert f.status.oag_state == "InGate"
    assert f.status.departure_delay_minutes == 11
    assert f.status.arrival_delay_minutes == 23


# --- helpers and edge cases -------------------------------------------------

@pytest.mark.parametrize(
    "value, minutes",
    [("00:11:00", 11), ("01:05:00", 65), ("00:00:00", 0), ("-00:05:00", -5), (None, None), ("", None)],
)
def test_parse_variation_minutes(value, minutes):
    assert parse_variation_minutes(value) == minutes


def test_unknown_airport_and_aircraft_fall_back_to_codes(scheduled):
    raw = copy.deepcopy(scheduled)
    raw["data"][0]["arrival"]["airport"]["iata"] = "ZZZ"
    raw["data"][0]["aircraftType"]["iata"] = "XYZ"

    f = build_flight(raw, source="fixture", overrides={})

    assert f.destination.city == "ZZZ"
    assert f.aircraft.name == "XYZ"


def test_empty_data_raises_flight_not_found():
    with pytest.raises(FlightNotFound):
        build_flight({"data": [], "paging": {}}, source="fixture", overrides={})


def test_response_has_no_oag_internals(scheduled):
    dumped = build_flight(scheduled, source="fixture", overrides={}).model_dump(by_alias=True)
    text = json.dumps(dumped)

    for leaked in ("icao", "scheduleInstanceKey", "statusKey", "cargoTonnage", "codeshare", "RJAA"):
        assert leaked not in text
