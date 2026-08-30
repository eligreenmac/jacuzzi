"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  FlaskConical,
  Package,
  History,
  Camera,
  ArrowRight,
  ShieldCheck,
  Zap,
  ShoppingCart,
  Search,
  ExternalLink,
  Check,
  Info,
  Calendar,
} from "lucide-react";

export default function WaterDoctorPage() {
  const [clarity, setClarity] = useState("CLEAR");
  const [description, setDescription] = useState("");

  // Test strip states + "Unknown" toggles
  const [phUnknown, setPhUnknown] = useState(false);
  const [ph, setPh] = useState("7.4");

  const [clUnknown, setClUnknown] = useState(false);
  const [freeChlorine, setFreeChlorine] = useState("3.0");

  const [alkUnknown, setAlkUnknown] = useState(false);
  const [alkalinity, setAlkalinity] = useState("90");

  const [imagePreview, setImagePreview] = useState("");
  const [imageMimeType, setImageMimeType] = useState("");

  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [addedLedger, setAddedLedger] = useState<any[]>([]);
  const [savedToLog, setSavedToLog] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSavedToLog(false);

    try {
      const res = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waterClarity: clarity,
          description,
          ph: phUnknown ? "UNKNOWN" : ph ? parseFloat(ph) : "UNKNOWN",
          freeChlorine: clUnknown ? "UNKNOWN" : freeChlorine ? parseFloat(freeChlorine) : "UNKNOWN",
          alkalinity: alkUnknown ? "UNKNOWN" : alkalinity ? parseFloat(alkalinity) : "UNKNOWN",
          imageBase64: imagePreview || undefined,
          imageMimeType: imageMimeType || undefined,
          saveToLog: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה באבחון");

      setDiagnosis(data.diagnosis);
      setAddedLedger(data.addedChemicalsLedger || []);
      setSavedToLog(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [executingStep, setExecutingStep] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleExecuteStep = async (step: any, isScheduleAction = false) => {
    setExecutingStep(step.stepNumber);
    setActionNotice(null);

    let hoursAhead = 24;
    if (step.title.includes("12 שעות") || step.instructions?.includes("12 שעות")) hoursAhead = 12;
    else if (step.title.includes("6 שעות") || step.instructions?.includes("6 שעות")) hoursAhead = 6;
    else if (step.title.includes("48 שעות") || step.instructions?.includes("48 שעות")) hoursAhead = 48;

    try {
      const res = await fetch("/api/log/execute-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepNumber: step.stepNumber,
          title: step.title,
          chemical: step.chemical,
          amount: step.amount,
          instructions: step.instructions,
          actionType: isScheduleAction ? "SCHEDULE_FUTURE" : "EXECUTE_NOW",
          hoursAhead,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בביצוע הפעולה");

      setActionNotice(data.message || (isScheduleAction ? "המשימה תוזמנה בהצלחה ללוח השנה!" : "הפעולה בוצעה ותועדה בהצלחה ביומן!"));

      // Update step status in memory
      setDiagnosis((prev: any) => {
        if (!prev || !prev.stepByStepPlan) return prev;
        return {
          ...prev,
          stepByStepPlan: prev.stepByStepPlan.map((s: any) =>
            s.stepNumber === step.stepNumber
              ? isScheduleAction
                ? { ...s, isScheduled: true, scheduledFor: data.scheduledFor, isExecuted: false }
                : { ...s, isScheduled: false, isExecuted: true, executedAt: new Date().toISOString() }
              : s
          ),
        };
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExecutingStep(null);
    }
  };

  const clarityOptions = [
    { value: "CLEAR", label: "מים צלולים", icon: "✨", desc: "שקופים לחלוטין וללא ריח" },
    { value: "SLIGHTLY_CLOUDY", label: "מעט עכורים", icon: "🌫️", desc: "ראות מופחתת קלות בקרקעית" },
    { value: "VERY_CLOUDY", label: "עכורים מאוד", icon: "🥛", desc: "מים חלביים / אטומים" },
    { value: "FOAMY", label: "מקציפים", icon: "🧼", desc: "שכבת קצף בעת הפעלת ג'טים" },
    { value: "GREEN", label: "ירוקים / אצות", icon: "🌿", desc: "גוון ירקרק או דפנות חלקלקות" },
    { value: "METALLIC_COPPER", label: "ירוק-טורקיז / נחושת", icon: "🪙", desc: "מים צלולים בגוון טורקיז הנובעים מחמצון נחושת (שחיקת גופי חימום)" },
    { value: "METALLIC_RUST", label: "חום / חלודה / ברזל", icon: "⚙️", desc: "מים בגוון צהבהב, חום או חלודה מנוכחות ברזל במים" },
    { value: "BAD_ODOR", label: "ריח חריף / צריבה", icon: "👃", desc: "ריח כלוראמינים חזק או צריבה בעיניים" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
          <Sparkles className="w-4 h-4" />
          <span>מופעל על ידי Gemini 3.7 AI • שקלול מלא של ארון החומרים, המינונים ומניעת מינון יתר</span>
        </div>
        <h1 className="text-3xl font-black text-white">רופא המים של הג'קוזי</h1>
        <p className="text-sm text-slate-300">
          תאר את מצב המים, הזן ערכים שידועים לך (או סמן "לא יודע"), וה-AI יגיד לך בדיוק איזה חומרים מהארון להוסיף, ומה לחפש ברשת לרכישה.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <span>הזנת נתוני בדיקה</span>
          </h2>

          <form onSubmit={handleDiagnose} className="space-y-5">
            {/* Clarity picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">1. מראה וצלילות המים כרגע</label>
              <div className="grid grid-cols-2 gap-2">
                {clarityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setClarity(opt.value)}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      clarity === opt.value
                        ? "bg-cyan-500/20 border-cyan-400 text-white shadow-inner"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-lg mb-1">{opt.icon}</div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Test strip values with "Unknown" toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  2. ערכי בדיקת מקלון (ניתן לסמן "לא יודע"):
                </label>
              </div>

              {/* pH Input */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">חומציות (pH)</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={phUnknown}
                      onChange={(e) => setPhUnknown(e.target.checked)}
                      className="accent-cyan-500 w-3.5 h-3.5 rounded"
                    />
                    <span>לא יודע / לא נבדק</span>
                  </label>
                </div>
                {!phUnknown ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      min="6.0"
                      max="8.8"
                      value={ph}
                      onChange={(e) => setPh(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                    />
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">יעד: 7.2 - 7.6</span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 bg-amber-950/30 p-2 rounded-xl border border-amber-900/50">
                    ה-AI יסתמך על מראה המים והחומרים שהוספו לאחרונה וימליץ לבדוק מקלון.
                  </div>
                )}
              </div>

              {/* Free Chlorine Input */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">כלור חופשי / ברום (ppm)</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={clUnknown}
                      onChange={(e) => setClUnknown(e.target.checked)}
                      className="accent-cyan-500 w-3.5 h-3.5 rounded"
                    />
                    <span>לא יודע / לא נבדק</span>
                  </label>
                </div>
                {!clUnknown ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="15"
                      value={freeChlorine}
                      onChange={(e) => setFreeChlorine(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                    />
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">יעד: 2.0 - 4.0</span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 bg-amber-950/30 p-2 rounded-xl border border-amber-900/50">
                    ה-AI יחשב מינון לפי מראה המים וזמן השוק האחרון.
                  </div>
                )}
              </div>

              {/* Alkalinity Input */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">בסיסיות כוללת (Total Alkalinity)</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={alkUnknown}
                      onChange={(e) => setAlkUnknown(e.target.checked)}
                      className="accent-cyan-500 w-3.5 h-3.5 rounded"
                    />
                    <span>לא יודע / לא נבדק</span>
                  </label>
                </div>
                {!alkUnknown ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="10"
                      min="0"
                      max="300"
                      value={alkalinity}
                      onChange={(e) => setAlkalinity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                    />
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">יעד: 80 - 120</span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 bg-amber-950/30 p-2 rounded-xl border border-amber-900/50">
                    בסיסיות לא ידועה - תומלץ בדיקה לייצוב ה-pH.
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">3. תיאור נוסף של התופעה (חופשי)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="למשל: המים היו צלולים עד שלשום, אחרי 4 אנשים הופיע קצף וריח..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs placeholder:text-slate-500"
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">4. צילום המים או מקלון הבדיקה (אופציונלי)</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 bg-slate-950 border border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl text-xs text-slate-400 hover:text-white transition-all">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>{imagePreview ? "החלף צילום" : "העלה צילום מים / מקלון"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-cyan-500/50">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini מנתח את ההיסטוריה ומחשב מינונים...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>אבחן מים וקבל מרשם לטיפול</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output & Plan (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!diagnosis ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-lg font-bold text-white">האבחון יופיע כאן</h3>
                <p className="text-xs text-slate-400">
                  מלא את מה שידוע לך ולחץ על "אבחן מים". ה-AI יסרוק את ארון החומרים שלך, יציין איזה חומרים זמינים להוספה מיידית, ומה לחפש ברשת לרכישה.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${
                      diagnosis.severity === "GOOD"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : diagnosis.severity === "ATTENTION"
                        ? "bg-sky-950 text-sky-300 border-sky-800"
                        : diagnosis.severity === "WARNING"
                        ? "bg-amber-950 text-amber-300 border-amber-800"
                        : "bg-rose-950 text-rose-300 border-rose-800"
                    }`}
                  >
                    {diagnosis.severity === "GOOD"
                      ? "מצב מצוין"
                      : diagnosis.severity === "ATTENTION"
                      ? "נדרש איזון קל"
                      : diagnosis.severity === "WARNING"
                      ? "אזהרה - דורש טיפול"
                      : "מצב קריטי - סכנת רחצה"}
                  </span>
                  <h2 className="text-xl font-bold text-white">{diagnosis.waterStatusSummary}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                      diagnosis.safeToBathe
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {diagnosis.safeToBathe ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{diagnosis.safeToBathe ? "בטוח לרחצה" : "אין להתרחץ כרגע!"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>זמן שיקום: {diagnosis.estimatedRecoveryTime}</span>
                  </div>
                </div>
              </div>

              {actionNotice && (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-xl animate-fade-in">
                  <div className="flex items-center gap-2.5 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{actionNotice}</span>
                  </div>
                  <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chemical Ledger Analysis (What was already added) */}
              {(diagnosis.recentAdditionsAnalysis?.length > 0 || addedLedger.length > 0) && (
                <div className="bg-cyan-950/40 border border-cyan-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Package className="w-4 h-4" />
                    <span>חומרים שהוכנסו לג'קוזי ונלקחו בחשבון בחישוב ה-AI:</span>
                  </div>

                  {diagnosis.recentAdditionsAnalysis?.map((item: string, idx: number) => (
                    <div key={idx} className="text-xs text-slate-200">
                      💡 {item}
                    </div>
                  ))}

                  {addedLedger.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {addedLedger.map((add, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-cyan-800 text-[11px] text-cyan-300"
                        >
                          {add.chemical} ({add.amount || ""}) • {new Date(add.date).toLocaleDateString("he-IL")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Root Cause Analysis Banner */}
              {diagnosis.rootCauseAnalysis && (
                <div className="bg-purple-950/40 border border-purple-800/80 rounded-2xl p-4 space-y-1.5 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <Info className="w-4 h-4 text-purple-400" />
                    <span>ניתוח מקצועי של שורש הבעיה (Root Cause):</span>
                  </div>
                  <div className="text-xs text-purple-200/90 leading-relaxed pr-6">
                    {diagnosis.rootCauseAnalysis}
                  </div>
                </div>
              )}

              {/* Inventory Overview Card: Available in Cabinet vs Missing to Buy */}
              {diagnosis.inventoryStatus && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Ready in Cabinet */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-900/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-emerald-950 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4" />
                        <span>זמין בארון החומרים שלך:</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
                        {diagnosis.inventoryStatus.availableInCabinet.length} פריטים
                      </span>
                    </div>

                    {diagnosis.inventoryStatus.availableInCabinet.length === 0 ? (
                      <div className="text-[11px] text-slate-400 py-1">
                        אין צורך בחומרים נוספים או שאין חומרים תואמים בארון.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {diagnosis.inventoryStatus.availableInCabinet.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-200 flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-850">
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-[11px] text-emerald-300 font-bold">נותרו: {item.remaining}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Missing to Buy Online */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-amber-900/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-amber-950 pb-2">
                      <div className="flex items-center gap-1.5">
                        <ShoppingCart className="w-4 h-4" />
                        <span>חומרים חסרים - לקנייה ברשת:</span>
                      </div>
                      <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800">
                        {diagnosis.inventoryStatus.missingToBuy.length} פריטים
                      </span>
                    </div>

                    {diagnosis.inventoryStatus.missingToBuy.length === 0 ? (
                      <div className="text-[11px] text-emerald-400 py-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>כל החומרים הנדרשים זמינים בארון שלך!</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {diagnosis.inventoryStatus.missingToBuy.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs bg-slate-900/80 p-2 rounded-xl border border-slate-850 flex items-center justify-between gap-2">
                            <div>
                              <div className="font-semibold text-amber-200">{item.name}</div>
                              <div className="text-[10px] text-slate-400">חפש: "{item.searchKeywords}"</div>
                            </div>
                            <a
                              href={item.searchUrl || `https://www.google.com/search?q=${encodeURIComponent(item.searchKeywords)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-all shrink-0"
                            >
                              <Search className="w-3 h-3" />
                              <span>חפש ברשת</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Historical Insights and Missing Test Alerts */}
              {(diagnosis.historicalInsights?.length > 0 || diagnosis.missingTestsAlerts?.length > 0) && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                    <History className="w-4 h-4" />
                    <span>תובנות היסטוריות ופערי זמנים:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {diagnosis.historicalInsights?.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {diagnosis.missingTestsAlerts?.map((item: string, idx: number) => (
                      <li key={idx} className="text-amber-300 font-medium">⚠️ {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step By Step Treatment Plan */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>תוכנית טיפול ומינונים צעד-אחר-צעד</span>
                </h3>

                <div className="space-y-3">
                  {diagnosis.stepByStepPlan?.map((step: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black flex items-center justify-center border border-cyan-500/30">
                            {step.stepNumber || idx + 1}
                          </span>
                          <span className="font-bold text-sm text-white">{step.title}</span>
                        </div>

                        {step.amount && step.amount !== "לפי שגרה" && (
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 font-extrabold text-xs border border-cyan-800">
                            מינון: {step.amount}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-300 leading-relaxed pr-8">{step.instructions}</div>

                      {/* Chemical Cabinet / Shopping Match for this Step */}
                      {step.chemical && step.chemical !== "ללא חומר" && step.chemical !== "תחזוקה רגילה" && (
                        <div className="mr-8">
                          {step.inInventory ? (
                            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>
                                  <strong>קיים בארון שלך:</strong> {step.inventoryItemName || step.chemical} (נותרו: {step.inventoryRemaining || "במלאי"})
                                </span>
                              </div>
                              <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-md font-bold text-emerald-200">
                                מוכן לשימוש ✅
                              </span>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/80 text-amber-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <ShoppingCart className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="font-bold text-amber-300">חסר בארון החומרים שלך - נדרש לרכוש</span>
                                </div>
                                <a
                                  href={`https://www.google.com/search?q=${encodeURIComponent(step.searchKeywords || step.chemical + " לג'קוזי")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition-all shadow"
                                >
                                  <Search className="w-3 h-3" />
                                  <span>חפש ברשת לרכישה</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <div className="text-[11px] text-amber-300/80 pr-6">
                                💡 {step.buyRecommendation || `חפש ברשת: "${step.searchKeywords || step.chemical}" באתרי ציוד בריכות וספא`}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {step.safetyWarning && (
                        <div className="mr-8 p-2 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-300 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{step.safetyWarning}</span>
                        </div>
                      )}

                      {/* Action Button: Schedule Future Task vs Immediate Done */}
                      <div className="mr-8 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                        {step.isExecuted ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>
                              בוצע ותועד ביומן {step.executedAt ? `(${new Date(step.executedAt).toLocaleDateString("he-IL")} ${new Date(step.executedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})` : "✅"}
                            </span>
                          </div>
                        ) : step.isScheduled ? (
                          <div className="flex items-center justify-between gap-2 w-full flex-wrap">
                            <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-800">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>
                                ⏳ תוזמן ללוח השנה {step.scheduledFor ? `ל-${new Date(step.scheduledFor).toLocaleDateString("he-IL")} ${new Date(step.scheduledFor).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}` : ""}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={executingStep === step.stepNumber}
                              onClick={() => handleExecuteStep(step, false)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>סמן כבוצע כעת</span>
                            </button>
                          </div>
                        ) : step.stepType === "FOLLOW_UP" || step.title.includes("בעוד") || step.title.includes("להמשך") ? (
                          <button
                            type="button"
                            disabled={executingStep === step.stepNumber}
                            onClick={() => handleExecuteStep(step, true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>{executingStep === step.stepNumber ? "מתזמן ללוח השנה..." : "📅 הכנס ללוח השנה (תזמן ליומן)"}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={executingStep === step.stepNumber}
                            onClick={() => handleExecuteStep(step, false)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{executingStep === step.stepNumber ? "מתעד ביומן ומפחית מהארון..." : "✓ סמן כבוצע כעת ותעד ביומן"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow up Requirements & Prevention Guidelines */}
              {((diagnosis.followUpRequirements && diagnosis.followUpRequirements.length > 0) || (diagnosis.preventionGuidelines && diagnosis.preventionGuidelines.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {diagnosis.followUpRequirements?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 shadow">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-2 border-b border-slate-900 pb-1.5">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>פעולות חובה להמשך (24-48 שעות):</span>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {diagnosis.followUpRequirements.map((req: string, idx: number) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diagnosis.preventionGuidelines?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 shadow">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-2 border-b border-slate-900 pb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>הנחיות מניעה לפעמים הבאות:</span>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {diagnosis.preventionGuidelines.map((prev: string, idx: number) => (
                          <li key={idx}>{prev}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* General Tips */}
              {diagnosis.generalTips?.length > 0 && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>המלצות זהב של רופא המים:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                    {diagnosis.generalTips.map((tip: string, idx: number) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
                <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>תוצאות האבחון נשמרו בהיסטוריית הבדיקות שלך!</span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/inventory"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>נהל ארון חומרים</span>
                  </Link>

                  <Link
                    href="/calendar"
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>עבור ללוח השנה להזנת ביצוע</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
