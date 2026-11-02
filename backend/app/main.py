import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import entities  # Ensure models are imported for metadata creation
from app.api import auth, cases, analysis, reports, models_mgmt, notifications, chat
from app.utils.sample_data import seed_initial_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed demo data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AI-powered dermatological mobile image analysis, quality assessment, U-Net segmentation, multi-class DL classification, Grad-CAM explainability, and automated clinical reporting.",
    lifespan=lifespan
)

# Secure CORS configuration (Restricted to local development and local Wi-Fi devices)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts for uploads, processed images, and generated reports
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/processed", StaticFiles(directory=str(settings.PROCESSED_DIR)), name="processed")
app.mount("/reports", StaticFiles(directory=str(settings.REPORTS_DIR)), name="reports")

# Include API Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(cases.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(models_mgmt.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "operational",
        "docs_url": "/docs",
        "supported_classes": settings.DISEASE_CLASSES,
        "active_version": "v1.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "quality_service": "online",
        "preprocessing_engine": "online",
        "segmentation_service": "online",
        "classification_models": "online",
        "xai_engine": "online",
        "pdf_reporting": "online"
    }

