import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ScreeningPage from "./pages/ScreeningPage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import CasesHistoryPage from "./pages/CasesHistoryPage";
import TemporalComparisonPage from "./pages/TemporalComparisonPage";
import ModelBenchmarksPage from "./pages/ModelBenchmarksPage";
import DermAIChatbot from "./components/DermAIChatbot";
import { api } from "./api";

export default function App() {
  const [activeTab, setActiveTab] = useState("screening");
  const [currentRole, setCurrentRole] = useState("clinician");
  const [deviceMode, setDeviceMode] = useState("laptop"); // "laptop" or "mobile"
  const [notifications, setNotifications] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [temporalCaseId, setTemporalCaseId] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalysisComplete = (analysisData) => {
    setCurrentAnalysis(analysisData);
    setActiveTab("analysis_detail");
    loadNotifications();
  };

  const handleSelectCase = async (caseId) => {
    try {
      const details = await api.getCaseDetails(caseId);
      if (details.analyses && details.analyses.length > 0) {
        const latest = details.analyses[0];
        setCurrentAnalysis({
          case_id: details.id,
          case_number: details.case_number,
          model: {
            name: latest.model_name,
            version: latest.model_version
          },
          prediction: {
            class_code: latest.predicted_class,
            class_name: latest.predicted_class_name,
            confidence: latest.confidence,
            top_predictions: latest.top_predictions
          },
          segmentation: {
            lesion_area_percentage: latest.lesion_area_percentage,
            bounding_box: []
          },
          risk: {
            risk_category: latest.risk_category,
            risk_rationale: latest.risk_rationale,
            recommendation: latest.recommendation
          },
          quality: {
            overall_status: latest.quality_status,
            overall_score: latest.quality_score,
            ...latest.quality_metrics
          },
          images: {
            original_url: details.original_image_url,
            preprocessed_url: latest.preprocessed_image_url,
            mask_url: latest.mask_image_url,
            segmentation_overlay_url: latest.mask_image_url,
            heatmap_url: latest.heatmap_image_url,
            gradcam_overlay_url: latest.overlay_image_url
          },
          report_pdf_url: latest.report_pdf_url
        });
        setActiveTab("analysis_detail");
      } else {
        const res = await api.runAnalysis(caseId, "ensemble", true);
        handleAnalysisComplete(res);
      }
    } catch (err) {
      console.error("Failed to load case details:", err);
    }
  };

  const handleSelectDemoCase = async (caseNumber) => {
    try {
      const cases = await api.listCases();
      const match = cases.find(c => c.case_number === caseNumber);
      if (match) {
        handleSelectCase(match.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateTemporal = (caseId) => {
    setTemporalCaseId(caseId);
    setActiveTab("temporal");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "screening":
        return (
          <ScreeningPage
            onAnalysisComplete={handleAnalysisComplete}
            onSelectDemoCase={handleSelectDemoCase}
          />
        );
      case "analysis_detail":
        return (
          <AnalysisDetailPage
            analysis={currentAnalysis}
            onBack={() => setActiveTab("screening")}
            onDeleteSuccess={() => {
              setCurrentAnalysis(null);
              setActiveTab("history");
            }}
            onNavigateTemporal={handleNavigateTemporal}
          />
        );
      case "history":
        return (
          <CasesHistoryPage
            onSelectCase={handleSelectCase}
          />
        );
      case "temporal":
        return (
          <TemporalComparisonPage
            defaultCaseId={temporalCaseId}
          />
        );
      case "benchmarks":
        return (
          <ModelBenchmarksPage />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        deviceMode={deviceMode}
        setDeviceMode={setDeviceMode}
        onToggleChatbot={() => setIsChatbotOpen(prev => !prev)}
        isChatbotOpen={isChatbotOpen}
      />

      {/* Main View Container */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        {deviceMode === "laptop" ? (
          /* Widescreen Laptop / Desktop View (Full screen utilization) */
          <div className="w-full">
            {renderContent()}
          </div>
        ) : (
          /* Mobile Smartphone Simulator View (shows mobile phone app behavior on laptop) */
          <div className="py-6 px-2 flex flex-col items-center w-full animate-in fade-in duration-300">
            <div className="mb-2 text-xs font-semibold text-slate-500 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mobile Smartphone Device Simulation (390px Viewport)</span>
            </div>

            {/* Smartphone Outer Chassis */}
            <div className="w-full max-w-[410px] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700">
              {/* Dynamic Island / Notch */}
              <div className="w-full flex items-center justify-center pt-1 pb-2">
                <div className="w-24 h-4 bg-black rounded-full" />
              </div>

              {/* Mobile Screen Body */}
              <div className="w-full bg-slate-50 rounded-[38px] overflow-hidden max-h-[820px] overflow-y-auto border border-slate-200">
                {renderContent()}
              </div>

              {/* Home indicator bar */}
              <div className="w-full flex justify-center py-2">
                <div className="w-32 h-1 bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-semibold text-slate-700">
            DermAI: Skin Disease Detector from Mobile Images Using DL
          </div>
          <div className="text-slate-400">
            Screening & Decision-Support System • Responsive across Laptops, Tablets & Smartphones
          </div>
        </div>
      </footer>

      {/* Interactive Dermatology Clinical Chatbot (Triggered from Navbar) */}
      <DermAIChatbot
        isOpen={isChatbotOpen}
        setIsOpen={setIsChatbotOpen}
        activeCaseContext={
          currentAnalysis
            ? {
                case_number: currentAnalysis.case_number,
                class_name: currentAnalysis.prediction?.class_name,
                class_code: currentAnalysis.prediction?.class_code,
                confidence: currentAnalysis.prediction?.confidence,
                risk_category: currentAnalysis.risk?.risk_category,
                recommendation: currentAnalysis.risk?.recommendation,
              }
            : null
        }
      />
    </div>
  );
}
