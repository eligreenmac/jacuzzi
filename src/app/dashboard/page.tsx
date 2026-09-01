"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Droplets,
  Package,
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  FlaskConical,
  CheckCircle2,
  Check,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handleResetTask = async (task: any) => {
    if (!confirm(`האם להחזיר את המשימה "${task.title}" למצב פתוח (טרם בוצע)? המלאי שנגרע יוחזר לארון.`)) {
      return;
    }
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, resetTask: true }),
      });
      if (res.ok) {
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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
  const latestWaterLog = waterLogs.length > 0 ? waterLogs[0] : null;

  // Calculate days since last refill
  const refillDate = jacuzzi?.lastRefillDate ? new Date(jacuzzi.lastRefillDate) : new Date();
  const daysSinceRefill = Math.max(0, Math.floor((Date.now() - refillDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilNextRefill = Math.max(0, 90 - daysSinceRefill);

  // Calculate days since last deep clean / pipe flush
  const deepCleanDate = jacuzzi?.lastDeepCleanDate ? new Date(jacuzzi.lastDeepCleanDate) : null;
  const daysSinceDeepClean = deepCleanDate
    ? Math.max(0, Math.floor((Date.now() - deepCleanDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Filter urgent & upcoming tasks based on Saturday-to-Saturday weekly cycle
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const day = todayStart.getDay(); // 0 (Sun) to 6 (Sat)
  const offsetFromSaturday = (day + 1) % 7;
  const startOfWeek = new Date(todayStart);
  startOfWeek.setDate(todayStart.getDate() - offsetFromSaturday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Completed tasks: explicitly completed OR performed during this week
  const completedTasks = tasks.filter((t: any) => {
    if (t.isCompleted) return true;
    if (t.lastDoneDate) {
      const lastDone = new Date(t.lastDoneDate);
      return lastDone >= startOfWeek && lastDone <= endOfWeek;
    }
    return false;
  });

  // Pending tasks for this week: NOT completed AND due <= endOfWeek AND NOT performed this week
  const pendingTasks = tasks.filter((t: any) => {
    if (t.isCompleted) return false;
    const dueDate = new Date(t.nextDueDate);
    if (t.lastDoneDate) {
      const lastDone = new Date(t.lastDoneDate);
      if (lastDone >= startOfWeek && dueDate > endOfWeek) {
        return false; // Already executed for this weekly cycle!
      }
    }
    return dueDate <= endOfWeek;
  });

  const lowStockChemicals = chemicals.filter((c: any) => c.quantity <= (c.minThreshold || 100));

  return (
    <div className="space-y-8 pb-12">
      {/* 🌟 Unified Master Board: הג'קוזי שלי ובדיקות מים */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/80 border border-cyan-800/40 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                {jacuzzi?.sanitizationType === "CHLORINE"
                  ? "חיטוי בכלור"
                  : jacuzzi?.sanitizationType === "BROMINE"
                  ? "חיטוי בברום"
                  : jacuzzi?.sanitizationType === "SALT"
                  ? "מערכת מלח"
                  : "חמצן פעיל"}
              </span>
              <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                נפח: {jacuzzi?.volumeLiters || 1200} ליטר
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <span>{jacuzzi?.name || "הג'קוזי שלי"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              שלום {data.name}! לוח בקרה מרכזי לניטור מצב הג'קוזי, איכות המים ותוכנית התחזוקה.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/water-tests"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <FlaskConical className="w-4 h-4" />
              <span>בדיקות מים מלאות</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Quick Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: גיל המים */}
          <div className="bg-slate-950/80 border border-slate-800/90 p-3.5 rounded-2xl space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>גיל המים</span>
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-300">{daysSinceRefill} ימים</div>
            <div className="text-[10px] text-slate-400 truncate">
              החלפה בעוד {daysUntilNextRefill} יום ({refillDate.toLocaleDateString("he-IL")})
            </div>
          </div>

          {/* Card 2: תאריך ניקוי צנרת */}
          <div className="bg-slate-950/80 border border-slate-800/90 p-3.5 rounded-2xl space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>ניקוי צנרת ושטיפה</span>
              <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-xl font-black text-teal-300">
              {daysSinceDeepClean !== null ? `${daysSinceDeepClean} ימים` : "טרם עודכן"}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              תאריך: {deepCleanDate ? deepCleanDate.toLocaleDateString("he-IL") : "טרם בוצע"}
            </div>
          </div>

          {/* Card 3: משימות פתוחות */}
          <div className="bg-slate-950/80 border border-slate-800/90 p-3.5 rounded-2xl space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>משימות פתוחות</span>
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300">{pendingTasks.length}</div>
            <div className="text-[10px] text-slate-400 truncate">
              {completedTasks.length > 0 ? `${completedTasks.length} בוצעו השבוע` : "לשבוע הקרוב"}
            </div>
          </div>

          {/* Card 4: ארון חומרים */}
          <div className="bg-slate-950/80 border border-slate-800/90 p-3.5 rounded-2xl space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>ארון חומרים</span>
              <Package className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-black text-sky-300">{chemicals.length} פריטים</div>
            <div className="text-[10px] text-slate-400 truncate">
              {lowStockChemicals.length > 0 ? `⚠️ ${lowStockChemicals.length} במלאי נמוך` : "מלאי תקין ✓"}
            </div>
          </div>
        </div>

        {/* Integrated Water Test Section inside Master Board */}
        <div className="bg-slate-950/60 border border-cyan-900/30 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-bold text-white">איכות מים ואבחון אחרון</span>
            </div>
            {latestWaterLog ? (
              <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
                נבדק בתאריך: {new Date(latestWaterLog.testedAt).toLocaleDateString("he-IL")}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">טרם תועדה בדיקת מים</span>
            )}
          </div>

          {latestWaterLog ? (
            <div className="space-y-3">
              {/* 4 Mini Parameter Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-medium">חומציות (pH)</div>
                  <div className="text-base sm:text-lg font-black text-white">{latestWaterLog.ph ?? "—"}</div>
                  <div className="text-[10px]">
                    {latestWaterLog.ph >= 7.2 && latestWaterLog.ph <= 7.6 ? (
                      <span className="text-emerald-400 font-bold">✓ אידיאלי</span>
                    ) : latestWaterLog.ph < 7.2 ? (
                      <span className="text-amber-400 font-bold">חומצי מדי</span>
                    ) : (
                      <span className="text-rose-400 font-bold">בסיסי מדי</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-medium">חיטוי</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {latestWaterLog.freeChlorine !== null ? `${latestWaterLog.freeChlorine} ppm` : "—"}
                  </div>
                  <div className="text-[10px]">
                    {latestWaterLog.freeChlorine >= 2 && latestWaterLog.freeChlorine <= 5 ? (
                      <span className="text-emerald-400 font-bold">✓ תקין</span>
                    ) : latestWaterLog.freeChlorine < 2 ? (
                      <span className="text-rose-400 font-bold">נמוך</span>
                    ) : (
                      <span className="text-amber-400 font-bold">גבוה</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-medium">בסיסיות (TA)</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {latestWaterLog.alkalinity !== null ? `${latestWaterLog.alkalinity} ppm` : "—"}
                  </div>
                  <div className="text-[10px]">
                    {latestWaterLog.alkalinity >= 80 && latestWaterLog.alkalinity <= 120 ? (
                      <span className="text-emerald-400 font-bold">✓ מאוזן</span>
                    ) : (
                      <span className="text-amber-400 font-bold">לא מאוזן</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-medium">צלילות ומצב</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {latestWaterLog.clarity === "CLEAR" ? "צלול ✨" : latestWaterLog.clarity === "FOAMY" ? "קצף ⚠️" : "עכור ⚠️"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {latestWaterLog.waterTemp ? `${latestWaterLog.waterTemp}°C` : "38°C"}
                  </div>
                </div>
              </div>

              {latestWaterLog.notes && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200 flex items-center gap-2">
                  <span className="font-bold">💡 אבחון מים:</span>
                  <span className="truncate">{latestWaterLog.notes}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 text-xs text-slate-400">
              <p>טרם בוצעה בדיקת מקלון במערכת. בצע בדיקה ראשונה לקבלת אבחון כימי מלא ומינונים מומלצים.</p>
              <Link
                href="/water-tests"
                className="text-xs bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 px-3 py-1.5 rounded-lg transition-colors font-bold shrink-0 text-center"
              >
                + בצע בדיקת מים ראשונה
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Grid: יומן ומשימות | ארון חומרים */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Column 1: 📅 יומן ומשימות */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-sky-800/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-sky-500/50 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">יומן ומשימות</h2>
                  <p className="text-[11px] text-slate-400">מעקב שגרה, שטיפות ותחזוקה</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {completedTasks.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{completedTasks.length} בוצעו</span>
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                  {pendingTasks.length} פתוחות
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {tasks.length > 0 ? (
                (() => {
                  const displayTasks = [
                    ...pendingTasks.map((t: any) => ({ ...t, isDoneForView: false })),
                    ...completedTasks.map((t: any) => ({ ...t, isDoneForView: true })),
                  ].slice(0, 5);

                  return displayTasks.map((task: any) => {
                    const isDone = task.isDoneForView ?? task.isCompleted;
                    const isOverdue = !isDone && new Date(task.nextDueDate).getTime() < Date.now();
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border transition-all space-y-1 ${
                          isDone
                            ? "bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-800/80"
                            : "bg-slate-950/70 border-slate-850 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            )}
                            <h4 className={`font-bold text-xs truncate ${isDone ? "text-slate-300 line-through decoration-emerald-500/50" : "text-white"}`}>
                              {task.title}
                            </h4>
                          </div>

                          {isDone ? (
                            <button
                              type="button"
                              onClick={() => handleResetTask(task)}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-emerald-300 border border-emerald-800 shrink-0 flex items-center gap-1 transition-colors group/btn"
                              title="לחץ כאן כדי לבטל סימון ביצוע ולהחזיר למצב לא בוצע"
                            >
                              <span className="group-hover/btn:hidden">✓ בוצע</span>
                              <span className="hidden group-hover/btn:inline">✕ בטל</span>
                            </button>
                          ) : (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                task.priority === "URGENT" || isOverdue
                                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                                  : task.priority === "HIGH"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-slate-900 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {isOverdue ? "באיחור" : task.category === "WEEKLY" ? "שבועי" : task.category === "MONTHLY" ? "חודשי" : "תקופתי"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pr-5">
                          {isDone ? (
                            <span className="text-emerald-400/90 flex items-center gap-1">
                              <span>✓</span>
                              <span>
                                בוצע בתאריך: {task.lastDoneDate ? new Date(task.lastDoneDate).toLocaleDateString("he-IL") : new Date(task.updatedAt || task.nextDueDate).toLocaleDateString("he-IL")}
                              </span>
                            </span>
                          ) : (
                            <span>תאריך יעד: {new Date(task.nextDueDate).toLocaleDateString("he-IL")}</span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs space-y-1">
                  <p>אין משימות להצגה כרגע.</p>
                  <p className="text-[11px] text-slate-500">הוסף משימות ראשונות ביומן.</p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/calendar"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <span>מעבר ליומן ותחזוקה</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Column 2: 📦 ארון חומרים ומלאי */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-blue-800/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">ארון חומרים ומלאי</h2>
                  <p className="text-[11px] text-slate-400">מעקב כמויות, זיהוי חוסרים ובטיחות</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                {chemicals.length} פריטים
              </span>
            </div>

            <div className="space-y-2.5">
              {chemicals.slice(0, 5).map((chem: any) => {
                const threshold = chem.minThreshold && chem.minThreshold > 0 ? chem.minThreshold : (chem.unit === "GRAMS" || chem.unit === "ML" ? 330 : 15);
                const isLow = chem.quantity <= threshold;
                return (
                  <div
                    key={chem.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      isLow ? "bg-rose-950/40 border-rose-800/60" : "bg-slate-950/70 border-slate-850"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200 flex items-center gap-1">
                        <span>{chem.name}</span>
                        {isLow && <span className="text-rose-400 font-bold text-[10px]">⚠️</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        נותרו: {chem.quantity} {chem.unit === "GRAMS" ? 'גר\'' : chem.unit === "ML" ? 'מ"ל' : chem.unit === "TABLETS" ? "טבליות" : chem.unit === "STRIPS" ? "מקלונים" : "יחידות"}
                      </div>
                    </div>
                    {isLow ? (
                      <span
                        className="text-[9px] font-bold bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800"
                        title="המלאי מתחת לשליש - שובצה משימת רכש להיום ביומן"
                      >
                        מתחת לשליש! (להזמין)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                        תקין
                      </span>
                    )}
                  </div>
                );
              })}

              {chemicals.some((c: any) => c.quantity <= (c.minThreshold && c.minThreshold > 0 ? c.minThreshold : (c.unit === "GRAMS" || c.unit === "ML" ? 330 : 15))) && (
                <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-[10px] flex items-center gap-1.5">
                  <span>🔔</span>
                  <span>חומרים מתחת לשליש: שובצו משימות רכש להיום ביומן.</span>
                </div>
              )}

              {chemicals.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs space-y-1">
                  <p>ארון החומרים ריק כעת.</p>
                  <p className="text-[11px] text-slate-500">הוסף חומרים ראשונים למעקב כמויות.</p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/inventory"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <span>מעבר לארון חומרים ומלאי</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
