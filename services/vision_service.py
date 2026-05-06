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

def analyze_body_shape(image_bytes: bytes, mime_type: str) -> dict:
    """
    Uses Gemini 1.5 Pro to analyze body photos (tummy/face shape) for health state estimation.
    """
    if not vertex_initialized:
        logger.info("Mocking Gemini Body Analysis API call")
        return {
            "health_state_estimate": "Good",
            "face_shape": "oval",
            "tummy_profile": "flat",
            "recommendation": "Maintain current diet and exercise routine."
        }

    try:
        image_part = Part.from_data(data=image_bytes, mime_type=mime_type)
        prompt = "Analyze this body/face photo. Estimate the general health state based on visible markers like face shape (e.g., round, oval) and tummy profile. Provide a JSON response with keys: 'health_state_estimate', 'face_shape', 'tummy_profile', and 'recommendation'."
        
        response = model.generate_content([image_part, prompt])
        # In reality, we would parse the JSON carefully here.
        return {
            "health_state_estimate": "Analyzed",
            "face_shape": "Detected",
            "tummy_profile": "Detected",
            "recommendation": response.text.strip()
        }
    except Exception as e:
        logger.error(f"Error in body analysis: {e}")
        return {"error": "Failed to analyze body shape"}

def verify_grocery_receipt(image_bytes: bytes, mime_type: str, healthy_roadmap: list) -> dict:
    """
    Uses Gemini to verify grocery photos against the "Healthy Roadmap" list.
    """
    if not vertex_initialized:
        logger.info("Mocking Gemini Grocery Verification API call")
        return {
            "verification_status": "Passed",
            "matched_items": ["Oats", "Apples", "Spinach"],
            "unhealthy_items_flagged": ["Soda"],
            "message": "Great job! Most items match your healthy roadmap. Goal Unlocked!"
        }

    try:
        image_part = Part.from_data(data=image_bytes, mime_type=mime_type)
        roadmap_str = ", ".join(healthy_roadmap)
        prompt = f"Analyze this grocery receipt or basket. Cross-reference the items found with this healthy roadmap: [{roadmap_str}]. Tell me which items match, and flag any obviously unhealthy items."
        
        response = model.generate_content([image_part, prompt])
        return {
            "verification_status": "Analyzed",
            "message": response.text.strip()
        }
    except Exception as e:
        logger.error(f"Error in grocery verification: {e}")
        return {"error": "Failed to verify groceries"}
