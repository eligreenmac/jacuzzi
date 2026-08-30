"use client";

import { useState } from "react";
import {
  Sparkles,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Camera,
  X,
  FileCheck,
  Send,
  RefreshCw,
  ShieldCheck,
  Zap,
  History,
  Info,
  Package,
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

  const clarityOptions = [
    { value: "CLEAR", label: "מים צלולים", icon: "✨", desc: "שקופים לחלוטין וללא ריח" },
    { value: "SLIGHTLY_CLOUDY", label: "מעט עכורים", icon: "🌫️", desc: "ראות מופחתת קלות בקרקעית" },
    { value: "VERY_CLOUDY", label: "עכורים מאוד", icon: "🥛", desc: "מים חלביים / אטומים" },
    { value: "FOAMY", label: "מקציפים", icon: "🧼", desc: "שכבת קצף בעת הפעלת ג'טים" },
    { value: "GREEN", label: "ירוקים / אצות", icon: "🌿", desc: "גוון ירקרק או דפנות חלקלקות" },
    { value: "BAD_ODOR", label: "ריח חריף / צריבה", icon: "👃", desc: "ריח כלוראמינים חזק או צריבה בעיניים" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
          <Sparkles className="w-4 h-4" />
          <span>מופעל על ידי Gemini 3.7 AI • שקלול מלא של חומרים שהוספו ומניעת מינון יתר</span>
        </div>
        <h1 className="text-3xl font-black text-white">רופא המים של הג'קוזי</h1>
        <p className="text-sm text-slate-300">
          תאר את מצב המים, הזן ערכים שידועים לך (או סמן "לא יודע"), וה-AI יחשב מינונים בהתחשב בחומרים שכבר הוכנסו לג'קוזי.
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
                    <span className="text-[10px] text-slate-500 shrink-0">מומלץ: 7.2-7.6</span>
                  </div>
                ) : (
                  <div className="text-center py-1 text-xs text-amber-400/80 font-medium">
                    לא ידוע (ה-AI ימליץ לפי מראה המים וההיסטוריה)
                  </div>
                )}
              </div>

              {/* Chlorine Input */}
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
                    <span className="text-[10px] text-slate-500 shrink-0">מומלץ: 3.0-5.0</span>
                  </div>
                ) : (
                  <div className="text-center py-1 text-xs text-amber-400/80 font-medium">
                    לא ידוע (ה-AI ימליץ לפי מראה המים)
                  </div>
                )}
              </div>

              {/* Alkalinity Input */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">בסיסיות כוללת (TA ppm)</span>
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
                      step="5"
                      min="0"
                      max="300"
                      value={alkalinity}
                      onChange={(e) => setAlkalinity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500 shrink-0">מומלץ: 80-120</span>
                  </div>
                ) : (
                  <div className="text-center py-1 text-xs text-amber-400/80 font-medium">
                    לא ידוע (ה-AI ימליץ לפי שגרה)
                  </div>
                )}
              </div>
            </div>

            {/* Free text description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">3. תיאור חופשי של המצב</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="למשל: היו 4 מתרחצים אתמול, המים נראים מעט אטומים..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">צילום מים או מקלון בדיקה (אופציונלי)</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition-colors border border-slate-700">
                  <Camera className="w-4 h-4" />
                  <span>העלה צילום</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview("")}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

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
                  מלא את מה שידוע לך ולחץ על "אבחן מים". ה-AI ישקלל את כל החומרים שכבר הוספת בעבר לג'קוזי ואת המועדים המדויקים.
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
                      className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2 relative overflow-hidden"
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

                      {step.safetyWarning && (
                        <div className="mr-8 p-2 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-300 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{step.safetyWarning}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* General Tips */}
              {diagnosis.generalTips?.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>דגשים להמשך תחזוקה</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                    {diagnosis.generalTips.map((tip: string, idx: number) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {savedToLog && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-4 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>האבחון נשמר אוטומטית ביומן הטיפולים שלך.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
