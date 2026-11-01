import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Clock, AlertTriangle, TrendingUp, CheckCircle, Split } from "lucide-react";
import { api, getImageUrl } from "../api";

export default function TemporalComparisonPage({ defaultCaseId }) {
  const [cases, setCases] = useState([]);
  const [case1Id, setCase1Id] = useState(defaultCaseId || "");
  const [case2Id, setCase2Id] = useState("");
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await api.listCases();
      setCases(data);
      if (data.length >= 2) {
        if (!case1Id) setCase1Id(data[1].id);
        setCase2Id(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompare = async () => {
    if (!case1Id || !case2Id) return;
    setLoading(true);
    try {
      const res = await api.compareCases(case1Id, case2Id);
      setComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (case1Id && case2Id) {
      handleCompare();
    }
  }, [case1Id, case2Id]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Temporal Lesion Evolution Comparison</h1>
        <p className="text-sm text-slate-500 mt-1">
          Longitudinal comparison between initial screening and follow-up consultation to track lesion morphology, border drift, and dimensional changes.
        </p>
      </div>

      {/* Case Pickers */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Baseline / Previous Case (Visit 1)</span>
          </label>
          <select
            value={case1Id}
            onChange={(e) => setCase1Id(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select Baseline Case...</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.title} ({c.body_location}) - {new Date(c.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
            <span>Follow-up / Recent Case (Visit 2)</span>
          </label>
          <select
            value={case2Id}
            onChange={(e) => setCase2Id(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select Follow-up Case...</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.title} ({c.body_location}) - {new Date(c.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          
          {/* Dimensional & Clinical Delta Banner */}
          <div className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs ${
            comparison.evolution_analysis.lesion_growth_alert
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}>
            {comparison.evolution_analysis.lesion_growth_alert ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                {comparison.evolution_analysis.lesion_growth_alert ? "Growth Progression Alert Flagged" : "Morphology Appears Dimensionally Stable"}
              </div>
              <p className="mt-0.5">{comparison.evolution_analysis.clinical_guidance}</p>
              <div className="mt-1 font-mono font-semibold">
                Area Delta: {comparison.evolution_analysis.lesion_area_delta_pct > 0 ? "+" : ""}
                {comparison.evolution_analysis.lesion_area_delta_pct}%
              </div>
            </div>
          </div>

          {/* Side-by-Side Visual Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Visit 1 (Baseline) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-500">Visit 1: Initial Presentation</span>
                <span className="font-mono text-xs font-bold text-slate-800">{comparison.case_1.case_number}</span>
              </div>
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-black/5 mb-4">
                <img
                  src={getImageUrl(comparison.case_1.image_url)}
                  alt="baseline"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Classification:</span>
                  <span className="font-bold text-slate-800">{comparison.case_1.prediction || "Pending"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Risk Tier:</span>
                  <span className="font-bold text-slate-800">{comparison.case_1.risk_category || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Lesion Area Coverage:</span>
                  <span className="font-mono font-bold text-slate-800">{comparison.case_1.lesion_area_pct}%</span>
                </div>
              </div>
            </div>

            {/* Visit 2 (Follow-up) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-indigo-600">Visit 2: Follow-Up Consultation</span>
                <span className="font-mono text-xs font-bold text-slate-800">{comparison.case_2.case_number}</span>
              </div>
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-black/5 mb-4">
                <img
                  src={getImageUrl(comparison.case_2.image_url)}
                  alt="follow-up"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Classification:</span>
                  <span className="font-bold text-slate-800">{comparison.case_2.prediction || "Pending"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Risk Tier:</span>
                  <span className="font-bold text-slate-800">{comparison.case_2.risk_category || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Lesion Area Coverage:</span>
                  <span className="font-mono font-bold text-slate-800">{comparison.case_2.lesion_area_pct}%</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

