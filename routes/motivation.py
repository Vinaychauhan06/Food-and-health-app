from fastapi import APIRouter, Body
from services.imagen_service import generate_future_self

router = APIRouter()

@router.post("/future-self", tags=["Motivation (Lalach)"])
async def future_self_motivation(body_analysis_data: dict = Body(...)):
    """
    Generates a motivational 'Future Self' image based on current body analysis data.
    """
    result = generate_future_self(body_analysis_data)
    return result
