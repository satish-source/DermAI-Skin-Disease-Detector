import React, { useState } from "react";
import { Calculator, AlertTriangle, CheckCircle2, ShieldAlert, Info } from "lucide-react";

export default function AbcdeCalculator() {
  const [asymmetry, setAsymmetry] = useState(1);
  const [border, setBorder] = useState(3);
  const [colorsCount, setColorsCount] = useState(3);
  const [diameterLarge, setDiameterLarge] = useState(true);

  // Total Dermatoscopy Score (TDS) according to Stolz et al.
  // TDS = (1.3 * A) + (0.1 * B) + (0.5 * C) + (0.5 * D)
  const dScore = diameterLarge ? 2 : 1;
  const tds = (1.3 * asymmetry) + (0.1 * border) + (0.5 * colorsCount) + (0.5 * dScore);

  let status = "Benign Lesion";
  let statusColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
  let recommendation = "Low dermatoscopic risk. Continue monthly self-skin exams.";

  if (tds > 5.45) {
    status = "Highly Suspicious / Malignant";
    statusColor = "bg-rose-100 text-rose-800 border-rose-300";
    recommendation = "High dermatoscopic risk. Urgent in-person biopsy and histological assessment indicated.";
  } else if (tds >= 4.75) {
    status = "Borderline / Suspicious";
    statusColor = "bg-amber-100 text-amber-800 border-amber-300";
    recommendation = "Moderate risk. Sequential digital dermatoscopic imaging (SDDI) in 3 months recommended.";
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <Calculator className="w-4 h-4 text-sky-600" />
            <span>Clinical ABCDE Dermatoscopy Calculator</span>
          </h3>
          <p className="text-[11px] text-slate-500">Stolz 4-criteria clinical scoring formula for dermatologists</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${statusColor}`}>
          TDS: {tds.toFixed(2)}
        </div>
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Asymmetry */}
        <div>
          <div className="flex justify-between font-semibold text-slate-700 mb-1">
            <span>[A] Asymmetry in 0, 1, or 2 Axes:</span>
            <span className="font-mono text-sky-700 font-bold">{asymmetry} {asymmetry === 0 ? "(Symmetric)" : asymmetry === 1 ? "(1 Axis)" : "(2 Axes)"}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={asymmetry}
            onChange={(e) => setAsymmetry(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </div>

        {/* Border */}
        <div>
          <div className="flex justify-between font-semibold text-slate-700 mb-1">
            <span>[B] Border Irregularity (Abrupt Cutoff Segments 0-8):</span>
            <span className="font-mono text-sky-700 font-bold">{border} / 8</span>
          </div>
          <input
            type="range"
            min="0"
            max="8"
            step="1"
            value={border}
            onChange={(e) => setBorder(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </div>

        {/* Color Variegation */}
        <div>
          <div className="flex justify-between font-semibold text-slate-700 mb-1">
            <span>[C] Distinct Colors Present (1-6):</span>
            <span className="font-mono text-sky-700 font-bold">{colorsCount} colors (e.g. Tan, Dark Brown, Red)</span>
          </div>
          <input
            type="range"
            min="1"
            max="6"
            step="1"
            value={colorsCount}
            onChange={(e) => setColorsCount(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </div>

        {/* Diameter */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold text-slate-700">[D] Diameter &gt; 6mm (Pencil Eraser Rule):</span>
          <button
            type="button"
            onClick={() => setDiameterLarge(!diameterLarge)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              diameterLarge ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {diameterLarge ? "Yes (> 6mm)" : "No (< 6mm)"}
          </button>
        </div>

        {/* Score Summary Banner */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-3 text-slate-700">
          <div className="flex items-center justify-between font-bold text-xs mb-1">
            <span>Classification: {status}</span>
            <span className="font-mono text-[11px] text-slate-500">TDS: {tds.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}

