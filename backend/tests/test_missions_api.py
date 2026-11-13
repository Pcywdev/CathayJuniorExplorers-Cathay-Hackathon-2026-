"""POST /api/trips/{id}/missions/{missionId}/complete: the child presses the stamp."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app import trip_service
from app.config import Settings, get_settings
from app.db import create_tables, get_session, make_engine
from app.main import app
from app.services import oag

client = TestClient(app)

NEW_TRIP = {"childName": "Mei", "ageBand": "6-8", "carrier": "CX", "number": "500", "date": "2026-11-14"}


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
    monkeypatch.setattr(oag.httpx, "get", lambda *a, **k: (_ for _ in ()).throw(AssertionError("no OAG")))
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def published(monkeypatch):
    """Capture everything sent to the broker."""
    sent = []
    real = trip_service.broker.publish
    monkeypatch.setattr(trip_service.broker, "publish", lambda tid, seq, ev: (sent.append(ev), real(tid, seq, ev))[1])
    return sent


def new_trip() -> str:
    r = client.post("/api/trips", json=NEW_TRIP)
    assert r.status_code == 201
    return r.json()["id"]


def fire(trip_id: str, *types: str) -> None:
    for t in types:
        assert client.post(f"/api/trips/{trip_id}/events", json={"type": t}).status_code == 201


def complete(trip_id: str, mission_id: str):
    return client.post(f"/api/trips/{trip_id}/missions/{mission_id}/complete")


def test_window_watcher_after_departed(published):
    trip_id = new_trip()
    fire(trip_id, "checkin", "boarded", "departed")
    before = client.get(f"/api/trips/{trip_id}").json()["lastEventId"]
    published.clear()

    r = complete(trip_id, "window")

    assert r.status_code == 201
    e = r.json()
    assert e["type"] == "mission_completed" and e["source"] == "child"
    assert e["mission"] == {"id": "window", "title": "Window Watcher", "miles": 30}
    assert e["cap"] == {"used": 1360, "limit": 2000}
    assert e["chapterUnlocked"] is None
    assert e["childMessage"] == "Window Watcher collected!"
    assert e["parentMessage"] == "Mei completed Window Watcher"
    assert e["at"].endswith("+08:00")
    assert [p.type for p in published] == ["mission_completed"]

    trip = client.get(f"/api/trips/{trip_id}").json()
    assert trip["lastEventId"] == before + 1
    assert trip["events"][-1] == e
    assert {m["id"]: m["state"] for m in trip["missions"]}["window"] == "done"
    assert trip["cap"]["used"] == 1360


def test_completing_again_returns_original_event_and_records_nothing(published):
    trip_id = new_trip()
    fire(trip_id, "checkin", "boarded", "departed")
    first = complete(trip_id, "window").json()
    count = len(client.get(f"/api/trips/{trip_id}").json()["events"])
    published.clear()

    again = complete(trip_id, "window")

    assert again.status_code == 200 and again.json() == first
    assert len(client.get(f"/api/trips/{trip_id}").json()["events"]) == count
    assert published == []


def test_mission_already_done_by_trip_event_returns_that_event():
    trip_id = new_trip()
    fire(trip_id, "checkin")

    r = complete(trip_id, "checkin")

    assert r.status_code == 200
    assert r.json()["type"] == "checkin" and r.json()["source"] == "simulated"


def test_child_checkin_first_then_checkin_event_pays_nothing():
    trip_id = new_trip()
    assert complete(trip_id, "checkin").json()["cap"]["used"] == 1280

    r = client.post(f"/api/trips/{trip_id}/events", json={"type": "checkin"})

    assert r.json()["mission"] is None and r.json()["cap"]["used"] == 1280


def test_window_before_departed_is_409():
    trip_id = new_trip()
    fire(trip_id, "checkin", "boarded")

    r = complete(trip_id, "window")

    assert r.status_code == 409 and "Window Watcher" in r.json()["detail"]


def test_unknown_mission_and_unknown_trip_are_404():
    trip_id = new_trip()
    assert complete(trip_id, "teleport").status_code == 404
    assert complete("trp_nope", "window").status_code == 404


def test_child_source_cannot_be_posted_as_a_trip_event():
    trip_id = new_trip()
    r = client.post(f"/api/trips/{trip_id}/events", json={"type": "checkin", "source": "child"})
    assert r.status_code == 422
    r = client.post(f"/api/trips/{trip_id}/events", json={"type": "mission_completed"})
    assert r.status_code == 422
