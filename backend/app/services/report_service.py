import os
import json
import csv
import io
import datetime
from pathlib import Path
from fpdf import FPDF
from app.config import settings

class DermAIReportPDF(FPDF):
    def header(self):
        # Header banner
        self.set_fill_color(30, 58, 138)  # Deep Indigo #1E3A8A
        self.rect(0, 0, 210, 24, 'F')
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, "DermAI - Dermatological Screening Analysis Report", ln=True, align="C")
        self.set_font("Helvetica", "I", 9)
        self.cell(0, 4, "Deep Learning-Assisted Mobile Skin Lesion Screening System", ln=True, align="C")
        self.ln(6)

    def footer(self):
        self.set_y(-18)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 4, "CONFIDENTIAL & MEDICAL RESEARCH SCREENING REPORT - NOT A DEFINITIVE DIAGNOSIS", ln=True, align="C")
        self.cell(0, 4, f"Page {self.page_no()}", align="C")

class ReportGenerationService:
    @classmethod
    def generate_pdf(cls, case_data: dict, analysis_data: dict, output_pdf_path: str) -> str:
        pdf = DermAIReportPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        
        # 1. Medical Disclaimer Banner
        pdf.set_fill_color(254, 242, 242)  # Soft red/pink warning box
        pdf.set_draw_color(239, 68, 68)
        pdf.set_line_width(0.4)
        pdf.rect(10, 28, 190, 16, 'DF')
        pdf.set_xy(12, 29)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(185, 28, 28)
        pdf.cell(0, 5, "[!] CLINICAL NOTICE & REGULATORY DISCLAIMER:", ln=True)
        pdf.set_x(12)
        pdf.set_font("Helvetica", "", 7.5)
        pdf.set_text_color(127, 29, 29)
        pdf.multi_cell(186, 4, "This automated screening report was generated using deep learning computer vision algorithms. It is designed as an assistive decision-support tool for preliminary triage and clinical review, NOT as an autonomous medical diagnosis or histopathological replacement.")

        pdf.ln(4)

        # 2. Case & Patient Demographics Section
        pdf.set_fill_color(243, 244, 246)
        pdf.rect(10, 48, 190, 24, 'F')
        pdf.set_xy(12, 50)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(90, 5, f"Case Number: {case_data.get('case_number', 'N/A')}")
        pdf.cell(90, 5, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True)

        pdf.set_x(12)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(90, 5, f"Patient ID: {case_data.get('patient_code', 'De-identified')}")
        pdf.cell(90, 5, f"Anatomical Location: {case_data.get('body_location', 'Skin')}", ln=True)

        pdf.set_x(12)
        pdf.cell(90, 5, f"Image Capture Source: {case_data.get('image_source', 'Mobile Device')}")
        pdf.cell(90, 5, f"AI Model: {analysis_data.get('model_name', 'DermAI-Ensemble')} ({analysis_data.get('model_version', 'v1.0')})", ln=True)

        pdf.ln(5)

        # 3. Primary Screening Prediction & Triage Risk
        pred_class = analysis_data.get("predicted_class", "MEL")
        pred_name = analysis_data.get("predicted_class_name", "Melanoma")
        conf = analysis_data.get("confidence", 0.0)
        risk = analysis_data.get("risk_category", "Requires Clinical Review")
        
        # Color coding for Risk
        if risk == "High Risk":
            r_fill = (254, 226, 226); r_txt = (185, 28, 28)
        elif risk == "Moderate Risk":
            r_fill = (254, 249, 195); r_txt = (161, 98, 7)
        elif risk == "Low Risk":
            r_fill = (209, 250, 229); r_txt = (4, 120, 87)
        else:
            r_fill = (254, 243, 199); r_txt = (180, 83, 9)

        pdf.set_fill_color(*r_fill)
        pdf.rect(10, 76, 190, 20, 'F')
        pdf.set_xy(12, 78)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*r_txt)
        pdf.cell(100, 6, f"Predicted Condition: {pred_name} ({pred_class})")
        pdf.cell(80, 6, f"Screening Risk: {risk}", ln=True, align="R")

        pdf.set_x(12)
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(55, 65, 81)
        pdf.cell(100, 5, f"AI Prediction Confidence: {conf*100:.1f}%")
        pdf.cell(80, 5, f"Image Quality Status: {analysis_data.get('quality_status', 'Good Quality')}", ln=True, align="R")

        pdf.ln(6)

        # 4. Multi-Panel Medical Visual Analysis (4 Images)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(17, 24, 39)
        pdf.set_x(10)
        pdf.cell(0, 6, "Multimodal Visual Analysis & Explainable AI Verification:", ln=True)

        img_y = 104
        img_w = 44
        img_h = 44
        gap = 4
        
        images_to_embed = [
            ("1. Original Skin Photo", case_data.get("original_image_path")),
            ("2. DullRazor Preprocessed", analysis_data.get("preprocessed_image_path")),
            ("3. Lesion Boundary Mask", analysis_data.get("mask_image_path")),
            ("4. Grad-CAM XAI Heatmap", analysis_data.get("heatmap_image_path") or analysis_data.get("overlay_image_path"))
        ]

        for i, (label, img_path) in enumerate(images_to_embed):
            col_x = 10 + i * (img_w + gap)
            pdf.set_xy(col_x, img_y)
            pdf.set_font("Helvetica", "B", 7.5)
            pdf.set_text_color(75, 85, 99)
            pdf.cell(img_w, 4, label, align="C", ln=True)

            if img_path and os.path.exists(img_path):
                try:
                    pdf.image(img_path, x=col_x, y=img_y + 5, w=img_w, h=img_h)
                except Exception:
                    pdf.rect(col_x, img_y + 5, img_w, img_h)
                    pdf.set_xy(col_x, img_y + 20)
                    pdf.cell(img_w, 5, "[Image preview]", align="C")
            else:
                pdf.rect(col_x, img_y + 5, img_w, img_h)
                pdf.set_xy(col_x, img_y + 20)
                pdf.cell(img_w, 5, "[Image preview]", align="C")

        # 5. Top-N Differential Diagnoses Table
        pdf.set_xy(10, 160)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 6, "Differential Probability Distribution (Top-4 Ranked Conditions):", ln=True)

        top_preds = analysis_data.get("top_predictions", [])[:4]
        pdf.set_fill_color(229, 231, 235)
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_x(10)
        pdf.cell(30, 6, "Class Code", 1, 0, 'C', fill=True)
        pdf.cell(90, 6, "Dermatological Condition", 1, 0, 'L', fill=True)
        pdf.cell(35, 6, "Probability", 1, 0, 'C', fill=True)
        pdf.cell(35, 6, "Risk Category", 1, 1, 'C', fill=True)

        pdf.set_font("Helvetica", "", 8)
        for item in top_preds:
            pdf.set_x(10)
            pdf.cell(30, 5.5, str(item.get("class_code", "")), 1, 0, 'C')
            pdf.cell(90, 5.5, str(item.get("class_name", "")), 1, 0, 'L')
            p_val = item.get("probability", 0.0) * 100.0
            pdf.cell(35, 5.5, f"{p_val:.1f}%", 1, 0, 'C')
            pdf.cell(35, 5.5, str(item.get("risk_level", "")), 1, 1, 'C')

        pdf.ln(4)

        # 6. Clinical Rationale & Recommendation
        pdf.set_x(10)
        pdf.set_font("Helvetica", "B", 9.5)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 5, "Clinical Recommendation & Next Steps:", ln=True)
        
        pdf.set_x(10)
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(55, 65, 81)
        rec_text = analysis_data.get("recommendation", "Please consult a healthcare professional.")
        pdf.multi_cell(190, 4.5, rec_text)

        # Save to file
        Path(output_pdf_path).parent.mkdir(parents=True, exist_ok=True)
        pdf.output(output_pdf_path)
        return output_pdf_path

    @classmethod
    def export_json(cls, case_data: dict, analysis_data: dict) -> str:
        report_dict = {
            "system": "DermAI - Skin Disease Detector",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "case": case_data,
            "analysis": analysis_data,
            "disclaimer": "AI-assisted screening only; not a definitive medical diagnosis."
        }
        return json.dumps(report_dict, indent=2, default=str)

    @classmethod
    def export_csv(cls, cases_list: list[dict]) -> str:
        output = io.StringIO()
        fieldnames = [
            "case_number", "patient_code", "body_location", "image_source",
            "predicted_class", "predicted_class_name", "confidence",
            "risk_category", "quality_status", "created_at"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for row in cases_list:
            writer.writerow({k: row.get(k, "") for k in fieldnames})
        return output.getvalue()

