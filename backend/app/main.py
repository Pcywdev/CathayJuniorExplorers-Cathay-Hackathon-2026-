"""FastAPI entry point. Only wiring lives here: middleware and routers."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health

settings = get_settings()

app = FastAPI(title="Little Explorers API", version="0.1.0")

# CORS: the browser only lets the frontend (a different origin/port) call us
# if we list its origin here. Origins come from ALLOWED_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
