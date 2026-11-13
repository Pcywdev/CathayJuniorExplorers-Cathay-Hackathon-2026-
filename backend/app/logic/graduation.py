"""Graduation score (plan.md section 5): history -> score, breakdown, band and package.

Pure functions only. Every rule and limit comes from the Program (shared/program.json).
"""

from app.models.graduation import GraduationPackage, GraduationResult, ScoreLine
from app.models.program import Band, Program, ScoreRule

LABELS = {
    "membershipYears": "Membership years",
    "familyFlights": "Family flights",
    "juniorMiles": "Junior miles",
}


def points(value: int, rule: ScoreRule) -> int:
    """`pointsPer` for every full `per` units, capped at `max`."""
    return min(rule.max, (value // rule.per) * rule.points_per)


def band_for(score: int, program: Program) -> Band:
    for band in program.bands:
        if band.min <= score <= band.max:
            return band
    raise ValueError(f"No band in program.json covers score {score}")


def score_graduation(membership_years: int, family_flights: int, junior_miles: int, program: Program) -> GraduationResult:
    rules = program.score
    inputs = {
        "membershipYears": (membership_years, rules.membership_years),
        "familyFlights": (family_flights, rules.family_flights),
        "juniorMiles": (junior_miles, rules.junior_miles),
    }
    breakdown = [
        ScoreLine(id=key, label=LABELS[key], points=points(value, rule), max=rule.max)
        for key, (value, rule) in inputs.items()
    ]
    score = sum(line.points for line in breakdown)
    band = band_for(score, program)
    top_band = max(program.bands, key=lambda b: b.index)
    grad = program.graduation

    return GraduationResult(
        score=score,
        max_score=sum(line.max for line in breakdown),
        breakdown=breakdown,
        band=band,
        package=GraduationPackage(
            miles_carried_over=junior_miles,
            status_points_head_start=grad.top_band_status_points_head_start if band.index == top_band.index else 0,
            silver_threshold=grad.silver_threshold,
            transfer_allowance=grad.transfer_allowance_by_year,
        ),
    )
