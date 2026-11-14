"""Dummy data: users, promotions and a synthetic interaction log.

A promo's minAge/maxAge/peakAge say who it was *designed for*; they are soft. Only real restrictions
(`hardMinAge`/`hardMaxAge`, e.g. 18+ for a hostel, a minors-only service) and required traits are rules.
Users see promos from the whole catalog, so the model, not the rules, learns how far each promo's appeal
reaches beyond its designed range (e.g. bubble tea for a 20-year-old foodie).

The interaction log is drawn from a hidden preference function (`_true_logit`). The dual encoder never sees it;
analyse.py checks the trained model recovers it (AUC, recall@6 vs a popularity baseline).
"""

from __future__ import annotations

import math
import random

from .vocab import AGE_BANDS, MAX_AGE, MIN_AGE, PROGRAM, TRAITS, band_for, trait_min_age

# --- Promotions --------------------------------------------------------------------------------------------

# Tags for the catalog already in program.json (xplorers.discover), so the grid's existing ids keep working.
SEED_TAGS: dict[str, list[str]] = {
    "cockpit-colouring": ["arts", "aviation", "kids"],
    "puppet-show": ["arts", "kids", "family"],
    "draw-a-plane": ["arts", "aviation", "kids"],
    "seatbelt-song": ["kids", "family"],
    "cloud-spotter": ["games", "outdoors", "kids"],
    "pip-sticker-hunt": ["games", "kids", "family"],
    "plane-spotting": ["aviation", "outdoors"],
    "crew-workshop": ["aviation", "kids"],
    "kids-meal-upgrade": ["food", "kids"],
    "flight-sim-try": ["aviation", "games"],
    "blind-box-drop": ["arts", "value"],
    "bubble-tea-gate": ["food", "value"],
    "snack-pack": ["food", "value"],
    "esports-night": ["games"],
    "route-quiz": ["games", "aviation"],
    "photo-challenge": ["arts", "games"],
    "phone-strap": ["arts"],
    "summer-camp": ["aviation", "outdoors"],
    "student-fare": ["study", "campus", "value"],
    "extra-bag": ["campus", "abroad"],
    "language-trip": ["study", "abroad", "solo"],
    "hostel-deal": ["solo", "value", "abroad"],
    "lounge-study": ["study", "campus"],
    "career-day": ["aviation", "campus"],
    "grad-trip": ["campus", "solo"],
    "hike-meetup": ["outdoors", "solo"],
    "travel-hack": ["games", "value", "solo"],
}
SEED_REQUIRES: dict[str, list[str]] = {"student-fare": ["studying"], "lounge-study": ["studying"]}

# New dummy promotions. Generic partner wording only: no real brands.
NEW_PROMOS = [
    ("gate-arcade", "event", "Retro arcade corner at the gate", "HKG terminal", None, 8, 18, 13, ["games", "kids"]),
    ("game-bundle", "discount", "In-flight game bundle", "On board", 300, 9, 20, 14, ["games", "value"]),
    ("dim-sum-class", "activity", "Mini dim sum class", "Partner restaurant", 500, 7, 16, 11, ["food", "kids", "family"]),
    ("street-food-pass", "discount", "Street food tasting pass", "Partner food hall", 900, 14, 25, 19, ["food", "value"]),
    ("chef-table", "event", "Meet the in-flight chef", "Cathay City", 1500, 12, 25, 18, ["food", "aviation"]),
    ("sunrise-paddle", "activity", "Sunrise paddleboard session", "Partner club", 1100, 13, 25, 19, ["outdoors"]),
    ("trail-run", "event", "Island trail run for Xplorers", "Partner club", None, 14, 25, 18, ["outdoors", "solo"]),
    ("kite-day", "activity", "Kite-making day", "Partner park", None, 5, 12, 8, ["outdoors", "arts", "kids", "family"]),
    ("skyline-sketch", "activity", "Sketch the skyline workshop", "Partner studio", 400, 9, 22, 15, ["arts"]),
    ("film-photo-walk", "event", "Film photo walk", "Partner studio", 700, 15, 25, 20, ["arts", "solo"]),
    ("hangar-tour", "event", "Behind-the-scenes hangar tour", "Cathay City", 800, 8, 25, 14, ["aviation"]),
    ("pilot-qa", "event", "Ask a pilot live session", "In app", None, 7, 18, 12, ["aviation", "kids"]),
    ("sibling-seats", "discount", "Sit-together seats for siblings", "Cathay", 200, 4, 17, 10, ["family", "value", "kids"]),
    ("family-lounge-play", "event", "Lounge play corner pass", "HKG lounge", 600, 4, 12, 7, ["family", "kids"]),
    ("solo-starter", "activity", "First solo trip starter guide", "In app", None, 15, 25, 18, ["solo"]),
    ("solo-meet-assist", "discount", "Airport meet-and-assist for solo travellers", "Cathay", 1000, 15, 19, 16, ["solo", "family"]),
    ("mile-stretcher", "discount", "Mile-stretcher value pack", "Cathay", 350, 12, 25, 18, ["value"]),
    ("off-peak-fare", "discount", "Off-peak fare saver", "Cathay", 2000, 16, 25, 21, ["value", "solo"]),
    ("move-abroad-bags", "discount", "Move-abroad baggage allowance", "Cathay", 3500, 18, 25, 19, ["abroad", "campus"]),
    ("term-break-home", "discount", "Term-break flight home", "Cathay", 5000, 18, 25, 21, ["abroad", "study"]),
    ("study-cafe-pass", "discount", "Quiet study café pass", "Partner café", 900, 17, 25, 20, ["study", "food", "campus"]),
    ("campus-storage", "discount", "Summer dorm storage", "Partner storage", 2200, 18, 25, 20, ["campus", "abroad"]),
]
NEW_REQUIRES = {
    "move-abroad-bags": ["studying_abroad"],
    "term-break-home": ["studying_abroad"],
    "study-cafe-pass": ["studying"],
    "campus-storage": ["studying"],
}


# Real restrictions only. Everything else about age is left for the model to learn.
HARD_LIMITS: dict[str, tuple[int, int]] = {
    "hostel-deal": (18, 25),        # partner hostels take adults only
    "grad-trip": (18, 25),
    "off-peak-fare": (16, 25),
    "solo-starter": (15, 25),       # first solo trip: 15+ (as the trait)
    "solo-meet-assist": (12, 17),   # an assistance service for minors flying alone
    "trail-run": (14, 25),
    "sunrise-paddle": (10, 25),
    "kids-meal-upgrade": (4, 13),   # it is a kids' meal
    "family-lounge-play": (4, 12),  # a play corner
}


def make_promotions() -> list[dict]:
    promos = []
    for item in PROGRAM["xplorers"]["discover"]["items"]:
        promos.append({
            "id": item["id"], "kind": item["kind"], "title": item["title"], "where": item["where"],
            **({"miles": item["miles"]} if "miles" in item else {}),
            "minAge": item["minAge"], "maxAge": item["maxAge"], "peakAge": item["peakAge"],
            "tags": SEED_TAGS[item["id"]], "requires": SEED_REQUIRES.get(item["id"], []),
        })
        promos[-1].update(_hard(item["id"]))
    for pid, kind, title, where, miles, lo, hi, peak, tags in NEW_PROMOS:
        promos.append({
            "id": pid, "kind": kind, "title": title, "where": where,
            **({"miles": miles} if miles else {}),
            "minAge": lo, "maxAge": hi, "peakAge": peak,
            "tags": tags, "requires": NEW_REQUIRES.get(pid, []),
        })
        promos[-1].update(_hard(pid))
    return promos


def _hard(pid: str) -> dict:
    lo, hi = HARD_LIMITS.get(pid, (MIN_AGE, MAX_AGE))
    return {"hardMinAge": lo, "hardMaxAge": hi}


# --- Users -------------------------------------------------------------------------------------------------

FIRST_NAMES = ["Ada", "Bo", "Chi", "Dani", "Eli", "Fai", "Gigi", "Hin", "Ivy", "Jun", "Kai", "Lok", "Man", "Nia",
               "Oli", "Pak", "Qi", "Rae", "Sum", "Tin", "Uma", "Vic", "Wing", "Xin", "Yan", "Zoe"]

# Typical miles balance by band (users who watch every mile hold fewer).
BALANCE = {"little": 1500, "teen": 9000, "campus": 22000}


def make_users(rng: random.Random, n: int = 500) -> list[dict]:
    users = []
    for i in range(n):
        age = rng.randint(MIN_AGE, MAX_AGE)
        band = band_for(age)
        traits = []
        for t in TRAITS:
            if age < trait_min_age(t["id"]):
                continue
            if any(r not in traits for r in t.get("requires", [])):
                continue
            # studying_abroad is a share of students, so scale up by the studying rate.
            p = t["prevalence"][band] / (0.75 if t.get("requires") == ["studying"] else 1)
            if rng.random() < p:
                traits.append(t["id"])
        balance = int(BALANCE[band] * rng.uniform(0.5, 1.5) * (0.6 if "budget" in traits else 1))
        users.append({"id": f"u{i:03d}", "name": rng.choice(FIRST_NAMES), "age": age, "traits": traits, "miles": balance})
    return users


# --- Rules (stage 1, deterministic) ------------------------------------------------------------------------

def eligible(user: dict, promo: dict) -> bool:
    """Hard age limits (not the designed range), required traits, and affordability (games earn miles)."""
    if not promo["hardMinAge"] <= user["age"] <= promo["hardMaxAge"]:
        return False
    if any(r not in user["traits"] for r in promo["requires"]):
        return False
    if promo["kind"] != "game" and promo.get("miles", 0) > user["miles"]:
        return False
    return True


# --- Hidden preferences (ground truth the model must recover) ----------------------------------------------

AFFINITY: dict[str, dict[str, float]] = {
    "gamer": {"games": 2.2, "aviation": 0.3},
    "foodie": {"food": 2.2},
    "outdoorsy": {"outdoors": 2.2},
    "creative": {"arts": 2.2},
    "techie": {"aviation": 2.2, "games": 0.4},
    "budget": {"value": 1.6},
    "with_siblings": {"family": 1.8, "kids": 0.4},
    "first_solo": {"solo": 1.8},
    "studying": {"study": 1.6, "campus": 1.2},
    "studying_abroad": {"abroad": 2.2, "study": 0.6},
}


def _true_logit(user: dict, promo: dict, popularity: dict[str, float]) -> float:
    s = -2.6 + popularity[promo["id"]]
    for t in user["traits"]:
        for tag in promo["tags"]:
            s += AFFINITY[t].get(tag, 0.0)
    # Appeal fades with distance from the designed peak; wide-range promos fade slower. Outside the designed
    # range it keeps fading but never hits a wall, so a strong interest can still carry it.
    spread = max(3.0, (promo["maxAge"] - promo["minAge"]) / 2)
    s += 2.4 * math.exp(-0.5 * ((user["age"] - promo["peakAge"]) / spread) ** 2) - 1.0
    if "budget" in user["traits"] and promo["kind"] != "game" and promo.get("miles", 0) > 2000:
        s -= 1.8
    return s


def make_interactions(rng: random.Random, users: list[dict], promos: list[dict], views: int = 16) -> list[dict]:
    popularity = {p["id"]: rng.gauss(0, 0.4) for p in promos}
    log = []
    for u in users:
        pool = [p for p in promos if eligible(u, p)]
        for p in rng.sample(pool, min(views, len(pool))):
            prob = 1 / (1 + math.exp(-_true_logit(u, p, popularity)))
            log.append({"user": u["id"], "promo": p["id"], "redeemed": 1 if rng.random() < prob else 0})
    return log


def band_names() -> dict[str, str]:
    return {b["id"]: b["name"] for b in AGE_BANDS}
