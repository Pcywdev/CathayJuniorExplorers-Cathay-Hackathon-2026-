"""GET /api/trips/{id}/chapters: the trip's story, filled for this trip, for offline storage."""

import json
import re
import shutil

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.config import FIXTURES_DIR, Settings, get_settings
from app.db import create_tables, get_session, make_engine
from app.main import app
from app.services import oag

client = TestClient(app)

NEW_TRIP = {"childName": "Mei", "ageBand": "6-8", "carrier": "CX", "number": "500", "date": "2026-11-14"}
VERSIONS = [[1, "both"], [2, "on_time"], [2, "delayed"], [3, "on_time"], [3, "delayed"], [4, "on_time"], [4, "delayed"]]


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


def new_trip(**body) -> str:
    r = client.post("/api/trips", json={**NEW_TRIP, **body})
    assert r.status_code == 201
    return r.json()["id"]


def chapters(trip_id: str) -> dict:
    r = client.get(f"/api/trips/{trip_id}/chapters")
    assert r.status_code == 200
    return r.json()


def landing_unlocks(body: dict) -> set[str]:
    return {c["unlockAt"] for c in body["chapters"] if c["key"] == "landing"}


def test_new_trip_gets_the_filled_fallback_story():
    trip_id = new_trip()
    body = chapters(trip_id)

    assert body["tripId"] == trip_id and body["generatedBy"] == "fallback"
    assert body["language"] == "en" and body["title"] == {"en": "Pip and the jade sky"}
    assert [[c["number"], c["branch"]] for c in body["chapters"]] == VERSIONS
    text = json.dumps(body, ensure_ascii=False)
    assert "Mei" in text and "Tokyo" in text and "gate 23" in text
    assert not re.search(r"\{(name|city|gate)\}", text)
    first = body["chapters"][0]
    assert first == {
        "number": 1, "key": "checkin", "branch": "both", "unlockOn": "junior_mode_on", "unlockAt": None,
        "text": {"en": {"title": "A ticket with your name on it", "pages": [first["text"]["en"]["pages"][0]]}},
    }
    assert landing_unlocks(body) == {"2026-11-14T11:20:00Z"}
    assert all(c["unlockAt"] is None for c in body["chapters"] if c["key"] != "landing")


def test_delay_moves_the_offline_landing_unlock():
    trip_id = new_trip()
    client.post(f"/api/trips/{trip_id}/events", json={"type": "delayed", "delayMinutes": 40})

    assert landing_unlocks(chapters(trip_id)) == {"2026-11-14T12:00:00Z"}


def test_new_gate_shows_in_the_story():
    trip_id = new_trip()
    client.post(f"/api/trips/{trip_id}/events", json={"type": "delayed", "delayMinutes": 15, "newGate": "31"})

    text = json.dumps(chapters(trip_id))
    assert "gate 31" in text and "gate 23" not in text


def test_zh_hant_trip_still_gets_english():
    assert chapters(new_trip(language="zh-Hant"))["language"] == "en"


def test_unknown_trip_is_404():
    assert client.get("/api/trips/trp_nope/chapters").status_code == 404


def test_story_fixture_wins_over_fallback(tmp_path):
    shutil.copytree(FIXTURES_DIR, tmp_path / "fixtures")
    stories = tmp_path / "fixtures" / "stories"
    reviewed = json.loads((stories / "fallback.json").read_text(encoding="utf-8"))
    reviewed["title"]["en"] = "Mei and the paper crane"
    (stories / "CX500_2026-11-14_6-8.json").write_text(json.dumps(reviewed), encoding="utf-8")
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, fixtures_dir=tmp_path / "fixtures")

    body = chapters(new_trip())
    assert body["generatedBy"] == "llm" and body["title"]["en"] == "Mei and the paper crane"
    # A different age band has no fixture, so it falls back.
    assert chapters(new_trip(ageBand="9-12"))["generatedBy"] == "fallback"


def test_broken_story_fixture_falls_back(tmp_path):
    shutil.copytree(FIXTURES_DIR, tmp_path / "fixtures")
    (tmp_path / "fixtures" / "stories" / "CX500_2026-11-14_6-8.json").write_text('{"title": {}}', encoding="utf-8")
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, fixtures_dir=tmp_path / "fixtures")

    assert chapters(new_trip())["generatedBy"] == "fallback"
