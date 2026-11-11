"""Fetch one flight from the OAG Flight Info API and save the raw JSON as a fixture.

Each call spends OAG quota (1,000 requests / 30 days, shared), so an existing
fixture is never re-fetched unless you pass --force.

Usage (from the repo root, Cathay-Hack env):
    python tools/fetch_oag.py --carrier CX --number 500 --date 2026-11-14
"""

import argparse
import json
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "backend" / "fixtures" / "oag"
URL = "https://api.oag.com/flight-instances/"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--carrier", default="CX")
    parser.add_argument("--number", type=int, default=500)
    parser.add_argument("--date", required=True, help="Local departure date, YYYY-MM-DD")
    parser.add_argument("--force", action="store_true", help="Re-fetch even if the fixture exists")
    args = parser.parse_args()

    out = FIXTURES / f"{args.carrier}{args.number}_{args.date}.json"
    if out.exists() and not args.force:
        print(f"fixture exists, not calling OAG: {out.relative_to(ROOT)}")
        return

    load_dotenv(ROOT / "backend" / ".env")
    key = os.environ.get("OAG_API_KEY", "").strip()
    if not key:
        sys.exit("OAG_API_KEY is not set in backend/.env")

    params = {
        "version": "v2",
        "CarrierCode": args.carrier,
        "FlightNumber": args.number,
        "DepartureDateTime": args.date,
        "CodeType": "IATA",
        "Content": "Status",
    }
    response = httpx.get(URL, params=params, headers={"Subscription-Key": key}, timeout=30)
    print(f"HTTP {response.status_code}")
    if response.status_code != 200:
        print(response.text[:500])
        sys.exit(1)

    data = response.json()
    FIXTURES.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"saved {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
