"""GET /api/flights/lookup and the fixture-first OAG service."""

import json

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app
from app.services import oag

client = TestClient(app)


def no_network(*args, **kwargs):
    raise AssertionError("OAG must not be called")


@pytest.fixture(autouse=True)
def isolated_from_dotenv_and_network(monkeypatch):
    """A developer's backend/.env (e.g. OAG_LIVE=true) must never change these tests or spend quota."""
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None)
    monkeypatch.setattr(oag.httpx, "get", no_network)
    yield
    app.dependency_overrides.clear()


def test_lookup_demo_flight_from_fixture():
    r = client.get("/api/flights/lookup", params={"carrier": "CX", "number": 500, "date": "2026-11-14"})

    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "fixture"
    assert body["destination"] == {"iata": "NRT", "city": "Tokyo", "terminal": "2"}
    assert body["durationMinutes"] == 235
    assert (body["gate"], body["seat"]) == ("23", "34K")
    assert body["synthetic"] == ["gate", "seat"]
    assert set(body) >= {"departure", "arrival", "distanceKm", "aircraft", "status"}


def test_lookup_operated_flight_has_real_gate_and_delays():
    r = client.get("/api/flights/lookup", params={"carrier": "cx", "number": 500, "date": "2026-11-11"})

    body = r.json()
    assert r.status_code == 200
    assert body["gate"] == "42"
    assert body["synthetic"] == ["seat"]
    assert body["status"]["arrivalDelayMinutes"] == 23


def test_unknown_flight_is_404_and_never_calls_oag_by_default():
    r = client.get("/api/flights/lookup", params={"carrier": "CX", "number": 999, "date": "2026-11-14"})

    assert r.status_code == 404
    assert "detail" in r.json()


@pytest.mark.parametrize(
    "params",
    [
        {"carrier": "CX", "number": 500, "date": "14-11-2026"},
        {"carrier": "CX", "number": 500, "date": "not-a-date"},
        {"carrier": "CXA1", "number": 500, "date": "2026-11-14"},
        {"carrier": "C!", "number": 500, "date": "2026-11-14"},
        {"carrier": "CX", "number": 0, "date": "2026-11-14"},
        {"carrier": "CX", "number": 10000, "date": "2026-11-14"},
        {"carrier": "CX", "number": 500},
    ],
)
def test_bad_params_are_422(params):
    assert client.get("/api/flights/lookup", params=params).status_code == 422


# --- live mode (OAG_LIVE=true): only on a fixture miss, and the result is saved -----

class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload
        self.text = json.dumps(payload)

    def json(self):
        return self._payload


def settings_for(tmp_path, **kw) -> Settings:
    return Settings(_env_file=None, fixtures_dir=tmp_path, **kw)


def real_payload():
    return json.loads((oag.DEFAULT_FIXTURES_DIR / "oag" / "CX500_2026-11-14.json").read_text(encoding="utf-8"))


def test_live_disabled_means_not_found_even_with_a_key(tmp_path):
    s = settings_for(tmp_path, oag_api_key="k", oag_live=False)

    with pytest.raises(oag.FlightNotFound):
        oag.lookup_flight("CX", "500", "2026-11-14", s)


def test_live_on_without_key_means_not_found(tmp_path):
    s = settings_for(tmp_path, oag_api_key="", oag_live=True)

    with pytest.raises(oag.FlightNotFound):
        oag.lookup_flight("CX", "500", "2026-11-14", s)


def test_live_fetch_sends_key_header_saves_fixture_then_serves_from_it(tmp_path, monkeypatch):
    calls = []

    def fake_get(url, params=None, headers=None, timeout=None):
        calls.append((url, params, headers))
        return FakeResponse(200, real_payload())

    monkeypatch.setattr(oag.httpx, "get", fake_get)
    s = settings_for(tmp_path, oag_api_key="secret-key", oag_live=True)

    first = oag.lookup_flight("CX", "500", "2026-11-14", s)
    second = oag.lookup_flight("CX", "500", "2026-11-14", s)

    assert len(calls) == 1  # second call came from the saved fixture
    assert calls[0][2] == {"Subscription-Key": "secret-key"}
    assert calls[0][1]["CarrierCode"] == "CX" and calls[0][1]["FlightNumber"] == 500
    assert first.source == "oag" and second.source == "fixture"
    assert (tmp_path / "oag" / "CX500_2026-11-14.json").exists()


def test_live_error_response_is_not_saved_and_reports_oag_unavailable(tmp_path, monkeypatch):
    monkeypatch.setattr(oag.httpx, "get", lambda *a, **k: FakeResponse(500, {"error": "boom"}))
    s = settings_for(tmp_path, oag_api_key="k", oag_live=True)

    with pytest.raises(oag.OagUnavailable):
        oag.lookup_flight("CX", "500", "2026-11-14", s)
    assert not (tmp_path / "oag").exists() or not list((tmp_path / "oag").iterdir())


def test_endpoint_maps_oag_failure_to_502_without_leaking_the_key(tmp_path, monkeypatch):
    monkeypatch.setattr(oag.httpx, "get", lambda *a, **k: FakeResponse(500, {"error": "boom"}))
    app.dependency_overrides[get_settings] = lambda: settings_for(tmp_path, oag_api_key="secret-key", oag_live=True)

    r = client.get("/api/flights/lookup", params={"carrier": "CX", "number": 500, "date": "2026-11-14"})

    assert r.status_code == 502
    assert "secret-key" not in r.text


def test_live_response_with_no_flights_is_not_saved(tmp_path, monkeypatch):
    monkeypatch.setattr(oag.httpx, "get", lambda *a, **k: FakeResponse(200, {"data": [], "paging": {}}))
    s = settings_for(tmp_path, oag_api_key="k", oag_live=True)

    with pytest.raises(oag.FlightNotFound):
        oag.lookup_flight("CX", "500", "2026-11-14", s)
    assert not (tmp_path / "oag").exists() or not list((tmp_path / "oag").iterdir())
