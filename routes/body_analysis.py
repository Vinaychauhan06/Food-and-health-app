from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from services.vision_service import analyze_body_shape, verify_grocery_receipt
from typing import List

router = APIRouter()

@router.post("/analyze", tags=["Body Analysis"])
async def body_analysis(file: UploadFile = File(...)):
    """
    Analyzes a body photo to estimate health state based on visible markers.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        content = await file.read()
        result = analyze_body_shape(content, file.content_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/grocery", tags=["Grocery Matcher"])
async def grocery_verification(
    file: UploadFile = File(...), 
    healthy_roadmap: str = Form(...) # We accept a comma-separated string for simplicity
):
    """
    Verifies a grocery receipt against a healthy roadmap list.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        content = await file.read()
        roadmap_list = [item.strip() for item in healthy_roadmap.split(",")]
        result = verify_grocery_receipt(content, file.content_type, roadmap_list)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
