import React, { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, Cpu, ArrowRight, Loader2, Info, MapPin, Check } from "lucide-react";
import CameraCapture from "../components/CameraCapture";
import InteractiveBodyMap from "../components/InteractiveBodyMap";
import { api } from "../api";
import confetti from "canvas-confetti";

export default function ScreeningPage({ onAnalysisComplete, onSelectDemoCase }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageSource, setImageSource] = useState("mobile_camera");

  // Batch multi-photo files state
  const [batchFiles, setBatchFiles] = useState([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);

  const [caseTitle, setCaseTitle] = useState("Skin Lesion Screening");
  const [bodyLocation, setBodyLocation] = useState("Upper Back");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [architecture, setArchitecture] = useState("ensemble");

  const [isUploading, setIsUploading] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState(null);
  const [qualityResult, setQualityResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const architectures = [
    { id: "ensemble", name: "DermAI-Ensemble (ViT + EfficientNet + ResNet)", speed: "115ms", desc: "Recommended multi-model soft voting" },
    { id: "vit", name: "Vision Transformer (ViT-B/16)", speed: "94ms", desc: "Self-attention patch network" },
    { id: "efficientnet", name: "EfficientNet-B0", speed: "42ms", desc: "High-accuracy compound scaled CNN" },
    { id: "mobilenet_v3", name: "MobileNetV3-Large", speed: "22ms", desc: "Low-latency on-device smartphone CNN" },
    { id: "resnet50", name: "ResNet-50", speed: "58ms", desc: "Standard deep residual baseline" },
  ];

  const analysisSteps = [
    "1. Assessing blur variance & illumination...",
    "2. Applying DullRazor morphological hair inpainting...",
    "3. Segmenting lesion border with U-Net & GrabCut...",
    "4. Running multi-class deep learning inference...",
    "5. Generating Grad-CAM++ visual activation heatmaps...",
    "6. Compiling official clinical PDF report..."
  ];

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep(prev => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleImageSelected = (file, url, source) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setImageSource(source || "mobile_camera");
    setCreatedCaseId(null);
    setQualityResult(null);
    setBatchFiles([]);
    setErrorMessage("");
  };

  const handleBatchFilesSelected = (files, urls) => {
    setBatchFiles(files);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCreatedCaseId(null);
    setQualityResult(null);
    setErrorMessage("");
  };

  const handleRunBatchAnalysis = async () => {
    if (!batchFiles || batchFiles.length === 0) return;
    setIsBatchAnalyzing(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      batchFiles.forEach(f => {
        formData.append("files", f);
      });
      formData.append("body_location", bodyLocation);
      formData.append("auto_analyze", "true");

      const res = await api.batchUploadCases(formData);
      setBatchProgress(res);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      setErrorMessage(err.message || "Batch screening failed.");
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  const handleCreateCaseAndCheckQuality = async () => {
    if (!selectedFile) {
      setErrorMessage("Please capture or upload a skin lesion photograph first.");
      return;
    }
    setErrorMessage("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", caseTitle);
      formData.append("body_location", bodyLocation);
      formData.append("image_source", imageSource);
      if (clinicalNotes) formData.append("clinical_notes", clinicalNotes);

      const res = await api.createCaseWithUpload(formData);
      setCreatedCaseId(res.case_id);

      const quality = await api.checkQuality(res.case_id);
      setQualityResult(quality);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create case and check quality.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunFullAnalysis = async (force = false) => {
    if (!createdCaseId) return;
    setIsAnalyzing(true);
    setErrorMessage("");

    try {
      const res = await api.runAnalysis(createdCaseId, architecture, force);
      if (res.status === "rejected") {
        setQualityResult(res.quality);
        setErrorMessage("Analysis blocked by Image Quality Gate. You may override below if clinically required.");
      } else {
        try {
          confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
        } catch (e) {}
        onAnalysisComplete(res);
      }
    } catch (err) {
      setErrorMessage(err.message || "Error running deep learning inference.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Title & Regulatory Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              New Dermatological Screening Case
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Mobile image acquisition, automated quality checks, U-Net lesion segmentation, and multi-class classification.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200/70 px-2.5 py-1 rounded-full border border-slate-300/80">
              ISO 13485 Research Class I
            </span>
          </div>
        </div>

        {/* Quick Load Demo Presets */}
        <div className="mt-4 p-3 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-sky-50 border border-sky-200 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs text-sky-950 font-bold">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Instant Demo Presets (1-Click Evaluation):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectDemoCase("CAS-MEL-001")}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>Sample Melanoma</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectDemoCase("CAS-NEV-002")}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>Sample Benign Mole</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectDemoCase("CAS-BCC-003")}
              className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>Sample BCC Carcinoma</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectDemoCase("CAS-NORM-005")}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span className="text-emerald-500">✨</span>
              <span>Sample Healthy Skin</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectDemoCase("CAS-BLUR-004")}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>Blurry Quality Reject</span>
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Notice</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (7 cols) & Right Column (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Camera & Image Quality */}
        <div className="lg:col-span-7 space-y-6">
          <CameraCapture
            onImageSelected={handleImageSelected}
            onBatchFilesSelected={handleBatchFilesSelected}
          />

          {/* Batch Processing Execution Card */}
          {batchFiles.length > 0 && !batchProgress && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-slate-900 text-sm sm:text-base">
                  Batch Multi-Lesion Screening ({batchFiles.length} Photos Selected)
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Parallel DL Inference
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Click below to automatically run quality assessment, DullRazor artifact removal, U-Net lesion segmentation, and ensemble multi-class classification on all {batchFiles.length} uploaded photos in parallel.
              </p>
              <button
                type="button"
                onClick={handleRunBatchAnalysis}
                disabled={isBatchAnalyzing}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {isBatchAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing {batchFiles.length} Photos in Parallel...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Batch AI Screening on All {batchFiles.length} Photos</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Batch Complete Results Summary */}
          {batchProgress && (
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-sm animate-in fade-in">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Batch Analysis Completed: {batchProgress.total_uploaded} Photos Analyzed!</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mb-4">
                {batchProgress.analyzed_cases.map(item => (
                  <div key={item.case_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{item.filename}</div>
                      <div className="text-[11px] text-slate-500">{item.case_number} * {item.predicted_name || "Analyzed"}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.risk_category === "High Risk" ? "bg-rose-100 text-rose-800" :
                        item.risk_category === "Moderate Risk" ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      }`}>
                        {item.risk_category || "Processed"}
                      </span>
                      {item.confidence && (
                        <span className="font-mono text-slate-600 font-bold">{(item.confidence * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                All individual PDF reports and case records have been saved to your Case History and <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">backend/reports/</code> folder.
              </p>
              <button
                type="button"
                onClick={() => { setBatchFiles([]); setBatchProgress(null); }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Done (Start New Screening)
              </button>
            </div>
          )}

          {/* Quality Assessment Results Card */}
          {qualityResult && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Image Quality Evaluation</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    qualityResult.overall_status === "Good Quality"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : qualityResult.overall_status === "Acceptable Quality"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}>
                    {qualityResult.overall_status} (Score: {(qualityResult.overall_score * 100).toFixed(0)}%)
                  </span>
                </h3>
              </div>

              {/* Quality Indicators Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-slate-400 font-medium">Sharpness (Blur)</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{qualityResult.blur_score}</div>
                  <div className={qualityResult.is_blurry ? "text-rose-600 font-bold" : "text-emerald-600 font-semibold"}>
                    {qualityResult.is_blurry ? "Blurry" : "Sharp"}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-slate-400 font-medium">Luminance</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{qualityResult.mean_luminance}</div>
                  <div className={qualityResult.is_underexposed ? "text-amber-600 font-bold" : qualityResult.is_overexposed ? "text-amber-600 font-bold" : "text-emerald-600 font-semibold"}>
                    {qualityResult.is_underexposed ? "Underexposed" : qualityResult.is_overexposed ? "Overexposed" : "Balanced"}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-slate-400 font-medium">RMS Contrast</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{qualityResult.rms_contrast}</div>
                  <div className={qualityResult.is_low_contrast ? "text-amber-600 font-bold" : "text-emerald-600 font-semibold"}>
                    {qualityResult.is_low_contrast ? "Low" : "Normal"}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-slate-400 font-medium">Resolution</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{qualityResult.width}x{qualityResult.height}</div>
                  <div className={qualityResult.resolution_ok ? "text-emerald-600 font-semibold" : "text-rose-600 font-bold"}>
                    {qualityResult.resolution_ok ? "Valid" : "Too Low"}
                  </div>
                </div>
              </div>

              {/* Rejection Reasons or Tips */}
              {qualityResult.rejection_reasons?.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Quality Warnings:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {qualityResult.rejection_reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {qualityResult.remediation_tips?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200/60 font-semibold text-amber-900">
                      💡 Tip: {qualityResult.remediation_tips.join(" ")}
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Stage Visual Stepper during AI Inference */}
              {isAnalyzing && (
                <div className="my-4 p-4 bg-sky-50 rounded-xl border border-sky-200 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-xs font-bold text-sky-900 mb-2">
                    <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                    <span>Deep Learning Diagnostic Pipeline in Progress...</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] font-mono text-slate-600">
                    {analysisSteps.map((step, idx) => (
                      <div key={idx} className={`flex items-center space-x-2 ${
                        idx < analysisStep ? "text-emerald-700 font-bold" : idx === analysisStep ? "text-sky-700 font-bold animate-pulse" : "text-slate-400"
                      }`}>
                        <span>{idx < analysisStep ? "✓" : idx === analysisStep ? "➜" : "○"}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRunFullAnalysis(false)}
                  disabled={isAnalyzing || qualityResult.overall_status === "Poor Quality"}
                  className="flex-1 py-3 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Running Neural Screening...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run Deep Learning Inference</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {qualityResult.overall_status === "Poor Quality" && (
                  <button
                    type="button"
                    onClick={() => handleRunFullAnalysis(true)}
                    disabled={isAnalyzing}
                    className="py-3 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>Force Override Quality Gate</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Initial Pre-Check Button */}
          {!qualityResult && selectedFile && (
            <button
              type="button"
              onClick={handleCreateCaseAndCheckQuality}
              disabled={isUploading}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading & Assessing Image Quality...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Validate Image Quality & Register Case</span>
                </>
              )}
            </button>
          )}

        </div>

        {/* Right Column (5 cols): Case Metadata, Body Map & Model Choice */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Metadata Card with Interactive Body Map */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>2. Anatomical Location & Case Metadata</span>
            </h3>

            {/* Interactive Body Map */}
            <InteractiveBodyMap
              selectedLocation={bodyLocation}
              onSelectLocation={setBodyLocation}
            />
            
            <div className="space-y-3.5 text-xs mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Case Title</label>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-semibold shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Observations & History</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Asymmetric brown macule noticed 3 months ago, itchy, patient has history of dysplastic nevi."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-normal resize-none shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Model Selection Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>3. Deep Learning Architecture</span>
            </h3>
            
            <div className="space-y-2">
              {architectures.map(arch => (
                <div
                  key={arch.id}
                  onClick={() => setArchitecture(arch.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    architecture === arch.id
                      ? "border-sky-500 bg-sky-50/60 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{arch.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{arch.speed}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{arch.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
