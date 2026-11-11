from datetime import date as Date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import Settings, get_settings
from app.models.flight import Flight
from app.services.oag import FlightNotFound, OagUnavailable, lookup_flight

router = APIRouter(prefix="/api", tags=["flights"])


@router.get("/flights/lookup", response_model=Flight, response_model_by_alias=True)
def flights_lookup(
    carrier: str = Query(pattern=r"^[A-Za-z0-9]{2}$", description="IATA airline code, e.g. CX"),
    number: int = Query(ge=1, le=9999, description="Flight number, e.g. 500"),
    flight_date: Date = Query(alias="date", description="Local departure date, YYYY-MM-DD"),
    settings: Settings = Depends(get_settings),
) -> Flight:
    try:
        return lookup_flight(carrier, str(number), flight_date.isoformat(), settings)
    except FlightNotFound:
        raise HTTPException(404, f"Flight {carrier.upper()} {number} on {flight_date} not found")
    except OagUnavailable:
        raise HTTPException(502, "Flight data provider is unavailable, try again shortly")
