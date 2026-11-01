import React, { useState, useEffect } from "react";
import { Search, Download, Filter, Eye, Clock, AlertTriangle, ShieldCheck, FileSpreadsheet, Trash2 } from "lucide-react";
import { api, getImageUrl } from "../api";

export default function CasesHistoryPage({ onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, [filterStatus]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus === "all" ? null : filterStatus;
      const data = await api.listCases(statusParam);
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId, caseNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete case ${caseNumber}?`)) {
      return;
    }
    try {
      await api.deleteCase(caseId);
      setCases(prev => prev.filter(c => c.id !== caseId));
    } catch (err) {
      alert("Failed to delete case: " + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL cases? This action cannot be undone.")) {
      return;
    }
    try {
      await api.clearAllCases();
      setCases([]);
    } catch (err) {
      alert("Failed to clear cases: " + err.message);
    }
  };

  const filteredCases = cases.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.case_number?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.body_location?.toLowerCase().includes(q) ||
      c.patient_code?.toLowerCase().includes(q) ||
      c.latest_prediction?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Case Management & Screening History</h1>
          <p className="text-sm text-slate-500 mt-1">Review longitudinal patient skin lesion cases, triage risk levels, and export datasets.</p>
        </div>

        <div className="flex items-center space-x-2">
          {cases.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-600 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
              title="Delete all cases"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <a
            href={api.getExportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            download
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search case #, patient ID, diagnosis..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer bg-white"
          >
            <option value="all">All Cases</option>
            <option value="analyzed">Analyzed Only</option>
            <option value="pending">Pending Inference</option>
            <option value="quality_rejected">Quality Rejected</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading cases...</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No cases match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Case #</th>
                  <th className="py-3 px-4">Thumbnail</th>
                  <th className="py-3 px-4">Patient / Anatomical Site</th>
                  <th className="py-3 px-4">Screening Diagnosis</th>
                  <th className="py-3 px-4 min-w-[200px]">Triage Risk</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCases.map(c => {
                  const isHigh = c.risk_category === "High Risk";
                  const isMod = c.risk_category === "Moderate Risk";
                  const isLow = c.risk_category === "Low Risk" || c.risk_category === "Healthy / Low Risk";
                  const isReview = c.risk_category === "Requires Clinical Review";

                  const badgeClass = isHigh
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : isMod
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : isLow
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isReview
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-slate-100 text-slate-600 border-slate-200";

                  const dotColor = isHigh
                    ? "bg-rose-500"
                    : isMod
                    ? "bg-amber-500"
                    : isLow
                    ? "bg-emerald-500"
                    : isReview
                    ? "bg-orange-500"
                    : "bg-slate-400";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {c.case_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={getImageUrl(c.original_image_url)}
                            alt="thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{c.patient_code}</div>
                        <div className="text-[11px] text-slate-400">{c.body_location}</div>
                      </td>
                      <td className="py-3 px-4">
                        {c.latest_prediction ? (
                          <div className="font-semibold text-slate-900">{c.latest_prediction}</div>
                        ) : (
                          <span className="text-slate-400 italic">Pending analysis</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border whitespace-nowrap inline-flex items-center space-x-1.5 shadow-2xs ${badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          <span>{c.risk_category || c.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {c.confidence ? `${(c.confidence * 100).toFixed(1)}%` : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => onSelectCase(c.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs inline-flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {c.status === "analyzed" && (
                            <a
                              href={api.getPdfReportUrl(c.id)}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center space-x-1 transition-all shadow-2xs"
                              title="Download PDF Screening Report"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                              <span>PDF</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteCase(c.id, c.case_number)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                            title={`Delete Case ${c.case_number}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

