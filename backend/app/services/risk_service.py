from app.config import settings

class ClinicalRiskAssessmentEngine:
    @staticmethod
    def stratify_risk(predicted_class: str, confidence: float, quality_status: str, lesion_area_pct: float) -> dict:
        """
        Stratifies clinical risk tier based on:
        1. Disease severity class (MEL, BCC = High; AKIEC, BKL = Moderate; NV, DF, VASC = Low)
        2. Prediction confidence
        3. Image quality status
        4. Lesion boundary/size attributes
        """
        # If image quality is poor or confidence is borderline, flag for clinical review
        if quality_status == "Poor Quality":
            return {
                "risk_category": "Requires Clinical Review",
                "risk_color": "#F59E0B",  # Amber
                "risk_rationale": "Poor image quality prevents reliable AI inference. Lesion features could not be evaluated with sufficient clinical confidence.",
                "recommendation": "Recapture photo under better lighting and focus. Consult a certified dermatologist for direct physical examination."
            }

        # Normal Healthy Skin (No focal lesion detected by segmentation)
        if predicted_class == "NORM" or lesion_area_pct == 0.0:
            return {
                "risk_category": "Healthy / Low Risk",
                "risk_color": "#10B981",  # Emerald Green
                "risk_rationale": "Automated lesion localization and dermatoscopic analysis confirmed uniform, healthy skin tone. No focal lesion, abnormal pigment network, or pathological structures were detected.",
                "recommendation": "Your skin photograph appears healthy and clear. No dermatologist visit is needed! Continue routine skincare and daily broad-spectrum sun protection (SPF 30+)."
            }

        if confidence < settings.BORDERLINE_CONFIDENCE_THRESHOLD:
            return {
                "risk_category": "Requires Clinical Review",
                "risk_color": "#F59E0B",  # Amber
                "risk_rationale": f"The model prediction confidence ({confidence*100:.1f}%) is below the decisive threshold. On normal or healthy skin photos without an isolated pigmented lesion, the AI deliberately refrains from guessing a disease, triggering an automatic safety review.",
                "recommendation": "If this is normal skin, no medical action is required. If evaluating a specific spot or symptom, consult a certified dermatologist for in-person dermoscopy."
            }

        # High Risk Classes (Melanoma, Basal Cell Carcinoma)
        if predicted_class in settings.HIGH_RISK_CLASSES:
            if confidence >= settings.HIGH_CONFIDENCE_THRESHOLD:
                return {
                    "risk_category": "High Risk",
                    "risk_color": "#EF4444",  # Red
                    "risk_rationale": f"High probability of malignant condition ({settings.DISEASE_CLASSES.get(predicted_class, predicted_class)}) with {confidence*100:.1f}% confidence.",
                    "recommendation": "Urgent clinical evaluation by a dermatologist or surgical oncologist. Immediate dermatoscopic evaluation and biopsy consideration strongly advised."
                }
            else:
                return {
                    "risk_category": "Requires Clinical Review",
                    "risk_color": "#F59E0B",  # Amber
                    "risk_rationale": f"Possible malignant condition ({settings.DISEASE_CLASSES.get(predicted_class, predicted_class)}) detected with moderate confidence ({confidence*100:.1f}%).",
                    "recommendation": "Prompt specialist clinical consultation within 1 to 2 weeks for dermoscopy and lesion monitoring."
                }

        # Moderate Risk Classes (Actinic Keratosis, atypical Benign Keratosis)
        if predicted_class in settings.MODERATE_RISK_CLASSES:
            return {
                "risk_category": "Moderate Risk",
                "risk_color": "#EAB308",  # Yellow
                "risk_rationale": f"Lesion identified as pre-cancerous or atypical keratosis ({settings.DISEASE_CLASSES.get(predicted_class, predicted_class)}) with {confidence*100:.1f}% confidence.",
                "recommendation": "Routine clinical review recommended. Discuss cryotherapy, topical 5-FU, or preventative photoprotection with your clinician."
            }

        # Low Risk Classes (Benign Nevus, Dermatofibroma, Vascular Lesions)
        return {
            "risk_category": "Low Risk",
            "risk_color": "#10B981",  # Green
            "risk_rationale": f"Features consistent with benign lesion ({settings.DISEASE_CLASSES.get(predicted_class, predicted_class)}) with {confidence*100:.1f}% confidence.",
            "recommendation": "Benign characteristics observed. Perform self-skin checks monthly; seek medical attention if lesion changes size, shape, or color (ABCDE criteria)."
        }

