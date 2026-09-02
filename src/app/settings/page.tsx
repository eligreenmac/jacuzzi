"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Droplets,
  Mail,
  Save,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  Clock,
  Waves,
  FlaskConical,
  Sliders,
  Check,
} from "lucide-react";
import {
  ALL_TEST_STRIP_PARAMS,
  DEFAULT_TEST_STRIP_PARAM_IDS,
  PARAM_CATEGORIES,
  parseTestStripParams,
} from "@/lib/test-strip-params";

export default function SettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "הג'קוזי שלי",
    brand: "",
    model: "",
    volumeLiters: "1200",
    sanitizationType: "CHLORINE",
    usageFrequency: "MEDIUM",
    lastRefillDate: "",
    lastDeepCleanDate: "",
    lastFilterReplaceDate: "",
    testStripParams: DEFAULT_TEST_STRIP_PARAM_IDS,
    emailNotificationsEnabled: true,
    notifySameDayTasks: true,
    notifyOverdueTasks: true,
    notificationEmail: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ text: string; previewUrl?: string } | null>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const j = data.user.jacuzzi;
        setFormData({
          name: j?.name || "הג'קוזי שלי",
          brand: j?.brand || "",
          model: j?.model || "",
          volumeLiters: j?.volumeLiters?.toString() || "1200",
          sanitizationType: j?.sanitizationType || "CHLORINE",
          usageFrequency: j?.usageFrequency || "MEDIUM",
          lastRefillDate: j?.lastRefillDate ? new Date(j.lastRefillDate).toISOString().split("T")[0] : "",
          lastDeepCleanDate: j?.lastDeepCleanDate ? new Date(j.lastDeepCleanDate).toISOString().split("T")[0] : "",
          lastFilterReplaceDate: j?.lastFilterReplaceDate ? new Date(j.lastFilterReplaceDate).toISOString().split("T")[0] : "",
          testStripParams: parseTestStripParams(j?.testStripParams),
          emailNotificationsEnabled: data.user.emailNotificationsEnabled ?? true,
          notifySameDayTasks: data.user.notifySameDayTasks ?? true,
          notifyOverdueTasks: data.user.notifyOverdueTasks ?? true,
          notificationEmail: data.user.notificationEmail || data.user.email || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleClose = () => {
    try {
      window.close();
    } catch {}
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/water-tests");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/jacuzzi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "שגיאה בשמירת הגדרות");
      }

      setSuccessMsg("ההגדרות עודכנו בהצלחה! סוגר חלון...");
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/reminders/send", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        const firstResult = d.results?.[0];
        if (firstResult?.previewUrl) {
          setTestResult({
            text: "מייל בדיקה מעוצב הופק ונשלח בהצלחה!",
            previewUrl: firstResult.previewUrl,
          });
        } else {
          setTestResult({
            text: "מייל בדיקה נשלח בהצלחה לכתובת המייל שלך!",
          });
        }
      } else {
        setTestResult({ text: "שגיאה: " + (d.error || "") });
      }
    } catch (err: any) {
      setTestResult({ text: "שגיאה: " + err.message });
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-cyan-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-400" />
            <span>הגדרות הג'קוזי והתראות מייל</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            התאם אישית את מאפייני הג'קוזי, תאריכי החלפת מים, והגדרות שליחת תזכורות למייל.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
        >
          <span>✕</span>
          <span>סגור</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 🌟 Dedicated Link to Routines Management & Educational Guide */}
      <Link
        href="/settings/routines"
        className="block bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-800/40 hover:border-cyan-600/70 rounded-3xl p-6 transition-all shadow-xl group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  ניהול שגרות ותדירויות תחזוקה
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                  חדש
                </span>
              </div>
              <p className="text-xs text-slate-400">
                התאם אישית את מרווחי הזמן של בדיקת המים, שטיפת הפילטר, השוק והריקון, וקרא הסבר מלא על החלפת מים חלקית ושקלול גיל המים.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 shrink-0 group-hover:translate-x-[-4px] transition-transform">
            <span>פתח שגרות</span>
            <ChevronLeft className="w-4 h-4" />
          </div>
        </div>
      </Link>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Jacuzzi Parameters Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <span>מאפייני הג'קוזי ונפח מים</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">שם או כינוי הג'קוזי</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">נפח מים כולל (בליטרים)</label>
              <input
                type="number"
                required
                min="300"
                max="10000"
                step="50"
                value={formData.volumeLiters}
                onChange={(e) => setFormData({ ...formData, volumeLiters: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm font-bold text-cyan-300"
              />
              <span className="text-[11px] text-slate-500">משמש את הבינה המלאכותית לחישוב מדויק של גרמים לחומרים</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">שיטת חיטוי עיקרית</label>
              <select
                value={formData.sanitizationType}
                onChange={(e) => setFormData({ ...formData, sanitizationType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs"
              >
                <option value="CHLORINE">כלור גרגירי (Sodium Dichlor)</option>
                <option value="BROMINE">טבליות ברום (Bromine)</option>
                <option value="SALT">מערכת מלח (Salt System)</option>
                <option value="ACTIVE_OXYGEN">חמצן פעיל (Active Oxygen)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">תדירות שימוש ממוצעת</label>
              <select
                value={formData.usageFrequency}
                onChange={(e) => setFormData({ ...formData, usageFrequency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs"
              >
                <option value="LIGHT">קלה (1-2 פעמים בשבוע)</option>
                <option value="MEDIUM">בינונית (3-4 פעמים בשבוע)</option>
                <option value="HEAVY">אינטנסיבית (יומיומי / אורחים מרובים)</option>
              </select>
            </div>
          </div>

          {/* Refill Dates */}
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>מעקב החלפת מים, ניקוי צנרת והחלפת פילטר</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">תאריך מילוי מים אחרון</label>
                <input
                  type="date"
                  value={formData.lastRefillDate}
                  onChange={(e) => setFormData({ ...formData, lastRefillDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs"
                />
                <span className="text-[10px] text-slate-400 block">מחזור רענון מים מומלץ: כל 3 חודשים (90 יום).</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">תאריך ניקוי צנרת ושטיפה אחרון</label>
                <input
                  type="date"
                  value={formData.lastDeepCleanDate}
                  onChange={(e) => setFormData({ ...formData, lastDeepCleanDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs"
                />
                <span className="text-[10px] text-cyan-400/90 block">⚡ משבץ אוטומטית ביומן את שטיפת הצנרת הבאה בעוד 90 יום.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">תאריך החלפת פילטר חדש אחרון</label>
                <input
                  type="date"
                  value={formData.lastFilterReplaceDate}
                  onChange={(e) => setFormData({ ...formData, lastFilterReplaceDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs"
                />
                <span className="text-[10px] text-emerald-400/90 block">⚡ משבץ אוטומטית ביומן את החלפת הפילטר השנתית הבאה (כל 365 יום).</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🧪 Test Strip Settings Section (הגדרות מקלון בדיקה) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              <span>הגדרות מקלון בדיקה</span>
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    testStripParams: ALL_TEST_STRIP_PARAMS.map((p) => p.id),
                  }))
                }
                className="text-[11px] px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg border border-slate-700 transition-colors"
              >
                בחר הכל ({ALL_TEST_STRIP_PARAMS.length})
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    testStripParams: DEFAULT_TEST_STRIP_PARAM_IDS,
                  }))
                }
                className="text-[11px] px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition-colors"
              >
                ברירת מחדל (3 מדדים)
              </button>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200/90 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              סמן את המדדים הנמדדים במקלון או בערכת הבדיקה שברשותך. המדדים המסומנים יופיעו בטופס הזנת הבדיקות ובדוחות איכות המים כולל התראות הסכנה הישירות של המדדים החורגים.
              <span className="block text-slate-400 text-[11px] mt-0.5">
                * שינוי הגדרות זה חל על בדיקות חדשות ואינו משנה היסטוריית בדיקות עבר.
              </span>
            </div>
          </div>

          {/* Categorized Parameters List */}
          <div className="space-y-6">
            {PARAM_CATEGORIES.map((catName) => {
              const catParams = ALL_TEST_STRIP_PARAMS.filter((p) => p.category === catName);
              const selectedInCat = catParams.filter((p) => (formData.testStripParams || []).includes(p.id)).length;

              return (
                <div key={catName} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>{catName}</span>
                    </h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-semibold border border-slate-700">
                      {selectedInCat} / {catParams.length} פעילים
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {catParams.map((param) => {
                      const isSelected = (formData.testStripParams || []).includes(param.id);

                      return (
                        <div
                          key={param.id}
                          onClick={() => {
                            setFormData((prev) => {
                              const current = prev.testStripParams || [];
                              const next = current.includes(param.id)
                                ? current.filter((p) => p !== param.id)
                                : [...current, param.id];
                              if (next.length === 0) return prev;
                              return { ...prev, testStripParams: next };
                            });
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all select-none flex items-start gap-3.5 ${
                            isSelected
                              ? "bg-cyan-950/20 border-cyan-500/50 shadow-sm"
                              : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-85"
                          }`}
                        >
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer pointer-events-none"
                            />
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className={`font-bold text-sm ${isSelected ? "text-white" : "text-slate-400"}`}>
                                {param.nameHe} ({param.enName})
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300 font-semibold shrink-0">
                                יעד: {param.idealRange}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {param.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Email Notifications Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Mail className="w-5 h-5 text-emerald-400" />
            <span>הגדרות התראות ותזכורות במייל</span>
          </h2>

          <div className="space-y-5">
            {/* Master Switch */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
              <input
                type="checkbox"
                id="emailToggle"
                checked={formData.emailNotificationsEnabled}
                onChange={(e) => setFormData({ ...formData, emailNotificationsEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
              <label htmlFor="emailToggle" className="text-sm font-bold text-white cursor-pointer">
                הפעל שליחת תזכורות אוטומטיות למייל
              </label>
            </div>

            {/* Granular Notification Types */}
            {formData.emailNotificationsEnabled && (
              <div className="space-y-3 pr-2 pl-2 border-r-2 border-cyan-500/40 mr-1">
                <div className="text-xs font-bold text-slate-300">בחר אילו מיילים תרצה לקבל:</div>

                {/* Option 1: Same Day */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-850 hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    id="notifySameDay"
                    checked={formData.notifySameDayTasks}
                    onChange={(e) => setFormData({ ...formData, notifySameDayTasks: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-cyan-500 rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="notifySameDay" className="text-xs text-slate-300 cursor-pointer space-y-0.5 block">
                    <span className="font-bold text-white block">📅 משימות שיש לבצע באותו היום</span>
                    <span className="text-[11px] text-slate-400 block">
                      קבלת מייל בבוקר המועד עם רשימת המשימות, הבדיקות והטיפולים המתוכננים להיום.
                    </span>
                  </label>
                </div>

                {/* Option 2: Overdue / Next Day */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-850 hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    id="notifyOverdue"
                    checked={formData.notifyOverdueTasks}
                    onChange={(e) => setFormData({ ...formData, notifyOverdueTasks: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-amber-500 rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="notifyOverdue" className="text-xs text-slate-300 cursor-pointer space-y-0.5 block">
                    <span className="font-bold text-amber-300 block">⚠️ משימות פג תוקף / שלא בוצעו (שליחה יום למחרת)</span>
                    <span className="text-[11px] text-slate-400 block">
                      קבלת התראת תזכורת על משימות שמועדן עבר ועדיין לא סומנו כבוצעו.
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-1.5 max-w-md">
              <label className="text-xs font-semibold text-slate-300">כתובת אימייל לקבלת התראות</label>
              <input
                type="email"
                required
                value={formData.notificationEmail}
                onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                placeholder="your-email@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testSending}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-2 border border-slate-700 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testSending ? "שולח בדיקה..." : "בדוק שליחת מייל עכשיו"}</span>
              </button>

              {testResult && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{testResult.text}</span>
                  </div>
                  {testResult.previewUrl && (
                    <a
                      href={testResult.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors"
                    >
                      <span>🔍 פתח צפייה במייל שנשלח</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit & Close */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
          >
            סגור
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all disabled:opacity-50 hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "שומר..." : "שמור וסגור"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
