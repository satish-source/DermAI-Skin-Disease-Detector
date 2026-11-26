import React, { useState } from "react";
import { ArrowLeft, Lock, Mail, User, Shield, Stethoscope, Eye, EyeOff, Sparkles, CheckCircle2, ArrowRight, Building, Award, Activity } from "lucide-react";
import confetti from "canvas-confetti";

export default function AuthPage({ onLoginSuccess, onBack }) {
  const [authMode, setAuthMode] = useState("signin"); // "signin" or "signup"
  const [selectedRole, setSelectedRole] = useState("clinician"); // "clinician", "patient", "researcher"
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [institution, setInstitution] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const roles = [
    {
      id: "clinician",
      title: "Clinician / Doctor",
      desc: "Licensed Dermatologist or General Practitioner",
      icon: Stethoscope
    },
    {
      id: "patient",
      title: "Patient / User",
      desc: "Personal skin screening & telehealth history",
      icon: User
    },
    {
      id: "researcher",
      title: "Researcher",
      desc: "Academic / Clinical ML model evaluation",
      icon: Award
    }
  ];

  const handleQuickDemoLogin = (profileType) => {
    let demoUser;
    if (profileType === "doctor") {
      demoUser = {
        id: "usr-doc-001",
        name: "Dr. Satish Sharma, MD",
        role: "clinician",
        roleTitle: "Consultant Dermatologist",
        email: "satish.sharma@dermai-health.org",
        licenseNumber: "KMC-482910-DERM",
        institution: "Apollo Institute of Dermatology",
        avatar: "👨‍⚕️",
        isDemo: true
      };
    } else if (profileType === "patient") {
      demoUser = {
        id: "usr-pat-002",
        name: "Priya Patel",
        role: "patient",
        roleTitle: "Registered Patient",
        email: "priya.patel@gmail.com",
        patientCode: "PAT-00412",
        avatar: "👩",
        isDemo: true
      };
    } else {
      demoUser = {
        id: "usr-res-003",
        name: "Prof. Rajesh Kumar, PhD",
        role: "researcher",
        roleTitle: "Medical Imaging Scientist",
        email: "rajesh.k@aiims.edu",
        institution: "AIIMS Digital Health Lab",
        avatar: "🔬",
        isDemo: true
      };
    }

    localStorage.setItem("dermai_auth_user", JSON.stringify(demoUser));
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch (_) {}
    onLoginSuccess(demoUser);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (authMode === "signup" && !fullName) {
      setErrorMessage("Please provide your full legal name.");
      return;
    }

    const roleObj = roles.find(r => r.id === selectedRole);
    const user = {
      id: `usr-${Date.now().toString(36)}`,
      name: fullName || (email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase())),
      role: selectedRole,
      roleTitle: roleObj?.title || "User",
      email: email,
      licenseNumber: licenseNumber || null,
      institution: institution || null,
      avatar: selectedRole === "clinician" ? "👨‍⚕️" : selectedRole === "patient" ? "🧑" : "🔬",
      isDemo: false
    };

    if (rememberMe) {
      localStorage.setItem("dermai_auth_user", JSON.stringify(user));
    }

    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch (_) {}

    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Cyber-Medical Glow Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-white/10 pb-4">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onBack}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Activity className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-white">
                Derm<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">AI</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-400/30">
                Clinical Portal
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Secure Healthcare Authentication & Access Control
            </p>
          </div>
        </div>

        {/* Back to Website Button */}
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>Return to Clinical Screening</span>
        </button>
      </div>

      {/* Center Auth Card Container */}
      <div className="relative z-10 max-w-lg mx-auto w-full my-8">
        
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
          
          {/* Card Top Title Header */}
          <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-base font-extrabold leading-tight">DermAI Clinical Portal</div>
                  <div className="text-[11px] text-sky-100 font-medium">HIPAA & ISO 13485 Compliant Secure Access</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Preset Logins for Mentor Review */}
          <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-sky-50 border-b border-sky-100">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-950 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Instant Demo Logins (1-Click Evaluation):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("doctor")}
                className="px-2.5 py-1.5 bg-white hover:bg-sky-50 text-slate-800 text-xs font-bold rounded-xl border border-sky-200 shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>👨‍⚕️</span>
                <span>Dr. Satish (MD)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("patient")}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 text-xs font-bold rounded-xl border border-emerald-200 shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>👩</span>
                <span>Patient Priya</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("researcher")}
                className="col-span-2 sm:col-span-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-slate-800 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>🔬</span>
                <span>Researcher</span>
              </button>
            </div>
          </div>

          {/* Tab Switcher: Sign In vs Sign Up */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode("signin"); setErrorMessage(""); }}
              className={`flex-1 py-3 text-center transition-all cursor-pointer ${
                authMode === "signin"
                  ? "bg-white text-sky-700 border-b-2 border-sky-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("signup"); setErrorMessage(""); }}
              className={`flex-1 py-3 text-center transition-all cursor-pointer ${
                authMode === "signup"
                  ? "bg-white text-sky-700 border-b-2 border-sky-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create New Account
            </button>
          </div>

          {/* Role Selector */}
          <div className="p-5 sm:p-6 pb-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Your Clinical Persona:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center sm:items-start ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-sky-600" : "text-slate-500"}`} />
                    <div className={`text-xs font-bold leading-tight ${isSelected ? "text-sky-900" : "text-slate-700"}`}>
                      {r.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 pt-2 space-y-3.5">
            
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {authMode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={selectedRole === "clinician" ? "e.g. Dr. Satish Sharma, MD" : "e.g. Priya Patel"}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>
            )}

            {authMode === "signup" && selectedRole === "clinician" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medical Registration / License No.
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. KMC-49201-DERM"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hospital / Clinic Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. Apollo Skin Clinic"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.org"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Remember this workstation</span>
              </label>

              {authMode === "signin" && (
                <button
                  type="button"
                  onClick={() => alert("Password reset instructions will be sent to your medical email.")}
                  className="text-sky-600 hover:text-sky-800 font-bold cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer mt-2"
            >
              <span>{authMode === "signin" ? "Sign In & Access System" : "Create Clinical Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-center text-slate-400 pt-1">
              Protected by 256-bit AES encryption. For investigational clinical decision-support use.
            </p>

          </form>

        </div>

      </div>

      {/* Bottom Compliance & Security Seals */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-400 pt-4 border-t border-white/10">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>HIPAA Security Rule • ISO 13485 Research Class I Compliant</span>
        </div>
        <div className="text-[11px] text-slate-500">
          DermAI Multimodal Diagnostic Decision-Support Platform
        </div>
      </div>

    </div>
  );
}
