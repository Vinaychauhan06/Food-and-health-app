import os
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import logging

logger = logging.getLogger(__name__)

# Initialize Vertex AI
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "health-and-food-app")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    # Using Gemini 1.5 Pro Multimodal as requested
    model = GenerativeModel("gemini-1.5-pro-preview-0409")
    vertex_initialized = True
except Exception as e:
    logger.warning(f"Failed to initialize Vertex AI: {e}. Will use mock data.")
    vertex_initialized = False

def estimate_water_volume(image_bytes: bytes, mime_type: str) -> dict:
    """
    Calls Gemini 1.5 Pro to estimate water volume from an image.
    """
    if not vertex_initialized or PROJECT_ID == "mock-project-id":
        logger.info("Mocking Gemini Vision API call")
        return {
            "estimated_ml": 250,
            "confidence": "High (Mocked)",
            "message": "Great job staying hydrated! Keep it up."
        }

    try:
        image_part = Part.from_data(data=image_bytes, mime_type=mime_type)
        prompt = "Analyze this image of a drinking container. Estimate the volume of water (or liquid) it currently contains in milliliters (ml). Only return the number, or a short explanation if unsure. Assume standard sizes for common glasses and bottles."
        
        response = model.generate_content([image_part, prompt])
        text_response = response.text.strip()
        
        # Simple extraction logic (in a real app, you'd want more robust parsing)
        # Attempt to find the first number in the response
        import re
        numbers = re.findall(r'\d+', text_response)
        
        if numbers:
            estimated_ml = int(numbers[0])
            confidence = "Medium"
        else:
            estimated_ml = 0
            confidence = "Low"
            
        return {
            "estimated_ml": estimated_ml,
            "confidence": confidence,
            "message": f"Gemini Analysis: {text_response}"
        }
    except Exception as e:
        logger.error(f"Error calling Vertex AI: {e}")
        return {
            "estimated_ml": 0,
            "confidence": "Error",
            "message": "Failed to analyze image."
        }
