import cv2
import numpy as np
import uuid
from pathlib import Path
from sqlalchemy.orm import Session
from app.config import settings
from app.models.entities import User, Patient, Case, ModelRegistry, Notification
from app.utils.security import get_password_hash
from app.services.evaluation_service import ClassificationEvaluationService

def generate_synthetic_lesion_image(path: str, lesion_type: str = "melanoma") -> str:
    """
    Generates a realistic synthetic dermatological skin image with background skin texture,
    pigmentation, and lesion boundary patterns for demonstration and test execution.
    """
    h, w = 400, 400
    # Base skin tone (warm peachy-tan BGR)
    skin_base = np.zeros((h, w, 3), dtype=np.uint8)
    skin_base[:, :] = (185, 205, 235)  # BGR skin tone

    # Add subtle skin texture noise
    noise = np.random.normal(0, 7, (h, w, 3)).astype(np.int16)
    skin = np.clip(skin_base.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    cx, cy = w // 2, h // 2

    if lesion_type == "melanocytic_nevus":
        # Regular, smooth, symmetric brown/tan mole
        cv2.circle(skin, (cx, cy), 65, (45, 65, 110), -1)  # BGR dark brown
        cv2.circle(skin, (cx, cy), 50, (30, 45, 80), -1)
        skin = cv2.GaussianBlur(skin, (19, 19), 0)

    elif lesion_type == "melanoma":
        # Asymmetrical, dark, irregular notched border, variegated colors
        pts = np.array([
            [cx - 70, cy - 60],
            [cx + 10, cy - 85],
            [cx + 85, cy - 30],
            [cx + 95, cy + 40],
            [cx + 40, cy + 90],
            [cx - 45, cy + 80],
            [cx - 90, cy + 20],
            [cx - 80, cy - 25]
        ], np.int32)
        cv2.fillPoly(skin, [pts], (25, 30, 45))  # Very dark brownish-black
        cv2.circle(skin, (cx + 25, cy - 10), 35, (15, 15, 25), -1)  # Deep black core
        cv2.circle(skin, (cx - 20, cy + 25), 25, (40, 50, 115), -1) # Reddish-brown area
        for _ in range(8):
            rx = np.random.randint(cx - 75, cx + 75)
            ry = np.random.randint(cy - 75, cy + 75)
            cv2.circle(skin, (rx, ry), np.random.randint(15, 30), (20, 25, 40), -1)
        skin = cv2.GaussianBlur(skin, (15, 15), 0)

    elif lesion_type == "basal_cell_carcinoma":
        # Pearly translucent nodule with telangiectasia (red streaks)
        cv2.circle(skin, (cx, cy), 55, (170, 185, 225), -1)  # Pale/pearly
        cv2.circle(skin, (cx - 10, cy - 10), 40, (140, 150, 215), -1)
        cv2.line(skin, (cx - 30, cy - 20), (cx + 20, cy + 25), (40, 40, 200), 2)
        cv2.line(skin, (cx + 10, cy - 25), (cx + 35, cy + 15), (50, 50, 190), 1)
        skin = cv2.GaussianBlur(skin, (9, 9), 0)

    elif lesion_type == "healthy_skin":
        # Clear, healthy skin with uniform texture and no focal lesion
        pass

    elif lesion_type == "blurry_poor_quality":
        # Severely blurred image to test quality rejection
        cv2.circle(skin, (cx, cy), 60, (50, 60, 90), -1)
        skin = cv2.GaussianBlur(skin, (51, 51), 0)  # Extreme blur

    # Add a couple of realistic hair strands to demonstrate DullRazor algorithm
    if lesion_type != "blurry_poor_quality":
        cv2.line(skin, (cx - 120, cy - 80), (cx + 110, cy + 90), (30, 25, 20), 2)
        cv2.line(skin, (cx - 80, cy + 110), (cx + 70, cy - 90), (35, 30, 25), 2)

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(path, skin)
    return path

def seed_initial_data(db: Session):
    # 1. Seed Roles & Users
    default_users = [
        {"username": "admin", "email": "admin@dermai.org", "full_name": "System Administrator", "role": "admin"},
        {"username": "doctor.smith", "email": "dermatologist@dermai.org", "full_name": "Dr. Sarah Smith (Dermatologist)", "role": "clinician"},
        {"username": "patient.john", "email": "patient@dermai.org", "full_name": "John Doe", "role": "patient"},
        {"username": "researcher.lee", "email": "researcher@dermai.org", "full_name": "Prof. David Lee", "role": "researcher"},
        {"username": "ml.engineer", "email": "engineer@dermai.org", "full_name": "Alex Chen (ML Engineer)", "role": "data_scientist"}
    ]
    
    first_user = None
    for u in default_users:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash("password123"),
                full_name=u["full_name"],
                role=u["role"]
            )
            db.add(user)
            db.commit()
            if u["username"] == "doctor.smith":
                first_user = user
        else:
            if u["username"] == "doctor.smith":
                first_user = existing

    # 2. Seed Model Registry
    if db.query(ModelRegistry).count() == 0:
        benchmarks = ClassificationEvaluationService.get_benchmark_comparison()
        for b in benchmarks:
            m = ModelRegistry(
                name=b["model_name"],
                version=b["version"],
                architecture=b["architecture"],
                accuracy=b["accuracy"],
                f1_score=b["macro_f1"],
                sensitivity=b["sensitivity"],
                specificity=b["specificity"],
                is_active=b["is_active"],
                description=b["description"]
            )
            db.add(m)
        db.commit()

    # 3. Seed Sample Patients & Cases
    p1 = db.query(Patient).filter(Patient.patient_code == "PAT-70492").first()
    if not p1:
        p1 = Patient(
            patient_code="PAT-70492",
            age=48,
            gender="Male",
            medical_history="Dysplastic nevus syndrome; prolonged solar UV exposure.",
            known_allergies="None reported",
            clinical_notes="Referred for evaluation of an enlarging pigmented macule on upper back."
        )
        db.add(p1)
        db.commit()

    p2 = db.query(Patient).filter(Patient.patient_code == "PAT-31805").first()
    if not p2:
        p2 = Patient(
            patient_code="PAT-31805",
            age=34,
            gender="Female",
            medical_history="No history of skin malignancies.",
            known_allergies="Penicillin",
            clinical_notes="Routine annual full-body dermatoscopic check."
        )
        db.add(p2)
        db.commit()

    # Generate sample image files
    img1 = str(settings.UPLOAD_DIR / "sample_melanoma.jpg")
    img2 = str(settings.UPLOAD_DIR / "sample_nevus.jpg")
    img3 = str(settings.UPLOAD_DIR / "sample_bcc.jpg")
    img4 = str(settings.UPLOAD_DIR / "sample_blurry.jpg")
    img5 = str(settings.UPLOAD_DIR / "sample_healthy_skin.jpg")

    generate_synthetic_lesion_image(img1, "melanoma")
    generate_synthetic_lesion_image(img2, "melanocytic_nevus")
    generate_synthetic_lesion_image(img3, "basal_cell_carcinoma")
    generate_synthetic_lesion_image(img4, "blurry_poor_quality")
    generate_synthetic_lesion_image(img5, "healthy_skin")

    cases_to_seed = [
        ("CAS-MEL-001", p1.id, "Suspicious Pigmented Macule", "Upper Back", img1, "mobile_camera", "Patient notes rapid enlargement and border irregularities over the past 3 months."),
        ("CAS-NEV-002", p2.id, "Stable Cutaneous Mole", "Forearm", img2, "mobile_camera", "Uniform brown pigmentation, stable for >5 years."),
        ("CAS-BCC-003", p1.id, "Erythematous Pearly Papule", "Face / Nasal Bridge", img3, "upload", "Non-healing nodule with intermittent crusting."),
        ("CAS-BLUR-004", p2.id, "Motion-Blurred Mobile Upload", "Leg", img4, "mobile_camera", "Captured with poor hand stability to demonstrate quality validation."),
        ("CAS-NORM-005", p2.id, "Normal Healthy Cutaneous Skin", "Arm / Shoulder", img5, "mobile_camera", "Clean, healthy skin with no atypical pigmented lesions or pathology.")
    ]

    for c_num, pat_id, title, loc, img_p, src, notes in cases_to_seed:
        c_exist = db.query(Case).filter(Case.case_number == c_num).first()
        if not c_exist:
            c = Case(
                case_number=c_num,
                patient_id=pat_id,
                user_id=first_user.id if first_user else None,
                title=title,
                body_location=loc,
                original_image_path=img_p,
                image_source=src,
                status="pending",
                clinical_notes=notes
            )
            db.add(c)
    db.commit()

    # Seed initial notification if empty
    if db.query(Notification).count() == 0:
        notif = Notification(
            title="Welcome to DermAI Screening Platform",
            message="Platform initialized with 4 sample clinical cases across melanoma, nevus, BCC, and quality check.",
            level="success"
        )
        db.add(notif)
        db.commit()
