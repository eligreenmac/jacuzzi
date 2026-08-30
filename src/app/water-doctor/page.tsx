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
  Camera,
  ArrowRight,
  ShieldCheck,
  Zap,
  ShoppingCart,
  Search,
  ExternalLink,
  Info,
  HelpCircle,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { WATER_PARAMETERS_GUIDE, ParameterInfo } from "@/lib/water-parameters-guide";

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

  // Advanced / Lab Measurements
  const [calciumUnknown, setCalciumUnknown] = useState(true);
  const [calcium, setCalcium] = useState("180");

  const [cyaUnknown, setCyaUnknown] = useState(true);
  const [cya, setCya] = useState("40");

  const [tdsUnknown, setTdsUnknown] = useState(true);
  const [tds, setTds] = useState("1200");

  const [phosphatesUnknown, setPhosphatesUnknown] = useState(true);
  const [phosphates, setPhosphates] = useState("50");

  const [waterTemp, setWaterTemp] = useState("38");

  const [showAdvancedParams, setShowAdvancedParams] = useState(true);

  // Modal explanation state
  const [selectedParamModal, setSelectedParamModal] = useState<ParameterInfo | null>(null);

  const [imagePreview, setImagePreview] = useState("");
  const [imageMimeType, setImageMimeType] = useState("");

  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [addedLedger, setAddedLedger] = useState<any[]>([]);
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
          calcium: calciumUnknown ? "UNKNOWN" : calcium ? parseFloat(calcium) : "UNKNOWN",
          cya: cyaUnknown ? "UNKNOWN" : cya ? parseFloat(cya) : "UNKNOWN",
          tds: tdsUnknown ? "UNKNOWN" : tds ? parseFloat(tds) : "UNKNOWN",
          phosphates: phosphatesUnknown ? "UNKNOWN" : phosphates ? parseFloat(phosphates) : "UNKNOWN",
          waterTemp: waterTemp ? parseFloat(waterTemp) : 38,
          imageBase64: imagePreview || undefined,
          imageMimeType: imageMimeType || undefined,
          saveToLog: false, // Pure theoretical sandbox - does not write to system history
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה באבחון");

      setDiagnosis(data.diagnosis);
      setAddedLedger(data.addedChemicalsLedger || []);
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
    { value: "METALLIC_COPPER", label: "ירוק-טורקיז / נחושת", icon: "🪙", desc: "מים צלולים בגוון טורקיז הנובעים מחמצון נחושת (שחיקת גופי חימום)" },
    { value: "METALLIC_RUST", label: "חום / חלודה / ברזל", icon: "⚙️", desc: "מים בגוון צהבהב, חום או חלודה מנוכחות ברזל במים" },
    { value: "BAD_ODOR", label: "ריח חריף / צריבה", icon: "👃", desc: "ריח כלוראמינים חזק או צריבה בעיניים" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Parameter Explanation Modal */}
      {selectedParamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-right">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 text-2xl flex items-center justify-center border border-cyan-500/20">
                  {selectedParamModal.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedParamModal.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{selectedParamModal.nameEn} • {selectedParamModal.unit}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParamModal(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Range Pill */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/50 border border-cyan-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="font-bold text-cyan-300">🎯 טווח יעד אידיאלי לג'קוזי:</span>
              <span className="font-black text-cyan-200 bg-cyan-900/60 px-3 py-1 rounded-xl text-sm border border-cyan-700">
                {selectedParamModal.idealRange}
              </span>
            </div>

            {/* Section 1: What is it? */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span>💡</span>
                <span>מה זה אומר בדיוק?</span>
              </h4>
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850 whitespace-pre-line">
                {selectedParamModal.whatIsIt}
              </div>
            </div>

            {/* Section 2: Risks if High */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>מה הסכנות כשהערך גבוה מדי?</span>
              </h4>
              <div className="text-xs text-rose-200/90 leading-relaxed bg-rose-950/30 p-3.5 rounded-2xl border border-rose-900/50 whitespace-pre-line">
                {selectedParamModal.risksIfHigh}
              </div>
            </div>

            {/* Section 3: Risks if Low */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>מה הסכנות כשהערך נמוך מדי?</span>
              </h4>
              <div className="text-xs text-amber-200/90 leading-relaxed bg-amber-950/30 p-3.5 rounded-2xl border border-amber-900/50 whitespace-pre-line">
                {selectedParamModal.risksIfLow}
              </div>
            </div>

            {/* Section 4: How to Treat */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>איך מטפלים ואיך לאזן?</span>
              </h4>
              <div className="text-xs text-emerald-200/90 leading-relaxed bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-900/50 whitespace-pre-line">
                {selectedParamModal.howToTreat}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedParamModal(null)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all shadow"
            >
              סגור חלון הסבר
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>מרחב ייעוץ ובדיקות תיאורטיות (Sandbox) • שיח פתוח ללא שמירה בהיסטוריה</span>
        </div>
        <h1 className="text-3xl font-black text-white">רופא המים של הג'קוזי (ייעוץ מורכב ומעמיק)</h1>
        <p className="text-sm text-slate-300">
          מרחב ייעוץ מדעי ופתוח לכל מדדי המים. לחץ על כפתור <strong>(?)</strong> ליד כל מדד להסבר מעמיק על סכנות ודרכי טיפול.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <span>הזנת נתוני בדיקה מתקדמת</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">לחץ (?) להסבר מדד</span>
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

            {/* Routine Strip Parameters */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. בדיקות יסוד שגרתיות (מקלון 3 ב-1)</span>
                </label>
              </div>

              {/* pH Input */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">חומציות (pH)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedParamModal(WATER_PARAMETERS_GUIDE.ph)}
                      className="text-cyan-400 hover:text-cyan-300 p-0.5"
                      title="לחץ להסבר מלא על pH, סכנות וטיפול"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={phUnknown}
                      onChange={(e) => setPhUnknown(e.target.checked)}
                      className="accent-cyan-500 w-3.5 h-3.5 rounded"
                    />
                    <span>לא יודע</span>
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
                    ה-AI יסתמך על מראה המים והחומרים שהוספו לאחרונה.
                  </div>
                )}
              </div>

              {/* Free Chlorine Input */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">כלור חופשי / ברום (ppm)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedParamModal(WATER_PARAMETERS_GUIDE.freeChlorine)}
                      className="text-cyan-400 hover:text-cyan-300 p-0.5"
                      title="לחץ להסבר מלא על כלור וברום, סכנות וטיפול"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={clUnknown}
                      onChange={(e) => setClUnknown(e.target.checked)}
                      className="accent-cyan-500 w-3.5 h-3.5 rounded"
                    />
                    <span>לא יודע</span>
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
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">בסיסיות כוללת (TA - ppm)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedParamModal(WATER_PARAMETERS_GUIDE.alkalinity)}
                      className="text-cyan-400 hover:text-cyan-300 p-0.5"
                      title="לחץ להסבר מלא על בסיסיות, סכנות וטיפול"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={alkUnknown}
                      onChange={(e) => setAlkUnknown(e.target.checked)}
                      className="accent-cyan-500 w-3.5 h-3.5 rounded"
                    />
                    <span>לא יודע</span>
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

              {/* Water Temperature */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">טמפרטורת מים (°C)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedParamModal(WATER_PARAMETERS_GUIDE.waterTemp)}
                      className="text-cyan-400 hover:text-cyan-300 p-0.5"
                      title="לחץ להסבר על טמפרטורה ובטיחות"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">יעד: 36°C - 39°C</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="20"
                    max="42"
                    value={waterTemp}
                    onChange={(e) => setWaterTemp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                  />
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">מעלות צלזיוס</span>
                </div>
              </div>
            </div>

            {/* Advanced & Lab Measurements Toggle */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <button
                type="button"
                onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>3. מדידות מעבדה ומדדים מתקדמים (אופציונלי)</span>
                </div>
                {showAdvancedParams ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showAdvancedParams && (
                <div className="space-y-3 pl-1 pr-1 animate-fadeIn">
                  {/* Calcium Hardness */}
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">קשיות סידן (Calcium Hardness - ppm)</span>
                        <button
                          type="button"
                          onClick={() => setSelectedParamModal(WATER_PARAMETERS_GUIDE.calcium)}
                          className="text-cyan-400 hover:text-cyan-300 p-0.5"
                          title="לחץ להסבר מלא על קשיות סידן, אבנית וקורוזיה"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={calciumUnknown}
                          onChange={(e) => setCalciumUnknown(e.target.checked)}
                          className="accent-cyan-500 w-3.5 h-3.5 rounded"
                        />
                        <span>לא יודע</span>
                      </label>
                    </div>
                    {!calciumUnknown ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="10"
                          min="0"
                          max="600"
                          value={calcium}
                          onChange={(e) => setCalcium(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                        />
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">יעד: 150 - 250</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                        לא צוין • מומלץ לבדוק אחת לחודש למניעת אבנית או שחיקת גופי חימום.
                      </div>
                    )}
                  </div>

                  {/* Cyanuric Acid (CYA) */}
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">חומצה ציאנורית / מייצב (CYA - ppm)</span>
                        <button
                          type="button"
                          onClick={() => setSelectedParamModal(WATER_PARAMETERS_GUIDE.cya)}
                          className="text-cyan-400 hover:text-cyan-300 p-0.5"
                          title="לחץ להסבר על חומצה ציאנורית ונעילת כלור"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={cyaUnknown}
                          onChange={(e) => setCyaUnknown(e.target.checked)}
                          className="accent-cyan-500 w-3.5 h-3.5 rounded"
                        />
                        <span>לא יודע</span>
                      </label>
                    </div>
                    {!cyaUnknown ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="5"
                          min="0"
                          max="150"
                          value={cya}
                          onChange={(e) => setCya(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                        />
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">יעד: 30 - 50</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                        לא צוין • מזהה תופעת "נעילת כלור" (Chlorine Lock) משימוש ממושך בדיכלור.
                      </div>
                    )}
                  </div>

                  {/* Total Dissolved Solids (TDS) */}
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">מוצקים מומסים / מלח (TDS - ppm)</span>
                        <button
                          type="button"
                          onClick={() => setSelectedParamModal(WATER_PARAMETERS_GUIDE.tds)}
                          className="text-cyan-400 hover:text-cyan-300 p-0.5"
                          title="לחץ להסבר על TDS ועומס מים"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={tdsUnknown}
                          onChange={(e) => setTdsUnknown(e.target.checked)}
                          className="accent-cyan-500 w-3.5 h-3.5 rounded"
                        />
                        <span>לא יודע</span>
                      </label>
                    </div>
                    {!tdsUnknown ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="50"
                          min="0"
                          max="4000"
                          value={tds}
                          onChange={(e) => setTds(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                        />
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">יעד: 500 - 1500</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                        לא צוין • מעל 2,000 ppm המים נחשבים "עייפים" ומחייבים החלפת מים.
                      </div>
                    )}
                  </div>

                  {/* Phosphates */}
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">פוספטים / זרחן (Phosphates - ppb)</span>
                        <button
                          type="button"
                          onClick={() => setSelectedParamModal(WATER_PARAMETERS_GUIDE.phosphates)}
                          className="text-cyan-400 hover:text-cyan-300 p-0.5"
                          title="לחץ להסבר על פוספטים ומניעת אצות"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={phosphatesUnknown}
                          onChange={(e) => setPhosphatesUnknown(e.target.checked)}
                          className="accent-cyan-500 w-3.5 h-3.5 rounded"
                        />
                        <span>לא יודע</span>
                      </label>
                    </div>
                    {!phosphatesUnknown ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="10"
                          min="0"
                          max="1000"
                          value={phosphates}
                          onChange={(e) => setPhosphates(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center focus:border-cyan-500"
                        />
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">יעד: &lt; 100 ppb</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                        לא צוין • מזהה "מזון לאצות" שמחסל במהירות את הכלור במים.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300">4. תיאור נוסף של התופעה (חופשי)</label>
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
              <label className="text-xs font-semibold text-slate-300">5. צילום המים או מקלון הבדיקה (אופציונלי)</label>
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
                  <span>Gemini מנתח את כל המדדים וההיסטוריה...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>אבחן מים וקבל מרשם מורכב לטיפול</span>
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
                <h3 className="text-lg font-bold text-white">האבחון המורכב יופיע כאן</h3>
                <p className="text-xs text-slate-400">
                  הזן את המדדים הידועים לך ולחץ על "אבחן מים". ה-AI יסרוק את שילוב כל המדדים הכימיים, יזהה שורש בעיה ויספק מרשם טיפול מדויק.
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
                      ? "מים תקינים לחלוטין"
                      : diagnosis.severity === "ATTENTION"
                      ? "דורש תשומת לב קלה"
                      : diagnosis.severity === "WARNING"
                      ? "אזהרה - נדרש איזון מיידי"
                      : "קריטי - מים לא ראויים לרחצה"}
                  </span>
                  <h3 className="text-xl font-black text-white">{diagnosis.waterStatusSummary}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                      diagnosis.safeToBathe
                        ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                        : "bg-rose-950/60 border-rose-800 text-rose-300"
                    }`}
                  >
                    {diagnosis.safeToBathe ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{diagnosis.safeToBathe ? "בטוח לרחצה" : "אסור לרחצה כעת"}</span>
                  </div>

                  {diagnosis.estimatedRecoveryTime && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>זמן התאוששות: {diagnosis.estimatedRecoveryTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Root Cause Analysis */}
              {diagnosis.rootCauseAnalysis && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-900/60 space-y-1.5">
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>ניתוח שורש הבעיה הכימי (Root Cause Analysis):</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed">
                    {diagnosis.rootCauseAnalysis}
                  </p>
                </div>
              )}

              {/* History & Additions Insights */}
              {((diagnosis.historicalInsights && diagnosis.historicalInsights.length > 0) || (diagnosis.recentAdditionsAnalysis && diagnosis.recentAdditionsAnalysis.length > 0)) && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>תובנות מבוססות היסטוריית טיפולים:</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {diagnosis.historicalInsights?.map((insight: string, idx: number) => (
                      <li key={idx}>{insight}</li>
                    ))}
                    {diagnosis.recentAdditionsAnalysis?.map((addition: string, idx: number) => (
                      <li key={`add-${idx}`}>{addition}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step by Step Treatment Plan */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-cyan-400" />
                  <span>תוכנית טיפול ומרשם חומרים מותאם אישית:</span>
                </h4>

                <div className="space-y-3">
                  {diagnosis.stepByStepPlan?.map((step: any) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3 hover:border-slate-700 transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center shrink-0 border border-cyan-500/40">
                            {step.stepNumber}
                          </span>
                          <div>
                            <h5 className="font-bold text-white text-sm">{step.title}</h5>
                            <div className="text-xs text-cyan-300 font-semibold mt-0.5">
                              חומר: {step.chemical} • מינון מומלץ: <span className="text-white font-bold">{step.amount}</span>
                            </div>
                          </div>
                        </div>

                        {step.stepType && (
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              step.stepType === "ROOT_CAUSE"
                                ? "bg-purple-950 text-purple-300 border-purple-800"
                                : step.stepType === "IMMEDIATE_RELIEF"
                                ? "bg-blue-950 text-blue-300 border-blue-800"
                                : "bg-emerald-950 text-emerald-300 border-emerald-800"
                            }`}
                          >
                            {step.stepType === "ROOT_CAUSE"
                              ? "🎯 טיפול בשורש הבעיה"
                              : step.stepType === "IMMEDIATE_RELIEF"
                              ? "⚡ הקלה מיידית"
                              : "📅 פעולת המשך"}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pr-8">
                        {step.instructions}
                      </p>

                      {/* Cabinet vs Store Inventory Status */}
                      {step.chemical && !step.chemical.includes("ללא חומר") && !step.chemical.includes("תחזוקה") && !step.chemical.includes("שטיפת פילטר") && (
                        <div className="mr-8">
                          {step.inInventory ? (
                            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center justify-between flex-wrap gap-2">
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

              {/* Sandbox Notice & Action Links */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
                <div className="text-xs text-purple-300 flex items-center gap-2 bg-purple-950/40 px-3.5 py-2 rounded-xl border border-purple-850">
                  <Info className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>מרחב ייעוץ תיאורטי בלבד:</strong> תוצאות אלו לא נשמרות בהיסטוריה ואינן משפיעות על זיכרון המערכת.</span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/water-tests"
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>עבור להזנת תוצאת אמת ביומן הבדיקות</span>
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
