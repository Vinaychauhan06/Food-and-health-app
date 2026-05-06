import os
import googlemaps
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# Initialize Google Maps client (requires GOOGLE_MAPS_API_KEY env var)
# Using a placeholder for local development if the key is missing
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "mock_key")
try:
    gmaps = googlemaps.Client(key=API_KEY)
except ValueError as e:
    logger.warning(f"Failed to initialize Google Maps client: {e}. Will use mock data.")
    gmaps = None

@lru_cache(maxsize=128)
def get_restaurant_density(latitude: float, longitude: float, radius: int = 5000) -> int:
    """
    Calls Google Maps Places API to find restaurants within a radius.
    Cached using lru_cache to save API credits as requested.
    """
    if not gmaps or API_KEY == "mock_key":
        # Mock logic for demonstration/testing
        logger.info(f"Mocking Maps API call for {latitude}, {longitude}")
        if latitude > 40.0:  # arbitrary logic for testing
            return 2  # Low density
        return 15  # High density

    try:
        places_result = gmaps.places_nearby(
            location=(latitude, longitude),
            radius=radius,
            type='restaurant'
        )
        return len(places_result.get('results', []))
    except Exception as e:
        logger.error(f"Error calling Maps API: {e}")
        return 0 # Default to 0 on error to trigger fallback

def get_contextual_hack(latitude: float, longitude: float) -> dict:
    """
    Determines if user is in a small town and returns appropriate hack.
    """
    density = get_restaurant_density(latitude, longitude)
    
    # Threshold for "Small Town" / Low Restaurant Density
    if density < 5:
        return {
            "location_type": "small_town",
            "suggestion": "Local DIY Healthy Hack",
            "recipe_or_hack": "Since there aren't many healthy restaurant options nearby, try this DIY hack: Opt for a high-protein Paneer Tikka or Chole with less oil at a local dhaba, or make a quick Dal Tadka at home with whole wheat Roti."
        }
    else:
        return {
            "location_type": "urban",
            "suggestion": "Healthy Restaurant Option",
            "recipe_or_hack": "You have plenty of options! Search for 'healthy salads' or 'grilled protein' in your delivery app."
        }
