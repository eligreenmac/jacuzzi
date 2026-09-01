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
  Package,
  ShoppingCart,
  Search,
  ExternalLink,
  Zap,
} from "lucide-react";

// Standard Test Strip Range Scales (Clean & Calibrated)
// Standard Test Strip Range Scales (5 Distinct Domains: Very Low, Low, OK, High, Very High)
const PH_RANGES = [
  { id: "VERY_LOW", label: "Very Low (< 6.8 - חומצי מאוד)", val: 6.6, badge: "Very Low" },
  { id: "LOW", label: "Low (6.8 - 7.1 - נמוך)", val: 7.0, badge: "Low" },
  { id: "OK", label: "OK (7.2 - 7.6 - תקין)", val: 7.4, badge: "OK" },
  { id: "HIGH", label: "High (7.7 - 8.0 - גבוה)", val: 7.8, badge: "High" },
  { id: "VERY_HIGH", label: "Very High (> 8.0 - בסיסי מאוד)", val: 8.2, badge: "Very High" },
  { id: "UNKNOWN", label: "לא נבדק", val: null, badge: "לא נבדק" },
];

const CHLORINE_RANGES = [
  { id: "VERY_LOW", label: "Very Low (0 - 0.5 ppm - ללא חיטוי)", val: 0.0, badge: "Very Low" },
  { id: "LOW", label: "Low (0.5 - 1.5 ppm - נמוך)", val: 1.0, badge: "Low" },
  { id: "OK", label: "OK (2.0 - 4.0 ppm - תקין)", val: 3.0, badge: "OK" },
  { id: "HIGH", label: "High (5.0 - 8.0 ppm - גבוה)", val: 6.0, badge: "High" },
  { id: "VERY_HIGH", label: "Very High (> 8.0 ppm - גבוה מאוד / שוק)", val: 10.0, badge: "Very High" },
  { id: "UNKNOWN", label: "לא נבדק", val: null, badge: "לא נבדק" },
];

const ALKALINITY_RANGES = [
  { id: "VERY_LOW", label: "Very Low (< 40 ppm - נמוכה מאוד)", val: 30, badge: "Very Low" },
  { id: "LOW", label: "Low (40 - 70 ppm - נמוכה)", val: 60, badge: "Low" },
  { id: "OK", label: "OK (80 - 120 ppm - תקינה)", val: 100, badge: "OK" },
  { id: "HIGH", label: "High (130 - 180 ppm - גבוהה)", val: 150, badge: "High" },
  { id: "VERY_HIGH", label: "Very High (> 180 ppm - גבוהה מאוד)", val: 200, badge: "Very High" },
  { id: "UNKNOWN", label: "לא נבדק", val: null, badge: "לא נבדק" },
];

export function getParamDomain(type: "PH" | "CHLORINE" | "ALKALINITY", val: number | null | undefined) {
  if (val === null || val === undefined || isNaN(val)) {
    return { id: "UNKNOWN", label: "לא נבדק", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
  }
  if (type === "PH") {
    if (val < 6.8) return { id: "VERY_LOW", label: "Very Low", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 7.2) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 7.6) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 8.0) return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (type === "CHLORINE") {
    if (val < 0.5) return { id: "VERY_LOW", label: "Very Low", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 2.0) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 4.0) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 8.0) return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (type === "ALKALINITY") {
    if (val < 40) return { id: "VERY_LOW", label: "Very Low", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 80) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 120) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 180) return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  return { id: "UNKNOWN", label: "לא נבדק", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
}

export default function WaterTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Test Modal State (5 Range Domains)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 16));
  const [selectedPhRange, setSelectedPhRange] = useState("OK");
  const [selectedClRange, setSelectedClRange] = useState("OK");
  const [selectedAlkRange, setSelectedAlkRange] = useState("OK");
  const [clarity, setClarity] = useState("CLEAR");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Test Modal
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [executingStep, setExecutingStep] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    testedAt: "",
    phRangeId: "OK",
    clRangeId: "OK",
    alkRangeId: "OK",
    waterClarity: "CLEAR",
    description: "",
  });

  const handleExecuteStep = async (testId: string, step: any, recs: any, isScheduleAction = false) => {
    setExecutingStep(`${testId}-${step.stepNumber}`);
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
          testId,
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
      loadTests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExecutingStep(null);
    }
  };

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

    // Match 5 domains
    let phId = "UNKNOWN";
    if (typeof test.ph === "number") {
      if (test.ph < 6.8) phId = "VERY_LOW";
      else if (test.ph <= 7.1) phId = "LOW";
      else if (test.ph <= 7.6) phId = "OK";
      else if (test.ph <= 8.0) phId = "HIGH";
      else phId = "VERY_HIGH";
    }

    let clId = "UNKNOWN";
    if (typeof test.freeChlorine === "number") {
      if (test.freeChlorine < 0.5) clId = "VERY_LOW";
      else if (test.freeChlorine < 2.0) clId = "LOW";
      else if (test.freeChlorine <= 4.0) clId = "OK";
      else if (test.freeChlorine <= 8.0) clId = "HIGH";
      else clId = "VERY_HIGH";
    }

    let alkId = "UNKNOWN";
    if (typeof test.alkalinity === "number") {
      if (test.alkalinity < 40) alkId = "VERY_LOW";
      else if (test.alkalinity < 80) alkId = "LOW";
      else if (test.alkalinity <= 120) alkId = "OK";
      else if (test.alkalinity <= 180) alkId = "HIGH";
      else alkId = "VERY_HIGH";
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

  const clarityLabels: Record<string, { label: string; color: string }> = {
    CLEAR: { label: "מים צלולים", color: "text-slate-200 border-slate-750 bg-slate-950" },
    SLIGHTLY_CLOUDY: { label: "מעט עכורים", color: "text-slate-200 border-slate-750 bg-slate-950" },
    VERY_CLOUDY: { label: "עכורים מאוד / חלביים", color: "text-slate-200 border-slate-750 bg-slate-950" },
    FOAMY: { label: "מקציפים", color: "text-slate-200 border-slate-750 bg-slate-950" },
    GREEN: { label: "ירוקים / אצות", color: "text-rose-300 border-rose-900/40 bg-slate-950" },
    BAD_ODOR: { label: "ריח חריף", color: "text-rose-300 border-rose-900/40 bg-slate-950" },
    METALLIC_COPPER: { label: "ירוק-טורקיז (נחושת)", color: "text-teal-300 border-teal-900/40 bg-slate-950" },
    METALLIC_RUST: { label: "חלודה / ברזל", color: "text-orange-300 border-orange-900/40 bg-slate-950" },
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
            תיעוד כרונולוגי של בדיקות מקלונים, איזון מים ותוכניות טיפול.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/water-doctor"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>אבחון מקיף ברופא המים AI</span>
          </Link>

          <button
            onClick={() => {
              setTestDate(new Date().toISOString().slice(0, 16));
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-900/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>הזן תוצאת בדיקת מקלון חדשה</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>סה"כ בדיקות</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-white">{totalTests}</div>
          <div className="text-[11px] text-slate-400">היסטוריית בדיקות מתועדת</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>בדיקה אחרונה</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-white">
            {daysSinceLastTest === null ? "טרם נבדק" : daysSinceLastTest === 0 ? "היום" : `לפני ${daysSinceLastTest} ימים`}
          </div>
          <div className="text-[11px] text-slate-400">
            {lastTest ? new Date(lastTest.testedAt).toLocaleDateString("he-IL") : "מומלץ לבדוק שבועית"}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>pH ממוצע</span>
            <Droplets className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-white">{avgPh}</div>
          <div className="text-[11px] text-slate-400">טווח יעד: 7.2 - 7.6</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>חיטוי ממוצע</span>
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-white">{avgCl} {avgCl !== "--" ? "ppm" : ""}</div>
          <div className="text-[11px] text-slate-400">טווח יעד: 2.0 - 4.0 ppm</div>
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

              const phDomain = getParamDomain("PH", test.ph);
              const clDomain = getParamDomain("CHLORINE", test.freeChlorine);
              const alkDomain = getParamDomain("ALKALINITY", test.alkalinity);

              return (
                <div
                  key={test.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 transition-all shadow-xl space-y-4"
                >
                  {/* Top Bar: Date & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 text-teal-300 flex items-center justify-center font-bold text-sm border border-slate-700">
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

                  {/* Values Badges Grid (5 Domains: Very Low, Low, OK, High, Very High) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* pH Badge */}
                    <div className="bg-[#0a0f13] p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>חומציות (pH)</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${phDomain.badgeClass}`}>
                          {phDomain.label}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {test.phRange || (typeof test.ph === "number" ? `pH ${test.ph}` : "לא נבדק")}
                      </div>
                    </div>

                    {/* Chlorine Badge */}
                    <div className="bg-[#0a0f13] p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>חיטוי (כלור / ברום)</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${clDomain.badgeClass}`}>
                          {clDomain.label}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {test.chlorineRange || (typeof test.freeChlorine === "number" ? `${test.freeChlorine} ppm` : "לא נבדק")}
                      </div>
                    </div>

                    {/* Alkalinity Badge */}
                    <div className="bg-[#0a0f13] p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>בסיסיות כוללת (TA)</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${alkDomain.badgeClass}`}>
                          {alkDomain.label}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {test.alkalinityRange || (typeof test.alkalinity === "number" ? `${test.alkalinity} ppm` : "לא נבדק")}
                      </div>
                    </div>

                    {/* Clarity Badge */}
                    <div className="bg-[#0a0f13] p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-semibold">צלילות המים</div>
                      <div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${clarityInfo.color}`}>
                          {clarityInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Free text & AI Diagnosis & Recommendations if available */}
                  {(test.description || test.aiDiagnosis || test.aiRecommendations) && (() => {
                    let recs: any = null;
                    if (test.aiRecommendations) {
                      try {
                        recs = typeof test.aiRecommendations === "string" ? JSON.parse(test.aiRecommendations) : test.aiRecommendations;
                      } catch (e) {}
                    }

                    return (
                      <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                        {test.description && (
                          <div className="text-slate-300">
                            <span className="text-slate-500 font-semibold">תיאור והערות: </span>
                            {test.description}
                          </div>
                        )}

                        {test.aiDiagnosis && (
                          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-bold text-cyan-300">אבחון ומצב המים: </span>
                              <span>{test.aiDiagnosis}</span>
                            </div>
                          </div>
                        )}

                        {/* Root Cause Analysis */}
                        {recs?.rootCauseAnalysis && (
                          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
                            <div className="flex items-center gap-2 font-bold text-slate-200 text-xs">
                              <Info className="w-4 h-4 text-cyan-400" />
                              <span>ניתוח שורש הבעיה:</span>
                            </div>
                            <div className="text-[11px] leading-relaxed text-slate-300 pr-6">
                              {recs.rootCauseAnalysis}
                            </div>
                          </div>
                        )}

                        {/* Step By Step Treatment Plan with Inventory Matching & Web Search */}
                        {recs?.stepByStepPlan && recs.stepByStepPlan.length > 0 && (
                          <div className="space-y-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                              <Zap className="w-4 h-4 text-cyan-400" />
                              <span>תוכנית טיפול מומלצת:</span>
                            </div>

                            <div className="space-y-2.5">
                              {recs.stepByStepPlan.map((step: any, sIdx: number) => (
                                <div
                                  key={sIdx}
                                  className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                                      <span className="w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                                        {step.stepNumber || sIdx + 1}
                                      </span>
                                      <span>{step.title}</span>
                                    </div>
                                    {step.amount && step.amount !== "לפי שגרה" && (
                                      <span className="px-2 py-0.5 rounded-md bg-slate-950 text-cyan-300 font-bold text-[11px] border border-slate-800">
                                        מינון: {step.amount}
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-slate-300 leading-relaxed pr-7">
                                    {step.instructions}
                                  </div>

                                  {step.safetyWarning && (
                                    <div className="mr-7 p-2 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 text-[10px] flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      <span>{step.safetyWarning}</span>
                                    </div>
                                  )}

                                  {/* Chemical match badge */}
                                  {step.chemical && step.chemical !== "ללא חומר" && step.chemical !== "תחזוקה רגילה" && !step.chemical.includes("שטיפת פילטר") && (
                                    <div className="mr-7">
                                      {step.inInventory ? (
                                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <Package className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                            <span>
                                              <strong>קיים בארון החומרים:</strong> {step.inventoryItemName || step.chemical} (נותרו: {step.inventoryRemaining || "במלאי"})
                                            </span>
                                          </div>
                                          <span className="text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded font-bold text-cyan-300">
                                            זמין לשימוש
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] space-y-1">
                                          <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                              <ShoppingCart className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                              <span className="font-bold text-slate-200">חסר בארון החומרים</span>
                                            </div>
                                            <a
                                              href={`https://www.google.com/search?q=${encodeURIComponent(step.searchKeywords || step.chemical + " לג'קוזי")}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[10px] rounded flex items-center gap-1 transition-all"
                                            >
                                              <Search className="w-3 h-3" />
                                              <span>חפש ברשת לרכישה</span>
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Action Button: Schedule Future Task vs Immediate Done */}
                                  <div className="mr-7 pt-1 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                                    {step.isExecuted ? (
                                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span>
                                          בוצע ותועד ביומן {step.executedAt ? `(${new Date(step.executedAt).toLocaleDateString("he-IL")})` : "✓"}
                                        </span>
                                      </div>
                                    ) : step.isScheduled ? (
                                      <div className="flex items-center justify-between gap-2 w-full flex-wrap">
                                        <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                          <span>
                                            תוזמן ליומן {step.scheduledFor ? `ל-${new Date(step.scheduledFor).toLocaleDateString("he-IL")}` : ""}
                                          </span>
                                        </div>

                                        {step.scheduledFor && new Date(step.scheduledFor).getTime() > Date.now() ? (
                                          <button
                                            type="button"
                                            disabled
                                            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[11px] cursor-not-allowed opacity-75 flex items-center gap-1 select-none"
                                            title={`משימה עתידית - תיפתח לסימון ביצוע ב-${new Date(step.scheduledFor).toLocaleDateString("he-IL")}`}
                                          >
                                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                                            <span>ייפתח לביצוע במועד</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            disabled={executingStep === `${test.id}-${step.stepNumber}`}
                                            onClick={() => handleExecuteStep(test.id, step, recs, false)}
                                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow flex items-center gap-1 transition-all"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>סמן כבוצע כעת</span>
                                          </button>
                                        )}
                                      </div>
                                    ) : step.stepType === "FOLLOW_UP" || step.title.includes("בעוד") || step.title.includes("להמשך") ? (
                                      <button
                                        type="button"
                                        disabled={executingStep === `${test.id}-${step.stepNumber}`}
                                        onClick={() => handleExecuteStep(test.id, step, recs, true)}
                                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                                      >
                                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>{executingStep === `${test.id}-${step.stepNumber}` ? "מתזמן ליומן..." : "תזמן ליומן"}</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={executingStep === `${test.id}-${step.stepNumber}`}
                                        onClick={() => handleExecuteStep(test.id, step, recs, false)}
                                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow-md flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{executingStep === `${test.id}-${step.stepNumber}` ? "מתעד ביומן..." : "סמן כבוצע כעת"}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Follow up actions & Prevention guidelines */}
                        {((recs?.followUpRequirements && recs.followUpRequirements.length > 0) || (recs?.preventionGuidelines && recs.preventionGuidelines.length > 0)) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {recs.followUpRequirements?.length > 0 && (
                              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>פעולות להמשך:</span>
                                </div>
                                <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                                  {recs.followUpRequirements.map((req: string, idx: number) => (
                                    <li key={idx}>{req}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {recs.preventionGuidelines?.length > 0 && (
                              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>הנחיות מניעה:</span>
                                </div>
                                <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                                  {recs.preventionGuidelines.map((prev: string, idx: number) => (
                                    <li key={idx}>{prev}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add New Test */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <span>הזנת תוצאות בדיקת מקלון</span>
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
                  <span className="font-bold text-slate-200">1. רמת חומציות (pH):</span>
                  <span className="text-[11px] text-slate-400">אידיאלי: 7.2 - 7.6</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PH_RANGES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedPhRange(r.id)}
                      className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                        selectedPhRange === r.id
                          ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold shadow"
                          : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
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
                  <span className="font-bold text-slate-200">2. כלור חופשי / ברום (חיטוי):</span>
                  <span className="text-[11px] text-slate-400">אידיאלי: 2.0 - 4.0 ppm</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHLORINE_RANGES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedClRange(r.id)}
                      className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                        selectedClRange === r.id
                          ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold shadow"
                          : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
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
                  <span className="font-bold text-slate-200">3. בסיסיות כוללת (TA):</span>
                  <span className="text-[11px] text-slate-400">אידיאלי: 80 - 120 ppm</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALKALINITY_RANGES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedAlkRange(r.id)}
                      className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                        selectedAlkRange === r.id
                          ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold shadow"
                          : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-medium"
                >
                  <option value="CLEAR">מים צלולים לחלוטין</option>
                  <option value="SLIGHTLY_CLOUDY">מעט עכורים</option>
                  <option value="VERY_CLOUDY">עכורים מאוד / חלביים</option>
                  <option value="FOAMY">מקציפים בהפעלת ג'טים</option>
                  <option value="GREEN">ירוקים / אצות</option>
                  <option value="METALLIC_COPPER">גוון ירוק-טורקיז / נחושת (Copper)</option>
                  <option value="METALLIC_RUST">גוון חלודה / ברזל (Iron / Rust)</option>
                  <option value="BAD_ODOR">ריח חריף</option>
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
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
                >
                  {saving ? "שומר..." : "שמור תוצאות בדיקה"}
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
                  <option value="CLEAR">מים צלולים</option>
                  <option value="SLIGHTLY_CLOUDY">מעט עכורים</option>
                  <option value="VERY_CLOUDY">עכורים מאוד</option>
                  <option value="FOAMY">מקציפים</option>
                  <option value="GREEN">ירוקים / אצות</option>
                  <option value="METALLIC_COPPER">גוון ירוק-טורקיז (נחושת)</option>
                  <option value="METALLIC_RUST">חלודה / ברזל</option>
                  <option value="BAD_ODOR">ריח חריף</option>
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
