import React, { useState } from "react";
import { Eye, Layers, Sparkles, Crosshair, ZoomIn, Sliders, Maximize2 } from "lucide-react";
import { getImageUrl } from "../api";
import DermatoscopeLens from "./DermatoscopeLens";

export default function MedicalViewer({ images, predictedClass, confidence }) {
  const [activeView, setActiveView] = useState("grid"); // "grid", "original", "preprocessed", "mask", "heatmap", "blend"
  const [blendOpacity, setBlendOpacity] = useState(50); // for crossfade slider

  const panels = [
    {
      id: "original",
      title: "1. Raw Mobile Capture",
      desc: "Original unprocessed photograph",
      url: getImageUrl(images?.original_url),
      badge: "Clinical Input",
      badgeColor: "bg-slate-100 text-slate-700",
      icon: Eye
    },
    {
      id: "preprocessed",
      title: "2. DullRazor Preprocessed",
      desc: "Hair inpainting + CLAHE + Grey World",
      url: getImageUrl(images?.preprocessed_url),
      badge: "Artifact Cleansed",
      badgeColor: "bg-sky-100 text-sky-700",
      icon: Sparkles
    },
    {
      id: "mask",
      title: "3. Lesion Boundary & Mask",
      desc: "U-Net boundary segmentation contour",
      url: getImageUrl(images?.segmentation_overlay_url || images?.mask_url),
      badge: "ROI Localization",
      badgeColor: "bg-emerald-100 text-emerald-700",
      icon: Crosshair
    },
    {
      id: "heatmap",
      title: "4. Grad-CAM++ Attention Map",
      desc: "Deep visual features influencing diagnosis",
      url: getImageUrl(images?.gradcam_overlay_url || images?.heatmap_url),
      badge: "Explainable AI (XAI)",
      badgeColor: "bg-amber-100 text-amber-800",
      icon: Layers
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <span>Multimodal Medical Image Analysis Screen</span>
            <span className="text-[10px] font-mono uppercase bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200 font-bold">
              4-Panel Clinical Sync
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cross-examination of raw capture against DullRazor artifact removal, U-Net contour, and Grad-CAM++ activation.
          </p>
        </div>

        {/* View Controls & Interactive Blending Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveView("grid")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === "grid" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              4-Way Grid
            </button>
            <button
              onClick={() => setActiveView("blend")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                activeView === "blend" ? "bg-white text-sky-700 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3 h-3 text-sky-600" />
              <span>Interactive Blend</span>
            </button>
            <button
              onClick={() => setActiveView("loupe")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                activeView === "loupe" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              <Crosshair className="w-3 h-3 text-indigo-600" />
              <span>Dermatoscope Loupe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: 4-Way Grid Display */}
      {activeView === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {panels.map((p) => {
            const IconComponent = p.icon;
            return (
              <div key={p.id} className="group relative rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden flex flex-col hover:border-sky-300 transition-all shadow-2xs">
                <div className="p-2.5 border-b border-slate-100 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <IconComponent className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800">{p.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>

                <div className="relative aspect-square w-full bg-slate-900/5 flex items-center justify-center overflow-hidden">
                  {p.url ? (
                    <img
                      src={p.url}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs">Awaiting processing...</div>
                  )}

                  <button
                    onClick={() => setActiveView(p.id)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 shadow-md"
                    title="Enlarge View"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2 text-[11px] text-slate-500 bg-white border-t border-slate-100 font-medium">
                  {p.desc}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: Interactive Dynamic Blending Crossfade Slider */}
      {activeView === "blend" && (
        <div className="p-6 bg-slate-900 rounded-2xl flex flex-col items-center">
          <div className="w-full max-w-lg mb-4 flex items-center justify-between text-xs text-white">
            <span className="font-bold flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Real-Time Layer Crossfade: Original ↔ Grad-CAM++ Attention</span>
            </span>
            <span className="font-mono text-sky-400 font-bold">{blendOpacity}% Heatmap</span>
          </div>

          <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-black mb-4">
            {/* Base Image (Preprocessed) */}
            <img
              src={getImageUrl(images?.preprocessed_url || images?.original_url)}
              alt="Base Skin"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlaid Heatmap with Dynamic Opacity */}
            <img
              src={getImageUrl(images?.gradcam_overlay_url || images?.heatmap_url)}
              alt="Heatmap Layer"
              style={{ opacity: blendOpacity / 100 }}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-75"
            />
          </div>

          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>0% (Raw Skin Photo)</span>
              <span>50% (Balanced Blend)</span>
              <span>100% (Full Grad-CAM++ XAI)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={blendOpacity}
              onChange={(e) => setBlendOpacity(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Mode 3: Digital Dermatoscope Loupe Lens */}
      {activeView === "loupe" && (
        <div className="p-4 bg-slate-900 rounded-2xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-white mb-3">
            <span className="font-bold flex items-center space-x-1.5">
              <Crosshair className="w-4 h-4 text-sky-400" />
              <span>Precision Digital Dermatoscope Loupe (2.5x Optical Zoom)</span>
            </span>
            <span className="text-slate-400 text-[11px]">Hover over lesion to inspect pigment network</span>
          </div>
          <div className="max-w-lg w-full">
            <DermatoscopeLens
              imageUrl={getImageUrl(images?.preprocessed_url || images?.original_url)}
              alt="Dermatoscope Inspection"
            />
          </div>
        </div>
      )}

      {/* Mode 4: Enlarge Single Layer */}
      {["original", "preprocessed", "mask", "heatmap"].includes(activeView) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 flex flex-col items-center">
          {(() => {
            const current = panels.find(p => p.id === activeView);
            return (
              <div className="w-full max-w-lg">
                <div className="w-full flex items-center justify-between text-white text-xs mb-3">
                  <span className="font-bold">{current.title}</span>
                  <button
                    onClick={() => setActiveView("grid")}
                    className="text-sky-400 hover:text-sky-300 font-semibold underline text-xs"
                  >
                    Back to 4-Way Grid
                  </button>
                </div>
                <img
                  src={current.url}
                  alt={current.title}
                  className="w-full aspect-square object-cover rounded-xl shadow-2xl"
                />
                <p className="text-slate-400 text-xs mt-3 text-center">{current.desc}</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
