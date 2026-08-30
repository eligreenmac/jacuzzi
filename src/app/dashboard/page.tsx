"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Droplets,
  Sparkles,
  Package,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  ArrowLeft,
  Flame,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ success?: boolean; text: string } | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleMarkTaskDone = async (taskId: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, markDoneAndReschedule: true }),
      });
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestEmail = async () => {
    setEmailSending(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/reminders/send", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setEmailMsg({
          success: true,
          text: result.results?.[0]?.mock
            ? "מצב הדגמה: התזכורת נרשמה בהצלחה (לשליחה אמיתית הזן פרטי SMTP ב-.env)"
            : "מייל תזכורת נשלח בהצלחה לכתובת האימייל שלך!",
        });
      } else {
        setEmailMsg({ success: false, text: result.error || "שגיאה בשליחת המייל" });
      }
    } catch (err: any) {
      setEmailMsg({ success: false, text: err.message });
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-cyan-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const jacuzzi = data.jacuzzi;
  const chemicals = data.chemicals || [];
  const tasks = data.tasks || [];
  const waterLogs = data.waterLogs || [];

  // Calculate days since last refill
  const refillDate = jacuzzi?.lastRefillDate ? new Date(jacuzzi.lastRefillDate) : new Date();
  const daysSinceRefill = Math.max(0, Math.floor((Date.now() - refillDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilNextRefill = Math.max(0, 90 - daysSinceRefill);

  // Filter urgent & upcoming tasks
  const pendingTasks = tasks.filter((t: any) => !t.isCompleted);
  const lowStockChemicals = chemicals.filter((c: any) => c.quantity <= (c.minThreshold || 100));

  return (
    <div className="space-y-8 pb-12">
      {/* Jacuzzi Overview Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-800/40 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                {jacuzzi?.sanitizationType === "CHLORINE"
                  ? "חיטוי בכלור"
                  : jacuzzi?.sanitizationType === "BROMINE"
                  ? "חיטוי בברום"
                  : jacuzzi?.sanitizationType === "SALT"
                  ? "מערכת מלח"
                  : "חמצן פעיל"}
              </span>
              <span className="text-xs text-slate-400">נפח: {jacuzzi?.volumeLiters || 1200} ליטר</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{jacuzzi?.name || "הג'קוזי שלי"}</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              שלום {data.name}! המערכת מנטרת את טיפולי הג'קוזי ושולחת תזכורות תקופתיות.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400">גיל המים</div>
              <div className="text-lg font-bold text-cyan-400">{daysSinceRefill} ימים</div>
              <div className="text-[10px] text-slate-500">החלפה בעוד {daysUntilNextRefill} יום</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400">משימות פתוחות</div>
              <div className="text-lg font-bold text-amber-400">{pendingTasks.length}</div>
              <div className="text-[10px] text-slate-500">לשבוע הקרוב</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400">ארון חומרים</div>
              <div className="text-lg font-bold text-sky-400">{chemicals.length} פריטים</div>
              <div className="text-[10px] text-slate-500">
                {lowStockChemicals.length > 0 ? `⚠️ ${lowStockChemicals.length} במלאי נמוך` : "מלאי תקין"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/water-doctor"
          className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 hover:border-cyan-400 p-5 rounded-2xl space-y-3 transition-all hover:scale-[1.02] group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">רופא מים AI</h2>
            <p className="text-xs text-slate-400 mt-0.5">אבחון עכירות, בדיקת pH ומינונים בגרמים</p>
          </div>
        </Link>

        <Link
          href="/inventory"
          className="bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/30 hover:border-blue-400 p-5 rounded-2xl space-y-3 transition-all hover:scale-[1.02] group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">ארון חומרים ומלאי</h2>
            <p className="text-xs text-slate-400 mt-0.5">העלאת תמונות, מעקב כמויות וזיהוי חוסרים</p>
          </div>
        </Link>

        <Link
          href="/calendar"
          className="bg-gradient-to-br from-sky-950/40 to-slate-900 border border-sky-500/30 hover:border-sky-400 p-5 rounded-2xl space-y-3 transition-all hover:scale-[1.02] group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">לוח טיפולים ויומן</h2>
            <p className="text-xs text-slate-400 mt-0.5">מעקב שטיפת פילטר, שוק ויומן הערות</p>
          </div>
        </Link>

        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-5 rounded-2xl space-y-3 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
              התראות פעילות
            </span>
          </div>
          <div>
            <h2 className="font-bold text-white text-base">שליחת תזכורת למייל</h2>
            <p className="text-xs text-slate-400 mt-0.5">בדוק קבלת התראת תחזוקה ישירה למייל</p>
          </div>
          <button
            onClick={handleSendTestEmail}
            disabled={emailSending}
            className="w-full py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {emailSending ? "שולח..." : "שלח לי תזכורת עכשיו"}
          </button>
        </div>
      </div>

      {emailMsg && (
        <div
          className={`p-4 rounded-2xl text-sm border flex items-center gap-2 ${
            emailMsg.success
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
              : "bg-rose-950/60 border-rose-800 text-rose-300"
          }`}
        >
          {emailMsg.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{emailMsg.text}</span>
        </div>
      )}

      {/* Two columns: Maintenance Tasks & Chemical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Upcoming Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>משימות תחזוקה קרובות</span>
            </h2>
            <Link href="/calendar" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <span>לכל המשימות ביומן</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {pendingTasks.slice(0, 4).map((task: any) => {
              const isOverdue = new Date(task.nextDueDate).getTime() < Date.now();
              return (
                <div
                  key={task.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === "URGENT"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : task.priority === "HIGH"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        }`}
                      >
                        {task.category === "WEEKLY"
                          ? "שבועי"
                          : task.category === "MONTHLY"
                          ? "חודשי"
                          : task.category === "QUARTERLY"
                          ? "רבעוני"
                          : "יומי"}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800">
                          באיחור!
                        </span>
                      )}
                      <h3 className="font-bold text-white text-sm">{task.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{task.description}</p>
                    <div className="text-[11px] text-slate-500">
                      תאריך יעד: {new Date(task.nextDueDate).toLocaleDateString("he-IL")}
                    </div>
                  </div>

                  <button
                    onClick={() => handleMarkTaskDone(task.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 transition-all text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">בוצע היום</span>
                  </button>
                </div>
              );
            })}

            {pendingTasks.length === 0 && (
              <div className="text-center py-8 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
                🎉 כל הכבוד! כל משימות התחזוקה הושלמו בהצלחה.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Chemical Stock & Safety Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-400" />
              <span>סטטוס מלאי חומרים</span>
            </h2>
            <Link href="/inventory" className="text-xs text-cyan-400 hover:underline">
              ניהול ארון
            </Link>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            {chemicals.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-slate-400">ארון החומרים שלך ריק עדיין.</p>
                <Link
                  href="/inventory"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>הוסף חומרים ראשונים</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {chemicals.slice(0, 4).map((chem: any) => {
                  const isLow = chem.quantity <= (chem.minThreshold || 100);
                  return (
                    <div
                      key={chem.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200">{chem.name}</div>
                        <div className="text-[11px] text-slate-400">
                          נותרו: {chem.quantity} {chem.unit === "GRAMS" ? 'גר\'' : chem.unit === "ML" ? 'מ"ל' : chem.unit}
                        </div>
                      </div>
                      {isLow ? (
                        <span className="text-[10px] bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                          מלאי נמוך!
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                          תקין
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800">
              <Link
                href="/inventory"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>סרוק חומרים חסרים ב-AI</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
