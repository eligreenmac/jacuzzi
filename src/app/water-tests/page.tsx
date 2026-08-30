"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Sparkles,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Activity,
  ChevronRight,
  TrendingUp,
  Info,
} from "lucide-react";

// Standard Test Strip Range Scales
const PH_RANGES = [
  { id: "LOW_CRIT", label: "< 6.8 (חומצי מאוד / קריטי 🔴)", val: 6.6, badge: "חומצי מאוד", color: "border-rose-700 bg-rose-950/50 text-rose-300" },
  { id: "LOW", label: "6.8 - 7.1 (נמוך / דורש מעלה pH 🟠)", val: 7.0, badge: "נמוך", color: "border-amber-700 bg-amber-950/50 text-amber-300" },
  { id: "IDEAL", label: "7.2 - 7.6 (אידיאלי ומאוזן ✨ 🟢)", val: 7.4, badge: "אידיאלי", color: "border-emerald-700 bg-emerald-950/50 text-emerald-300" },
  { id: "HIGH", label: "7.7 - 8.0 (גבוה / דורש מוריד pH 🟠)", val: 7.8, badge: "גבוה", color: "border-amber-700 bg-amber-950/50 text-amber-300" },
  { id: "HIGH_CRIT", label: "> 8.0 (בסיסי מאוד / קריטי 🔴)", val: 8.2, badge: "גבוה מאוד", color: "border-rose-700 bg-rose-950/50 text-rose-300" },
  { id: "UNKNOWN", label: "לא יודע / לא נבדק", val: null, badge: "לא נבדק", color: "border-slate-800 bg-slate-950 text-slate-400" },
];

const CHLORINE_RANGES = [
  { id: "ZERO", label: "0 ppm (ללא חיטוי כלל / קריטי 🔴)", val: 0.0, badge: "ללא חיטוי", color: "border-rose-700 bg-rose-950/50 text-rose-300" },
  { id: "LOW", label: "0.5 - 1.5 ppm (נמוך / דורש חיטוי 🟠)", val: 1.0, badge: "נמוך", color: "border-amber-700 bg-amber-950/50 text-amber-300" },
  { id: "IDEAL", label: "2.0 - 4.0 ppm (אידיאלי לג'קוזי ✨ 🟢)", val: 3.0, badge: "אידיאלי", color: "border-emerald-700 bg-emerald-950/50 text-emerald-300" },
  { id: "HIGH", label: "5.0 - 8.0 ppm (גבוה / להמתין לפני רחצה 🟠)", val: 6.0, badge: "גבוה", color: "border-amber-700 bg-amber-950/50 text-amber-300" },
  { id: "SHOCK", label: "> 10.0 ppm (גבוה מאוד / שוק 🔴)", val: 10.0, badge: "שוק / גבוה", color: "border-rose-700 bg-rose-950/50 text-rose-300" },
  { id: "UNKNOWN", label: "לא יודע / לא נבדק", val: null, badge: "לא נבדק", color: "border-slate-800 bg-slate-950 text-slate-400" },
];

const ALKALINITY_RANGES = [
  { id: "LOW_CRIT", label: "< 40 ppm (נמוכה מאוד 🔴)", val: 30, badge: "נמוכה מאוד", color: "border-rose-700 bg-rose-950/50 text-rose-300" },
  { id: "LOW", label: "40 - 70 ppm (נמוכה 🟠)", val: 60, badge: "נמוכה", color: "border-amber-700 bg-amber-950/50 text-amber-300" },
  { id: "IDEAL", label: "80 - 120 ppm (אידיאלי לג'קוזי ✨ 🟢)", val: 100, badge: "אידיאלי", color: "border-emerald-700 bg-emerald-950/50 text-emerald-300" },
  { id: "HIGH", label: "130 - 180 ppm (גבוהה 🟠)", val: 150, badge: "גבוהה", color: "border-amber-700 bg-amber-950/50 text-amber-300" },
  { id: "HIGH_CRIT", label: "> 180 ppm (גבוהה מאוד 🔴)", val: 200, badge: "גבוהה מאוד", color: "border-rose-700 bg-rose-950/50 text-rose-300" },
  { id: "UNKNOWN", label: "לא יודע / לא נבדק", val: null, badge: "לא נבדק", color: "border-slate-800 bg-slate-950 text-slate-400" },
];

export default function WaterTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Test Modal State (Test Strip Ranges)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 16));
  const [selectedPhRange, setSelectedPhRange] = useState("IDEAL");
  const [selectedClRange, setSelectedClRange] = useState("IDEAL");
  const [selectedAlkRange, setSelectedAlkRange] = useState("IDEAL");
  const [clarity, setClarity] = useState("CLEAR");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Test Modal
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    testedAt: "",
    phRangeId: "IDEAL",
    clRangeId: "IDEAL",
    alkRangeId: "IDEAL",
    waterClarity: "CLEAR",
    description: "",
  });

  const loadTests = async () => {
    try {
      const res = await fetch("/api/water-tests");
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleSaveNewTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const phObj = PH_RANGES.find((r) => r.id === selectedPhRange);
    const clObj = CHLORINE_RANGES.find((r) => r.id === selectedClRange);
    const alkObj = ALKALINITY_RANGES.find((r) => r.id === selectedAlkRange);

    try {
      const res = await fetch("/api/water-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testedAt: new Date(testDate).toISOString(),
          ph: phObj?.val !== null ? phObj?.val : "UNKNOWN",
          phRange: phObj?.label,
          freeChlorine: clObj?.val !== null ? clObj?.val : "UNKNOWN",
          chlorineRange: clObj?.label,
          alkalinity: alkObj?.val !== null ? alkObj?.val : "UNKNOWN",
          alkalinityRange: alkObj?.label,
          waterClarity: clarity,
          description: description || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "שגיאה בשמירת בדיקה");
      }

      setIsAddModalOpen(false);
      setDescription("");
      loadTests();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (test: any) => {
    setEditingTest(test);

    // Match closest range
    let phId = "UNKNOWN";
    if (typeof test.ph === "number") {
      if (test.ph < 6.8) phId = "LOW_CRIT";
      else if (test.ph <= 7.1) phId = "LOW";
      else if (test.ph <= 7.6) phId = "IDEAL";
      else if (test.ph <= 8.0) phId = "HIGH";
      else phId = "HIGH_CRIT";
    }

    let clId = "UNKNOWN";
    if (typeof test.freeChlorine === "number") {
      if (test.freeChlorine === 0) clId = "ZERO";
      else if (test.freeChlorine < 2.0) clId = "LOW";
      else if (test.freeChlorine <= 4.0) clId = "IDEAL";
      else if (test.freeChlorine <= 8.0) clId = "HIGH";
      else clId = "SHOCK";
    }

    let alkId = "UNKNOWN";
    if (typeof test.alkalinity === "number") {
      if (test.alkalinity < 40) alkId = "LOW_CRIT";
      else if (test.alkalinity < 80) alkId = "LOW";
      else if (test.alkalinity <= 120) alkId = "IDEAL";
      else if (test.alkalinity <= 180) alkId = "HIGH";
      else alkId = "HIGH_CRIT";
    }

    setEditForm({
      testedAt: test.testedAt ? new Date(test.testedAt).toISOString().slice(0, 16) : "",
      phRangeId: phId,
      clRangeId: clId,
      alkRangeId: alkId,
      waterClarity: test.waterClarity || "CLEAR",
      description: test.description || "",
    });
  };

  const handleSaveEditTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;

    const phObj = PH_RANGES.find((r) => r.id === editForm.phRangeId);
    const clObj = CHLORINE_RANGES.find((r) => r.id === editForm.clRangeId);
    const alkObj = ALKALINITY_RANGES.find((r) => r.id === editForm.alkRangeId);

    try {
      await fetch("/api/water-tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTest.id,
          testedAt: new Date(editForm.testedAt).toISOString(),
          ph: phObj?.val !== null ? phObj?.val : "UNKNOWN",
          phRange: phObj?.label,
          freeChlorine: clObj?.val !== null ? clObj?.val : "UNKNOWN",
          chlorineRange: clObj?.label,
          alkalinity: alkObj?.val !== null ? alkObj?.val : "UNKNOWN",
          alkalinityRange: alkObj?.label,
          waterClarity: editForm.waterClarity,
          description: editForm.description,
        }),
      });

      setEditingTest(null);
      loadTests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("האם למחוק רשומת בדיקה זו?")) return;
    try {
      await fetch(`/api/water-tests?id=${id}`, { method: "DELETE" });
      loadTests();
    } catch (err) {
      console.error(err);
    }
  };

  const clarityLabels: Record<string, { label: string; icon: string; color: string }> = {
    CLEAR: { label: "מים צלולים", icon: "✨", color: "text-emerald-400 border-emerald-800 bg-emerald-950/40" },
    SLIGHTLY_CLOUDY: { label: "מעט עכורים", icon: "🌫️", color: "text-sky-400 border-sky-800 bg-sky-950/40" },
    VERY_CLOUDY: { label: "עכורים מאוד", icon: "🥛", color: "text-amber-400 border-amber-800 bg-amber-950/40" },
    FOAMY: { label: "מקציפים", icon: "🧼", color: "text-indigo-400 border-indigo-800 bg-indigo-950/40" },
    GREEN: { label: "ירוקים / אצות", icon: "🌿", color: "text-rose-400 border-rose-800 bg-rose-950/40" },
    BAD_ODOR: { label: "ריח חריף / צריבה", icon: "👃", color: "text-rose-400 border-rose-800 bg-rose-950/40" },
  };

  // Metrics calculation
  const totalTests = tests.length;
  const testsWithPh = tests.filter((t) => typeof t.ph === "number");
  const avgPh = testsWithPh.length > 0 ? (testsWithPh.reduce((acc, t) => acc + t.ph, 0) / testsWithPh.length).toFixed(2) : "--";

  const testsWithCl = tests.filter((t) => typeof t.freeChlorine === "number");
  const avgCl = testsWithCl.length > 0 ? (testsWithCl.reduce((acc, t) => acc + t.freeChlorine, 0) / testsWithCl.length).toFixed(1) : "--";

  const lastTest = tests[0];
  const daysSinceLastTest = lastTest
    ? Math.floor((Date.now() - new Date(lastTest.testedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-cyan-400" />
            <span>יומן בדיקות איכות מים</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            תיעוד כרונולוגי לפי סולם טווחי מקלונים (pH, כלור/ברום, בסיסיות וצלילות מים).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/water-doctor"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>אבחון מקיף ברופא המים AI</span>
          </Link>

          <button
            onClick={() => {
              setTestDate(new Date().toISOString().slice(0, 16));
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-600/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>הזן תוצאת בדיקת מקלון חדשה</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>סה"כ בדיקות שתועדו</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTests}</div>
          <div className="text-[11px] text-slate-500">היסטוריית מקלונים ובדיקות</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>בדיקה אחרונה</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {daysSinceLastTest === null ? "טרם נבדק" : daysSinceLastTest === 0 ? "היום" : `לפני ${daysSinceLastTest} ימים`}
          </div>
          <div className="text-[11px] text-slate-500">
            {lastTest ? new Date(lastTest.testedAt).toLocaleDateString("he-IL") : "מומלץ לבדוק שבועית"}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>רמת pH ממוצעת</span>
            <Droplets className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-300">{avgPh}</div>
          <div className="text-[11px] text-slate-500">טווח יעד אופטימלי: 7.2 - 7.6</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>כלור חופשי ממוצע</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{avgCl} {avgCl !== "--" ? "ppm" : ""}</div>
          <div className="text-[11px] text-slate-500">טווח יעד אופטימלי: 2.0 - 4.0 ppm</div>
        </div>
      </div>

      {/* Tests Chronological List */}
      {loading ? (
        <div className="text-center py-24 text-cyan-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center space-y-4">
          <FlaskConical className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">עדיין לא תועדו בדיקות מים</h3>
            <p className="text-xs text-slate-400">הזן את תוצאות בדיקת המקלון הראשונה שלך לפי סולם הטווחים</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>הזן בדיקה ראשונה</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>היסטוריית בדיקות לפי סדר כרונולוגי ({tests.length} רשומות)</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {tests.map((test) => {
              const testDateObj = new Date(test.testedAt);
              const clarityInfo = clarityLabels[test.waterClarity] || clarityLabels.CLEAR;

              // pH evaluation
              const isPhGood = typeof test.ph === "number" && test.ph >= 7.2 && test.ph <= 7.6;
              const isPhHigh = typeof test.ph === "number" && test.ph > 7.6;

              // Chlorine evaluation
              const isClGood = typeof test.freeChlorine === "number" && test.freeChlorine >= 2.0 && test.freeChlorine <= 4.0;
              const isClLow = typeof test.freeChlorine === "number" && test.freeChlorine < 2.0;

              return (
                <div
                  key={test.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 transition-all shadow-xl space-y-4"
                >
                  {/* Top Bar: Date & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">
                          {testDateObj.toLocaleDateString("he-IL", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>שעה: {testDateObj.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => openEditModal(test)}
                        className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                        title="ערוך תוצאות בדיקה"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="מחק רשומת בדיקה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Values Badges Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* pH Badge */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>חומציות (pH)</span>
                        {typeof test.ph === "number" && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isPhGood
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : isPhHigh
                                ? "bg-amber-950 text-amber-300 border-amber-800"
                                : "bg-rose-950 text-rose-300 border-rose-800"
                            }`}
                          >
                            {isPhGood ? "אידיאלי" : isPhHigh ? "גבוה" : "נמוך"}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-white">
                        {test.phRange || (typeof test.ph === "number" ? `pH ${test.ph}` : "לא נבדק")}
                      </div>
                    </div>

                    {/* Chlorine Badge */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>כלור / ברום (חיטוי)</span>
                        {typeof test.freeChlorine === "number" && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isClGood
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : isClLow
                                ? "bg-rose-950 text-rose-300 border-rose-800"
                                : "bg-amber-950 text-amber-300 border-amber-800"
                            }`}
                          >
                            {isClGood ? "אידיאלי" : isClLow ? "חסר" : "גבוה"}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-white">
                        {test.chlorineRange || (typeof test.freeChlorine === "number" ? `${test.freeChlorine} ppm` : "לא נבדק")}
                      </div>
                    </div>

                    {/* Alkalinity Badge */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>בסיסיות כוללת (TA)</span>
                        <span className="text-[10px] text-slate-400">יעד: 80-120</span>
                      </div>
                      <div className="text-sm font-bold text-cyan-300">
                        {test.alkalinityRange || (typeof test.alkalinity === "number" ? `${test.alkalinity} ppm` : "לא נבדק")}
                      </div>
                    </div>

                    {/* Clarity Badge */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold">צלילות המים</div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{clarityInfo.icon}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${clarityInfo.color}`}>
                          {clarityInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Free text & AI Diagnosis if available */}
                  {(test.description || test.aiDiagnosis) && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                      {test.description && (
                        <div className="text-slate-300">
                          <span className="text-slate-500 font-semibold">תיאור והערות: </span>
                          {test.description}
                        </div>
                      )}

                      {test.aiDiagnosis && (
                        <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-cyan-300">אבחון AI בבדיקה זו: </span>
                            {test.aiDiagnosis}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add New Test (With Test Strip Ranges / Verbal Scale) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <span>הזנת תוצאות בדיקת מקלון (לפי סולם טווחים)</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveNewTest} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">תאריך ושעת הבדיקה</label>
                <input
                  type="datetime-local"
                  required
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              {/* 1. pH Range Picker */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">1. רמת חומציות (pH לפי סולם המקלון):</span>
                  <span className="text-[11px] text-cyan-400">אידיאלי: 7.2 - 7.6</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PH_RANGES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedPhRange(r.id)}
                      className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                        selectedPhRange === r.id
                          ? `${r.color} ring-2 ring-cyan-400 font-bold shadow-md`
                          : "border-slate-850 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Chlorine Range Picker */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">2. כלור חופשי / ברום (ppm חיטוי):</span>
                  <span className="text-[11px] text-cyan-400">אידיאלי: 2.0 - 4.0 ppm</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHLORINE_RANGES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedClRange(r.id)}
                      className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                        selectedClRange === r.id
                          ? `${r.color} ring-2 ring-cyan-400 font-bold shadow-md`
                          : "border-slate-850 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Alkalinity Range Picker */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">3. בסיסיות כוללת (TA ppm):</span>
                  <span className="text-[11px] text-cyan-400">אידיאלי: 80 - 120 ppm</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALKALINITY_RANGES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedAlkRange(r.id)}
                      className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                        selectedAlkRange === r.id
                          ? `${r.color} ring-2 ring-cyan-400 font-bold shadow-md`
                          : "border-slate-850 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Clarity Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">4. מראה וצלילות המים</label>
                <select
                  value={clarity}
                  onChange={(e) => setClarity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                >
                  <option value="CLEAR">✨ מים צלולים לחלוטין וללא ריח</option>
                  <option value="SLIGHTLY_CLOUDY">🌫️ מעט עכורים / ראות מופחתת בקרקעית</option>
                  <option value="VERY_CLOUDY">🥛 עכורים מאוד / מים חלביים</option>
                  <option value="FOAMY">🧼 מקציפים בהפעלת ג'טים</option>
                  <option value="GREEN">🌿 ירוקים / חשד לאצות</option>
                  <option value="BAD_ODOR">👃 ריח חריף / צריבה בעיניים</option>
                </select>
              </div>

              {/* Free text */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">הערות נוספות (אופציונלי)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="למשל: נבדק אחרי סופשבוע עם אורחים..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
                >
                  {saving ? "שומר בדיקה..." : "שמור תוצאות בדיקה"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Test */}
      {editingTest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>עריכת תוצאות בדיקה</span>
              </h2>
              <button onClick={() => setEditingTest(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">תאריך ושעה</label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.testedAt}
                  onChange={(e) => setEditForm({ ...editForm, testedAt: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">טווח pH</label>
                <select
                  value={editForm.phRangeId}
                  onChange={(e) => setEditForm({ ...editForm, phRangeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  {PH_RANGES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">טווח כלור/ברום</label>
                <select
                  value={editForm.clRangeId}
                  onChange={(e) => setEditForm({ ...editForm, clRangeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  {CHLORINE_RANGES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">טווח בסיסיות (TA)</label>
                <select
                  value={editForm.alkRangeId}
                  onChange={(e) => setEditForm({ ...editForm, alkRangeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  {ALKALINITY_RANGES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">צלילות מים</label>
                <select
                  value={editForm.waterClarity}
                  onChange={(e) => setEditForm({ ...editForm, waterClarity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="CLEAR">✨ מים צלולים</option>
                  <option value="SLIGHTLY_CLOUDY">🌫️ מעט עכורים</option>
                  <option value="VERY_CLOUDY">🥛 עכורים מאוד</option>
                  <option value="FOAMY">🧼 מקציפים</option>
                  <option value="GREEN">🌿 ירוקים</option>
                  <option value="BAD_ODOR">👃 ריח חריף</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">הערות</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold"
                >
                  שמור שינויים
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
