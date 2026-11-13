"""Request and response for POST /api/graduation/score (docs/api.md)."""

from pydantic import Field

from app.models.program import Band, CamelModel


class GraduationRequest(CamelModel):
    # Upper limits only stop nonsense input; the score itself is capped by program.json.
    membership_years: int = Field(ge=0, le=100)
    family_flights: int = Field(ge=0, le=10_000)
    junior_miles: int = Field(ge=0, le=100_000_000)


class ScoreLine(CamelModel):
    id: str
    label: str
    points: int
    max: int


class GraduationPackage(CamelModel):
    miles_carried_over: int
    status_points_head_start: int  # top band only, otherwise 0
    silver_threshold: int
    transfer_allowance: list[int]  # family transfer limit per year after graduating


class GraduationResult(CamelModel):
    score: int
    max_score: int
    breakdown: list[ScoreLine]
    band: Band
    package: GraduationPackage
