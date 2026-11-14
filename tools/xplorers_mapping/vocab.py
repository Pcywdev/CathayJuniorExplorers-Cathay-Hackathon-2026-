"""Shared vocabulary: age bands and buckets, member traits, promo tags. Everything here is illustrative."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROGRAM = json.loads((ROOT / "shared" / "program.json").read_text(encoding="utf-8"))

MIN_AGE = PROGRAM["xplorers"]["discover"]["minAge"]  # 4
MAX_AGE = PROGRAM["xplorers"]["discover"]["maxAge"]  # 25

# Age bands follow the tier edges in program.json (Little / Teen / Campus).
AGE_BANDS = [
    {"id": t["id"], "name": t["name"], "minAge": max(t["minAge"], MIN_AGE), "maxAge": min(t["maxAge"], MAX_AGE)}
    for t in PROGRAM["xplorers"]["tiers"]
]

# Finer age buckets give the user tower a smooth sense of age inside a band.
AGE_BUCKETS = [
    (4, 6), (7, 9), (10, 11), (12, 13), (14, 15), (16, 17), (18, 19), (20, 22), (23, 25),
]


def band_for(age: int) -> str:
    for b in AGE_BANDS:
        if b["minAge"] <= age <= b["maxAge"]:
            return b["id"]
    return AGE_BANDS[-1]["id"]


def bucket_for(age: int) -> str:
    for lo, hi in AGE_BUCKETS:
        if lo <= age <= hi:
            return f"{lo}-{hi}"
    lo, hi = AGE_BUCKETS[-1]
    return f"{lo}-{hi}"


# Member characteristics shown as tick boxes in the demo panel. `prevalence` is the share of synthetic users
# per band that have the trait (0 = can't have it in that band). Interests and situation only: never health
# or location (children's data rule).
TRAITS = [
    # Style
    {"id": "gamer", "label": "Loves games", "group": "style", "reason": "Because you love games",
     "prevalence": {"little": 0.30, "teen": 0.45, "campus": 0.30}},
    {"id": "foodie", "label": "Foodie", "group": "style", "reason": "Because you're a foodie",
     "prevalence": {"little": 0.25, "teen": 0.35, "campus": 0.40}},
    {"id": "outdoorsy", "label": "Outdoors and sport", "group": "style", "reason": "Because you like the outdoors",
     "prevalence": {"little": 0.30, "teen": 0.30, "campus": 0.35}},
    {"id": "creative", "label": "Arts and photos", "group": "style", "reason": "Because you like making things",
     "prevalence": {"little": 0.30, "teen": 0.30, "campus": 0.25}},
    {"id": "techie", "label": "Planes and tech", "group": "style", "reason": "Because you like planes and tech",
     "prevalence": {"little": 0.35, "teen": 0.25, "campus": 0.20}},
    # Situation
    {"id": "budget", "label": "Watching every mile", "group": "situation", "reason": "Good value for your miles",
     "prevalence": {"little": 0.20, "teen": 0.35, "campus": 0.50}},
    {"id": "with_siblings", "label": "Travels with siblings", "group": "situation", "reason": "Fun with your siblings",
     "prevalence": {"little": 0.50, "teen": 0.40, "campus": 0.15}},
    {"id": "first_solo", "label": "First trip alone", "group": "situation", "reason": "For your first trip alone",
     "minAge": 15, "prevalence": {"little": 0.0, "teen": 0.25, "campus": 0.50}},
    {"id": "studying", "label": "University student", "group": "situation", "reason": "For students",
     "minAge": 18, "prevalence": {"little": 0.0, "teen": 0.0, "campus": 0.75}},
    {"id": "studying_abroad", "label": "Studying abroad", "group": "situation", "reason": "For studying abroad",
     "minAge": 18, "requires": ["studying"], "prevalence": {"little": 0.0, "teen": 0.0, "campus": 0.35}},
]
TRAIT_IDS = [t["id"] for t in TRAITS]
TRAIT_BY_ID = {t["id"]: t for t in TRAITS}


def trait_min_age(trait_id: str) -> int:
    return TRAIT_BY_ID[trait_id].get("minAge", MIN_AGE)


TAGS = ["food", "games", "outdoors", "arts", "aviation", "study", "campus", "abroad", "family", "solo", "value", "kids"]

KINDS = ["activity", "event", "discount", "game"]

# Miles buckets for the item tower: free, low, mid, high.
def miles_bucket(miles: int | None) -> str:
    if not miles:
        return "free"
    if miles <= 500:
        return "low"
    if miles <= 3000:
        return "mid"
    return "high"
