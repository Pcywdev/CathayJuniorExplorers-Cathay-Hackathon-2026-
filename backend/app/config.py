"""App settings, read from environment variables (and backend/.env in dev).

pydantic-settings maps each field to an env var of the same name, case-insensitive:
OAG_API_KEY -> oag_api_key. Nothing secret is ever hard-coded here.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/config.py -> repo root. The Dockerfile keeps the same layout.
REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
# Saved OAG responses and synthetic overrides. The Dockerfile copies this folder into the image.
FIXTURES_DIR = BACKEND_DIR / "fixtures"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    oag_api_key: str = ""
    # Off by default so nothing spends OAG quota by accident. When true, a fixture miss
    # triggers one live OAG call and the response is saved as a new fixture.
    oag_live: bool = False
    fixtures_dir: Path = FIXTURES_DIR
    # Story AI (services/llm.py). "" = no AI (pre-written fallback only), "fake" = canned output
    # for tests and dev, "openai" = the openai SDK (OpenAI, or Gemini via LLM_BASE_URL).
    llm_provider: str = ""
    llm_api_key: str = ""
    llm_base_url: str = ""  # empty = OpenAI itself; set for an OpenAI-compatible provider
    llm_model: str = ""  # required for "openai"; never guessed
    # Off by default so no trip waits on the AI on stage. When true, a trip with no reviewed
    # story fixture makes one live AI call; any failure falls back to the pre-written story.
    llm_live: bool = False
    llm_timeout_seconds: float = 30
    # Comma-separated list, e.g. "http://localhost:5173,https://demo.example.app"
    allowed_origins: str = "http://localhost:5173"
    program_path: Path = REPO_ROOT / "shared" / "program.json"
    # Trips and events. The folder is created on first use; *.db is gitignored.
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'data' / 'little-explorers.db').as_posix()}"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
