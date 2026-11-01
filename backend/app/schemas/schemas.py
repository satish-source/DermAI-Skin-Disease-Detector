import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

# Auth & User schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    role: str
    full_name: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: Optional[str] = "patient"

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Patient schemas
class PatientCreate(BaseModel):
    patient_code: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    known_allergies: Optional[str] = None
    clinical_notes: Optional[str] = None

class PatientOut(BaseModel):
    id: str
    patient_code: str
    age: Optional[int]
    gender: Optional[str]
    medical_history: Optional[str]
    known_allergies: Optional[str]
    clinical_notes: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Case schemas
class CaseCreate(BaseModel):
    patient_id: Optional[str] = None
    title: Optional[str] = "Skin Lesion Screening"
    body_location: Optional[str] = "Unspecified"
    image_source: Optional[str] = "mobile_camera"
    clinical_notes: Optional[str] = None

class CaseOut(BaseModel):
    id: str
    case_number: str
    patient_id: Optional[str]
    user_id: Optional[str]
    title: str
    body_location: str
    original_image_path: str
    image_source: str
    status: str
    clinical_notes: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Image Quality schemas
class QualityMetrics(BaseModel):
    blur_score: float
    is_blurry: bool
    mean_luminance: float
    is_underexposed: bool
    is_overexposed: bool
    rms_contrast: float
    is_low_contrast: bool
    width: int
    height: int
    resolution_ok: bool
    overall_status: str  # Good Quality, Acceptable Quality, Poor Quality
    overall_score: float  # 0.0 to 1.0
    rejection_reasons: List[str]
    remediation_tips: List[str]

# Prediction item
class PredictionItem(BaseModel):
    class_code: str
    class_name: str
    probability: float
    risk_level: str

# Analysis Result schemas
class AnalysisResultOut(BaseModel):
    id: str
    case_id: str
    model_name: str
    model_version: str
    quality_status: str
    quality_score: float
    quality_metrics: Dict[str, Any]
    predicted_class: str
    predicted_class_name: str
    confidence: float
    top_predictions: List[Dict[str, Any]]
    risk_category: str
    risk_rationale: Optional[str]
    recommendation: Optional[str]
    preprocessed_image_path: Optional[str]
    mask_image_path: Optional[str]
    heatmap_image_path: Optional[str]
    overlay_image_path: Optional[str]
    report_pdf_path: Optional[str]
    lesion_area_percentage: float
    is_reviewed_by_clinician: bool
    clinician_feedback: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ModelRegistryOut(BaseModel):
    id: str
    name: str
    version: str
    architecture: str
    accuracy: float
    f1_score: float
    sensitivity: float
    specificity: float
    is_active: bool
    description: Optional[str]

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: str
    case_id: Optional[str]
    title: str
    message: str
    level: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True
