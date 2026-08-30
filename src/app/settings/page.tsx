"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: "הג'קוזי שלי",
    brand: "",
    model: "",
    volumeLiters: "1200",
    sanitizationType: "CHLORINE",
    location: "OUTDOOR",
    usageFrequency: "MEDIUM",
    lastRefillDate: "",
    lastDeepCleanDate: "",
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
          location: j?.location || "OUTDOOR",
          usageFrequency: j?.usageFrequency || "MEDIUM",
          lastRefillDate: j?.lastRefillDate ? new Date(j.lastRefillDate).toISOString().split("T")[0] : "",
          lastDeepCleanDate: j?.lastDeepCleanDate ? new Date(j.lastDeepCleanDate).toISOString().split("T")[0] : "",
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

      setSuccessMsg("ההגדרות עודכנו בהצלחה!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetRefillToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      lastRefillDate: today,
      lastDeepCleanDate: today,
    }));
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-cyan-400" />
          <span>הגדרות הג'קוזי והתראות מייל</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          התאם אישית את מאפייני הג'קוזי, תאריכי החלפת מים, והגדרות שליחת תזכורות למייל.
        </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className="text-xs font-semibold text-slate-300">מיקום הג'קוזי</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs"
              >
                <option value="OUTDOOR">חצר / גינה פתוחה</option>
                <option value="ROOF">גג / מרפסת</option>
                <option value="INDOOR">פנים הבית / חלל סגור</option>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>מעקב החלפת מים וניקוי צנרת</span>
              </h3>
              <button
                type="button"
                onClick={handleSetRefillToday}
                className="text-xs bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                ✨ מילאתי מים חדשים היום!
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">תאריך מילוי מים אחרון</label>
                <input
                  type="date"
                  value={formData.lastRefillDate}
                  onChange={(e) => setFormData({ ...formData, lastRefillDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">תאריך שטיפת צנרת וניקוי עמוק אחרון</label>
                <input
                  type="date"
                  value={formData.lastDeepCleanDate}
                  onChange={(e) => setFormData({ ...formData, lastDeepCleanDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs"
                />
              </div>
            </div>
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

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>שליחת מיילים לתיבת הדואר שלך:</span>
              </div>
              <p>
                המערכת שולחת כעת מיילים מעוצבים עם כפתור תצוגה חיה מידית.
                לשליחה ישירה לתיבת ה-Gmail שלך, הזן את כתובת המייל וסיסמת האפליקציה שלך ב-<code>.env</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all disabled:opacity-50 hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "שומר..." : "שמור את כל השינויים"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
