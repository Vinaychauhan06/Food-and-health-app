from fastapi import APIRouter, UploadFile, File, HTTPException
from models import WaterIntakeResponse
from services.vision_service import estimate_water_volume

router = APIRouter()

@router.post("/estimate", response_model=WaterIntakeResponse)
async def estimate_water(file: UploadFile = File(...)):
    """
    Estimates the volume of water in ml from an uploaded image using Gemini Vision API.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        content = await file.read()
        result = estimate_water_volume(content, file.content_type)
        return WaterIntakeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
