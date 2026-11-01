from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import ModelRegistry
from app.services.evaluation_service import ClassificationEvaluationService

router = APIRouter(prefix="/models", tags=["Model Management, Versioning & Evaluation"])

@router.get("/benchmarks")
def get_benchmarks():
    return ClassificationEvaluationService.get_benchmark_comparison()

@router.get("/confusion-matrix")
def get_confusion_matrix():
    return ClassificationEvaluationService.get_confusion_matrix_data()

@router.get("/registry")
def list_registry_models(db: Session = Depends(get_db)):
    models = db.query(ModelRegistry).order_by(ModelRegistry.accuracy.desc()).all()
    if not models:
        # Seed registry with standard benchmark models
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
        models = db.query(ModelRegistry).order_by(ModelRegistry.accuracy.desc()).all()

    return models

@router.post("/set-active/{model_id}")
def set_active_model(model_id: str, db: Session = Depends(get_db)):
    target = db.query(ModelRegistry).filter(ModelRegistry.id == model_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Model not found in registry")

    db.query(ModelRegistry).update({ModelRegistry.is_active: False})
    target.is_active = True
    db.commit()
    db.refresh(target)
    return {"message": f"Active model set to {target.name} ({target.version})"}

