"""Typed view of shared/program.json. Every displayed number flows through here."""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base for models whose JSON uses camelCase (the API convention in docs/api.md)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, frozen=True)


class Mission(CamelModel):
    id: str
    title: str
    miles: int


class ScoreRule(CamelModel):
    points_per: int
    per: int
    max: int


class ScoreRules(CamelModel):
    membership_years: ScoreRule
    family_flights: ScoreRule
    junior_miles: ScoreRule


class Band(CamelModel):
    index: int
    min: int
    max: int


class Graduation(CamelModel):
    top_band_status_points_head_start: int
    silver_threshold: int
    transfer_allowance_by_year: list[int]


class DemoMember(CamelModel):
    name: str
    starting_balance: int


class Program(CamelModel):
    note: str
    currency: str
    annual_earn_cap: int
    missions: list[Mission]
    score: ScoreRules
    bands: list[Band]
    graduation: Graduation
    demo_member: DemoMember
