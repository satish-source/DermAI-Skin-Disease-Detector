import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
PROCESSED_DIR = BASE_DIR / "processed"
STATIC_DIR = BASE_DIR / "static"
REPORTS_DIR = BASE_DIR / "reports"

for d in [UPLOAD_DIR, PROCESSED_DIR, STATIC_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "DermAI - Skin Disease Detector from Mobile Images"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dermai-super-secure-secret-key-2026-medical-dl")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    PROCESSED_DIR: Path = PROCESSED_DIR
    STATIC_DIR: Path = STATIC_DIR
    REPORTS_DIR: Path = REPORTS_DIR

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'dermai.db'}")
    
    # Image Quality Thresholds
    MIN_RESOLUTION_WIDTH: int = 224
    MIN_RESOLUTION_HEIGHT: int = 224
    BLUR_LAPLACIAN_THRESHOLD: float = 65.0  # Under 65 indicates blurry image
    UNDEREXPOSURE_LUMINANCE: float = 40.0   # Under 40 is too dark
    OVEREXPOSURE_LUMINANCE: float = 220.0   # Over 220 is washed out / overexposed
    CONTRAST_THRESHOLD: float = 30.0        # RMS contrast below 30 is low-contrast
    
    # Clinical Risk Thresholds
    HIGH_RISK_CLASSES: list[str] = ["MEL", "BCC"]
    MODERATE_RISK_CLASSES: list[str] = ["AKIEC", "BKL"]
    LOW_RISK_CLASSES: list[str] = ["NV", "DF", "VASC", "NORM"]
    HIGH_CONFIDENCE_THRESHOLD: float = 0.70
    BORDERLINE_CONFIDENCE_THRESHOLD: float = 0.50
    
    # Supported Disease Classes (HAM10000 / ISIC standard + Healthy Skin baseline)
    DISEASE_CLASSES: dict[str, str] = {
        "NORM": "Normal Healthy Skin (No Lesion Detected)",
        "MEL": "Melanoma (Malignant)",
        "NV": "Melanocytic Nevus (Benign Mole)",
        "BCC": "Basal Cell Carcinoma (Skin Cancer)",
        "AKIEC": "Actinic Keratosis / Intraepithelial Carcinoma",
        "BKL": "Benign Keratosis (Seborrheic / Solar Lentigo)",
        "DF": "Dermatofibroma (Benign Cutaneous Nodule)",
        "VASC": "Vascular Lesion (Angioma / Hemangioma)"
    }

settings = Settings()
