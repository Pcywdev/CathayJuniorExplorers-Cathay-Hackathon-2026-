"""SSE stream generator and the in-memory broker. Run with asyncio.run (no pytest-asyncio)."""

import asyncio
import json

from app import broker
from app.models.trip import Cap, Event
from app.routers.events import format_event, trip_event_stream


def ev(type_: str = "boarded") -> Event:
    return Event(
        type=type_, at="2026-11-14T15:31:00+08:00", source="simulated", mission=None,
        cap=Cap(used=1330, limit=2000), chapter_unlocked=None, branch="on_time",
        child_message="c", parent_message="p", system_lines=[],
    )


def test_format_event_is_one_sse_message_with_camelcase_json():
    text = format_event(7, ev())
    assert text.startswith("id: 7\nevent: trip-event\ndata: ") and text.endswith("\n\n")
    data = json.loads(text.split("data: ", 1)[1])
    assert data["childMessage"] == "c" and data["cap"] == {"used": 1330, "limit": 2000}


def test_broker_delivers_to_every_subscriber_and_forgets_on_unsubscribe():
    async def go():
        a, b = broker.subscribe("trp_x"), broker.subscribe("trp_x")
        assert broker.publish("trp_x", 1, ev()) == 2
        assert a.get_nowait()[0] == 1 and b.get_nowait()[0] == 1
        broker.unsubscribe("trp_x", a)
        broker.unsubscribe("trp_x", b)
        assert broker.subscriber_count("trp_x") == 0
        assert broker.publish("trp_x", 2, ev()) == 0
        assert broker.publish("trp_other", 1, ev()) == 0

    asyncio.run(go())


def test_backlog_then_live_each_once_then_ping_and_unsubscribe():
    async def go():
        q = broker.subscribe("trp_s")
        backlog = [(3, ev("checkin")), (4, ev("boarded"))]
        # Event 4 was published while the backlog was being read: it must not be sent twice.
        broker.publish("trp_s", 4, ev("boarded"))
        broker.publish("trp_s", 5, ev("departed"))

        gen = trip_event_stream("trp_s", q, backlog, after_seq=2, ping_seconds=0.05)
        got = [await gen.__anext__() for _ in range(4)]
        await gen.aclose()
        return got

    got = asyncio.run(go())
    ids = [m.split("\n", 1)[0] for m in got[:3]]
    assert ids == ["id: 3", "id: 4", "id: 5"]
    assert got[3] == ": ping\n\n"
    assert broker.subscriber_count("trp_s") == 0


def test_backlog_skips_events_at_or_before_after_seq():
    async def go():
        q = broker.subscribe("trp_r")
        gen = trip_event_stream("trp_r", q, [(2, ev()), (3, ev())], after_seq=2, ping_seconds=0.05)
        first = await gen.__anext__()
        await gen.aclose()
        return first

    assert asyncio.run(go()).startswith("id: 3\n")
