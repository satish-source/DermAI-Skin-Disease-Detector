import React, { useState } from "react";
import { User, Check } from "lucide-react";

export default function InteractiveBodyMap({ selectedLocation, onSelectLocation }) {
  const [viewSide, setViewSide] = useState("front"); // "front" or "back"

  const frontZones = [
    { id: "Face / Nasal Bridge", label: "Face / Nasal", top: "10%", left: "50%" },
    { id: "Neck", label: "Neck", top: "18%", left: "50%" },
    { id: "Chest", label: "Chest", top: "27%", left: "50%" },
    { id: "Abdomen / Torso", label: "Abdomen", top: "38%", left: "50%" },
    { id: "Forearm", label: "Forearm (L/R)", top: "42%", left: "22%" },
    { id: "Hand / Palm", label: "Hand / Palm", top: "52%", left: "14%" },
    { id: "Thigh", label: "Thigh", top: "58%", left: "42%" },
    { id: "Lower Leg", label: "Lower Leg / Shin", top: "75%", left: "40%" },
    { id: "Foot / Sole", label: "Foot", top: "92%", left: "40%" },
  ];

  const backZones = [
    { id: "Scalp / Crown", label: "Scalp / Crown", top: "8%", left: "50%" },
    { id: "Neck", label: "Posterior Neck", top: "17%", left: "50%" },
    { id: "Upper Back", label: "Upper Back / Shoulders", top: "28%", left: "50%" },
    { id: "Lower Back", label: "Lower Back", top: "40%", left: "50%" },
    { id: "Forearm", label: "Posterior Arm", top: "42%", left: "78%" },
    { id: "Gluteal Region", label: "Gluteal Region", top: "50%", left: "50%" },
    { id: "Posterior Thigh", label: "Hamstring", top: "62%", left: "42%" },
    { id: "Calf", label: "Calf", top: "78%", left: "40%" },
    { id: "Heel / Sole", label: "Heel / Sole", top: "92%", left: "40%" },
  ];

  const activeZones = viewSide === "front" ? frontZones : backZones;

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
          <User className="w-3.5 h-3.5 text-sky-600" />
          <span>Interactive Anatomical Body Map</span>
        </span>
        <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setViewSide("front")}
            className={`px-2 py-0.5 rounded-md transition-all ${
              viewSide === "front" ? "bg-white text-sky-700 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Anterior (Front)
          </button>
          <button
            type="button"
            onClick={() => setViewSide("back")}
            className={`px-2 py-0.5 rounded-md transition-all ${
              viewSide === "back" ? "bg-white text-sky-700 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Posterior (Back)
          </button>
        </div>
      </div>

      {/* Silhouette & Hotspots */}
      <div className="relative w-full h-56 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center overflow-hidden shadow-inner">
        {/* SVG Medical Silhouette Graphic */}
        <svg viewBox="0 0 200 360" className="h-full w-auto opacity-20 text-slate-800" fill="currentColor">
          {/* Head */}
          <circle cx="100" cy="35" r="22" />
          {/* Neck */}
          <rect x="94" y="55" width="12" height="15" rx="3" />
          {/* Torso */}
          <path d="M 68 70 L 132 70 L 124 180 L 76 180 Z" />
          {/* Left Arm */}
          <path d="M 68 70 L 40 160 L 32 210 L 42 212 L 52 165 L 74 85 Z" />
          {/* Right Arm */}
          <path d="M 132 70 L 160 160 L 168 210 L 158 212 L 148 165 L 126 85 Z" />
          {/* Legs */}
          <path d="M 77 180 L 73 280 L 70 340 L 86 340 L 93 280 L 98 190 Z" />
          <path d="M 123 180 L 127 280 L 130 340 L 114 340 L 107 280 L 102 190 Z" />
        </svg>

        {/* Hotspot Pinpoints */}
        {activeZones.map(zone => {
          const isSelected = selectedLocation === zone.id;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelectLocation(zone.id)}
              style={{ top: zone.top, left: zone.left, transform: "translate(-50%, -50%)" }}
              className={`absolute group px-2 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm flex items-center space-x-1 ${
                isSelected
                  ? "bg-sky-600 text-white ring-2 ring-sky-300 scale-110 z-20"
                  : "bg-white/95 text-slate-700 hover:bg-sky-50 border border-slate-200/90 hover:scale-105 z-10"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-sky-500"}`} />
              <span>{zone.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>Selected Location:</span>
        <span className="font-bold text-sky-800 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          {selectedLocation || "Not Selected"}
        </span>
      </div>
    </div>
  );
}

