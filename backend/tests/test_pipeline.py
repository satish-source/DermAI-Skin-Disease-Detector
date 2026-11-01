import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, engine, Base
from app.models.entities import Case, Patient, AnalysisResult
from app.utils.sample_data import seed_initial_data
from app.services.quality_service import ImageQualityAssessmentService
from app.services.preprocessing_service import SkinPreprocessingEngine
from app.services.segmentation_service import LesionSegmentationEngine
from app.services.classification_service import SkinDiseaseClassifier
from app.services.xai_service import ExplainableAIService
from app.services.risk_service import ClinicalRiskAssessmentEngine
from app.services.report_service import ReportGenerationService
from app.config import settings

def run_all_tests():
    print("=" * 60)
    print("STARTING DERMAI INTEGRATION TEST SUITE")
    print("=" * 60)

    # 1. DB Init & Seeding
    print("\n[1/7] Initializing Database & Seeding Sample Cases...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_initial_data(db)
    cases = db.query(Case).all()
    print(f"-> Seeded {len(cases)} initial clinical screening cases.")
    assert len(cases) >= 4, "Expected at least 4 sample cases"

    # Find sample melanoma and blurry cases
    mel_case = next(c for c in cases if "MEL" in c.case_number)
    blur_case = next(c for c in cases if "BLUR" in c.case_number)

    # 2. Quality Assessment Test
    print("\n[2/7] Testing Image Quality Assessment Service...")
    blur_res = ImageQualityAssessmentService.assess_quality(blur_case.original_image_path)
    print(f"-> Blurry case status: {blur_res['overall_status']} (Blur score: {blur_res['blur_score']})")
    assert blur_res["is_blurry"] is True, "Expected blurry image to be flagged as is_blurry=True"
    print(f"-> Rejection reasons: {blur_res['rejection_reasons']}")

    good_res = ImageQualityAssessmentService.assess_quality(mel_case.original_image_path)
    print(f"-> Normal case status: {good_res['overall_status']} (Score: {good_res['overall_score']})")
    assert good_res["overall_status"] in ["Good Quality", "Acceptable Quality"]

    # 3. Preprocessing Test
    print("\n[3/7] Testing Skin Preprocessing Pipeline (DullRazor + CLAHE)...")
    prep_out = str(settings.PROCESSED_DIR / "test_preprocessed.jpg")
    prep_info = SkinPreprocessingEngine.preprocess_image(mel_case.original_image_path, prep_out)
    print(f"-> Preprocessed output saved to {prep_out}")
    print(f"-> Applied steps: {prep_info['applied_steps']}")
    assert Path(prep_out).exists()

    # 4. Segmentation Test
    print("\n[4/7] Testing Lesion Localization & Segmentation (U-Net & GrabCut)...")
    mask_out = str(settings.PROCESSED_DIR / "test_mask.png")
    seg_overlay = str(settings.PROCESSED_DIR / "test_seg_overlay.jpg")
    seg_res = LesionSegmentationEngine.process_and_save(prep_out, mask_out, seg_overlay)
    print(f"-> Lesion area percentage: {seg_res['lesion_area_percentage']}%")
    print(f"-> Bounding box: {seg_res['bounding_box']}")
    assert Path(mask_out).exists()

    # 5. Multi-Class Classification Test
    print("\n[5/7] Testing Multi-Class Deep Learning Classification (7 Classes)...")
    cls_res = SkinDiseaseClassifier.predict(prep_out, mask_out, architecture="ensemble")
    print(f"-> Model: {cls_res['model_name']}")
    print(f"-> Predicted Class: {cls_res['predicted_class']} ({cls_res['predicted_class_name']})")
    print(f"-> Confidence: {cls_res['confidence'] * 100:.2f}%")
    print(f"-> Top 3 Differential Diagnoses:")
    for rank, p in enumerate(cls_res["top_predictions"][:3], 1):
        print(f"    {rank}. {p['class_name']} ({p['class_code']}): {p['probability']*100:.1f}% [{p['risk_level']}]")
    assert cls_res["predicted_class"] in settings.DISEASE_CLASSES

    # 6. Explainable AI (Grad-CAM++) Test
    print("\n[6/7] Testing Explainable AI (Grad-CAM++ Attention Heatmap)...")
    heatmap_out = str(settings.PROCESSED_DIR / "test_heatmap.jpg")
    xai_overlay = str(settings.PROCESSED_DIR / "test_xai_overlay.jpg")
    xai_res = ExplainableAIService.generate_and_save(prep_out, mask_out, heatmap_out, xai_overlay, class_code=cls_res["predicted_class"])
    print(f"-> Heatmap and overlay generated: {xai_res['method']}")
    assert Path(heatmap_out).exists()
    assert Path(xai_overlay).exists()

    # 7. PDF Report Generation Test
    print("\n[7/7] Testing Automated PDF Report Generation (fpdf2)...")
    pdf_out = str(settings.REPORTS_DIR / "test_clinical_screening_report.pdf")
    case_data = {
        "case_number": mel_case.case_number,
        "patient_code": mel_case.patient.patient_code if mel_case.patient else "PAT-TEST",
        "body_location": mel_case.body_location,
        "image_source": mel_case.image_source,
        "original_image_path": mel_case.original_image_path
    }
    risk_res = ClinicalRiskAssessmentEngine.stratify_risk(
        cls_res["predicted_class"], cls_res["confidence"], good_res["overall_status"], seg_res["lesion_area_percentage"]
    )
    analysis_data = {
        "model_name": cls_res["model_name"],
        "model_version": cls_res["model_version"],
        "predicted_class": cls_res["predicted_class"],
        "predicted_class_name": cls_res["predicted_class_name"],
        "confidence": cls_res["confidence"],
        "top_predictions": cls_res["top_predictions"],
        "risk_category": risk_res["risk_category"],
        "quality_status": good_res["overall_status"],
        "recommendation": risk_res["recommendation"],
        "preprocessed_image_path": prep_out,
        "mask_image_path": mask_out,
        "heatmap_image_path": heatmap_out,
        "overlay_image_path": xai_overlay
    }
    ReportGenerationService.generate_pdf(case_data, analysis_data, pdf_out)
    print(f"-> Generated PDF Report: {pdf_out} (Size: {os.path.getsize(pdf_out)} bytes)")
    assert Path(pdf_out).exists()
    assert os.path.getsize(pdf_out) > 1000

    db.close()
    print("\n" + "=" * 60)
    print("ALL 7 CORE DERMAI PIPELINE MODULES PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()

