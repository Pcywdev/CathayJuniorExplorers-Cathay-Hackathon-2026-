"""FastAPI entry point. Only wiring lives here: middleware and routers."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import create_tables, get_engine
from app.routers import events, flights, graduation, health, trips

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_tables(get_engine())
    yield


app = FastAPI(title="Little Explorers API", version="0.1.0", lifespan=lifespan)

# CORS: the browser only lets the frontend (a different origin/port) call us
# if we list its origin here. Origins come from ALLOWED_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(flights.router)
app.include_router(trips.router)
app.include_router(events.router)
app.include_router(graduation.router)
