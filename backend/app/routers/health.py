from fastapi import APIRouter

from app.models.program import CamelModel
from app.program import get_program

router = APIRouter(prefix="/api", tags=["health"])


class HealthResponse(CamelModel):
    status: str
    service: str
    program_note: str


@router.get("/health", response_model=HealthResponse, response_model_by_alias=True)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="little-explorers-api", program_note=get_program().note)
