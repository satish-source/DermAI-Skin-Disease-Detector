import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.entities import Case, Patient, AnalysisResult, AuditLog, Notification
from app.schemas.schemas import PatientCreate, PatientOut, CaseOut
from app.services.quality_service import ImageQualityAssessmentService
from app.services.preprocessing_service import SkinPreprocessingEngine
from app.services.segmentation_service import LesionSegmentationEngine
from app.services.classification_service import SkinDiseaseClassifier
from app.services.xai_service import ExplainableAIService
from app.services.risk_service import ClinicalRiskAssessmentEngine
from app.services.report_service import ReportGenerationService

router = APIRouter(prefix="/cases", tags=["Patient & Case Management"])

@router.post("/patients", response_model=PatientOut)
def create_patient(p_in: PatientCreate, db: Session = Depends(get_db)):
    code = p_in.patient_code or f"PAT-{uuid.uuid4().hex[:6].upper()}"
    patient = Patient(
        patient_code=code,
        age=p_in.age,
        gender=p_in.gender,
        medical_history=p_in.medical_history,
        known_allergies=p_in.known_allergies,
        clinical_notes=p_in.clinical_notes
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/patients", response_model=list[PatientOut])
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).order_by(Patient.created_at.desc()).all()

@router.post("/create-with-upload")
async def create_case_with_upload(
    file: UploadFile = File(...),
    title: str = Form("Skin Lesion Screening"),
    body_location: str = Form("Unspecified"),
    image_source: str = Form("mobile_camera"),
    clinical_notes: str = Form(None),
    patient_id: str = Form(None),
    user_id: str = Form(None),
    db: Session = Depends(get_db)
):
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported image format. Please upload JPG, PNG, or WebP.")

    case_uuid = str(uuid.uuid4())
    case_num = f"CAS-{case_uuid[:8].upper()}"
    saved_filename = f"{case_num}{ext}"
    dest_path = settings.UPLOAD_DIR / saved_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_case = Case(
        id=case_uuid,
        case_number=case_num,
        patient_id=patient_id if patient_id else None,
        user_id=user_id if user_id else None,
        title=title,
        body_location=body_location,
        original_image_path=str(dest_path),
        image_source=image_source,
        status="pending",
        clinical_notes=clinical_notes
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Audit log
    audit = AuditLog(action="CASE_CREATED", details=f"Case {case_num} uploaded from {image_source}")
    db.add(audit)
    db.commit()

    return {
        "case_id": new_case.id,
        "case_number": new_case.case_number,
        "title": new_case.title,
        "body_location": new_case.body_location,
        "image_path": f"/uploads/{saved_filename}",
        "status": new_case.status,
        "created_at": new_case.created_at
    }

@router.get("")
def list_cases(status: str = None, db: Session = Depends(get_db)):
    query = db.query(Case)
    if status:
        query = query.filter(Case.status == status)
    cases = query.order_by(Case.created_at.desc()).all()
    
    results = []
    for c in cases:
        latest_analysis = db.query(AnalysisResult).filter(AnalysisResult.case_id == c.id).order_by(AnalysisResult.created_at.desc()).first()
        results.append({
            "id": c.id,
            "case_number": c.case_number,
            "title": c.title,
            "body_location": c.body_location,
            "image_source": c.image_source,
            "original_image_url": f"/uploads/{Path(c.original_image_path).name}" if c.original_image_path else None,
            "status": c.status,
            "created_at": c.created_at,
            "patient_code": c.patient.patient_code if c.patient else "De-identified",
            "latest_prediction": latest_analysis.predicted_class_name if latest_analysis else None,
            "confidence": latest_analysis.confidence if latest_analysis else None,
            "risk_category": latest_analysis.risk_category if latest_analysis else None,
            "quality_status": latest_analysis.quality_status if latest_analysis else None
        })
    return results

@router.get("/{case_id}")
def get_case_details(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    analyses = db.query(AnalysisResult).filter(AnalysisResult.case_id == case_id).order_by(AnalysisResult.created_at.desc()).all()

    return {
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "body_location": case.body_location,
        "image_source": case.image_source,
        "original_image_url": f"/uploads/{Path(case.original_image_path).name}",
        "status": case.status,
        "clinical_notes": case.clinical_notes,
        "created_at": case.created_at,
        "patient": {
            "id": case.patient.id,
            "patient_code": case.patient.patient_code,
            "age": case.patient.age,
            "gender": case.patient.gender,
            "medical_history": case.patient.medical_history
        } if case.patient else None,
        "analyses": [
            {
                "id": a.id,
                "model_name": a.model_name,
                "model_version": a.model_version,
                "predicted_class": a.predicted_class,
                "predicted_class_name": a.predicted_class_name,
                "confidence": a.confidence,
                "top_predictions": a.top_predictions,
                "risk_category": a.risk_category,
                "risk_rationale": a.risk_rationale,
                "recommendation": a.recommendation,
                "quality_status": a.quality_status,
                "quality_score": a.quality_score,
                "quality_metrics": a.quality_metrics,
                "preprocessed_image_url": f"/processed/{Path(a.preprocessed_image_path).name}" if a.preprocessed_image_path else None,
                "mask_image_url": f"/processed/{Path(a.mask_image_path).name}" if a.mask_image_path else None,
                "heatmap_image_url": f"/processed/{Path(a.heatmap_image_path).name}" if a.heatmap_image_path else None,
                "overlay_image_url": f"/processed/{Path(a.overlay_image_path).name}" if a.overlay_image_path else None,
                "report_pdf_url": f"/reports/{Path(a.report_pdf_path).name}" if a.report_pdf_path else None,
                "lesion_area_percentage": a.lesion_area_percentage,
                "created_at": a.created_at
            }
            for a in analyses
        ]
    }

@router.get("/compare/{case_id_1}/{case_id_2}")
def compare_cases(case_id_1: str, case_id_2: str, db: Session = Depends(get_db)):
    """
    Temporal Lesion Progression Comparison:
    Compares two temporal scans of the same lesion or patient over time.
    """
    c1 = db.query(Case).filter(Case.id == case_id_1).first()
    c2 = db.query(Case).filter(Case.id == case_id_2).first()
    if not c1 or not c2:
        raise HTTPException(status_code=404, detail="One or both cases not found")

    a1 = db.query(AnalysisResult).filter(AnalysisResult.case_id == case_id_1).order_by(AnalysisResult.created_at.desc()).first()
    a2 = db.query(AnalysisResult).filter(AnalysisResult.case_id == case_id_2).order_by(AnalysisResult.created_at.desc()).first()

    area1 = a1.lesion_area_percentage if a1 else 0.0
    area2 = a2.lesion_area_percentage if a2 else 0.0
    area_delta = round(area2 - area1, 2)

    return {
        "case_1": {
            "case_number": c1.case_number,
            "date": c1.created_at,
            "image_url": f"/uploads/{Path(c1.original_image_path).name}",
            "prediction": a1.predicted_class_name if a1 else None,
            "confidence": a1.confidence if a1 else None,
            "risk_category": a1.risk_category if a1 else None,
            "lesion_area_pct": area1
        },
        "case_2": {
            "case_number": c2.case_number,
            "date": c2.created_at,
            "image_url": f"/uploads/{Path(c2.original_image_path).name}",
            "prediction": a2.predicted_class_name if a2 else None,
            "confidence": a2.confidence if a2 else None,
            "risk_category": a2.risk_category if a2 else None,
            "lesion_area_pct": area2
        },
        "evolution_analysis": {
            "lesion_area_delta_pct": area_delta,
            "lesion_growth_alert": area_delta > 5.0,
            "condition_drift": (a1 and a2 and a1.predicted_class != a2.predicted_class),
            "clinical_guidance": "Lesion exhibits dimensional progression." if area_delta > 5.0 else "Lesion dimensions remain relatively stable over the observed interval."
        }
    }

@router.post("/batch-upload")
async def batch_upload_cases(
    files: list[UploadFile] = File(...),
    body_location: str = Form("Unspecified"),
    auto_analyze: bool = Form(True),
    db: Session = Depends(get_db)
):
    """
    Batch Multi-Photo Upload & Screening Engine:
    Accepts multiple skin lesion photographs (e.g. 5, 10, or 20 files at once),
    automatically creates individual clinical cases, and executes the complete
    deep learning screening pipeline on each photo in parallel.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    results = []

    for idx, f in enumerate(files):
        ext = Path(f.filename).suffix.lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            continue

        case_uuid = str(uuid.uuid4())
        case_num = f"BATCH-{case_uuid[:6].upper()}"
        saved_filename = f"{case_num}{ext}"
        dest_path = settings.UPLOAD_DIR / saved_filename

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)

        new_case = Case(
            id=case_uuid,
            case_number=case_num,
            title=f"Batch Screening: {Path(f.filename).stem}",
            body_location=body_location,
            original_image_path=str(dest_path),
            image_source="batch_upload",
            status="pending"
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        case_res = {
            "case_id": new_case.id,
            "case_number": new_case.case_number,
            "filename": f.filename,
            "image_url": f"/uploads/{saved_filename}",
            "status": "pending"
        }

        if auto_analyze:
            try:
                # 1. Quality Check
                quality = ImageQualityAssessmentService.assess_quality(str(dest_path))
                
                # Paths
                prep_out = str(settings.PROCESSED_DIR / f"{case_num}_preprocessed.jpg")
                mask_out = str(settings.PROCESSED_DIR / f"{case_num}_mask.png")
                seg_overlay_out = str(settings.PROCESSED_DIR / f"{case_num}_seg_overlay.jpg")
                heatmap_out = str(settings.PROCESSED_DIR / f"{case_num}_gradcam_heatmap.jpg")
                xai_overlay_out = str(settings.PROCESSED_DIR / f"{case_num}_gradcam_overlay.jpg")
                pdf_out = str(settings.REPORTS_DIR / f"{case_num}_Screening_Report.pdf")

                # 2. Preprocessing
                SkinPreprocessingEngine.preprocess_image(str(dest_path), prep_out)

                # 3. Segmentation
                seg_res = LesionSegmentationEngine.process_and_save(prep_out, mask_out, seg_overlay_out)
                lesion_area_pct = seg_res.get("lesion_area_percentage", 0.0)

                # 4. Classification
                cls_res = SkinDiseaseClassifier.predict(prep_out, mask_out, architecture="ensemble")
                pred_class = cls_res["predicted_class"]
                pred_name = cls_res["predicted_class_name"]
                conf = cls_res["confidence"]

                # 5. Grad-CAM++
                ExplainableAIService.generate_and_save(prep_out, mask_out, heatmap_out, xai_overlay_out, class_code=pred_class)

                # 6. Risk Stratification
                risk_res = ClinicalRiskAssessmentEngine.stratify_risk(pred_class, conf, quality["overall_status"], lesion_area_pct)

                # 7. PDF Report
                case_dict = {
                    "case_number": case_num,
                    "patient_code": "Batch-Upload",
                    "body_location": body_location,
                    "image_source": "Batch Multi-Upload",
                    "original_image_path": str(dest_path)
                }
                analysis_dict = {
                    "model_name": cls_res["model_name"],
                    "model_version": cls_res["model_version"],
                    "predicted_class": pred_class,
                    "predicted_class_name": pred_name,
                    "confidence": conf,
                    "top_predictions": cls_res["top_predictions"],
                    "risk_category": risk_res["risk_category"],
                    "quality_status": quality["overall_status"],
                    "recommendation": risk_res["recommendation"],
                    "preprocessed_image_path": prep_out,
                    "mask_image_path": mask_out,
                    "heatmap_image_path": heatmap_out,
                    "overlay_image_path": xai_overlay_out
                }
                ReportGenerationService.generate_pdf(case_dict, analysis_dict, pdf_out)

                # Save Analysis
                analysis = AnalysisResult(
                    case_id=new_case.id,
                    model_name=cls_res["model_name"],
                    model_version=cls_res["model_version"],
                    quality_status=quality["overall_status"],
                    quality_score=quality["overall_score"],
                    quality_metrics=quality,
                    predicted_class=pred_class,
                    predicted_class_name=pred_name,
                    confidence=conf,
                    top_predictions=cls_res["top_predictions"],
                    risk_category=risk_res["risk_category"],
                    risk_rationale=risk_res["risk_rationale"],
                    recommendation=risk_res["recommendation"],
                    preprocessed_image_path=prep_out,
                    mask_image_path=mask_out,
                    heatmap_image_path=heatmap_out,
                    overlay_image_path=xai_overlay_out,
                    report_pdf_path=pdf_out,
                    lesion_area_percentage=lesion_area_pct
                )
                db.add(analysis)
                new_case.status = "analyzed"
                db.commit()

                case_res.update({
                    "status": "analyzed",
                    "predicted_class": pred_class,
                    "predicted_name": pred_name,
                    "confidence": conf,
                    "risk_category": risk_res["risk_category"],
                    "quality_status": quality["overall_status"],
                    "report_pdf_url": f"/reports/{Path(pdf_out).name}"
                })
            except Exception as e:
                case_res["error"] = str(e)

        results.append(case_res)

    return {
        "total_uploaded": len(results),
        "analyzed_cases": results
    }

@router.delete("/{case_id}")
def delete_case(case_id: str, db: Session = Depends(get_db)):
    """
    Deletes a specific case, its analysis results, and associated file assets from disk.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case_num = case.case_number

    # Find analysis results to delete associated files
    analyses = db.query(AnalysisResult).filter(AnalysisResult.case_id == case_id).all()
    for a in analyses:
        for p in [a.preprocessed_image_path, a.mask_image_path, a.heatmap_image_path, a.overlay_image_path, a.report_pdf_path]:
            if p and Path(p).exists():
                try:
                    Path(p).unlink(missing_ok=True)
                except Exception:
                    pass
        db.delete(a)

    # Delete original image file
    if case.original_image_path and Path(case.original_image_path).exists():
        try:
            Path(case.original_image_path).unlink(missing_ok=True)
        except Exception:
            pass

    # Delete notifications related to this case
    db.query(Notification).filter(Notification.case_id == case_id).delete(synchronize_session=False)

    # Delete case
    db.delete(case)
    db.commit()

    # Audit log
    audit = AuditLog(action="CASE_DELETED", details=f"Case {case_num} permanently removed")
    db.add(audit)
    db.commit()

    return {"message": f"Case {case_num} successfully deleted.", "case_id": case_id}

@router.delete("/clear/all")
def clear_all_cases(db: Session = Depends(get_db)):
    """
    Clears all screening cases and analysis artifacts from the database.
    """
    cases = db.query(Case).all()
    for c in cases:
        analyses = db.query(AnalysisResult).filter(AnalysisResult.case_id == c.id).all()
        for a in analyses:
            for p in [a.preprocessed_image_path, a.mask_image_path, a.heatmap_image_path, a.overlay_image_path, a.report_pdf_path]:
                if p and Path(p).exists():
                    try:
                        Path(p).unlink(missing_ok=True)
                    except Exception:
                        pass
            db.delete(a)
        if c.original_image_path and Path(c.original_image_path).exists():
            try:
                Path(c.original_image_path).unlink(missing_ok=True)
            except Exception:
                pass
        db.delete(c)

    db.query(Notification).delete(synchronize_session=False)
    db.commit()
    return {"message": "All cases cleared successfully."}

