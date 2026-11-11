"""Response shape for GET /api/flights/lookup (docs/api.md). Child-friendly subset of OAG's payload."""

from app.models.program import CamelModel


class Airport(CamelModel):
    iata: str
    city: str
    terminal: str | None = None


class TimePoint(CamelModel):
    local: str  # ISO 8601 with the airport's own UTC offset, e.g. 2026-11-14T20:20:00+09:00
    utc: str  # ISO 8601, e.g. 2026-11-14T11:20:00Z


class Aircraft(CamelModel):
    iata: str
    name: str


class FlightStatus(CamelModel):
    """Filled only when OAG has operated-flight data; all None for a schedule-only flight."""

    oag_state: str | None = None
    departure_delay_minutes: int | None = None
    arrival_delay_minutes: int | None = None


class Flight(CamelModel):
    carrier: str
    number: str
    date: str  # local departure date, YYYY-MM-DD
    origin: Airport
    destination: Airport
    departure: TimePoint
    arrival: TimePoint
    duration_minutes: int
    distance_km: int
    aircraft: Aircraft
    gate: str
    seat: str
    synthetic: list[str]  # which of gate / seat were invented (the UI must label them)
    status: FlightStatus
    source: str  # "fixture" | "oag"
