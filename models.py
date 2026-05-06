from pydantic import BaseModel, Field
from typing import Optional

class LocationRequest(BaseModel):
    latitude: float = Field(..., description="Latitude of the user's location")
    longitude: float = Field(..., description="Longitude of the user's location")

class HackResponse(BaseModel):
    location_type: str = Field(..., description="Detected location type (e.g., 'small_town', 'urban')")
    suggestion: str = Field(..., description="The recommended meal or hack")
    recipe_or_hack: Optional[str] = Field(None, description="Detailed recipe or hack if applicable")

class WaterIntakeResponse(BaseModel):
    estimated_ml: int = Field(..., description="Estimated volume of water in milliliters")
    confidence: str = Field(..., description="Confidence level of the estimation")
    message: str = Field(..., description="Motivational or contextual message")
