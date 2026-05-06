from fastapi import APIRouter
from models import LocationRequest, HackResponse
from services.location_service import get_contextual_hack

router = APIRouter()

@router.post("/contextual", response_model=HackResponse)
async def contextual_health_hack(request: LocationRequest):
    """
    Returns a contextual health hack based on the user's location.
    If the user is in a small town (low restaurant density), it suggests a DIY hack.
    """
    result = get_contextual_hack(request.latitude, request.longitude)
    return HackResponse(**result)
