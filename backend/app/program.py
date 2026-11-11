"""Loads shared/program.json once and validates it against the Program model."""

import json
from functools import lru_cache
from pathlib import Path

from app.config import get_settings
from app.models.program import Program


def load_program(path: Path) -> Program:
    with path.open(encoding="utf-8") as f:
        return Program.model_validate(json.load(f))


@lru_cache
def get_program() -> Program:
    return load_program(get_settings().program_path)
