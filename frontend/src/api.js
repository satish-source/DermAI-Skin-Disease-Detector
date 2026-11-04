const API_BASE = "/api/v1";
const STATIC_BASE = "";

export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return path;
};

export const api = {
  // Cases & Upload
  createCaseWithUpload: async (formData) => {
    const res = await fetch(`${API_BASE}/cases/create-with-upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  batchUploadCases: async (formData) => {
    const res = await fetch(`${API_BASE}/cases/batch-upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  listCases: async (status) => {
    const url = status ? `${API_BASE}/cases?status=${status}` : `${API_BASE}/cases`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch cases");
    return res.json();
  },

  getCaseDetails: async (caseId) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    if (!res.ok) throw new Error("Failed to fetch case details");
    return res.json();
  },

  compareCases: async (caseId1, caseId2) => {
    const res = await fetch(`${API_BASE}/cases/compare/${caseId1}/${caseId2}`);
    if (!res.ok) throw new Error("Failed to compare cases");
    return res.json();
  },

  deleteCase: async (caseId) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete case");
    return res.json();
  },

  clearAllCases: async () => {
    const res = await fetch(`${API_BASE}/cases/clear/all`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to clear cases");
    return res.json();
  },

  // Analysis
  checkQuality: async (caseId) => {
    const res = await fetch(`${API_BASE}/analysis/quality-check/${caseId}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Quality check failed");
    return res.json();
  },

  runAnalysis: async (caseId, architecture = "ensemble", force = false) => {
    const res = await fetch(
      `${API_BASE}/analysis/run/${caseId}?architecture=${architecture}&force_run_poor_quality=${force}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Reports
  getPdfReportUrl: (caseId) => `${API_BASE}/reports/download-pdf/${caseId}`,
  getExportJsonUrl: (caseId) => `${API_BASE}/reports/export-json/${caseId}`,
  getExportCsvUrl: () => `${API_BASE}/reports/export-csv`,

  // Models & Benchmarks
  getBenchmarks: async () => {
    const res = await fetch(`${API_BASE}/models/benchmarks`);
    if (!res.ok) throw new Error("Failed to fetch benchmarks");
    return res.json();
  },

  getConfusionMatrix: async () => {
    const res = await fetch(`${API_BASE}/models/confusion-matrix`);
    if (!res.ok) throw new Error("Failed to fetch confusion matrix");
    return res.json();
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/notifications`);
    if (!res.ok) return [];
    return res.json();
  },

  markNotificationRead: async (notifId) => {
    await fetch(`${API_BASE}/notifications/mark-read/${notifId}`, { method: "POST" });
  },

  markAllNotificationsRead: async () => {
    await fetch(`${API_BASE}/notifications/mark-all-read`, { method: "POST" });
  },

  // Chatbot Assistant (Powered by Google Gemini AI & Clinical Knowledge Base)
  sendChatMessage: async (message, language = "en", caseContext = null, apiKey = null) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        language,
        case_context: caseContext,
        api_key: apiKey
      })
    });
    if (!res.ok) throw new Error("Failed to communicate with DermAI Assistant");
    return res.json();
  }
};

