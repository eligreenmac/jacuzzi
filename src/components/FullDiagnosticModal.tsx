"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  X,
  RefreshCw,
  Sparkles,
  Droplets,
  Wrench,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  ChevronLeft,
  Flame,
  Info,
} from "lucide-react";
import { FullJacuzziDiagnosticResponse } from "@/lib/gemini";

interface FullDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullDiagnosticModal({ isOpen, onClose }: FullDiagnosticModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FullJacuzziDiagnosticResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/full-diagnostic");
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "שגיאה בטעינת אבחון המערכת");
      }
      const json = await res.json();
      if (json.diagnostic) {
        setData(json.diagnostic);
      } else {
        throw new Error("לא התקבלו נתוני אבחון");
      }
    } catch (err: any) {
      console.error("Diagnostic error:", err);
      setError(err.message || "שגיאה בטעינת האבחון");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostic();
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "EXCELLENT":
        return {
          bg: "bg-emerald-950/80 text-emerald-300 border-emerald-700/80",
          border: "border-emerald-500/50",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          label: "מעולה ומאוזן ✓",
          icon: CheckCircle2,
        };
      case "GOOD":
        return {
          bg: "bg-sky-950/80 text-sky-300 border-sky-700/80",
          border: "border-sky-500/50",
          badge: "bg-sky-500/20 text-sky-300 border-sky-500/40",
          label: "מצב טוב ויציב ✓",
          icon: CheckCircle2,
        };
      case "ATTENTION":
        return {
          bg: "bg-amber-950/80 text-amber-300 border-amber-700/80",
          border: "border-amber-500/50",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          label: "דורש תשומת לב ⚠️",
          icon: AlertTriangle,
        };
      case "CRITICAL":
      default:
        return {
          bg: "bg-rose-950/80 text-rose-300 border-rose-700/80",
          border: "border-rose-500/50",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          label: "נדרשת התערבות דחופה 🚨",
          icon: AlertOctagon,
        };
    }
  };

  const statusConfig = getStatusColor(data?.overallStatus);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#0b1219] border border-cyan-800/60 w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-right relative overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-sky-900/40 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-950/90 border border-cyan-700/70 flex items-center justify-center text-cyan-300 shadow-inner relative">
              <Activity className="w-6 h-6 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 absolute -top-1 -right-1" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>אבחון כולל לג'קוזי</span>
                <span className="text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-full">
                  AI מופעל
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                סריקה בזמן אמת: איכות המים, מראה וריח, מתקן ומלאי חומרים
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDiagnostic}
              disabled={loading}
              className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-sky-950 text-slate-400 hover:text-sky-200 border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="רענן אבחון"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="סגור (X)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs sm:text-sm">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-center text-cyan-400 animate-spin">
                  <Activity className="w-8 h-8" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">סורק ומנתח את כל נתוני הג'קוזי...</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  בודק מדדי איכות מים, מראה וריח, מצב פילטרים, שגרות באיחור ומלאי חומרים בארון
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-center space-y-2 text-rose-300">
              <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
              <p className="font-bold">{error}</p>
              <button
                type="button"
                onClick={fetchDiagnostic}
                className="px-4 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-xs"
              >
                נסה שוב
              </button>
            </div>
          ) : data ? (
            <>
              {/* Overall Score & Health Banner */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${statusConfig.border} ${statusConfig.bg} space-y-2.5 shadow-lg relative overflow-hidden`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <statusConfig.icon className="w-5 h-5 shrink-0" />
                    <span className="font-black text-sm sm:text-base text-white">
                      {data.statusTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-slate-300 font-semibold">ציון בריאות:</span>
                    <span className="text-base sm:text-lg font-black text-white px-2.5 py-0.5 rounded-xl bg-black/40 border border-current/30 font-mono">
                      {data.healthScore}/100
                    </span>
                  </div>
                </div>

                {/* 🌟 Freeform AI Executive Summary */}
                <div className="bg-[#080e14]/90 p-3.5 rounded-xl border border-sky-900/40 text-slate-200 leading-relaxed text-xs sm:text-sm">
                  {data.executiveSummary}
                </div>
              </div>

              {/* 3 Component Columns / Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. איכות המים, מראה וריח */}
                <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                        <span>איכות ומראה המים</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          data.waterAnalysis.status === "OK"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : data.waterAnalysis.status === "WARNING"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : "bg-rose-950 text-rose-300 border-rose-800"
                        }`}
                      >
                        {data.waterAnalysis.statusLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-normal">
                      {data.waterAnalysis.summary}
                    </p>
                  </div>

                  {data.waterAnalysis.keyPoints && data.waterAnalysis.keyPoints.length > 0 && (
                    <div className="pt-2 border-t border-sky-900/30 space-y-1">
                      {data.waterAnalysis.keyPoints.slice(0, 3).map((pt, i) => (
                        <div key={i} className="text-[10px] text-slate-300 flex items-start gap-1">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. תחזוקת המתקן והפילטרים */}
                <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-sky-400" />
                        <span>תחזוקת מתקן ופילטר</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          data.equipmentAnalysis.status === "OK"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : data.equipmentAnalysis.status === "WARNING"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : "bg-rose-950 text-rose-300 border-rose-800"
                        }`}
                      >
                        {data.equipmentAnalysis.statusLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-normal">
                      {data.equipmentAnalysis.summary}
                    </p>
                  </div>

                  {data.equipmentAnalysis.keyPoints && data.equipmentAnalysis.keyPoints.length > 0 && (
                    <div className="pt-2 border-t border-sky-900/30 space-y-1">
                      {data.equipmentAnalysis.keyPoints.slice(0, 3).map((pt, i) => (
                        <div key={i} className="text-[10px] text-slate-300 flex items-start gap-1">
                          <span className="text-sky-400 font-bold">•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. ארון חומרים ומלאי */}
                <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ארון חומרים ומלאי</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          data.inventoryAnalysis.status === "OK"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : data.inventoryAnalysis.status === "WARNING"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : "bg-rose-950 text-rose-300 border-rose-800"
                        }`}
                      >
                        {data.inventoryAnalysis.statusLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-normal">
                      {data.inventoryAnalysis.summary}
                    </p>
                  </div>

                  {data.inventoryAnalysis.keyPoints && data.inventoryAnalysis.keyPoints.length > 0 && (
                    <div className="pt-2 border-t border-sky-900/30 space-y-1">
                      {data.inventoryAnalysis.keyPoints.slice(0, 3).map((pt, i) => (
                        <div key={i} className="text-[10px] text-slate-300 flex items-start gap-1">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Items */}
              {data.actionItems && data.actionItems.length > 0 && (
                <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>המלצות ממוקדות לפעולה מיידית:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {data.actionItems.length} פעולות מומלצות
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 text-xs ${
                          item.priority === "HIGH"
                            ? "bg-rose-950/30 border-rose-900/50"
                            : item.priority === "MEDIUM"
                            ? "bg-amber-950/30 border-amber-900/50"
                            : "bg-sky-950/30 border-sky-900/50"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-white block">
                            {idx + 1}. {item.title}
                          </span>
                          <span className="text-[11px] text-slate-300 block leading-snug">
                            {item.description}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${
                            item.priority === "HIGH"
                              ? "bg-rose-950 text-rose-300 border-rose-800"
                              : item.priority === "MEDIUM"
                              ? "bg-amber-950 text-amber-300 border-amber-800"
                              : "bg-sky-950 text-sky-300 border-sky-800"
                          }`}
                        >
                          {item.priority === "HIGH"
                            ? "דחיפות גבוהה"
                            : item.priority === "MEDIUM"
                            ? "בינונית"
                            : "המלצה"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Pro Tips */}
              {data.quickTips && data.quickTips.length > 0 && (
                <div className="bg-sky-950/40 p-3 rounded-2xl border border-sky-900/40 space-y-1.5">
                  <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>טיפים מקצועיים לתחזוקה נכונה:</span>
                  </span>
                  <div className="space-y-1">
                    {data.quickTips.map((tip, idx) => (
                      <p key={idx} className="text-[10px] text-slate-300">
                        💡 {tip}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-sky-900/40 pt-3 shrink-0">
          <button
            type="button"
            onClick={fetchDiagnostic}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-950/90 hover:bg-sky-900 text-sky-200 border border-sky-800/80 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>רענן אבחון</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>סגור</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
