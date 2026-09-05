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
  Trash2,
  AlertTriangle,
  X,
  Crown,
  CreditCard,
  Lock,
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

  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ text: string; previewUrl?: string } | null>(null);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const j = data.user.jacuzzi;
        setSubscriptionInfo(data.user.subscriptionDetails || null);
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
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("has_seen_settings_guide");
      if (!hasSeen) {
        setShowSettingsGuide(true);
      }
    }
  }, []);

  const handleDismissSettingsGuide = () => {
    setShowSettingsGuide(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("has_seen_settings_guide", "true");
    }
  };

  const handleClose = () => {
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

      if (formData.testStripParams && typeof window !== "undefined") {
        localStorage.setItem("active_test_strip_params", JSON.stringify(formData.testStripParams));
      }

      setSuccessMsg("ההגדרות עודכנו בהצלחה!");
      setTimeout(() => {
        handleClose();
      }, 700);
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

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/auth/me", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "שגיאה במחיקת החשבון");
      }
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = "/login?notice=account_deleted";
    } catch (err: any) {
      setDeleteError(err.message || "שגיאה במחיקת החשבון");
      setDeletingAccount(false);
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

          {/* Water Refill Date */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>תאריך בו בוצע מילוי מים לראשונה / מילוי נוכחי בג&apos;קוזי:</span>
              </span>
              {formData.lastRefillDate && (
                <span className="text-[11px] text-slate-400 font-normal">
                  גיל המים: {Math.max(0, Math.round((Date.now() - new Date(formData.lastRefillDate).getTime()) / (24 * 3600 * 1000)))} ימים
                </span>
              )}
            </label>
            <input
              type="date"
              value={formData.lastRefillDate}
              onChange={(e) => setFormData({ ...formData, lastRefillDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white text-sm font-bold"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              שמירת תאריך זה מתעדת מילוי מים מלא (100%) ללא שטיפת צנרת, ומבצעת התאמת זימונים אוטומטית במערכת.
            </p>
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

        {/* 💳 Subscription & Billing Section */}
        <div className="bg-[#0e1823]/90 border border-sky-800/50 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-sky-900/40 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-sky-400" />
              <span>מנוי ותשלומים (Jacuzzi AI Pro)</span>
            </h2>
            {subscriptionInfo && (
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${subscriptionInfo.badgeColor}`}>
                {subscriptionInfo.isAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                {subscriptionInfo.isPaying && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {subscriptionInfo.isTrial && <Clock className="w-3.5 h-3.5 text-sky-400" />}
                <span>{subscriptionInfo.formattedStatus}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl text-xs text-slate-300">
              {subscriptionInfo?.isAdmin ? (
                <p className="leading-relaxed">
                  הינך מוגדר כ-<strong>מנהל המערכת</strong> ונהנה מגישה חופשית ובלתי מוגבלת לתמיד ללא צורך במנוי או תשלום.
                </p>
              ) : subscriptionInfo?.status === "ACTIVE" ? (
                <div className="space-y-1">
                  <p className="font-bold text-emerald-300 text-sm">המנוי שלך פעיל ומשולם ($5.00 לחודש)</p>
                  <p className="text-slate-400">
                    גישה מלאה לכל תכונות ה-AI, אבחונים ללא הגבלה, עדכוני מלאי והתראות.
                    {subscriptionInfo.currentPeriodEnd && (
                      <span className="block pt-0.5">
                        מועד החידוש הבא: <strong>{new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString("he-IL")}</strong>
                      </span>
                    )}
                  </p>
                </div>
              ) : subscriptionInfo?.status === "TRIAL" ? (
                <div className="space-y-1">
                  <p className="font-bold text-sky-300 text-sm">
                    תקופת ניסיון חינם פעילה: נותרו לך עוד <strong>{subscriptionInfo.daysLeftInTrial} ימים</strong>
                  </p>
                  <p className="text-slate-400">
                    לאחר סיום תקופת הניסיון, השימוש במערכת וב-AI יימשך בעלות של $5.00 לחודש בלבד. ניתן לשדרג כבר עכשיו כדי להבטיח רציפות.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-rose-300 text-sm">תקופת הניסיון החינמית הסתיימה</p>
                  <p className="text-slate-400">
                    שדרג עכשיו למנוי Pro ב-$5 לחודש כדי להמשיך להשתמש באבחוני AI, חישוב מינונים ושליטה בג'קוזי.
                  </p>
                </div>
              )}

              {billingError && (
                <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs font-bold">
                  {billingError}
                </div>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {subscriptionInfo?.isAdmin ? null : subscriptionInfo?.status === "ACTIVE" ? (
                <button
                  type="button"
                  disabled={billingLoading}
                  onClick={async () => {
                    setBillingLoading(true);
                    setBillingError(null);
                    try {
                      const res = await fetch("/api/billing/portal", { method: "POST" });
                      const d = await res.json();
                      if (!res.ok) throw new Error(d.error || "שגיאה בפתיחת פורטל Stripe");
                      if (d.url) window.location.href = d.url;
                    } catch (err: any) {
                      setBillingError(err.message);
                      setBillingLoading(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span>{billingLoading ? "טוען פורטל..." : "ניהול מנוי וחשבוניות (Stripe)"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={billingLoading}
                  onClick={async () => {
                    setBillingLoading(true);
                    setBillingError(null);
                    try {
                      const res = await fetch("/api/billing/checkout", { method: "POST" });
                      const d = await res.json();
                      if (!res.ok) throw new Error(d.error || "שגיאה ביצירת קישור לתשלום");
                      if (d.url) window.location.href = d.url;
                    } catch (err: any) {
                      setBillingError(err.message);
                      setBillingLoading(false);
                    }
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-950/70 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{billingLoading ? "מעביר לתשלום..." : "קנה מנוי ($5/חודש)"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="bg-rose-950/30 border border-rose-900/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-rose-900/40 pb-3">
            <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>אזור סכנה ומחיקת חשבון</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <p className="text-sm font-bold text-rose-200">
                מחיקת החשבון וכל נתוני הג'קוזי לצמיתות
              </p>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                פעולה זו תמחק לצמיתות את החשבון שלך, את כל היסטוריית בדיקות המים, יומן הפעולות, מלאי הכימיקלים ושגרות התחזוקה. פעולה זו היא בלתי הפיכה ולא ניתן יהיה לשחזר את הנתונים.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteConfirmationText("");
                setDeleteError("");
              }}
              className="px-5 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 border border-rose-500/50 transition-all hover:scale-105 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>מחק את החשבון שלי</span>
            </button>
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
          dir="rtl"
          onClick={() => {
            if (!deletingAccount) setShowDeleteModal(false);
          }}
        >
          <div
            className="bg-[#180e14] border-2 border-rose-700/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-right relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-rose-900/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shadow-inner">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                    מחיקת חשבון לצמיתות
                  </h3>
                  <p className="text-xs text-rose-300/90 mt-0.5">פעולה בלתי הפיכה</p>
                </div>
              </div>

              {!deletingAccount && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <p className="font-bold text-rose-300">
                האם אתה בטוח שברצונך למחוק את החשבון שלך?
              </p>
              <div className="bg-rose-950/60 p-3.5 rounded-2xl border border-rose-900/60 space-y-1.5 text-xs text-rose-200">
                <p>⚠️ <strong>הנתונים הבאים יימחקו לצמיתות:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>פרטי החשבון והגדרות ההתראות במייל</li>
                  <li>כל בדיקות איכות המים וההיסטוריה</li>
                  <li>יומן הפעולות והטיפולים</li>
                  <li>ארון החומרים והמלאי</li>
                  <li>כל שגרות התחזוקה שהוגדרו</li>
                </ul>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-slate-300 block font-semibold">
                  כדי לאשר, הקלד <span className="text-rose-400 font-bold">מחק</span> בתיבה למטה:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="הקלד מחק לאישור"
                  disabled={deletingAccount}
                  className="w-full bg-slate-950 border border-rose-900/80 focus:border-rose-500 rounded-xl px-4 py-2.5 text-white text-sm text-center font-bold outline-none"
                />
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-950 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-900/40">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="button"
                disabled={deletingAccount || deleteConfirmationText.trim() !== "מחק"}
                onClick={handleDeleteAccount}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-950/70 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deletingAccount ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>מוחק חשבון...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>כן, מחק את החשבון שלי</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Settings Onboarding Guide Modal */}
      {showSettingsGuide && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
          dir="rtl"
          onClick={handleDismissSettingsGuide}
        >
          <div
            className="bg-[#0e1823] border border-sky-500/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 text-right relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/90 border border-sky-500/60 flex items-center justify-center text-sky-300 shadow-inner">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                    הסבר ליכולות המערכת ⚙️
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                    הגדרות הג&apos;קוזי והמערכת
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">התאמת מאפייני הג&apos;קוזי, תזכורות והעדפות אישיות</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissSettingsGuide}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* General Purpose */}
            <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/40 text-xs text-slate-200 leading-relaxed">
              <span className="text-sky-300 font-bold block mb-1">למה נועד מסך ההגדרות?</span>
              <p>
                כאן תוכל לעדכן את נפח המים, סוג החיטוי, תדירויות טיפולים, תאריך מילוי מים וניהול תזכורות במייל.
              </p>
            </div>

            {/* Core Capabilities */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>יכולות מרכזיות בהגדרות:</span>
              </span>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#080e14]/70 border border-sky-900/30 flex items-start gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-sky-400 font-bold shrink-0">📐</span>
                  <span><strong>נפח ושיטת חיטוי:</strong> הגדרת נפח המים (בליטרים) לחישוב מינונים מדויק ובחירת שיטת חיטוי (כלור/ברום/מלח).</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080e14]/70 border border-sky-900/30 flex items-start gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-sky-400 font-bold shrink-0">💧</span>
                  <span><strong>תאריך מילוי וגיל המים:</strong> קביעת מועד המילוי האחרון/ראשון לסנכרון ריקון מלא והתאמת זימונים.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080e14]/70 border border-sky-900/30 flex items-start gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-sky-400 font-bold shrink-0">📧</span>
                  <span><strong>תזכורות חכמות במייל:</strong> קבלת תזכורת אוטומטית לפני משימות דחופות והחלפת מים.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080e14]/70 border border-sky-900/30 flex items-start gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-sky-400 font-bold shrink-0">🗑️</span>
                  <span><strong>ניהול חשבון:</strong> אפשרות מחיקת חשבון וכל המידע לצמיתות במידת הצורך.</span>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleDismissSettingsGuide}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>הבנתי, תודה! 👍</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
