import asyncio
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app import broker, store
from app.db import get_session
from app.logic.rules import MissionLocked, UnknownMission
from app.models.program import Program
from app.models.trip import Event, EventRequest
from app.program import get_program
from app.trip_service import complete_mission, fire_event

router = APIRouter(prefix="/api", tags=["events"])

PING_SECONDS = 15


# async def: publishing to the broker must happen on the event loop. It also means two
# POSTs can't interleave their read-modify-write of the trip (no await in between).
@router.post("/trips/{trip_id}/events", response_model=Event, status_code=201, response_model_by_alias=True)
async def post_event(
    trip_id: str,
    body: EventRequest,
    session: Session = Depends(get_session),
    program: Program = Depends(get_program),
) -> Event:
    row = store.get_trip(session, trip_id)
    if row is None:
        raise HTTPException(404, f"Trip {trip_id} not found")
    return fire_event(
        session, row, body.type, source=body.source, program=program,
        now_utc=datetime.now(timezone.utc), delay_minutes=body.delay_minutes, new_gate=body.new_gate,
    )


@router.post(
    "/trips/{trip_id}/missions/{mission_id}/complete",
    response_model=Event, status_code=201, response_model_by_alias=True,
)
async def post_mission_complete(
    trip_id: str,
    mission_id: str,
    response: Response,
    session: Session = Depends(get_session),
    program: Program = Depends(get_program),
) -> Event:
    """The child pressed the stamp. 201 = awarded now; 200 = already done (returns the event that awarded it)."""
    row = store.get_trip(session, trip_id)
    if row is None:
        raise HTTPException(404, f"Trip {trip_id} not found")
    try:
        event, awarded = complete_mission(
            session, row, mission_id, program=program, now_utc=datetime.now(timezone.utc)
        )
    except UnknownMission:
        raise HTTPException(404, f"Mission {mission_id} not found")
    except MissionLocked as exc:
        raise HTTPException(409, str(exc))
    if not awarded:
        response.status_code = 200
    return event


@router.get("/trips/{trip_id}/stream")
async def stream(
    trip_id: str,
    after: int = Query(0, ge=0, description="Replay events after this id (use the trip's lastEventId)"),
    last_event_id: str | None = Header(None),
    session: Session = Depends(get_session),
) -> StreamingResponse:
    if store.get_trip(session, trip_id) is None:
        raise HTTPException(404, f"Trip {trip_id} not found")

    # The browser sends Last-Event-ID when it reconnects; that wins over ?after.
    after_seq = int(last_event_id) if last_event_id and last_event_id.isdigit() else after

    # Subscribe before reading the backlog, so nothing published in between is lost.
    queue = broker.subscribe(trip_id)
    backlog = store.events_after(session, trip_id, after_seq)
    return StreamingResponse(
        trip_event_stream(trip_id, queue, backlog, after_seq),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def format_event(seq: int, event: Event) -> str:
    return f"id: {seq}\nevent: trip-event\ndata: {event.model_dump_json(by_alias=True)}\n\n"


async def trip_event_stream(
    trip_id: str,
    queue: asyncio.Queue,
    backlog: list[tuple[int, Event]],
    after_seq: int = 0,
    ping_seconds: float = PING_SECONDS,
) -> AsyncIterator[str]:
    """Missed events first, then live ones; a `: ping` comment when idle. Each event is sent once."""
    last_sent = after_seq
    try:
        for seq, event in backlog:
            if seq > last_sent:
                last_sent = seq
                yield format_event(seq, event)
        while True:
            try:
                seq, event = await asyncio.wait_for(queue.get(), timeout=ping_seconds)
            except asyncio.TimeoutError:
                yield ": ping\n\n"
                continue
            if seq > last_sent:
                last_sent = seq
                yield format_event(seq, event)
    finally:
        broker.unsubscribe(trip_id, queue)
