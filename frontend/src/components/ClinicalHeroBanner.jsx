import React from "react";
import { Sparkles, Shield, ArrowRight, Activity, CheckCircle2, Stethoscope, UserCheck, Zap, Lock } from "lucide-react";
import { getImageUrl } from "../api";

export default function ClinicalHeroBanner({ onStartScreening, onSelectDemoCase, onOpenAuth, currentUser }) {
  const heroImgUrl = getImageUrl("/assets/ai_skin_analysis_hero.jpg");

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white shadow-xl border border-sky-500/20 mb-8 p-6 sm:p-8 lg:p-10">
      
      {/* Background Cyber-Medical Glow Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Clinical Title & Badges */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>AI Multi-Model Fusion • ViT + EfficientNet + ResNet</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>ISO 13485 Research Class I</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            AI SKIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300">ANALYSIS</span>
            <span className="block text-xl sm:text-2xl font-semibold text-slate-200 mt-1">
              Clinical Lesion Triage & Diagnostic Decision Support
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Automated dermatological screening powered by deep vision transformers. Features real-time blur assessment, DullRazor artifact removal, U-Net contour localization, and Grad-CAM++ feature explainability across 7 diagnostic classes.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-white/10">
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-lg font-black text-sky-400">94.2%</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Accuracy</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-lg font-black text-cyan-300">0.984</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AUC-ROC</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-lg font-black text-indigo-300">115 ms</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Inference</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-lg font-black text-emerald-400">7 Classes</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ISIC Triage</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onStartScreening}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/25 flex items-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Start Lesion Screening</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {currentUser ? (
              <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Active: <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle})</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                <span>Doctor / Patient Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: High-Tech Hero Visual (from User's Screenshot) */}
        <div className="lg:col-span-5 relative">
          <div className="relative mx-auto max-w-md rounded-2xl overflow-hidden border-2 border-sky-400/40 shadow-2xl shadow-sky-500/20 bg-slate-900 group">
            
            {/* Visual Image */}
            <img
              src={heroImgUrl}
              alt="AI Skin Analysis"
              className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
            />

            {/* Glowing Scan HUD Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />

            {/* Floating Live Badge Top Left */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-sky-500/40 text-[10px] font-bold text-sky-300 flex items-center space-x-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE AI CLINICAL SCAN</span>
            </div>

            {/* Floating Model Badge Top Right */}
            <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-indigo-500/40 text-[10px] font-mono font-bold text-indigo-300 shadow-md">
              <span>ViT-B/16 + GrabCut</span>
            </div>

            {/* Bottom Callout Bar */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-white/15 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-500/30">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white leading-tight">Melanoma & Lesion Detection</div>
                  <div className="text-[9px] text-slate-400 leading-tight">4-Way Sync: Raw • DullRazor • U-Net • Grad-CAM++</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectDemoCase("CAS-MEL-001")}
                className="px-2.5 py-1 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer"
              >
                Quick Preview
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
