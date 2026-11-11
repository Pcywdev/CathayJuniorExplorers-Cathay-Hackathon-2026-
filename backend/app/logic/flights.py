"""Turn an OAG flight-instances payload into our Flight model.

Pure functions: no network, no files, no clock. The service layer (app/services/oag.py)
fetches or loads the payload and passes it in, along with any synthetic overrides.
"""

import hashlib
from datetime import datetime

from app.models.flight import Aircraft, Airport, Flight, FlightStatus, TimePoint


class FlightNotFound(Exception):
    """OAG (or a fixture) has no flight matching the request."""


# Small display lookups. Unknown codes fall back to the code itself, never an error.
CITIES = {
    "HKG": "Hong Kong",
    "NRT": "Tokyo",
    "HND": "Tokyo",
    "TPE": "Taipei",
    "ICN": "Seoul",
    "SIN": "Singapore",
    "BKK": "Bangkok",
    "SYD": "Sydney",
    "LHR": "London",
    "JFK": "New York",
}
AIRCRAFT = {
    "333": "Airbus A330-300",
    "359": "Airbus A350-900",
    "351": "Airbus A350-1000",
    "77W": "Boeing 777-300ER",
}

# A330 economy is 2-4-2: A C | D E G H | J K
SEAT_LETTERS = "ACDEGHJK"


def parse_variation_minutes(value: str | None) -> int | None:
    """OAG variation 'HH:MM:SS' (optionally with a leading '-') -> whole minutes."""
    if not value:
        return None
    sign = -1 if value.startswith("-") else 1
    hours, minutes, _seconds = value.lstrip("-").split(":")
    return sign * (int(hours) * 60 + int(minutes))


def synthetic_gate_seat(carrier: str, number: str, date: str) -> tuple[str, str]:
    """Stable made-up gate and seat for a flight. Uses sha256, not hash(), which changes every run."""
    digest = hashlib.sha256(f"{carrier}{number}{date}".encode()).digest()
    gate = 1 + int.from_bytes(digest[0:2], "big") % 70
    row = 30 + digest[2] % 21
    letter = SEAT_LETTERS[digest[3] % len(SEAT_LETTERS)]
    return str(gate), f"{row}{letter}"


def build_flight(payload: dict, source: str, overrides: dict[str, dict[str, str]]) -> Flight:
    """overrides maps 'CX500_2026-11-14' -> {'gate': ..., 'seat': ...} for pinned demo values."""
    items = payload.get("data") or []
    if not items:
        raise FlightNotFound("OAG returned no flights")
    item = items[0]

    dep, arr = item["departure"], item["arrival"]
    carrier = item["carrier"]["iata"]
    number = str(item["flightNumber"])
    date = dep["date"]["local"]

    status = (item.get("statusDetails") or [{}])[0]
    real_gate = (status.get("departure") or {}).get("gate")

    pinned = overrides.get(f"{carrier}{number}_{date}", {})
    fake_gate, fake_seat = synthetic_gate_seat(carrier, number, date)
    gate = real_gate or pinned.get("gate") or fake_gate
    seat = pinned.get("seat") or fake_seat
    synthetic = ([] if real_gate else ["gate"]) + ["seat"]  # OAG never gives passenger seats

    return Flight(
        carrier=carrier,
        number=number,
        date=date,
        origin=_airport(dep),
        destination=_airport(arr),
        departure=_time_point(dep),
        arrival=_time_point(arr),
        duration_minutes=item["elapsedTime"],
        distance_km=round(item["distance"]["greatCircleKilometers"]),
        aircraft=_aircraft(item["aircraftType"]["iata"]),
        gate=gate,
        seat=seat,
        synthetic=synthetic,
        status=FlightStatus(
            oag_state=status.get("state"),
            departure_delay_minutes=_delay(status, "departure", "outGateVariation"),
            arrival_delay_minutes=_delay(status, "arrival", "inGateVariation"),
        ),
        source=source,
    )


def _airport(leg: dict) -> Airport:
    iata = leg["airport"]["iata"]
    return Airport(iata=iata, city=CITIES.get(iata, iata), terminal=leg.get("terminal"))


def _aircraft(iata: str) -> Aircraft:
    return Aircraft(iata=iata, name=AIRCRAFT.get(iata, iata))


def _time_point(leg: dict) -> TimePoint:
    local = datetime.fromisoformat(f"{leg['date']['local']}T{leg['time']['local']}")
    utc = datetime.fromisoformat(f"{leg['date']['utc']}T{leg['time']['utc']}")
    offset_minutes = int((local - utc).total_seconds() // 60)  # local clock minus UTC clock
    sign = "+" if offset_minutes >= 0 else "-"
    hours, minutes = divmod(abs(offset_minutes), 60)
    return TimePoint(
        local=f"{local:%Y-%m-%dT%H:%M:%S}{sign}{hours:02d}:{minutes:02d}",
        utc=f"{utc:%Y-%m-%dT%H:%M:%S}Z",
    )


def _delay(status: dict, leg: str, key: str) -> int | None:
    """Prefer the actual variation; fall back to the estimate; None if OAG has neither."""
    times = status.get(leg) or {}
    for kind in ("actualTime", "estimatedTime"):
        minutes = parse_variation_minutes((times.get(kind) or {}).get(key))
        if minutes is not None:
            return minutes
    return None
