import React, { useState, useEffect } from "react";
import { Cpu, CheckCircle2, BarChart2, Layers, Zap, Shield, Database } from "lucide-react";
import { api } from "../api";

export default function ModelBenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [confusionData, setConfusionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bData, cData] = await Promise.all([
        api.getBenchmarks(),
        api.getConfusionMatrix()
      ]);
      setBenchmarks(bData);
      setConfusionData(cData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCellColor = (val, maxVal) => {
    if (val === 0) return "bg-slate-50 text-slate-300";
    const ratio = val / maxVal;
    if (ratio > 0.6) return "bg-sky-600 text-white font-bold";
    if (ratio > 0.3) return "bg-sky-400 text-white font-medium";
    if (ratio > 0.1) return "bg-sky-200 text-sky-950 font-medium";
    return "bg-sky-50 text-sky-800";
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Clinical Disclaimer & Research Prototype Notice */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start space-x-3">
        <span className="text-lg">⚖️</span>
        <div>
          <span className="font-bold">Academic Research & Clinical Decision-Support Notice:</span>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            DermAI is an investigational decision-support tool. It presents both published academic reference baselines (HAM10000 / ISIC standards) and local PyTorch checkpoints fine-tuned on dermatological splits. It is not an autonomous diagnostic medical device.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Model Intelligence & Benchmark Suite</h1>
          <p className="text-sm text-slate-500 mt-1">
            Empirical evaluation across CNN (ResNet, EfficientNet, MobileNet) and Transformer (ViT) architectures on standardized multi-class dermatoscopic datasets (HAM10000 / ISIC).
          </p>
        </div>
        {confusionData?.is_live_evaluated && (
          <div className="self-start sm:self-auto flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Active Checkpoint: Validated on Test Split</span>
          </div>
        )}
      </div>

      {/* Model Architectures Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>Deep Learning Architecture Performance Matrix</span>
          </h3>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold border border-indigo-200">
            Published Baselines + Local Checkpoints
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Architecture Type</th>
                <th className="py-3 px-3">Accuracy</th>
                <th className="py-3 px-3">Balanced Acc.</th>
                <th className="py-3 px-3">Macro F1</th>
                <th className="py-3 px-3">Sensitivity</th>
                <th className="py-3 px-3">Specificity</th>
                <th className="py-3 px-3">AUC-ROC</th>
                <th className="py-3 px-3">MCC</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3">Deployment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {benchmarks.map(m => (
                <tr key={m.model_name} className={`hover:bg-slate-50/80 transition-colors ${m.is_active ? "bg-sky-50/30" : ""}`}>
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center space-x-1.5">
                    {m.is_active && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    <span>{m.model_name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{m.architecture}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{(m.accuracy * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{(m.balanced_accuracy * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{m.macro_f1.toFixed(3)}</td>
                  <td className="py-3 px-3 font-mono text-emerald-700 font-semibold">{(m.sensitivity * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{(m.specificity * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 font-mono font-semibold text-sky-700">{m.auc_roc.toFixed(3)}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{m.mcc.toFixed(3)}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{m.inference_time_ms} ms</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.is_active ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-100 text-slate-500"
                    }`}>
                      {m.is_active ? "Active" : "Standby"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7x7 Class Confusion Matrix Heatmap */}
      {confusionData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-sky-600" />
              <span>Multi-Class Confusion Matrix (7 Dermatological Classes)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Horizontal rows: Ground Truth classes. Vertical columns: DermAI model predictions. Strong diagonal indicates high clinical concordance.
            </p>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="border-collapse text-center text-xs font-mono mx-auto">
              <thead>
                <tr>
                  <th className="p-2 text-right font-sans text-slate-400 font-bold text-[10px]">Truth \ Pred</th>
                  {confusionData.classes.map(c => (
                    <th key={c} className="p-2 font-bold text-slate-700 w-14 text-center">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confusionData.matrix.map((row, rIdx) => {
                  const maxVal = Math.max(...row);
                  const rowClass = confusionData.classes[rIdx];
                  return (
                    <tr key={rowClass}>
                      <td className="p-2 text-right font-sans font-bold text-slate-700 pr-3">{rowClass}</td>
                      {row.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-2 w-14 h-11 border border-white text-xs ${getCellColor(val, maxVal)}`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Per-Class Clinical Metrics */}
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Class-Specific Sensitivity & Specificity Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {confusionData.per_class_metrics.map(pcm => (
              <div key={pcm.class_code} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between mb-1">
                  <span>{pcm.class_code}</span>
                  <span className="text-[10px] font-normal text-slate-500">{pcm.total_samples} samples</span>
                </div>
                <div className="text-[11px] text-slate-600 truncate mb-2">{pcm.class_name}</div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sensitivity:</span>
                    <span className="font-bold text-emerald-700">{(pcm.recall_sensitivity * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Specificity:</span>
                    <span className="font-bold text-slate-700">{(pcm.specificity * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">F1-Score:</span>
                    <span className="font-bold text-sky-700">{pcm.f1_score.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

