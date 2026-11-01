from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Case, AnalysisResult
from app.services.report_service import ReportGenerationService

router = APIRouter(prefix="/reports", tags=["Report Generation & Data Export"])

@router.get("/download-pdf/{case_id}")
def download_pdf_report(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    analysis = db.query(AnalysisResult).filter(AnalysisResult.case_id == case_id).order_by(AnalysisResult.created_at.desc()).first()
    if not analysis or not analysis.report_pdf_path or not Path(analysis.report_pdf_path).exists():
        raise HTTPException(status_code=404, detail="PDF report not yet generated for this case")

    filename = Path(analysis.report_pdf_path).name
    return FileResponse(
        path=analysis.report_pdf_path,
        filename=filename,
        media_type="application/pdf"
    )

@router.get("/export-json/{case_id}")
def export_json_report(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    analysis = db.query(AnalysisResult).filter(AnalysisResult.case_id == case_id).order_by(AnalysisResult.created_at.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found for this case")

    case_dict = {
        "case_number": case.case_number,
        "title": case.title,
        "body_location": case.body_location,
        "image_source": case.image_source,
        "created_at": str(case.created_at)
    }
    analysis_dict = {
        "model_name": analysis.model_name,
        "model_version": analysis.model_version,
        "predicted_class": analysis.predicted_class,
        "predicted_class_name": analysis.predicted_class_name,
        "confidence": analysis.confidence,
        "top_predictions": analysis.top_predictions,
        "risk_category": analysis.risk_category,
        "quality_status": analysis.quality_status,
        "quality_score": analysis.quality_score,
        "lesion_area_percentage": analysis.lesion_area_percentage
    }
    json_str = ReportGenerationService.export_json(case_dict, analysis_dict)
    return Response(content=json_str, media_type="application/json")

@router.get("/export-csv")
def export_all_cases_csv(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    rows = []
    for c in cases:
        a = db.query(AnalysisResult).filter(AnalysisResult.case_id == c.id).order_by(AnalysisResult.created_at.desc()).first()
        rows.append({
            "case_number": c.case_number,
            "patient_code": c.patient.patient_code if c.patient else "De-identified",
            "body_location": c.body_location,
            "image_source": c.image_source,
            "predicted_class": a.predicted_class if a else "N/A",
            "predicted_class_name": a.predicted_class_name if a else "N/A",
            "confidence": a.confidence if a else 0.0,
            "risk_category": a.risk_category if a else "Pending",
            "quality_status": a.quality_status if a else "Pending",
            "created_at": str(c.created_at)
        })
    csv_str = ReportGenerationService.export_csv(rows)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dermai_clinical_cases.csv"}
    )

