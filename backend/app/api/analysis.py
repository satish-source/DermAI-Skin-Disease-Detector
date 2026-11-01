from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.entities import Case, AnalysisResult, Notification, AuditLog
from app.services.quality_service import ImageQualityAssessmentService
from app.services.preprocessing_service import SkinPreprocessingEngine
from app.services.segmentation_service import LesionSegmentationEngine
from app.services.classification_service import SkinDiseaseClassifier
from app.services.xai_service import ExplainableAIService
from app.services.risk_service import ClinicalRiskAssessmentEngine
from app.services.report_service import ReportGenerationService

router = APIRouter(prefix="/analysis", tags=["AI Image Analysis Pipeline"])

@router.post("/quality-check/{case_id}")
def check_image_quality(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    quality_res = ImageQualityAssessmentService.assess_quality(case.original_image_path)
    return quality_res

@router.post("/run/{case_id}")
def run_full_analysis(
    case_id: str,
    architecture: str = Query("ensemble", description="DL architecture: ensemble, mobilenet_v3, resnet50, efficientnet, densenet, vit"),
    force_run_poor_quality: bool = Query(False, description="Whether to continue even if quality assessment warns of blur or bad exposure"),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    original_path = case.original_image_path
    if not Path(original_path).exists():
        raise HTTPException(status_code=400, detail="Original image file not found on server")

    # Step 1: Quality Check
    quality = ImageQualityAssessmentService.assess_quality(original_path)
    if quality["overall_status"] == "Poor Quality" and not force_run_poor_quality:
        case.status = "quality_rejected"
        db.commit()

        # Generate alert notification
        notif = Notification(
            user_id=case.user_id,
            case_id=case.id,
            title=f"Image Quality Warning - Case {case.case_number}",
            message=f"The uploaded image was flagged as Poor Quality: {', '.join(quality['rejection_reasons'])}. Please recapture.",
            level="warning"
        )
        db.add(notif)
        db.commit()

        return {
            "status": "rejected",
            "message": "Image quality is insufficient for accurate deep learning screening.",
            "quality": quality,
            "can_force_override": True
        }

    # Prepare output paths
    case_prefix = case.case_number
    prep_out = str(settings.PROCESSED_DIR / f"{case_prefix}_preprocessed.jpg")
    mask_out = str(settings.PROCESSED_DIR / f"{case_prefix}_mask.png")
    seg_overlay_out = str(settings.PROCESSED_DIR / f"{case_prefix}_seg_overlay.jpg")
    heatmap_out = str(settings.PROCESSED_DIR / f"{case_prefix}_gradcam_heatmap.jpg")
    xai_overlay_out = str(settings.PROCESSED_DIR / f"{case_prefix}_gradcam_overlay.jpg")
    pdf_out = str(settings.REPORTS_DIR / f"{case_prefix}_Screening_Report.pdf")

    # Step 2: Skin Preprocessing (DullRazor + Color Constancy + CLAHE)
    SkinPreprocessingEngine.preprocess_image(original_path, prep_out)

    # Step 3: Lesion Segmentation (U-Net & GrabCut)
    seg_res = LesionSegmentationEngine.process_and_save(prep_out, mask_out, seg_overlay_out)
    lesion_area_pct = seg_res.get("lesion_area_percentage", 0.0)

    # Step 4: Deep Learning Multi-Class Classification
    cls_res = SkinDiseaseClassifier.predict(prep_out, mask_out, architecture=architecture)
    pred_class = cls_res["predicted_class"]
    pred_name = cls_res["predicted_class_name"]
    confidence = cls_res["confidence"]
    top_preds = cls_res["top_predictions"]

    # Step 5: Explainable AI (Grad-CAM / Grad-CAM++ Attention Heatmap)
    ExplainableAIService.generate_and_save(prep_out, mask_out, heatmap_out, xai_overlay_out, class_code=pred_class)

    # Step 6: Clinical Risk & Severity Stratification
    risk_res = ClinicalRiskAssessmentEngine.stratify_risk(
        pred_class, confidence, quality["overall_status"], lesion_area_pct
    )

    # Step 7: Automated PDF Report Generation
    case_data_dict = {
        "case_number": case.case_number,
        "patient_code": case.patient.patient_code if case.patient else "De-identified",
        "body_location": case.body_location,
        "image_source": case.image_source,
        "original_image_path": original_path
    }
    analysis_data_dict = {
        "model_name": cls_res["model_name"],
        "model_version": cls_res["model_version"],
        "predicted_class": pred_class,
        "predicted_class_name": pred_name,
        "confidence": confidence,
        "top_predictions": top_preds,
        "risk_category": risk_res["risk_category"],
        "quality_status": quality["overall_status"],
        "recommendation": risk_res["recommendation"],
        "preprocessed_image_path": prep_out,
        "mask_image_path": mask_out,
        "heatmap_image_path": heatmap_out,
        "overlay_image_path": xai_overlay_out
    }
    ReportGenerationService.generate_pdf(case_data_dict, analysis_data_dict, pdf_out)

    # Step 8: Save to Database
    analysis = AnalysisResult(
        case_id=case.id,
        model_name=cls_res["model_name"],
        model_version=cls_res["model_version"],
        quality_status=quality["overall_status"],
        quality_score=quality["overall_score"],
        quality_metrics=quality,
        predicted_class=pred_class,
        predicted_class_name=pred_name,
        confidence=confidence,
        top_predictions=top_preds,
        risk_category=risk_res["risk_category"],
        risk_rationale=risk_res["risk_rationale"],
        recommendation=risk_res["recommendation"],
        preprocessed_image_path=prep_out,
        mask_image_path=mask_out,
        heatmap_image_path=heatmap_out,
        overlay_image_path=xai_overlay_out,
        report_pdf_path=pdf_out,
        lesion_area_pixels=seg_res.get("lesion_area_pixels", 0),
        lesion_area_percentage=lesion_area_pct
    )
    db.add(analysis)
    case.status = "analyzed"
    db.commit()
    db.refresh(analysis)

    # Step 9: Alert Notification if High Risk
    if risk_res["risk_category"] == "High Risk":
        alert_notif = Notification(
            user_id=case.user_id,
            case_id=case.id,
            title=f"High Risk Alert - Case {case.case_number}",
            message=f"High risk lesion detected ({pred_name}, {confidence*100:.1f}% confidence). Clinical consultation recommended immediately.",
            level="danger"
        )
        db.add(alert_notif)
        db.commit()

    # Audit log
    audit = AuditLog(
        action="ANALYSIS_EXECUTED",
        details=f"Case {case.case_number} analyzed with {cls_res['model_name']} -> {pred_name} ({confidence*100:.1f}%)"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "analysis_id": analysis.id,
        "case_id": case.id,
        "case_number": case.case_number,
        "model": {
            "name": cls_res["model_name"],
            "version": cls_res["model_version"],
            "architecture": architecture
        },
        "quality": quality,
        "prediction": {
            "class_code": pred_class,
            "class_name": pred_name,
            "confidence": confidence,
            "top_predictions": top_preds
        },
        "segmentation": {
            "lesion_area_pixels": seg_res.get("lesion_area_pixels", 0),
            "lesion_area_percentage": lesion_area_pct,
            "bounding_box": seg_res.get("bounding_box", [])
        },
        "risk": risk_res,
        "images": {
            "original_url": f"/uploads/{Path(original_path).name}",
            "preprocessed_url": f"/processed/{Path(prep_out).name}",
            "mask_url": f"/processed/{Path(mask_out).name}",
            "segmentation_overlay_url": f"/processed/{Path(seg_overlay_out).name}",
            "heatmap_url": f"/processed/{Path(heatmap_out).name}",
            "gradcam_overlay_url": f"/processed/{Path(xai_overlay_out).name}"
        },
        "report_pdf_url": f"/reports/{Path(pdf_out).name}"
    }

