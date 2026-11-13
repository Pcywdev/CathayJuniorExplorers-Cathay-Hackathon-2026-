from fastapi import APIRouter, Depends

from app.logic.graduation import score_graduation
from app.models.graduation import GraduationRequest, GraduationResult
from app.models.program import Program
from app.program import get_program

router = APIRouter(prefix="/api", tags=["graduation"])


@router.post("/graduation/score", response_model=GraduationResult, response_model_by_alias=True)
def graduation_score(body: GraduationRequest, program: Program = Depends(get_program)) -> GraduationResult:
    return score_graduation(body.membership_years, body.family_flights, body.junior_miles, program)
