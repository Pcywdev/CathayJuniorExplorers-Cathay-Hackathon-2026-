"""App settings, read from environment variables (and backend/.env in dev).

pydantic-settings maps each field to an env var of the same name, case-insensitive:
OAG_API_KEY -> oag_api_key. Nothing secret is ever hard-coded here.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/config.py -> repo root. The Dockerfile keeps the same layout.
REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    oag_api_key: str = ""
    llm_provider: str = ""  # "gemini" or "bedrock", whichever credits we get
    llm_api_key: str = ""
    # Comma-separated list, e.g. "http://localhost:5173,https://demo.example.app"
    allowed_origins: str = "http://localhost:5173"
    program_path: Path = REPO_ROOT / "shared" / "program.json"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
