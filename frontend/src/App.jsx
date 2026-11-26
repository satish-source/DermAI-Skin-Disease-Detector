import React, { useState, useEffect } from "react";
import { Camera, FileText, Clock, BarChart3, Sparkles } from "lucide-react";
import Navbar from "./components/Navbar";
import ScreeningPage from "./pages/ScreeningPage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import CasesHistoryPage from "./pages/CasesHistoryPage";
import TemporalComparisonPage from "./pages/TemporalComparisonPage";
import ModelBenchmarksPage from "./pages/ModelBenchmarksPage";
import DermAIChatbot from "./components/DermAIChatbot";
import AuthPage from "./pages/AuthPage";
import { api } from "./api";

export default function App() {
  const [activeTab, setActiveTab] = useState("screening");
  const [currentRole, setCurrentRole] = useState("clinician");
  const [notifications, setNotifications] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [temporalCaseId, setTemporalCaseId] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("dermai_auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role) {
      setCurrentRole(user.role);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("dermai_auth_user");
    setCurrentUser(null);
  };

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
            segmentation_overlay_url: latest.segmentation_overlay_url || latest.mask_image_url,
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
      // 1. Direct match by case number or id
      const details = await api.getCaseDetails(caseNumber);
      if (details) {
        handleSelectCase(details.id);
        return;
      }
    } catch (_) {}

    try {
      // 2. Query listCases
      const cases = await api.listCases();
      const match = cases.find(c => c.case_number === caseNumber);
      if (match) {
        handleSelectCase(match.id);
      }
    } catch (err) {
      console.error("Error selecting demo case:", err);
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
            onOpenAuth={() => setActiveTab("auth")}
            currentUser={currentUser}
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

  if (activeTab === "auth") {
    return (
      <AuthPage
        onLoginSuccess={(user) => {
          handleLoginSuccess(user);
          setActiveTab("screening");
        }}
        onBack={() => setActiveTab("screening")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onToggleChatbot={() => setIsChatbotOpen(prev => !prev)}
        isChatbotOpen={isChatbotOpen}
        currentUser={currentUser}
        onOpenAuth={() => setActiveTab("auth")}
        onLogout={handleLogout}
      />

      {/* Main View Container (Clean, 100% Native Responsive across all screens) */}
      <main className="flex-1 flex flex-col items-center justify-start w-full pb-20 md:pb-6">
        <div className="w-full">
          {renderContent()}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-semibold text-slate-700">
            DermAI: Skin Disease Detector from Mobile Images Using DL
          </div>
          <div className="text-slate-400">
            Screening & Decision-Support System • Responsive across Android, iOS, Tablets & Desktops
          </div>
        </div>
      </footer>

      {/* Android Native Sticky Bottom Navigation Bar (Thumb-Accessible) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-xl safe-area-bottom">
        <button
          type="button"
          onClick={() => setActiveTab("screening")}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            activeTab === "screening"
              ? "text-sky-600 font-bold bg-sky-50/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Camera className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5 font-bold tracking-tight">Screening</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            activeTab === "history"
              ? "text-sky-600 font-bold bg-sky-50/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Cases</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("temporal")}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            activeTab === "temporal"
              ? "text-sky-600 font-bold bg-sky-50/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Temporal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("benchmarks")}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            activeTab === "benchmarks"
              ? "text-sky-600 font-bold bg-sky-50/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Benchmarks</span>
        </button>

        <button
          type="button"
          onClick={() => setIsChatbotOpen(true)}
          className="flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl text-indigo-600 font-bold bg-gradient-to-b from-indigo-50 to-sky-50 border border-indigo-200/80 shadow-2xs cursor-pointer ml-1"
        >
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          <span className="text-[10px] mt-0.5 font-extrabold tracking-tight">DermAura</span>
        </button>
      </nav>

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
