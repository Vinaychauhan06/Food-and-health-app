from fastapi import FastAPI
from routes import health_hacks, water_intake
import uvicorn
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

# Load environment variables from .env if present
load_dotenv()

app = FastAPI(
    title="Cloud-Native Health Ecosystem API",
    description="Backend API for the Full Health application, featuring contextual DIY hacks and AI-powered water intake tracking.",
    version="1.0.0"
)

# Include Routers
app.include_router(health_hacks.router, prefix="/api/v1/hacks", tags=["Health Hacks"])
app.include_router(water_intake.router, prefix="/api/v1/water", tags=["Water Intake"])

# Mount Static Files for Frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", include_in_schema=False)
async def root():
    """Redirects root to the frontend app."""
    return RedirectResponse(url="/static/index.html")

@app.get("/healthz", tags=["Health"])
def health_check():
    """
    Basic health check endpoint for Cloud Run / Kubernetes.
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
