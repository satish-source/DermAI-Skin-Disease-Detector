import React, { useState, useEffect, useRef } from "react";
import { Activity, Bell, Shield, FileText, BarChart3, Clock, Sparkles, Smartphone, Laptop, Check } from "lucide-react";

export default function Navbar({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  notifications,
  onMarkAllRead,
  deviceMode,
  setDeviceMode,
  onToggleChatbot,
  isChatbotOpen
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const roles = [
    { id: "clinician", label: "Clinician / Dermatologist" },
    { id: "patient", label: "Patient / Self-Screening" },
    { id: "researcher", label: "Researcher" },
    { id: "data_scientist", label: "ML Engineer" },
    { id: "admin", label: "Administrator" },
  ];

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Clinical Title */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab("screening")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-extrabold tracking-tight text-slate-900">Derm<span className="text-sky-600">AI</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">
                  DL v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden lg:block leading-none">
                Screening & Decision-Support System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("screening")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === "screening" ? "bg-sky-50 text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>New Screening</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === "history" ? "bg-sky-50 text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Case History</span>
            </button>

            <button
              onClick={() => setActiveTab("temporal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === "temporal" ? "bg-sky-50 text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Temporal Evolution</span>
            </button>

            <button
              onClick={() => setActiveTab("benchmarks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === "benchmarks" ? "bg-sky-50 text-sky-700 shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <span>ML Benchmarks</span>
            </button>

            {/* DermAura AI Navigation Button */}
            <button
              type="button"
              onClick={onToggleChatbot}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                isChatbotOpen
                  ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-gradient-to-r from-indigo-50 to-sky-50 text-indigo-700 hover:from-indigo-100 hover:to-sky-100 border border-indigo-200/80"
              }`}
              title="Open DermAura AI Clinical Copilot"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isChatbotOpen ? "text-amber-300 animate-spin" : "text-indigo-600"}`} style={{ animationDuration: "6s" }} />
              <span>DermAura AI</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isChatbotOpen ? "bg-amber-300" : "bg-emerald-500 animate-pulse"}`} />
            </button>
          </nav>

          {/* Right Controls: Device Mode Switcher, Role Selector & Notifications */}
          <div className="flex items-center space-x-2.5">
            
            {/* DermAura AI Mobile Button */}
            <button
              type="button"
              onClick={onToggleChatbot}
              className={`md:hidden p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                isChatbotOpen
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
              title="Open DermAura AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px]">DermAura</span>
            </button>
            
            {/* Laptop vs Mobile Viewport Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-slate-600">
              <button
                type="button"
                onClick={() => setDeviceMode("laptop")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  deviceMode === "laptop"
                    ? "bg-white text-sky-700 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
                title="Widescreen Laptop Display Mode"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Laptop</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceMode("mobile")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  deviceMode === "mobile"
                    ? "bg-white text-sky-700 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
                title="Mobile Smartphone Simulator Mode"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Mobile</span>
              </button>
            </div>

            {/* Role Selector */}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative focus:outline-none"
                title="Alerts & Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Alerts & Notifications</span>
                    <button
                      onClick={onMarkAllRead}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-xs text-slate-400 text-center">No alerts at this time</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 text-xs transition-colors ${n.is_read ? "opacity-60 bg-white" : "bg-sky-50/50"}`}>
                          <div className="font-semibold text-slate-800 flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 py-1.5 bg-slate-50 text-xs">
        <button
          onClick={() => setActiveTab("screening")}
          className={`py-1 px-2 font-medium ${activeTab === "screening" ? "text-sky-600 font-bold" : "text-slate-600"}`}
        >
          Screening
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-1 px-2 font-medium ${activeTab === "history" ? "text-sky-600 font-bold" : "text-slate-600"}`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab("temporal")}
          className={`py-1 px-2 font-medium ${activeTab === "temporal" ? "text-sky-600 font-bold" : "text-slate-600"}`}
        >
          Temporal
        </button>
        <button
          onClick={() => setActiveTab("benchmarks")}
          className={`py-1 px-2 font-medium ${activeTab === "benchmarks" ? "text-sky-600 font-bold" : "text-slate-600"}`}
        >
          Benchmarks
        </button>
      </div>
    </header>
  );
}
