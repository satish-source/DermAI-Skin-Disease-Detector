import React, { useState, useEffect, useRef } from "react";
import { Activity, Bell, Shield, FileText, BarChart3, Clock, Sparkles, User, LogOut, ChevronDown, Lock, Stethoscope, Award, Check } from "lucide-react";

export default function Navbar({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  notifications,
  onMarkAllRead,
  onToggleChatbot,
  isChatbotOpen,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const roleMenuRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const roles = [
    { id: "clinician", label: "Clinician / Doctor", icon: Stethoscope, badge: "MD Triage" },
    { id: "patient", label: "Patient / Self-Screening", icon: User, badge: "Personal" },
    { id: "researcher", label: "Researcher / ML Scientist", icon: Award, badge: "Model Eval" },
  ];

  const activeRoleObj = roles.find(r => r.id === currentRole) || roles[0];
  const ActiveRoleIcon = activeRoleObj.icon;

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer shrink-0 group"
            onClick={() => setActiveTab("screening")}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform duration-300">
              <Activity className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Derm<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">AI</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200/80">
                  DL v1.0
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-slate-500 font-semibold tracking-tight hidden sm:block">
                  Clinical Skin Disease Decision Support
                </p>
              </div>
            </div>
          </div>

          {/* Center Navigation Bar (Floating Segmented Control) */}
          <nav className="hidden lg:flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70 shadow-2xs">
            <button
              onClick={() => setActiveTab("screening")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "screening"
                  ? "bg-white text-sky-700 shadow-xs border border-sky-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeTab === "screening" ? "text-sky-600" : "text-slate-400"}`} />
              <span>Screening</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "history"
                  ? "bg-white text-sky-700 shadow-xs border border-sky-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === "history" ? "text-sky-600" : "text-slate-400"}`} />
              <span>Case History</span>
            </button>

            <button
              onClick={() => setActiveTab("temporal")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "temporal"
                  ? "bg-white text-sky-700 shadow-xs border border-sky-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === "temporal" ? "text-sky-600" : "text-slate-400"}`} />
              <span>Temporal Evolution</span>
            </button>

            <button
              onClick={() => setActiveTab("benchmarks")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "benchmarks"
                  ? "bg-white text-sky-700 shadow-xs border border-sky-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeTab === "benchmarks" ? "text-sky-600" : "text-slate-400"}`} />
              <span>Model Accuracy</span>
            </button>

            {/* DermAura AI Highlight Pill */}
            <button
              type="button"
              onClick={onToggleChatbot}
              className={`ml-1 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                isChatbotOpen
                  ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-indigo-500/20"
                  : "bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 text-indigo-700 hover:from-indigo-100 hover:to-sky-100 border border-indigo-200/80"
              }`}
              title="Open DermAura AI Clinical Copilot"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isChatbotOpen ? "text-amber-300 animate-spin" : "text-indigo-600"}`} style={{ animationDuration: "6s" }} />
              <span>DermAura AI</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isChatbotOpen ? "bg-amber-300" : "bg-emerald-500 animate-pulse"}`} />
            </button>
          </nav>

          {/* Right Action Controls: Persona Selector, Alerts & User Authentication */}
          <div className="flex items-center space-x-2.5">
            
            {/* Mobile DermAura AI Button */}
            <button
              type="button"
              onClick={onToggleChatbot}
              className={`lg:hidden px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs ${
                isChatbotOpen
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
              title="Open DermAura AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px]">DermAura</span>
            </button>

            {/* Styled Clinical Persona Selector */}
            <div className="relative hidden sm:block" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                title="Switch Clinical Persona"
              >
                <ActiveRoleIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>{activeRoleObj.label.split(" / ")[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100">
                    Select Active Persona
                  </div>
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = currentRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setCurrentRole(r.id);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? "bg-sky-50 text-sky-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-sky-600" : "text-slate-400"}`} />
                          <span>{r.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Alerts & Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all relative cursor-pointer"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">Clinical Alerts</span>
                    <button
                      onClick={onMarkAllRead}
                      className="text-[11px] text-sky-600 hover:text-sky-800 font-bold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-5 text-xs text-slate-400 text-center">No active alerts at this time.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 text-xs transition-colors ${n.is_read ? "opacity-60 bg-white" : "bg-sky-50/40"}`}>
                          <div className="font-bold text-slate-800 flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile or Sign In CTA */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 pr-3 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/40 hover:from-sky-100 hover:to-indigo-100/50 border border-sky-200/80 transition-all cursor-pointer shadow-xs"
                >
                  <span className="w-8 h-8 rounded-xl bg-white border border-sky-200 shadow-2xs flex items-center justify-center text-base">
                    {currentUser.avatar || "👨‍⚕️"}
                  </span>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-slate-900 leading-tight truncate max-w-[130px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-sky-700 font-bold leading-tight">
                      {currentUser.roleTitle || "Medical Staff"}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="font-extrabold text-xs text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email}</div>
                      <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-[10px] font-bold text-sky-700">
                        {currentUser.roleTitle}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { setActiveTab("history"); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Clinical Cases</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("benchmarks"); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                        <span>AI Accuracy & Benchmarks</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={() => { onLogout(); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-bold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center space-x-1.5 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Lock className="w-3.5 h-3.5 text-sky-100" />
                <span>Sign In / Register</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
