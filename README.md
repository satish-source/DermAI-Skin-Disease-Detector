# DermAI: Skin Disease Detector from Mobile Images Using DL

> **AI-Powered Dermatological Image Analysis & Clinical Decision-Support System**
> *Developed strictly following the comprehensive 19-module syllabus & 4-milestone roadmap.*

---

## 🌟 System Overview

**DermAI** is an advanced dermatological screening system designed to analyze smartphone and mobile camera images of skin lesions. The platform assists patients, clinicians, researchers, and ML engineers by automating:
1. **Mobile Image Acquisition & Quality Assessment**: Blur detection, exposure validation, and resolution checking.
2. **Skin Preprocessing Engine**: **DullRazor** morphological hair artifact removal, **Grey World** color constancy, and **CLAHE** contrast enhancement.
3. **Lesion Segmentation**: **U-Net** semantic segmentation and GrabCut energy minimization to delineate lesion boundaries and measure lesion area coverage.
4. **Multi-Class Disease Classification**: Evaluates the 7 standardized HAM10000 / ISIC disease categories (Melanoma `MEL`, Nevus `NV`, Basal Cell Carcinoma `BCC`, Actinic Keratosis `AKIEC`, Benign Keratosis `BKL`, Dermatofibroma `DF`, Vascular Lesion `VASC`).
5. **Multi-Architecture Deep Learning**: MobileNetV3 (ultra-fast mobile), ResNet-50, EfficientNet-B0, DenseNet-121, Vision Transformer (ViT-B/16), and Multi-Model Soft Voting Ensemble.
6. **Explainable AI (XAI)**: **Grad-CAM++** visual attention heatmaps overlaid on the original and preprocessed images.
7. **Clinical Risk & Severity Stratification**: Triage categorizing into `Low Risk`, `Moderate Risk`, `High Risk`, and `Requires Clinical Review`.
8. **Automated Clinical PDF Reporting**: Clinical screening summary with the 4-panel visual comparison, probability distribution, and regulatory disclaimers.
9. **Temporal Evolution & Follow-up**: Side-by-side progression tracking across clinical visits to detect lesion drift and dimensional growth.
10. **Role-Based Access Control**: Tailored dashboards for Patients, Clinicians, Researchers, ML Engineers, and Administrators.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy ORM, Uvicorn |
| **Deep Learning** | PyTorch, Torchvision, Scikit-learn, OpenCV, Pillow |
| **Explainable AI** | Grad-CAM, Grad-CAM++ layer gradient activation maps |
| **Segmentation** | PyTorch U-Net architecture + Adaptive Multi-Channel GrabCut & Otsu |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Plus Jakarta Sans |
| **Database** | SQLite (zero-config local) / PostgreSQL ready via SQLAlchemy |
| **Reporting** | Automated Clinical PDF Generation with `fpdf2`, JSON & CSV export |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Run the Backend API

```bash
# Navigate to project root
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python run.py
```
- API is live at: `http://localhost:8000`
- Interactive OpenAPI / Swagger Documentation: `http://localhost:8000/docs`

### 2. Run the Frontend Web Application

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies (if not done already)
npm install

# Start Vite dev server
npm run dev
```
- Open your browser at: `http://localhost:5173`

---

## 🧪 Integration Test Suite

Verify all 7 core AI modules end-to-end (Quality assessment, Preprocessing, U-Net Segmentation, DL Classification, Grad-CAM++ XAI, and PDF report generation):

```bash
python backend/tests/test_pipeline.py
```

Expected output:
```
============================================================
ALL 7 CORE DERMAI PIPELINE MODULES PASSED WITH 100% SUCCESS!
============================================================
```

---

## 📊 Modules Implemented (All 19 Modules Covered)

1. **User Authentication & Role-Based Access**: JWT bearer tokens, bcrypt hashing, 5 distinct user roles.
2. **Patient & Case Management**: De-identified patient records, anatomical sites, clinical notes.
3. **Mobile Image Capture & Upload Module**: Live webcam/smartphone camera stream with reticle + drag-and-drop file upload.
4. **Skin Image Preprocessing Engine**: Morphological DullRazor hair removal, Grey World color constancy, CLAHE contrast enhancement.
5. **Skin Lesion Detection & Segmentation Engine**: U-Net architecture & GrabCut energy minimization with binary mask and border coordinates.
6. **Skin Disease Classification Engine**: Calibrated 7-class dermatological probability distribution.
7. **Advanced Deep Learning Intelligence Engine**: MobileNetV3, ResNet-50, EfficientNet-B0, DenseNet-121, Vision Transformer (ViT).
8. **Skin Disease Severity & Risk Assessment Module**: Automated risk tier categorization with triage recommendations.
9. **Explainable AI Module**: Grad-CAM++ activation maps revealing decisive lesion regions.
10. **AI Model Training & Evaluation Module**: Stratified cross-validation metrics and dataset loaders.
11. **Image Quality Evaluation Module**: Laplacian blur detection, exposure check, resolution validation with recapture tips.
12. **Classification Evaluation Module**: Confusion matrix, balanced accuracy, sensitivity, specificity, AUC-ROC, MCC.
13. **Visualization & Analysis Dashboard**: Tailored dashboards for patients, clinicians, and researchers.
14. **Medical Image Analysis Screen**: 4-way comparison view (Original ↔ Preprocessed ↔ Mask ↔ Grad-CAM++).
15. **Report Generation System**: Downloadable official PDF clinical reports + JSON / CSV exports.
16. **Prediction History & Follow-Up Module**: Temporal comparison tracking lesion evolution across visits.
17. **Notification & Alert System**: In-app alert banners for high-risk lesions and poor image quality.
18. **Model Management & Versioning**: Model registry with active architecture switching.
19. **Final Integration, Testing & Deployment**: Docker Compose containerization and automated test suite.

---

## ⚖️ Clinical & Legal Notice
*DermAI is intended for clinical research, educational screening, and decision support only. It is not an autonomous diagnostic medical device. Final medical diagnosis and treatment must always be rendered by certified dermatologists and confirmed via histopathology.*

