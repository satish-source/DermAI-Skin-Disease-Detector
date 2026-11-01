import React, { useState } from "react";
import { X, Calendar, Clock, Stethoscope, CheckCircle, ShieldCheck, Download } from "lucide-react";
import confetti from "canvas-confetti";

export default function TelehealthModal({ isOpen, onClose, caseNumber, riskCategory, predictedCondition }) {
  const [selectedDoctor, setSelectedDoctor] = useState("dr_smith");
  const [date, setDate] = useState("Tomorrow, 10:30 AM");
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen) return null;

  const doctors = [
    {
      id: "dr_smith",
      name: "Dr. Sarah Smith, MD, FAAD",
      role: "Board-Certified Dermatologist",
      hospital: "Metropolitan Cutaneous Oncology Center",
      rating: "4.9 ★ (180+ reviews)",
      available: "Tomorrow, 10:30 AM"
    },
    {
      id: "dr_patel",
      name: "Dr. Arjun Patel, MD",
      role: "Dermatosurgeon & Teledermatology Lead",
      hospital: "St. Jude Dermatology Institute",
      rating: "5.0 ★ (240+ reviews)",
      available: "Wednesday, 2:00 PM"
    }
  ];

  const handleConfirm = () => {
    setIsBooked(true);
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50/40">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Book Dermatologist Telehealth Consultation</h3>
              <p className="text-[11px] text-slate-500">Case #{caseNumber} * Auto-Attaches AI Screening PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isBooked ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Attached Screening Triage: </span>
                  <span>{predictedCondition}</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  {riskCategory}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Select Certified Dermatologist</label>
                <div className="space-y-2">
                  {doctors.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedDoctor === doc.id
                          ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-200"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{doc.name}</span>
                        <span className="text-[10px] text-amber-600 font-semibold">{doc.rating}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{doc.role} * {doc.hospital}</div>
                      <div className="text-[10px] text-sky-700 font-semibold mt-1 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Earliest Slot: {doc.available}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Appointment Preference</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirm Telehealth Slot & Attach Report</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">Consultation Scheduled!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your appointment with <strong>Dr. Sarah Smith</strong> for <strong>{date}</strong> is confirmed. Case summary and official PDF report have been synced to the provider portal.
              </p>
              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

