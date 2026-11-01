import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), default="patient")  # patient, clinician, researcher, data_scientist, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cases = relationship("Case", back_populates="created_by_user")
    notifications = relationship("Notification", back_populates="user")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_code = Column(String(32), unique=True, index=True, nullable=False)  # De-identified ID
    age = Column(Integer, nullable=True)
    gender = Column(String(16), nullable=True)  # Male, Female, Other
    medical_history = Column(Text, nullable=True)
    known_allergies = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cases = relationship("Case", back_populates="patient", cascade="all, delete-orphan")

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_number = Column(String(32), unique=True, index=True, nullable=False)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    title = Column(String(128), default="Skin Lesion Screening")
    body_location = Column(String(64), default="Unspecified")  # Back, Face, Arm, Leg, Torso, Hand, Neck
    original_image_path = Column(String(256), nullable=False)
    image_source = Column(String(32), default="mobile_camera")  # mobile_camera, upload
    status = Column(String(32), default="pending")  # pending, quality_rejected, analyzed, reviewed
    clinical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="cases")
    created_by_user = relationship("User", back_populates="cases")
    analysis_results = relationship("AnalysisResult", back_populates="case", cascade="all, delete-orphan")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    
    # Model info
    model_name = Column(String(64), default="DermAI-Ensemble")
    model_version = Column(String(32), default="v1.0")
    
    # Quality assessment
    quality_status = Column(String(32), default="Good Quality")  # Good Quality, Acceptable Quality, Poor Quality
    quality_score = Column(Float, default=1.0)
    quality_metrics = Column(JSON, default=dict)  # blur_score, luminance, contrast, resolution, rejection_reasons
    
    # Classification outputs
    predicted_class = Column(String(16), nullable=False)  # MEL, NV, BCC, AKIEC, BKL, DF, VASC
    predicted_class_name = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    top_predictions = Column(JSON, nullable=False)  # list of {class, name, probability, risk}
    
    # Clinical triage & risk
    risk_category = Column(String(32), default="Low Risk")  # Low Risk, Moderate Risk, High Risk, Requires Clinical Review
    risk_rationale = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    
    # Processed artifact paths
    preprocessed_image_path = Column(String(256), nullable=True)
    mask_image_path = Column(String(256), nullable=True)
    heatmap_image_path = Column(String(256), nullable=True)
    overlay_image_path = Column(String(256), nullable=True)
    report_pdf_path = Column(String(256), nullable=True)
    
    # Segmentation metrics
    lesion_area_pixels = Column(Integer, default=0)
    lesion_area_percentage = Column(Float, default=0.0)
    
    # Review status
    is_reviewed_by_clinician = Column(Boolean, default=False)
    clinician_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="analysis_results")

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(64), unique=True, nullable=False)
    version = Column(String(32), nullable=False)
    architecture = Column(String(64), nullable=False)  # ResNet50, EfficientNet, MobileNetV3, ViT, Ensemble
    accuracy = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    sensitivity = Column(Float, default=0.0)
    specificity = Column(Float, default=0.0)
    is_active = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    case_id = Column(String(36), nullable=True)
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    level = Column(String(16), default="info")  # info, warning, danger, success
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    username = Column(String(64), nullable=True)
    action = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

