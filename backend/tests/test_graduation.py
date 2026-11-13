"""Graduation score (plan.md section 5): pure logic first, then POST /api/graduation/score."""

import pytest
from fastapi.testclient import TestClient

from app.logic.graduation import band_for, points, score_graduation
from app.main import app
from app.program import get_program

client = TestClient(app)


@pytest.fixture
def program():
    return get_program()


# --- points ------------------------------------------------------------------

def test_points_per_unit_and_capped(program):
    rules = program.score
    assert points(12, rules.membership_years) == 60  # 5 per year
    assert points(20, rules.family_flights) == 80  # 4 per flight
    assert points(48000, rules.junior_miles) == 18  # 2 per full 5,000
    assert points(4999, rules.junior_miles) == 0  # partial blocks don't count
    assert points(40, rules.membership_years) == 75  # capped at max
    assert points(0, rules.family_flights) == 0


# --- bands -------------------------------------------------------------------

@pytest.mark.parametrize("score, index", [(0, 1), (60, 1), (61, 2), (130, 2), (131, 3), (200, 3)])
def test_band_edges(program, score, index):
    assert band_for(score, program).index == index


# --- full result -------------------------------------------------------------

def test_api_md_example(program):
    r = score_graduation(12, 20, 48000, program)

    assert r.score == 158 and r.max_score == 200
    assert [(b.id, b.points, b.max) for b in r.breakdown] == [
        ("membershipYears", 60, 75), ("familyFlights", 80, 100), ("juniorMiles", 18, 25),
    ]
    assert [b.label for b in r.breakdown] == ["Membership years", "Family flights", "Junior miles"]
    assert (r.band.index, r.band.min, r.band.max) == (3, 131, 200)
    assert r.package.miles_carried_over == 48000
    assert r.package.status_points_head_start == 150
    assert r.package.silver_threshold == 300
    assert r.package.transfer_allowance == [120000, 80000, 40000]


def test_head_start_only_in_top_band(program):
    r = score_graduation(2, 5, 10000, program)  # 10 + 20 + 4 = 34 -> band 1
    assert r.score == 34 and r.band.index == 1
    assert r.package.status_points_head_start == 0


def test_everything_maxed_is_200(program):
    assert score_graduation(100, 100, 1_000_000, program).score == 200


# --- endpoint ----------------------------------------------------------------

def test_endpoint_matches_api_md():
    r = client.post("/api/graduation/score", json={"membershipYears": 12, "familyFlights": 20, "juniorMiles": 48000})

    assert r.status_code == 200
    assert r.json() == {
        "score": 158,
        "maxScore": 200,
        "breakdown": [
            {"id": "membershipYears", "label": "Membership years", "points": 60, "max": 75},
            {"id": "familyFlights", "label": "Family flights", "points": 80, "max": 100},
            {"id": "juniorMiles", "label": "Junior miles", "points": 18, "max": 25},
        ],
        "band": {"index": 3, "min": 131, "max": 200},
        "package": {
            "milesCarriedOver": 48000,
            "statusPointsHeadStart": 150,
            "silverThreshold": 300,
            "transferAllowance": [120000, 80000, 40000],
        },
    }


@pytest.mark.parametrize("body", [
    {"membershipYears": -1, "familyFlights": 20, "juniorMiles": 48000},
    {"membershipYears": 12, "familyFlights": 20},
    {"membershipYears": 12, "familyFlights": 20, "juniorMiles": "lots"},
    {"membershipYears": 200, "familyFlights": 20, "juniorMiles": 48000},
])
def test_bad_input_is_422(body):
    assert client.post("/api/graduation/score", json=body).status_code == 422
