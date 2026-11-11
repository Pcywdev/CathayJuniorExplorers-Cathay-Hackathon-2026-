"""The only place that talks to OAG. Fixture-first: a saved response is always preferred.

Order: saved fixture -> (only if OAG_LIVE=true and a key is set) one live call, saved as a fixture.
OAG quota is 1,000 requests / 30 days, shared by the team, so every live response is kept.
"""

import json
from pathlib import Path

import httpx

from app.config import FIXTURES_DIR as DEFAULT_FIXTURES_DIR
from app.config import Settings
from app.logic.flights import FlightNotFound, build_flight
from app.models.flight import Flight

OAG_URL = "https://api.oag.com/flight-instances/"

__all__ = ["DEFAULT_FIXTURES_DIR", "FlightNotFound", "OagUnavailable", "lookup_flight"]


class OagUnavailable(Exception):
    """OAG itself failed (network error or non-200 response); says nothing about whether the flight exists."""


def lookup_flight(carrier: str, number: str, date: str, settings: Settings) -> Flight:
    carrier = carrier.upper()
    path = _fixture_path(settings.fixtures_dir, carrier, number, date)
    overrides = _load_overrides(settings.fixtures_dir)

    if path.exists():
        payload = json.loads(path.read_text(encoding="utf-8"))
        return build_flight(payload, source="fixture", overrides=overrides)

    payload = _fetch_live(carrier, number, date, settings)
    flight = build_flight(payload, source="oag", overrides=overrides)  # raises before saving if empty
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return flight


def _fixture_path(fixtures_dir: Path, carrier: str, number: str, date: str) -> Path:
    return fixtures_dir / "oag" / f"{carrier}{number}_{date}.json"


def _load_overrides(fixtures_dir: Path) -> dict[str, dict[str, str]]:
    path = fixtures_dir / "synthetic_overrides.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def _fetch_live(carrier: str, number: str, date: str, settings: Settings) -> dict:
    if not (settings.oag_live and settings.oag_api_key):
        raise FlightNotFound(f"No saved data for {carrier} {number} on {date}")

    params = {
        "version": "v2",
        "CarrierCode": carrier,
        "FlightNumber": int(number),
        "DepartureDateTime": date,
        "CodeType": "IATA",
        "Content": "Status",
    }
    try:
        response = httpx.get(
            OAG_URL, params=params, headers={"Subscription-Key": settings.oag_api_key}, timeout=30
        )
    except httpx.HTTPError as exc:
        raise OagUnavailable(f"OAG request failed: {type(exc).__name__}") from exc
    if response.status_code != 200:
        raise OagUnavailable(f"OAG returned HTTP {response.status_code}")
    return response.json()
