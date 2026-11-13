from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import store
from app.config import Settings, get_settings
from app.db import get_session
from app.logic.rules import initial_state
from app.logic.story import prepare
from app.models.program import Program
from app.models.story import TripChapters
from app.models.trip import CreateTripRequest, Trip
from app.program import get_program
from app.services.oag import FlightNotFound, OagUnavailable, lookup_flight
from app.services.stories import fallback_story, story_for
from app.trip_service import build_trip, fire_event

router = APIRouter(prefix="/api", tags=["trips"])


# async def: fire_event publishes to the in-memory broker, which must run on the event loop.
@router.post("/trips", response_model=Trip, status_code=201, response_model_by_alias=True)
async def create_trip(
    body: CreateTripRequest,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
    program: Program = Depends(get_program),
) -> Trip:
    try:
        flight = lookup_flight(body.carrier, body.number, body.date, settings)
    except FlightNotFound:
        raise HTTPException(404, f"Flight {body.carrier.upper()} {body.number} on {body.date} not found")
    except OagUnavailable:
        raise HTTPException(502, "Flight data provider is unavailable, try again shortly")

    now = datetime.now(timezone.utc)
    row = store.create_trip(
        session, child_name=body.child_name.strip(), age_band=body.age_band, language=body.language,
        flight=flight, state=initial_state(program), now=now,
    )
    # Pick and store the story before the first event, so it is ready when a phone asks.
    story, generated_by = story_for(flight, body.age_band, settings)
    store.save_story(session, row.id, story, generated_by)
    fire_event(session, row, "junior_mode_on", source="system", program=program, now_utc=now)
    return build_trip(session, row, program)


# Registered before /trips/{trip_id} so "current" isn't read as an id.
@router.get("/trips/current", response_model=Trip, response_model_by_alias=True)
def current_trip(session: Session = Depends(get_session), program: Program = Depends(get_program)) -> Trip:
    row = store.latest_trip(session)
    if row is None:
        raise HTTPException(404, "No trip yet")
    return build_trip(session, row, program)


@router.get("/trips/{trip_id}", response_model=Trip, response_model_by_alias=True)
def get_trip(trip_id: str, session: Session = Depends(get_session), program: Program = Depends(get_program)) -> Trip:
    row = store.get_trip(session, trip_id)
    if row is None:
        raise HTTPException(404, f"Trip {trip_id} not found")
    return build_trip(session, row, program)


@router.get("/trips/{trip_id}/chapters", response_model=TripChapters, response_model_by_alias=True)
def trip_chapters(
    trip_id: str,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> TripChapters:
    """Every chapter version, locked ones included, filled for this trip (for offline storage)."""
    row = store.get_trip(session, trip_id)
    if row is None:
        raise HTTPException(404, f"Trip {trip_id} not found")
    saved = store.get_story(session, trip_id)
    if saved is None:  # a trip created before stories existed
        saved = (fallback_story(settings), "fallback")
        store.save_story(session, trip_id, *saved)
    story, generated_by = saved

    _, delay_minutes = store.load_state(row)
    served = prepare(story, name=row.child_name, flight=store.load_flight(row), delay_minutes=delay_minutes)
    # Only English is written today; a zh-Hant trip still gets the English story.
    language = row.language if row.language in served.title else "en"
    return TripChapters(
        trip_id=row.id, generated_by=generated_by, language=language,
        title=served.title, chapters=served.chapters,
    )
