"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ArrowRight,
  Droplets,
  FlaskConical,
  Zap,
  Sparkles,
  Shield,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  Waves,
  Scale,
} from "lucide-react";

interface RoutineItem {
  key: string;
  title: string;
  description: string;
  category: string;
  defaultFrequencyDays: number;
  minDays: number;
  maxDays: number;
  priority: string;
  icon: string;
  explanation: string;
  taskId: string | null;
  currentFrequencyDays: number;
  currentPriority: string;
  nextDueDate: string | null;
  lastDoneDate: string | null;
  isCompleted: boolean;
  isActive: boolean;
}

const ICON_MAP: Record<string, any> = {
  FlaskConical: FlaskConical,
  Droplets: Droplets,
  Zap: Zap,
  Sparkles: Sparkles,
  Shield: Shield,
  RotateCcw: RotateCcw,
  Waves: Waves,
};

export default function RoutinesSettingsPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadRoutines = async () => {
    try {
      const res = await fetch("/api/routines");
      if (res.ok) {
        const data = await res.json();
        setRoutines(data.routines || []);
      }
    } catch (err) {
      console.error("Load routines error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleFrequencyChange = (key: string, value: number) => {
    setRoutines((prev) =>
      prev.map((r) => (r.key === key ? { ...r, currentFrequencyDays: value } : r))
    );
  };

  const handleResetToDefaults = () => {
    if (!confirm("האם לשחזר את כל תדירויות השגרה להגדרות ברירת המחדל המומלצות של המערכת?")) {
      return;
    }
    setRoutines((prev) =>
      prev.map((r) => ({
        ...r,
        currentFrequencyDays: r.defaultFrequencyDays,
      }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/routines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routines: routines.map((r) => ({
            key: r.key,
            taskId: r.taskId,
            title: r.title,
            description: r.description,
            category: r.category,
            frequencyDays: r.currentFrequencyDays,
            priority: r.currentPriority,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בשמירת שגרות");

      setSuccessMsg("השגרות עודכנו בהצלחה ולוח השנה סונכרן מחדש!");
      setTimeout(() => setSuccessMsg(""), 5000);
      await loadRoutines();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-cyan-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16" dir="rtl">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/settings" className="hover:text-cyan-400 flex items-center gap-1 transition-colors">
              <span>הגדרות</span>
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-medium">שגרות תחזוקה</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-cyan-400" />
            <span>שגרות תחזוקה והגדרת תדירויות</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            הגדרת זמני השיבוץ האוטומטי של משימות הג&apos;קוזי ביומן והסבר מלא על חישובי השגרה.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>צפה ביומן</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-lg animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 🌟 Special Educational Guide: Partial Water Change & Water Age */}
      <div className="bg-gradient-to-br from-[#0c1a24] to-[#091117] border border-cyan-950/80 hover:border-cyan-900/60 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl transition-all">
        <div className="flex items-center gap-3 border-b border-cyan-900/40 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center">
            <Waves className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>מה קורה כאשר מחליפים רק חלק מהמים?</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-normal">
                מדריך מקצועי
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              הבנת מנגנון החישוב וההשפעה הכימית של החלפת מים חלקית (Partial Water Change)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-4 rounded-2xl bg-[#080d11]/80 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <Scale className="w-4 h-4" />
              <span>1. שקלול גיל המים (Water Age)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              כשמחליפים למשל <strong>30% או 50%</strong> מהמים, המערכת לא מאפסת את הגיל ל-0, אלא מבצעת <strong>ממוצע משוקלל</strong> של המים הוותיקים והחדשים.
              הדבר מפחית את עומס המוצקים המומסים (TDS) ומאריך אוטומטית את מועד הריקון המלא הבא ביומן!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080d11]/80 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Clock className="w-4 h-4" />
              <span>2. סירקולציה של 12-24 שעות</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              המים החדשים קרים ובעלי הרכב כימי שונה. חובה להפעיל סירקולציה וחימום למשך <strong>12 עד 24 שעות</strong> כדי לאפשר למים להתערבב באופן הומוגני לפני כל מדידה.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#080d11]/80 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <FlaskConical className="w-4 h-4" />
              <span>3. איסור הוספת חיטוי מראש</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              אין להוסיף חומר חיטוי שגרתי (ברום/כלור) מיד עם המילוי! יש להמתין לבדיקת המקלון הראשונית, לאזן קודם את הבסיסיות (TA) וה-pH, ורק לאחר מכן להוסיף חיטוי.
            </p>
          </div>
        </div>
      </div>

      {/* Routine Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>הגדרת תדירויות לשגרות התחזוקה</span>
          </h2>
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-xs text-slate-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
          >
            שחזר ערכי ברירת מחדל
          </button>
        </div>

        <div className="space-y-4">
          {routines.map((routine) => {
            const IconComponent = ICON_MAP[routine.icon] || Droplets;
            const isChanged = routine.currentFrequencyDays !== routine.defaultFrequencyDays;

            return (
              <div
                key={routine.key}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 sm:p-6 transition-all shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      <IconComponent className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {routine.title}
                        </h3>
                        {isChanged && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            הותאם אישית
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {routine.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Frequency Input Control */}
                  <div className="flex items-center gap-3 shrink-0 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl">
                    <div className="text-right">
                      <label className="text-[11px] text-slate-400 block font-semibold">
                        תדירות שיבוץ:
                      </label>
                      <span className="text-[10px] text-slate-500">
                        ברירת מחדל: כל {routine.defaultFrequencyDays} ימים
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={routine.minDays}
                        max={routine.maxDays}
                        value={routine.currentFrequencyDays}
                        onChange={(e) =>
                          handleFrequencyChange(routine.key, Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="w-16 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-2.5 py-1.5 text-center text-sm font-bold text-cyan-300 outline-none"
                      />
                      <span className="text-xs font-semibold text-slate-400">ימים</span>
                    </div>
                  </div>
                </div>

                {/* Bottom details */}
                {routine.nextDueDate && (
                  <div className="flex items-center justify-between text-xs pt-1 text-slate-500 border-t border-slate-800/40">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        מועד יעד נוכחי ביומן: <strong className="text-slate-200">{new Date(routine.nextDueDate).toLocaleDateString("he-IL")}</strong>
                      </span>
                    </div>
                    {routine.lastDoneDate && (
                      <div className="text-[11px] text-slate-500">
                        בוצע לאחרונה: {new Date(routine.lastDoneDate).toLocaleDateString("he-IL")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Save Actions Bar */}
      <div className="sticky bottom-4 z-40 bg-[#0c141a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl">
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white">💡 שינוי תדירויות מעדכן את לוח השנה:</span> בעת שמירה, המערכת תחשב מחדש את תאריכי היעד העתידיים בהתאם למועד הביצוע האחרון.
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            שחזר ברירות מחדל
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all cursor-pointer select-none"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>שומר ומסנכרן יומן...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>שמור שינויים וסנכרן ליומן</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
