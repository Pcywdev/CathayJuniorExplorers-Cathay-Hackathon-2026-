"""In-memory pub/sub: one channel per trip, one queue per open stream.

Lives in this process only, so Cloud Run must run a single instance (docs/deploy.md).
publish() must be called from the event loop thread (the publishing routes are `async def`).
"""

import asyncio
from collections import defaultdict

from app.models.trip import Event

_channels: dict[str, set[asyncio.Queue]] = defaultdict(set)


def subscribe(trip_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    _channels[trip_id].add(q)
    return q


def unsubscribe(trip_id: str, q: asyncio.Queue) -> None:
    subs = _channels.get(trip_id)
    if subs is None:
        return
    subs.discard(q)
    if not subs:
        del _channels[trip_id]


def publish(trip_id: str, seq: int, event: Event) -> int:
    """Hand the event to every open stream on this trip. Returns how many received it."""
    subs = _channels.get(trip_id, set())
    for q in subs:
        q.put_nowait((seq, event))
    return len(subs)


def subscriber_count(trip_id: str) -> int:
    return len(_channels.get(trip_id, set()))
