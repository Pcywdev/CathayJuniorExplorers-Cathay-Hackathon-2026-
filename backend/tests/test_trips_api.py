"""POST /api/trips, GET /api/trips/current, GET /api/trips/{id}, POST /api/trips/{id}/events."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.config import Settings, get_settings
from app.db import create_tables, get_session, make_engine
from app.main import app
from app.services import oag

client = TestClient(app)

NEW_TRIP = {"childName": "Mei", "ageBand": "6-8", "carrier": "CX", "number": "500", "date": "2026-11-14", "language": "en"}


def no_network(*args, **kwargs):
    raise AssertionError("OAG must not be called")


@pytest.fixture(autouse=True)
def isolated(monkeypatch):
    """Fresh in-memory database per test; no .env, no OAG calls."""
    engine = make_engine("sqlite://")
    create_tables(engine)

    def session_override():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[get_session] = session_override
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None)
    monkeypatch.setattr(oag.httpx, "get", no_network)
    yield
    app.dependency_overrides.clear()


def create() -> dict:
    r = client.post("/api/trips", json=NEW_TRIP)
    assert r.status_code == 201, r.text
    return r.json()


def fire(trip_id: str, type_: str, **extra) -> dict:
    r = client.post(f"/api/trips/{trip_id}/events", json={"type": type_, "source": "simulated", **extra})
    assert r.status_code == 201, r.text
    return r.json()


# --- create ------------------------------------------------------------------

def test_create_trip_starts_at_member_balance_with_chapter_1_open():
    trip = create()

    assert trip["id"].startswith("trp_")
    assert trip["childName"] == "Mei" and trip["juniorMode"] is True
    assert trip["flight"]["destination"]["iata"] == "NRT"
    assert trip["cap"] == {"used": 1250, "limit": 2000}
    assert trip["branch"] == "on_time"
    assert [c["locked"] for c in trip["chapters"]] == [False, True, True, True]
    assert [m["state"] for m in trip["missions"]] == ["available", "locked", "locked", "locked"]
    assert trip["dataUsed"] == ["ageBand", "destination", "flightLength", "tripEvents"]
    assert trip["lastEventId"] >= 1

    [event] = trip["events"]
    assert event["type"] == "junior_mode_on" and event["source"] == "system"
    assert event["mission"] is None and event["chapterUnlocked"] == 1
    assert event["at"].endswith("+08:00")
    assert event["parentMessage"] == "Junior mode is on for Mei on CX 500"


def test_create_trip_for_unknown_flight_is_404():
    r = client.post("/api/trips", json={**NEW_TRIP, "number": "999"})
    assert r.status_code == 404 and "detail" in r.json()


@pytest.mark.parametrize("bad", [
    {"ageBand": "3-5"},
    {"language": "fr"},
    {"childName": ""},
    {"carrier": "CXX"},
    {"date": "14-11-2026"},
])
def test_create_trip_bad_body_is_422(bad):
    assert client.post("/api/trips", json={**NEW_TRIP, **bad}).status_code == 422


# --- get / current -----------------------------------------------------------

def test_current_is_404_before_any_trip_then_the_newest():
    assert client.get("/api/trips/current").status_code == 404
    create()
    second = create()

    r = client.get("/api/trips/current")
    assert r.status_code == 200 and r.json()["id"] == second["id"]


def test_get_trip_by_id_and_unknown_is_404():
    trip = create()
    assert client.get(f"/api/trips/{trip['id']}").json() == trip
    assert client.get("/api/trips/trp_nope").status_code == 404


# --- events ------------------------------------------------------------------

def test_full_trip_with_delay():
    trip_id = create()["id"]

    checkin = fire(trip_id, "checkin")
    assert checkin["mission"] == {"id": "checkin", "title": "Check-in Champion", "miles": 30}
    assert checkin["cap"] == {"used": 1280, "limit": 2000}
    assert checkin["source"] == "simulated"

    boarded = fire(trip_id, "boarded")
    assert boarded["cap"]["used"] == 1330 and boarded["chapterUnlocked"] == 2
    assert boarded["childMessage"] == "Boarding Badge collected!"
    assert boarded["parentMessage"] == "Mei has boarded CX 500"
    assert boarded["systemLines"] == ["Mission rule passed: Boarding Badge", "Cap check 1,330 / 2,000 ✓", "Chapter 2 unlocked"]

    delayed = fire(trip_id, "delayed", delayMinutes=40, newGate="27")
    assert delayed["mission"] is None and delayed["branch"] == "delayed"
    assert delayed["parentMessage"] == "Delayed 40 min, new gate 27"
    assert "Gate changed to 27" in delayed["systemLines"]

    departed = fire(trip_id, "departed")
    assert departed["chapterUnlocked"] == 3 and departed["branch"] == "delayed"
    assert departed["parentMessage"].endswith("landing about 21:00")  # 20:20 + 40 min

    landed = fire(trip_id, "landed")
    assert landed["cap"]["used"] == 1370 and landed["chapterUnlocked"] == 4
    assert landed["at"].endswith("+09:00")
    assert landed["parentMessage"] == "Mei has landed in Tokyo"

    trip = client.get(f"/api/trips/{trip_id}").json()
    assert trip["cap"] == {"used": 1370, "limit": 2000}
    assert trip["branch"] == "delayed"
    assert trip["flight"]["gate"] == "27"
    assert all(not c["locked"] for c in trip["chapters"])
    assert {m["id"]: m["state"] for m in trip["missions"]} == {
        "checkin": "done", "boarding": "done", "window": "available", "arrival": "done",
    }
    assert [e["type"] for e in trip["events"]] == ["junior_mode_on", "checkin", "boarded", "delayed", "departed", "landed"]


def test_repeat_event_awards_nothing():
    trip_id = create()["id"]
    fire(trip_id, "boarded")
    again = fire(trip_id, "boarded")

    assert again["mission"] is None and again["chapterUnlocked"] is None
    assert again["cap"]["used"] == 1300


@pytest.mark.parametrize("body", [
    {"type": "junior_mode_on"},
    {"type": "teleported"},
    {"type": "boarded", "source": "magic"},
    {"type": "boarded", "delayMinutes": 10},
    {"type": "delayed", "delayMinutes": 0},
    {"type": "delayed", "newGate": "GATE-23"},
])
def test_bad_event_is_422(body):
    trip_id = create()["id"]
    assert client.post(f"/api/trips/{trip_id}/events", json=body).status_code == 422


def test_event_for_unknown_trip_is_404():
    r = client.post("/api/trips/trp_nope/events", json={"type": "boarded"})
    assert r.status_code == 404


def test_stream_for_unknown_trip_is_404():
    assert client.get("/api/trips/trp_nope/stream").status_code == 404
