import React, { useState } from "react";
import { Download, FileJson, ArrowLeft, ShieldAlert, AlertTriangle, CheckCircle, Info, Stethoscope, Share2, Volume2, Calendar, ZoomIn, Calculator, UserCheck, Trash2, Globe } from "lucide-react";
import MedicalViewer from "../components/MedicalViewer";
import AbcdeCalculator from "../components/AbcdeCalculator";
import TelehealthModal from "../components/TelehealthModal";
import { api } from "../api";

const MULTILINGUAL_DATA = {
  en: {
    label: "English",
    code: "en-IN",
    diseases: {
      NORM: "Normal Healthy Skin (No Lesion Detected)",
      MEL: "Melanoma (Malignant)",
      NV: "Melanocytic Nevus (Benign Mole)",
      BCC: "Basal Cell Carcinoma",
      AKIEC: "Actinic Keratosis",
      BKL: "Benign Keratosis",
      DF: "Dermatofibroma",
      VASC: "Vascular Lesion"
    },
    risk: {
      "Healthy / Low Risk": "Healthy / Low Risk",
      "High Risk": "High Risk",
      "Moderate Risk": "Moderate Risk",
      "Low Risk": "Low Risk",
      "Requires Clinical Review": "Requires Clinical Review"
    },
    generate: (caseNum, disease, conf, riskCat, rec) =>
      `DermAI Clinical Screening Report for case ${caseNum}. The predicted condition is ${disease}, identified with ${conf} percent confidence. Clinical triage tier is ${riskCat}. Next steps: ${rec}`
  },
  kn: {
    label: "ಕನ್ನಡ (Kannada)",
    code: "kn-IN",
    diseases: {
      NORM: "ಸಾಮಾನ್ಯ ಆರೋಗ್ಯಕರ ಚರ್ಮ (ಯಾವುದೇ ಕಲೆ/ಗಾಯವಿಲ್ಲ)",
      MEL: "ಮೆಲನೋಮಾ (ಚರ್ಮದ ಗಂಭೀರ ಕ್ಯಾನ್ಸರ್)",
      NV: "ಮೆಲನೊಸೈಟಿಕ್ ನೆವಸ್ (ಸಾಮಾನ್ಯ ಮಚ್ಚೆ)",
      BCC: "ಬಾಸಲ್ ಸೆಲ್ ಕಾರ್ಸಿನೋಮ (ಚರ್ಮದ ಕ್ಯಾನ್ಸರ್)",
      AKIEC: "ಆಕ್ಟಿನಿಕ್ ಕೆರಾಟೋಸಿಸ್ (ಪೂರ್ವ ಕ್ಯಾನ್ಸರ್ ಸ್ಥಿತಿ)",
      BKL: "ಬೆನೈನ್ ಕೆರಾಟೋಸಿಸ್ (ಹಾನಿಕಾರಕವಲ್ಲದ ಚರ್ಮದ ಗಂಟು)",
      DF: "ಡರ್ಮಟೊಫೈಬ್ರೊಮಾ (ಹಾನಿಕಾರಕವಲ್ಲದ ಚರ್ಮದ ಬೆಳವಣಿಗೆ)",
      VASC: "ರಕ್ತನಾಳಗಳ ಗಾಯ (ವ್ಯಾಸ್ಕುಲರ್ ಲೆಸಿಯನ್)"
    },
    risk: {
      "Healthy / Low Risk": "ಆರೋಗ್ಯಕರ / ಅಪಾಯವಿಲ್ಲ",
      "High Risk": "ಹೆಚ್ಚಿನ ವೈದ್ಯಕೀಯ ಅಪಾಯ",
      "Moderate Risk": "ಮಧ್ಯಮ ಅಪಾಯ",
      "Low Risk": "ಕಡಿಮೆ ಅಪಾಯ (ಸುರಕ್ಷಿತ)",
      "Requires Clinical Review": "ವೈದ್ಯಕೀಯ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ"
    },
    generate: (caseNum, disease, conf, riskCat, rec) =>
      `ಡರ್ಮ್-ಎಐ ಕ್ಲಿನಿಕಲ್ ಸ್ಕ್ರೀನಿಂಗ್ ವರದಿ, ಕೇಸ್ ಸಂಖ್ಯೆ ${caseNum}. ಈ ತಪಾಸಣೆಯಲ್ಲಿ ${conf} ಪ್ರತಿಶತ ವಿಶ್ವಾಸಾರ್ಹತೆಯೊಂದಿಗೆ ${disease} ಗುರುತಿಸಲಾಗಿದೆ. ಕ್ಲಿನಿಕಲ್ ಅಪಾಯದ ವರ್ಗ: ${riskCat}. ಮುಂದಿನ ವೈದ್ಯಕೀಯ ಕ್ರಮ: ${rec}`
  },
  hi: {
    label: "हिन्दी (Hindi)",
    code: "hi-IN",
    diseases: {
      NORM: "सामान्य स्वस्थ त्वचा (कोई घाव या तिल नहीं मिला)",
      MEL: "मेलेनोमा (गंभीर त्वचा कैंसर)",
      NV: "मेलानोसाइटिक नेवस (साधारण तिल)",
      BCC: "बेसल सेल कार्सिनोमा (त्वचा कैंसर)",
      AKIEC: "एक्टिनिक केराटोसिस (पूर्व-कैंसर अवस्था)",
      BKL: "बेनाइन केराटोसिस (सुरक्षित गांठ)",
      DF: "डर्मेटोफाइब्रोमा (सामान्य त्वचा गांठ)",
      VASC: "वैस्कुलर लीजन (रक्त वाहिका संबंधी घाव)"
    },
    risk: {
      "Healthy / Low Risk": "पूरी तरह स्वस्थ / सुरक्षित",
      "High Risk": "उच्च चिकित्सीय जोखिम",
      "Moderate Risk": "मध्यम जोखिम",
      "Low Risk": "कम जोखिम (सुरक्षित)",
      "Requires Clinical Review": "चिकित्सक द्वारा जांच आवश्यक है"
    },
    generate: (caseNum, disease, conf, riskCat, rec) =>
      `डर्म-एआई क्लिनिकल स्क्रीनिंग रिपोर्ट, केस संख्या ${caseNum}। मॉडल ने ${conf} प्रतिशत सटीकता के साथ ${disease} की पहचान की है। ट्राइएज स्तर ${riskCat} है। अनुशंसित कदम: ${rec}`
  },
  te: {
    label: "తెలుగు (Telugu)",
    code: "te-IN",
    diseases: {
      NORM: "సాధారణ ఆరోగ్యకరమైన చర్మం (ఎలాంటి సమస్య లేదు)",
      MEL: "మెలనోమా (తీవ్రమైన చర్మ క్యాన్సర్)",
      NV: "మెలనోసైటిక్ నెవస్ (సాధారణ పుట్టుమచ్చ)",
      BCC: "బాసల్ సెల్ కార్సినోమా (చర్మ క్యాన్సర్ రకం)",
      AKIEC: "ఆక్టినిక్ కెరాటోసిస్ (ముందస్తు క్యాన్సర్ లక్షణం)",
      BKL: "బెనైన్ కెరాటోసిస్ (హానిచేయని చర్మ మార్పు)",
      DF: "డెర్మటోఫైబ్రోమా (సాధారణ చర్మ కణితి)",
      VASC: "వాస్కులర్ గాయం (రక్తనాళాల మార్పు)"
    },
    risk: {
      "Healthy / Low Risk": "పూర్తిగా ఆరోగ్యకరం / సురక్షితం",
      "High Risk": "అధిక ప్రమాదం",
      "Moderate Risk": "మధ్యస్థ ప్రమాదం",
      "Low Risk": "తక్కువ ప్రమాదం (సురక్షితం)",
      "Requires Clinical Review": "వైద్య సమీక్ష అవసరం"
    },
    generate: (caseNum, disease, conf, riskCat, rec) =>
      `డెర్మ్-ఏఐ క్లినికల్ స్క్రీనింగ్ నివేదిక, కేస్ నంబర్ ${caseNum}. ఈ పరీక్షలో ${conf} శాతం ఖచ్చితత్వంతో ${disease} నిర్ధారించబడింది. క్లినికల్ ప్రమాద స్థాయి: ${riskCat}. వైద్య సిఫార్సు: ${rec}`
  }
};

export default function AnalysisDetailPage({ analysis, onBack, onNavigateTemporal, onDeleteSuccess }) {
  const [feedback, setFeedback] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [showTelehealth, setShowTelehealth] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!analysis) return null;

  const {
    case_number,
    case_id,
    model,
    prediction,
    segmentation,
    risk,
    quality,
    images,
    report_pdf_url
  } = analysis;

  const handleDeleteCase = async () => {
    if (!case_id) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete Case ${case_number}?\nThis will remove the clinical images, model predictions, and PDF reports.`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.deleteCase(case_id);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        onBack();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete case: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const topPreds = prediction?.top_predictions || [];
  const primaryCode = prediction?.class_code;
  const primaryName = prediction?.class_name;
  const confidence = (prediction?.confidence || 0) * 100;

  const isHighRisk = risk?.risk_category === "High Risk";
  const isModerateRisk = risk?.risk_category === "Moderate Risk";
  const isReviewRequired = risk?.risk_category === "Requires Clinical Review";

  const riskBadgeClass = isHighRisk
    ? "bg-rose-100 text-rose-800 border-rose-300"
    : isModerateRisk
    ? "bg-amber-100 text-amber-800 border-amber-300"
    : isReviewRequired
    ? "bg-orange-100 text-orange-800 border-orange-300"
    : "bg-emerald-100 text-emerald-800 border-emerald-300";

  // Voice AI Web Speech API with Kannada, Hindi, Telugu, and English support
  const handleSpeakSummary = () => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const langConfig = MULTILINGUAL_DATA[selectedLang] || MULTILINGUAL_DATA.en;
    const diseaseLocalized = langConfig.diseases[primaryCode] || primaryName;
    const riskLocalized = langConfig.risk[risk?.risk_category] || risk?.risk_category;
    const recText = risk?.recommendation || "Consult a specialist.";

    const textToSpeak = langConfig.generate(
      case_number,
      diseaseLocalized,
      confidence.toFixed(0),
      riskLocalized,
      recText
    );

    setSpokenTranscript(textToSpeak);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langConfig.code;
    utterance.rate = selectedLang === "en" ? 0.95 : 0.88;

    // Match installed local/cloud voice for Indian languages if available
    const voices = window.speechSynthesis.getVoices();
    const prefix = langConfig.code.slice(0, 2).toLowerCase();
    const matchVoice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Screening</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Multilingual Voice AI Audio Controls */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center px-2.5 py-1.5 border-r border-slate-100 bg-slate-50/70">
              <Globe className="w-3.5 h-3.5 text-sky-600 mr-1.5 shrink-0" />
              <select
                value={selectedLang}
                onChange={(e) => {
                  setSelectedLang(e.target.value);
                  if (isSpeaking) window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                  setSpokenTranscript("");
                }}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                title="Choose voice language for AI summary"
              >
                <option value="en">English (Global)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSpeakSummary}
              className={`px-3 py-2 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                isSpeaking ? "bg-sky-100 text-sky-800 animate-pulse font-bold" : "hover:bg-slate-50 text-slate-700"
              }`}
              title="Listen to summary in selected language"
            >
              <Volume2 className="w-4 h-4 text-sky-600" />
              <span>{isSpeaking ? "Mute Voice AI" : "Listen to Summary"}</span>
            </button>
          </div>

          {/* Book Telehealth Button */}
          <button
            onClick={() => setShowTelehealth(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Book Doctor Telehealth</span>
          </button>

          {case_id && (
            <button
              onClick={() => onNavigateTemporal(case_id)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <span>Temporal Evolution</span>
            </button>
          )}

          <a
            href={api.getExportJsonUrl(case_id)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs transition-all"
          >
            <FileJson className="w-4 h-4 text-slate-500" />
            <span>Export JSON</span>
          </a>

          <a
            href={api.getPdfReportUrl(case_id)}
            target="_blank"
            rel="noreferrer"
            download
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF Report</span>
          </a>

          {/* Delete Case Button */}
          <button
            type="button"
            onClick={handleDeleteCase}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            title="Permanently Delete This Case"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>{isDeleting ? "Deleting..." : "Delete Case"}</span>
          </button>
        </div>
      </div>

      {/* Live Multilingual Voice AI Audio Transcript & Subtitles */}
      {isSpeaking && spokenTranscript && (
        <div className="mb-4 p-4 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-sky-50 border border-sky-300 rounded-2xl flex items-start space-x-3 text-xs text-sky-950 shadow-sm animate-in fade-in">
          <Volume2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <div className="font-bold text-[11px] uppercase tracking-wider text-sky-800 flex items-center space-x-2">
              <span>Voice AI Audio Transcript ({MULTILINGUAL_DATA[selectedLang]?.label}):</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-1 text-slate-900 font-semibold leading-relaxed text-sm">
              "{spokenTranscript}"
            </div>
          </div>
        </div>
      )}

      {/* Clinical Disclaimer Banner */}
      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl mb-6 flex items-start space-x-3 text-xs text-rose-900 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Clinical Screening Notice: </span>
          <span>
            DermAI is an AI-assisted preliminary triage and decision-support system. Predictions must be verified by a certified dermatologist or confirmed via histopathology before surgical decisions.
          </span>
        </div>
      </div>

      {/* 4-Panel Medical Image Comparison Screen (with Interactive Blend & Dermatoscope Loupe!) */}
      <MedicalViewer
        images={images}
        predictedClass={primaryCode}
        confidence={confidence}
      />

      {/* Primary Diagnosis & Risk Tier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left 7 Cols: Primary Result & Differential Diagnosis */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Prediction Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Case Reference: {case_number}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  {primaryName} ({primaryCode})
                </h2>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full border ${riskBadgeClass}`}>
                  {risk?.risk_category || "Requires Clinical Review"}
                </span>
              </div>
            </div>

            {/* Confidence Gauge Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Model Classification Confidence</span>
                <span className="text-slate-900 font-bold">{confidence.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    confidence > 75 ? "bg-emerald-500" : confidence > 50 ? "bg-sky-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>

              {/* Explainable Decision Fusion Badges */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-700 border border-slate-200">
                  {analysis?.model_source || "PyTorch MobileNetV3 Checkpoint"}
                </span>
                {analysis?.neural_confidence && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Deep CNN: {(analysis.neural_confidence * 100).toFixed(1)}%
                  </span>
                )}
                {analysis?.abcde_prior_confidence && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                    Clinical Priors: {(analysis.abcde_prior_confidence * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Clinical Rationale & Recommendation */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Stethoscope className="w-4 h-4 text-sky-600" />
                <span>Clinical Triage Rationale:</span>
              </div>
              <p className="leading-relaxed">{risk?.risk_rationale}</p>
              
              <div className="pt-2 border-t border-slate-200 text-sky-900 font-medium">
                🎯 Recommended Next Step: {risk?.recommendation}
              </div>
            </div>
          </div>

          {/* Differential Probability Distribution (Top-N Bar Chart) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Differential Probability Distribution (7 Standard Classes)
            </h3>
            
            <div className="space-y-3">
              {topPreds.map((item, idx) => {
                const pct = (item.probability * 100);
                const isSelected = item.class_code === primaryCode;
                return (
                  <div key={item.class_code} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isSelected ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className={`font-semibold ${isSelected ? "text-slate-900 font-bold" : "text-slate-700"}`}>
                          {item.class_name} ({item.class_code})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          item.risk_level === "High Risk" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          item.risk_level === "Moderate Risk" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {item.risk_level}
                        </span>
                        <span className="font-mono font-bold text-slate-800 w-12 text-right">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSelected ? "bg-sky-600" : "bg-slate-400"
                        }`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 5 Cols: ABCDE Calculator, Morphometry & Clinician Signoff */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Clinical ABCDE Calculator */}
          <AbcdeCalculator />

          {/* Morphometry Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3">Morphometric Metrics</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Lesion Area Coverage</span>
                <span className="font-bold text-slate-800 font-mono">{segmentation?.lesion_area_percentage}% of frame</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Segmentation Model</span>
                <span className="font-bold text-slate-800">U-Net & GrabCut Energy</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Deep Learning Model</span>
                <span className="font-bold text-slate-800">{model?.name} ({model?.version})</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Image Quality Status</span>
                <span className="font-bold text-emerald-700">{quality?.overall_status}</span>
              </div>
            </div>
          </div>

          {/* Clinician Review & Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">Clinician Feedback & Sign-off</h3>
            <p className="text-xs text-slate-500 mb-3">
              Add dermatological consultation observations or sign off for biopsy.
            </p>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Reviewed 4-way Grad-CAM overlay. Correlates with clinically atypical junctional nevus. Biopsy scheduled."
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-medium resize-none mb-3 shadow-2xs"
            />
            <button
              onClick={() => setIsSaved(true)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              {isSaved ? "Clinical Feedback Saved ✓" : "Save Clinical Evaluation"}
            </button>
          </div>

        </div>

      </div>

      {/* Telehealth Booking Modal */}
      <TelehealthModal
        isOpen={showTelehealth}
        onClose={() => setShowTelehealth(false)}
        caseNumber={case_number}
        riskCategory={risk?.risk_category}
        predictedCondition={primaryName}
      />

    </div>
  );
}
