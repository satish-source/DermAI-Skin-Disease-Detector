import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, RefreshCw, X, Check, Layers, Image as ImageIcon, Plus } from "lucide-react";

export default function CameraCapture({ onImageSelected, onBatchFilesSelected }) {
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  
  // Single mode state
  const [singlePreviewUrl, setSinglePreviewUrl] = useState(null);
  
  // Multi/Batch files state
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchPreviews, setBatchPreviews] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const batchInputRef = useRef(null);

  useEffect(() => {
    if (useCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [useCamera, facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn("Camera access failed or unavailable, fallback to file upload:", err);
      setUseCamera(false);
      alert("Unable to access mobile/web camera. Please use file upload instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `mobile_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(file);
        setSinglePreviewUrl(url);
        setBatchFiles([]);
        setBatchPreviews([]);
        stopCamera();
        setUseCamera(false);
        if (onImageSelected) onImageSelected(file, url, "mobile_camera");
      }
    }, "image/jpeg", 0.95);
  };

  const handleSingleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSinglePreviewUrl(url);
      setBatchFiles([]);
      setBatchPreviews([]);
      if (onImageSelected) onImageSelected(file, url, "upload");
    }
  };

  const handleBatchFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const urls = files.map(f => URL.createObjectURL(f));
      setBatchFiles(files);
      setBatchPreviews(urls);
      setSinglePreviewUrl(null);
      if (onBatchFilesSelected) onBatchFilesSelected(files, urls);
    }
  };

  const removeBatchFile = (index) => {
    const updatedFiles = batchFiles.filter((_, i) => i !== index);
    const updatedUrls = batchPreviews.filter((_, i) => i !== index);
    setBatchFiles(updatedFiles);
    setBatchPreviews(updatedUrls);
    if (onBatchFilesSelected) onBatchFilesSelected(updatedFiles, updatedUrls);
  };

  const clearSelection = () => {
    setSinglePreviewUrl(null);
    setBatchFiles([]);
    setBatchPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (batchInputRef.current) batchInputRef.current.value = "";
    if (onImageSelected) onImageSelected(null, null, null);
    if (onBatchFilesSelected) onBatchFilesSelected([], []);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            1. Mobile Image Acquisition (Single or Multiple Photos)
          </h3>
          <p className="text-xs text-slate-500">
            Standard: <strong>1 focused photo</strong> per lesion * Multi-photo: upload files of multiple lesions at once
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => { setUseCamera(!useCamera); setSinglePreviewUrl(null); setBatchFiles([]); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              useCamera ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{useCamera ? "Close Camera" : "Open Camera"}</span>
          </button>
        </div>
      </div>

      {/* Live Camera Viewfinder */}
      {useCamera && (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-80 flex items-center justify-center mb-4 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Target Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-dashed border-sky-400/90 rounded-2xl flex items-center justify-center">
              <span className="text-[11px] font-mono font-bold text-sky-200 bg-black/50 px-2 py-0.5 rounded">
                Center Lesion (1 Photo)
              </span>
            </div>
          </div>

          {/* Camera Controls Bar */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center space-x-4">
            <button
              type="button"
              onClick={() => setFacingMode(facingMode === "environment" ? "user" : "environment")}
              className="p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-black"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Lesion Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Single Photo Preview */}
      {singlePreviewUrl && !useCamera && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 mb-4">
          <div className="flex items-center justify-between mb-2 px-2 pt-1">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>1 Lesion Photo Loaded & Ready</span>
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
          <div className="relative aspect-video max-h-72 w-full rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
            <img src={singlePreviewUrl} alt="Selected skin lesion" className="max-h-72 w-auto object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Multi-Photo / Batch Gallery Grid Preview */}
      {batchFiles.length > 0 && !useCamera && (
        <div className="relative rounded-2xl overflow-hidden border border-sky-200 bg-sky-50/40 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-sky-950">
                Batch Mode: {batchFiles.length} Skin Photos Selected
              </span>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-1">
            {batchPreviews.map((url, i) => (
              <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                <img src={url} alt={`photo-${i}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeBatchFile(i)}
                  className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-white hover:bg-rose-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove this photo"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-mono px-1 py-0.5 truncate text-center">
                  #{i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Upload Zone (when no camera and no preview) */}
      {!useCamera && !singlePreviewUrl && batchFiles.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Option A: Single Photo Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all group shadow-2xs"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleSingleFileChange}
            />
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 mx-auto flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              Upload 1 Skin Photo (Standard)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Select 1 focused photo of a suspicious lesion
            </p>
          </div>

          {/* Option B: Batch Multi-File Upload */}
          <div
            onClick={() => batchInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all group shadow-2xs"
          >
            <input
              ref={batchInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleBatchFileChange}
            />
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              Upload Files of Multiple Photos (Batch)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Select 5, 10, or 20 photo files to analyze together
            </p>
          </div>

        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
