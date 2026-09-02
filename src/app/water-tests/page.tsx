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

import {
  ALL_TEST_STRIP_PARAMS,
  DEFAULT_TEST_STRIP_PARAM_IDS,
  parseTestStripParams,
  TestStripParamDef,
} from "@/lib/test-strip-params";

// Standard Test Strip Range Scales
const PH_RANGES = [
  { id: "VERY_LOW", label: "Very Low (< 6.8)", defaultVal: 6.5, badge: "Very Low" },
  { id: "LOW", label: "Low (6.8 - 7.1)", defaultVal: 7.0, badge: "Low" },
  { id: "OK", label: "OK (7.2 - 7.6)", defaultVal: 7.4, badge: "OK" },
  { id: "HIGH", label: "High (7.7 - 8.0)", defaultVal: 7.8, badge: "High" },
  { id: "VERY_HIGH", label: "Very High (> 8.0)", defaultVal: 8.3, badge: "Very High" },
  { id: "UNKNOWN", label: "לא נבדק", defaultVal: null, badge: "לא נבדק" },
];

const CHLORINE_RANGES = [
  { id: "VERY_LOW", label: "Very Low (0 - 0.5 ppm)", defaultVal: 0.0, badge: "Very Low" },
  { id: "LOW", label: "Low (0.5 - 1.5 ppm)", defaultVal: 1.0, badge: "Low" },
  { id: "OK", label: "OK (2.0 - 4.0 ppm)", defaultVal: 3.0, badge: "OK" },
  { id: "HIGH", label: "High (5.0 - 8.0 ppm)", defaultVal: 6.0, badge: "High" },
  { id: "VERY_HIGH", label: "Very High (> 8.0 ppm)", defaultVal: 10.0, badge: "Very High" },
  { id: "UNKNOWN", label: "לא נבדק", defaultVal: null, badge: "לא נבדק" },
];

const ALKALINITY_RANGES = [
  { id: "VERY_LOW", label: "Very Low (< 40 ppm)", defaultVal: 30, badge: "Very Low" },
  { id: "LOW", label: "Low (40 - 70 ppm)", defaultVal: 60, badge: "Low" },
  { id: "OK", label: "OK (80 - 120 ppm)", defaultVal: 100, badge: "OK" },
  { id: "HIGH", label: "High (130 - 180 ppm)", defaultVal: 150, badge: "High" },
  { id: "VERY_HIGH", label: "Very High (> 180 ppm)", defaultVal: 200, badge: "Very High" },
  { id: "UNKNOWN", label: "לא נבדק", defaultVal: null, badge: "לא נבדק" },
];

const CALCIUM_RANGES = [
  { id: "VERY_LOW", label: "Very Low (< 100 ppm)", defaultVal: 80, badge: "Very Low" },
  { id: "LOW", label: "Low (100 - 140 ppm)", defaultVal: 120, badge: "Low" },
  { id: "OK", label: "OK (150 - 250 ppm)", defaultVal: 200, badge: "OK" },
  { id: "HIGH", label: "High (260 - 400 ppm)", defaultVal: 300, badge: "High" },
  { id: "VERY_HIGH", label: "Very High (> 400 ppm)", defaultVal: 450, badge: "Very High" },
  { id: "UNKNOWN", label: "לא נבדק", defaultVal: null, badge: "לא נבדק" },
];

const TOTAL_CL_RANGES = [
  { id: "OK", label: "OK (אידיאלי - שווה לחופשי)", defaultVal: 3.0, badge: "OK" },
  { id: "HIGH", label: "High (כלורמינים מעל 0.5 ppm)", defaultVal: 5.0, badge: "High" },
  { id: "UNKNOWN", label: "לא נבדק", defaultVal: null, badge: "לא נבדק" },
];

const CYA_RANGES = [
  { id: "LOW", label: "Low (< 20 ppm)", defaultVal: 10, badge: "Low" },
  { id: "OK", label: "OK (20 - 50 ppm)", defaultVal: 35, badge: "OK" },
  { id: "HIGH", label: "High (50 - 100 ppm)", defaultVal: 75, badge: "High" },
  { id: "VERY_HIGH", label: "Very High / נעילת כלור (> 100 ppm)", defaultVal: 120, badge: "Very High" },
  { id: "UNKNOWN", label: "לא נבדק", defaultVal: null, badge: "לא נבדק" },
];

const SALT_RANGES = [
  { id: "LOW", label: "Low (< 1500 ppm)", defaultVal: 1200, badge: "Low" },
  { id: "OK", label: "OK (1500 - 2500 ppm)", defaultVal: 2000, badge: "OK" },
  { id: "HIGH", label: "High (> 2500 ppm)", defaultVal: 3000, badge: "High" },
  { id: "UNKNOWN", label: "לא נבדק", defaultVal: null, badge: "לא נבדק" },
];

export function getGenericDomain(
  paramId: string,
  val: number | null | undefined,
  rangeStr?: string | null
) {
  if (rangeStr) {
    const s = rangeStr.toUpperCase();
    if (s.includes("VERY_LOW") || s.includes("VERY LOW") || s.includes("חומצי מאוד") || s.includes("ללא חיטוי") || s.includes("נמוכה מאוד") || s.includes("נמוך מאוד")) {
      return { id: "VERY_LOW", label: "Very Low", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very Low" };
    }
    if (s.includes("VERY_HIGH") || s.includes("VERY HIGH") || s.includes("בסיסי מאוד") || s.includes("שוק") || s.includes("עודף") || s.includes("גבוהה מאוד") || s.includes("גבוה מאוד") || s.includes("נעילת כלור")) {
      return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very High" };
    }
    if (s.includes("LOW") || s.includes("נמוך") || s.includes("נמוכה")) {
      return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "Low" };
    }
    if (s.includes("HIGH") || s.includes("גבוה") || s.includes("גבוהה") || s.includes("כלורמינים")) {
      return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "High" };
    }
    if (s.includes("OK") || s.includes("תקין") || s.includes("אידיאלי") || s.includes("תקינה")) {
      return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    }
  }

  if (val === null || val === undefined || isNaN(val)) {
    return { id: "UNKNOWN", label: "לא נבדק", badgeClass: "bg-slate-800 text-slate-400 border-slate-700", shortLabel: "לא נבדק" };
  }

  if (paramId === "ph") {
    if (val < 6.8) return { id: "VERY_LOW", label: "Very Low", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very Low" };
    if (val < 7.2) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "Low" };
    if (val <= 7.6) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    if (val <= 8.0) return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "High" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very High" };
  }
  if (paramId === "chlorine") {
    if (val < 0.5) return { id: "VERY_LOW", label: "Very Low", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very Low" };
    if (val < 2.0) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "Low" };
    if (val <= 4.0) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    if (val <= 8.0) return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "High" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very High" };
  }
  if (paramId === "alkalinity") {
    if (val < 40) return { id: "VERY_LOW", label: "Very Low", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very Low" };
    if (val < 80) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "Low" };
    if (val <= 120) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    if (val <= 180) return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "High" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very High" };
  }
  if (paramId === "calcium") {
    if (val < 100) return { id: "VERY_LOW", label: "Very Low", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very Low" };
    if (val < 150) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "Low" };
    if (val <= 250) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    if (val <= 400) return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "High" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very High" };
  }
  if (paramId === "totalChlorine") {
    if (val <= 4.0) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "High" };
  }
  if (paramId === "cya") {
    if (val < 20) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "Low" };
    if (val <= 50) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    if (val <= 100) return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "High" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very High" };
  }
  if (paramId === "salt") {
    if (val < 1500) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "Low" };
    if (val <= 2500) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    return { id: "HIGH", label: "High", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "High" };
  }
  if (paramId === "waterTemp") {
    if (val < 35) return { id: "LOW", label: "Low", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20", shortLabel: "Low" };
    if (val <= 39) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", shortLabel: "OK" };
    return { id: "VERY_HIGH", label: "Very High", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20", shortLabel: "Very High" };
  }

  return { id: "UNKNOWN", label: "לא נבדק", badgeClass: "bg-slate-800 text-slate-400 border-slate-700", shortLabel: "לא נבדק" };
}

// Backward compatibility helper
export function getParamDomain(
  type: "PH" | "CHLORINE" | "ALKALINITY",
  val: number | null | undefined,
  rangeStr?: string | null
) {
  const map: Record<string, string> = { PH: "ph", CHLORINE: "chlorine", ALKALINITY: "alkalinity" };
  return getGenericDomain(map[type] || "ph", val, rangeStr);
}

export default function WaterTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeParams, setActiveParams] = useState<string[]>(DEFAULT_TEST_STRIP_PARAM_IDS);

  // Add Test Modal State (Range Domains + Optional Manual Values)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 16));

  // 1. pH
  const [selectedPhRange, setSelectedPhRange] = useState("OK");
  const [noNumericPh, setNoNumericPh] = useState(true);
  const [manualPh, setManualPh] = useState("");

  // 2. Chlorine
  const [selectedClRange, setSelectedClRange] = useState("OK");
  const [noNumericCl, setNoNumericCl] = useState(true);
  const [manualCl, setManualCl] = useState("");

  // 3. Alkalinity
  const [selectedAlkRange, setSelectedAlkRange] = useState("OK");
  const [noNumericAlk, setNoNumericAlk] = useState(true);
  const [manualAlk, setManualAlk] = useState("");

  // 4. Clarity
  const [clarity, setClarity] = useState("CLEAR");

  // 5. Calcium Hardness
  const [selectedCalciumRange, setSelectedCalciumRange] = useState("OK");
  const [noNumericCalcium, setNoNumericCalcium] = useState(true);
  const [manualCalcium, setManualCalcium] = useState("");

  // 6. Total Chlorine
  const [selectedTotalClRange, setSelectedTotalClRange] = useState("OK");
  const [noNumericTotalCl, setNoNumericTotalCl] = useState(true);
  const [manualTotalCl, setManualTotalCl] = useState("");

  // 7. CYA
  const [selectedCyaRange, setSelectedCyaRange] = useState("OK");
  const [noNumericCya, setNoNumericCya] = useState(true);
  const [manualCya, setManualCya] = useState("");

  // 8. Salt
  const [selectedSaltRange, setSelectedSaltRange] = useState("OK");
  const [noNumericSalt, setNoNumericSalt] = useState(true);
  const [manualSalt, setManualSalt] = useState("");

  // 9. Water Temp
  const [manualWaterTemp, setManualWaterTemp] = useState("");

  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Test Modal
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [executingStep, setExecutingStep] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    testedAt: "",
    phRangeId: "OK",
    noNumericPh: true,
    manualPh: "",
    clRangeId: "OK",
    noNumericCl: true,
    manualCl: "",
    alkRangeId: "OK",
    noNumericAlk: true,
    manualAlk: "",
    calciumRangeId: "OK",
    noNumericCalcium: true,
    manualCalcium: "",
    totalClRangeId: "OK",
    noNumericTotalCl: true,
    manualTotalCl: "",
    cyaRangeId: "OK",
    noNumericCya: true,
    manualCya: "",
    saltRangeId: "OK",
    noNumericSalt: true,
    manualSalt: "",
    manualWaterTemp: "",
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
      const [testsRes, authRes] = await Promise.all([
        fetch("/api/water-tests"),
        fetch("/api/auth/me"),
      ]);

      if (testsRes.ok) {
        const data = await testsRes.json();
        setTests(data.tests || []);
      }
      if (authRes.ok) {
        const authData = await authRes.json();
        const configuredParams = parseTestStripParams(authData?.user?.jacuzzi?.testStripParams);
        setActiveParams(configuredParams);
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
    const calciumObj = CALCIUM_RANGES.find((r) => r.id === selectedCalciumRange);
    const totalClObj = TOTAL_CL_RANGES.find((r) => r.id === selectedTotalClRange);
    const cyaObj = CYA_RANGES.find((r) => r.id === selectedCyaRange);
    const saltObj = SALT_RANGES.find((r) => r.id === selectedSaltRange);

    const parsedPh = activeParams.includes("ph") && !noNumericPh && manualPh.trim() ? parseFloat(manualPh) : null;
    const parsedCl = activeParams.includes("chlorine") && !noNumericCl && manualCl.trim() ? parseFloat(manualCl) : null;
    const parsedAlk = activeParams.includes("alkalinity") && !noNumericAlk && manualAlk.trim() ? parseFloat(manualAlk) : null;
    const parsedCalcium = activeParams.includes("calcium") && !noNumericCalcium && manualCalcium.trim() ? parseFloat(manualCalcium) : null;
    const parsedTotalCl = activeParams.includes("totalChlorine") && !noNumericTotalCl && manualTotalCl.trim() ? parseFloat(manualTotalCl) : null;
    const parsedCya = activeParams.includes("cya") && !noNumericCya && manualCya.trim() ? parseFloat(manualCya) : null;
    const parsedSalt = activeParams.includes("salt") && !noNumericSalt && manualSalt.trim() ? parseFloat(manualSalt) : null;
    const parsedWaterTemp = activeParams.includes("waterTemp") && manualWaterTemp.trim() ? parseFloat(manualWaterTemp) : null;

    try {
      const res = await fetch("/api/water-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testedAt: new Date(testDate).toISOString(),
          testedParams: activeParams,
          ph: parsedPh,
          phRange: activeParams.includes("ph") ? (phObj?.label || selectedPhRange) : null,
          freeChlorine: parsedCl,
          chlorineRange: activeParams.includes("chlorine") ? (clObj?.label || selectedClRange) : null,
          alkalinity: parsedAlk,
          alkalinityRange: activeParams.includes("alkalinity") ? (alkObj?.label || selectedAlkRange) : null,
          waterClarity: activeParams.includes("clarity") ? clarity : "CLEAR",
          calcium: parsedCalcium,
          calciumRange: activeParams.includes("calcium") ? (calciumObj?.label || selectedCalciumRange) : null,
          totalChlorine: parsedTotalCl,
          totalChlorineRange: activeParams.includes("totalChlorine") ? (totalClObj?.label || selectedTotalClRange) : null,
          cya: parsedCya,
          cyaRange: activeParams.includes("cya") ? (cyaObj?.label || selectedCyaRange) : null,
          salt: parsedSalt,
          saltRange: activeParams.includes("salt") ? (saltObj?.label || selectedSaltRange) : null,
          waterTemp: parsedWaterTemp,
          waterTempRange: activeParams.includes("waterTemp") && parsedWaterTemp ? `${parsedWaterTemp}°C` : null,
          description: description || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "שגיאה בשמירת בדיקה");
      }

      setIsAddModalOpen(false);
      setDescription("");
      setManualPh("");
      setNoNumericPh(true);
      setManualCl("");
      setNoNumericCl(true);
      setManualAlk("");
      setNoNumericAlk(true);
      setManualCalcium("");
      setNoNumericCalcium(true);
      setManualTotalCl("");
      setNoNumericTotalCl(true);
      setManualCya("");
      setNoNumericCya(true);
      setManualSalt("");
      setNoNumericSalt(true);
      setManualWaterTemp("");
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
    } else if (test.phRange) {
      const upper = test.phRange.toUpperCase();
      if (upper.includes("VERY_LOW") || upper.includes("חומצי מאוד")) phId = "VERY_LOW";
      else if (upper.includes("LOW") || upper.includes("נמוך")) phId = "LOW";
      else if (upper.includes("OK") || upper.includes("תקין")) phId = "OK";
      else if (upper.includes("VERY_HIGH") || upper.includes("בסיסי מאוד")) phId = "VERY_HIGH";
      else if (upper.includes("HIGH") || upper.includes("גבוה")) phId = "HIGH";
    }

    let clId = "UNKNOWN";
    if (typeof test.freeChlorine === "number") {
      if (test.freeChlorine < 0.5) clId = "VERY_LOW";
      else if (test.freeChlorine < 2.0) clId = "LOW";
      else if (test.freeChlorine <= 4.0) clId = "OK";
      else if (test.freeChlorine <= 8.0) clId = "HIGH";
      else clId = "VERY_HIGH";
    } else if (test.chlorineRange) {
      const upper = test.chlorineRange.toUpperCase();
      if (upper.includes("VERY_LOW") || upper.includes("ללא חיטוי")) clId = "VERY_LOW";
      else if (upper.includes("LOW") || upper.includes("נמוך")) clId = "LOW";
      else if (upper.includes("OK") || upper.includes("תקין")) clId = "OK";
      else if (upper.includes("VERY_HIGH") || upper.includes("שוק") || upper.includes("עודף")) clId = "VERY_HIGH";
      else if (upper.includes("HIGH") || upper.includes("גבוה")) clId = "HIGH";
    }

    let alkId = "UNKNOWN";
    if (typeof test.alkalinity === "number") {
      if (test.alkalinity < 40) alkId = "VERY_LOW";
      else if (test.alkalinity < 80) alkId = "LOW";
      else if (test.alkalinity <= 120) alkId = "OK";
      else if (test.alkalinity <= 180) alkId = "HIGH";
      else alkId = "VERY_HIGH";
    } else if (test.alkalinityRange) {
      const upper = test.alkalinityRange.toUpperCase();
      if (upper.includes("VERY_LOW") || upper.includes("נמוכה מאוד")) alkId = "VERY_LOW";
      else if (upper.includes("LOW") || upper.includes("נמוכה")) alkId = "LOW";
      else if (upper.includes("OK") || upper.includes("תקינה")) alkId = "OK";
      else if (upper.includes("VERY_HIGH") || upper.includes("גבוהה מאוד")) alkId = "VERY_HIGH";
      else if (upper.includes("HIGH") || upper.includes("גבוהה")) alkId = "HIGH";
    }

    const hasPhNum = typeof test.ph === "number" && !isNaN(test.ph);
    const hasClNum = typeof test.freeChlorine === "number" && !isNaN(test.freeChlorine);
    const hasAlkNum = typeof test.alkalinity === "number" && !isNaN(test.alkalinity);
    const hasCalciumNum = typeof test.calcium === "number" && !isNaN(test.calcium);
    const hasTotalClNum = typeof test.totalChlorine === "number" && !isNaN(test.totalChlorine);
    const hasCyaNum = typeof test.cya === "number" && !isNaN(test.cya);
    const hasSaltNum = typeof test.salt === "number" && !isNaN(test.salt);
    const hasWaterTempNum = typeof test.waterTemp === "number" && !isNaN(test.waterTemp);

    let formattedDate = "";
    if (test.testedAt) {
      const d = new Date(test.testedAt);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => n.toString().padStart(2, "0");
        formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    if (!formattedDate) {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    setEditForm({
      testedAt: formattedDate,
      phRangeId: phId,
      noNumericPh: !hasPhNum,
      manualPh: hasPhNum ? `${test.ph}` : "",
      clRangeId: clId,
      noNumericCl: !hasClNum,
      manualCl: hasClNum ? `${test.freeChlorine}` : "",
      alkRangeId: alkId,
      noNumericAlk: !hasAlkNum,
      manualAlk: hasAlkNum ? `${test.alkalinity}` : "",
      calciumRangeId: "OK",
      noNumericCalcium: !hasCalciumNum,
      manualCalcium: hasCalciumNum ? `${test.calcium}` : "",
      totalClRangeId: "OK",
      noNumericTotalCl: !hasTotalClNum,
      manualTotalCl: hasTotalClNum ? `${test.totalChlorine}` : "",
      cyaRangeId: "OK",
      noNumericCya: !hasCyaNum,
      manualCya: hasCyaNum ? `${test.cya}` : "",
      saltRangeId: "OK",
      noNumericSalt: !hasSaltNum,
      manualSalt: hasSaltNum ? `${test.salt}` : "",
      manualWaterTemp: hasWaterTempNum ? `${test.waterTemp}` : "",
      waterClarity: test.waterClarity || "CLEAR",
      description: test.description || "",
    });
  };

  const handleSaveEditTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;
    setSavingEdit(true);

    const phObj = PH_RANGES.find((r) => r.id === editForm.phRangeId);
    const clObj = CHLORINE_RANGES.find((r) => r.id === editForm.clRangeId);
    const alkObj = ALKALINITY_RANGES.find((r) => r.id === editForm.alkRangeId);
    const calciumObj = CALCIUM_RANGES.find((r) => r.id === editForm.calciumRangeId);
    const totalClObj = TOTAL_CL_RANGES.find((r) => r.id === editForm.totalClRangeId);
    const cyaObj = CYA_RANGES.find((r) => r.id === editForm.cyaRangeId);
    const saltObj = SALT_RANGES.find((r) => r.id === editForm.saltRangeId);

    const parsedPh = (!editForm.noNumericPh && editForm.manualPh?.trim()) ? parseFloat(editForm.manualPh) : null;
    const parsedCl = (!editForm.noNumericCl && editForm.manualCl?.trim()) ? parseFloat(editForm.manualCl) : null;
    const parsedAlk = (!editForm.noNumericAlk && editForm.manualAlk?.trim()) ? parseFloat(editForm.manualAlk) : null;
    const parsedCalcium = (!editForm.noNumericCalcium && editForm.manualCalcium?.trim()) ? parseFloat(editForm.manualCalcium) : null;
    const parsedTotalCl = (!editForm.noNumericTotalCl && editForm.manualTotalCl?.trim()) ? parseFloat(editForm.manualTotalCl) : null;
    const parsedCya = (!editForm.noNumericCya && editForm.manualCya?.trim()) ? parseFloat(editForm.manualCya) : null;
    const parsedSalt = (!editForm.noNumericSalt && editForm.manualSalt?.trim()) ? parseFloat(editForm.manualSalt) : null;
    const parsedWaterTemp = editForm.manualWaterTemp?.trim() ? parseFloat(editForm.manualWaterTemp) : null;

    try {
      let validIsoDate = new Date().toISOString();
      if (editForm.testedAt) {
        const d = new Date(editForm.testedAt);
        if (!isNaN(d.getTime())) {
          validIsoDate = d.toISOString();
        } else if (editingTest.testedAt) {
          validIsoDate = new Date(editingTest.testedAt).toISOString();
        }
      }

      const res = await fetch("/api/water-tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTest.id,
          testedAt: validIsoDate,
          ph: parsedPh,
          phRange: phObj?.label || editForm.phRangeId,
          freeChlorine: parsedCl,
          chlorineRange: clObj?.label || editForm.clRangeId,
          alkalinity: parsedAlk,
          alkalinityRange: alkObj?.label || editForm.alkRangeId,
          calcium: parsedCalcium,
          calciumRange: calciumObj?.label || editForm.calciumRangeId,
          totalChlorine: parsedTotalCl,
          totalChlorineRange: totalClObj?.label || editForm.totalClRangeId,
          cya: parsedCya,
          cyaRange: cyaObj?.label || editForm.cyaRangeId,
          salt: parsedSalt,
          saltRange: saltObj?.label || editForm.saltRangeId,
          waterTemp: parsedWaterTemp,
          waterTempRange: parsedWaterTemp ? `${parsedWaterTemp}°C` : null,
          waterClarity: editForm.waterClarity,
          description: editForm.description,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "שגיאה בשמירת שינויים");
      }

      setEditingTest(null);
      await loadTests();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "שגיאה בעדכון בדיקה");
    } finally {
      setSavingEdit(false);
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
            {tests.map((test, idx) => {
              const isLatestTest = idx === 0;
              const testDateObj = new Date(test.testedAt);

              const testedParamIds: string[] = (() => {
                if (test.testedParams) {
                  try {
                    const p = JSON.parse(test.testedParams);
                    if (Array.isArray(p) && p.length > 0) return p;
                  } catch {}
                }
                const list: string[] = [];
                if (test.ph !== null || test.phRange) list.push("ph");
                if (test.freeChlorine !== null || test.chlorineRange) list.push("chlorine");
                if (test.alkalinity !== null || test.alkalinityRange) list.push("alkalinity");
                if (test.waterClarity) list.push("clarity");
                if (test.calcium !== null || test.calciumRange) list.push("calcium");
                if (test.totalChlorine !== null || test.totalChlorineRange) list.push("totalChlorine");
                if (test.cya !== null || test.cyaRange) list.push("cya");
                if (test.salt !== null || test.saltRange) list.push("salt");
                if (test.waterTemp !== null || test.waterTempRange) list.push("waterTemp");
                return list.length > 0 ? list : DEFAULT_TEST_STRIP_PARAM_IDS;
              })();

              // Calculate Abnormal Risks dynamically for whichever parameters were tested
              const abnormalRisks: Array<{ name: string; risk: string }> = [];

              for (const pId of testedParamIds) {
                const pDef = ALL_TEST_STRIP_PARAMS.find((p) => p.id === pId);
                if (!pDef) continue;

                if (pId === "clarity") {
                  const clarityInfo = clarityLabels[test.waterClarity] || clarityLabels.CLEAR;
                  if (test.waterClarity && test.waterClarity !== "CLEAR") {
                    abnormalRisks.push({
                      name: `${pDef.nameHe} (${clarityInfo.label})`,
                      risk: pDef.dangerLow,
                    });
                  }
                  continue;
                }

                let val: number | null = null;
                let rangeStr: string | null = null;
                if (pId === "ph") { val = test.ph; rangeStr = test.phRange; }
                else if (pId === "chlorine") { val = test.freeChlorine; rangeStr = test.chlorineRange; }
                else if (pId === "alkalinity") { val = test.alkalinity; rangeStr = test.alkalinityRange; }
                else if (pId === "calcium") { val = test.calcium; rangeStr = test.calciumRange; }
                else if (pId === "totalChlorine") { val = test.totalChlorine; rangeStr = test.totalChlorineRange; }
                else if (pId === "cya") { val = test.cya; rangeStr = test.cyaRange; }
                else if (pId === "salt") { val = test.salt; rangeStr = test.saltRange; }
                else if (pId === "waterTemp") { val = test.waterTemp; rangeStr = test.waterTempRange; }

                const domain = getGenericDomain(pId, val, rangeStr);
                if (domain.id !== "OK" && domain.id !== "UNKNOWN") {
                  const riskText = (domain.id === "VERY_LOW" || domain.id === "LOW") ? pDef.dangerLow : pDef.dangerHigh;
                  abnormalRisks.push({
                    name: `${pDef.nameHe} (${domain.label})`,
                    risk: riskText,
                  });
                }
              }

              return (
                <div
                  key={test.id}
                  className={`bg-slate-900/90 border ${isLatestTest ? "border-cyan-800/80 ring-1 ring-cyan-500/20 shadow-cyan-950/30" : "border-slate-800 hover:border-slate-700"} rounded-3xl p-5 sm:p-6 transition-all shadow-xl space-y-4`}
                >
                  {/* Top Bar: Date & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl ${isLatestTest ? "bg-cyan-950/80 text-cyan-300 border-cyan-800/60" : "bg-slate-800 text-teal-300 border-slate-700"} flex items-center justify-center font-bold text-sm border`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-base">
                            {testDateObj.toLocaleDateString("he-IL", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          {isLatestTest ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>בדיקה עדכנית (מצב מים נוכחי)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 font-medium">
                              היסטוריית בדיקות
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
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

                  {/* Dynamic Parameter Badges Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {testedParamIds.map((pId) => {
                      const pDef = ALL_TEST_STRIP_PARAMS.find((p) => p.id === pId);
                      if (!pDef) return null;

                      if (pId === "clarity") {
                        const clarityInfo = clarityLabels[test.waterClarity] || clarityLabels.CLEAR;
                        return (
                          <div key={pId} className="bg-[#0a0f13] p-3.5 rounded-2xl border border-slate-800 space-y-1 text-center">
                            <div className="text-[11px] text-slate-400 font-semibold">{pDef.nameHe} ({pDef.enName})</div>
                            <div className={`text-sm sm:text-base font-bold ${clarityInfo.label.includes("צלול") ? "text-emerald-400" : "text-amber-400"}`}>
                              {clarityInfo.label}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium pt-0.5">
                              {clarityInfo.label.includes("צלול") ? "תקין" : "דורש טיפול"}
                            </div>
                          </div>
                        );
                      }

                      let val: number | null = null;
                      let rangeStr: string | null = null;
                      let displayUnit = pDef.unit;

                      if (pId === "ph") { val = test.ph; rangeStr = test.phRange; }
                      else if (pId === "chlorine") { val = test.freeChlorine; rangeStr = test.chlorineRange; }
                      else if (pId === "alkalinity") { val = test.alkalinity; rangeStr = test.alkalinityRange; }
                      else if (pId === "calcium") { val = test.calcium; rangeStr = test.calciumRange; }
                      else if (pId === "totalChlorine") { val = test.totalChlorine; rangeStr = test.totalChlorineRange; }
                      else if (pId === "cya") { val = test.cya; rangeStr = test.cyaRange; }
                      else if (pId === "salt") { val = test.salt; rangeStr = test.saltRange; }
                      else if (pId === "waterTemp") { val = test.waterTemp; rangeStr = test.waterTempRange; }

                      const domain = getGenericDomain(pId, val, rangeStr);

                      return (
                        <div key={pId} className="bg-[#0a0f13] p-3.5 rounded-2xl border border-slate-800 space-y-1 text-center">
                          <div className="text-[11px] text-slate-400 font-semibold">{pDef.nameHe} ({pDef.enName})</div>
                          <div className={`text-sm sm:text-base font-bold ${
                            domain.badgeClass.includes("text-emerald")
                              ? "text-emerald-400"
                              : domain.badgeClass.includes("text-amber")
                              ? "text-amber-400"
                              : domain.badgeClass.includes("text-rose")
                              ? "text-rose-400"
                              : "text-slate-400"
                          }`}>
                            {domain.label}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium pt-0.5">
                            {typeof val === "number" ? `${val} ${displayUnit}` : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional user description */}
                  {test.description && (
                    <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      <span className="text-slate-500 font-semibold">תיאור והערות: </span>
                      {test.description}
                    </div>
                  )}

                  {/* Hazards & Risks for abnormal parameters only */}
                  <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
                    {abnormalRisks.length === 0 ? (
                      <div className="p-3.5 rounded-2xl bg-[#0a0f13] border border-slate-800 text-slate-300 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-white">המים נבדקו ונמצאו בפרמטרים תקינים.</div>
                          <div className="text-[11px] text-slate-400">כל המדדים שנבדקו מאוזנים לחלוטין. המשך ליהנות ממים צלולים ובטוחים לרחצה!</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-slate-300 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>סכנות של מדדים שאינם תקינים:</span>
                        </div>
                        <div className="space-y-1.5 pr-2">
                          {abnormalRisks.map((item, rIdx) => (
                            <div key={rIdx} className="text-[11px] leading-relaxed flex items-start gap-1.5">
                              <span className="text-rose-400 font-bold shrink-0">• {item.name}:</span>
                              <span className="text-slate-200">{item.risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add New Test (Dynamic to activeParams) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">הזנת תוצאות בדיקת מקלון</h2>
                  <p className="text-[11px] text-slate-400">מוצגים {activeParams.length} מדדים פעילים בהתאם להגדרות שלך</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/settings"
                  target="_blank"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
                >
                  <span>⚙️ הגדרות מקלון</span>
                </Link>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
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

              {/* 1. pH */}
              {activeParams.includes("ph") && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">רמת חומציות (pH):</span>
                    <span className="text-[11px] text-slate-400">אידיאלי: 7.2 - 7.6</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-medium">הזנת ערך מספרי מדויק:</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={noNumericPh}
                          onChange={(e) => {
                            setNoNumericPh(e.target.checked);
                            if (e.target.checked) setManualPh("");
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                      </label>
                    </div>
                    {!noNumericPh && (
                      <input
                        type="number"
                        step="0.01"
                        placeholder="הזן ערך מספרי (למשל: 7.4)"
                        value={manualPh}
                        onChange={(e) => setManualPh(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 2. Chlorine */}
              {activeParams.includes("chlorine") && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">כלור חופשי / ברום (חיטוי):</span>
                    <span className="text-[11px] text-slate-400">אידיאלי: 2.0 - 4.0 ppm</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ב-ppm:</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={noNumericCl}
                          onChange={(e) => {
                            setNoNumericCl(e.target.checked);
                            if (e.target.checked) setManualCl("");
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                      </label>
                    </div>
                    {!noNumericCl && (
                      <input
                        type="number"
                        step="0.1"
                        placeholder="הזן ערך מספרי (למשל: 3.0)"
                        value={manualCl}
                        onChange={(e) => setManualCl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 3. Alkalinity */}
              {activeParams.includes("alkalinity") && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">בסיסיות כוללת (TA):</span>
                    <span className="text-[11px] text-slate-400">אידיאלי: 80 - 120 ppm</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ב-ppm:</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={noNumericAlk}
                          onChange={(e) => {
                            setNoNumericAlk(e.target.checked);
                            if (e.target.checked) setManualAlk("");
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                      </label>
                    </div>
                    {!noNumericAlk && (
                      <input
                        type="number"
                        step="1"
                        placeholder="הזן ערך מספרי (למשל: 90)"
                        value={manualAlk}
                        onChange={(e) => setManualAlk(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 4. Clarity */}
              {activeParams.includes("clarity") && (
                <div className="space-y-1.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300">מראה וצלילות המים</label>
                  <select
                    value={clarity}
                    onChange={(e) => setClarity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-medium"
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
              )}

              {/* 5. Calcium Hardness */}
              {activeParams.includes("calcium") && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">קשיות סידן (Calcium Hardness):</span>
                    <span className="text-[11px] text-slate-400">אידיאלי: 150 - 250 ppm</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CALCIUM_RANGES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedCalciumRange(r.id)}
                        className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                          selectedCalciumRange === r.id
                            ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold shadow"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ב-ppm:</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={noNumericCalcium}
                          onChange={(e) => {
                            setNoNumericCalcium(e.target.checked);
                            if (e.target.checked) setManualCalcium("");
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                      </label>
                    </div>
                    {!noNumericCalcium && (
                      <input
                        type="number"
                        step="5"
                        placeholder="הזן ערך מספרי (למשל: 200)"
                        value={manualCalcium}
                        onChange={(e) => setManualCalcium(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 6. Total Chlorine */}
              {activeParams.includes("totalChlorine") && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">כלור כולל (Total Chlorine):</span>
                    <span className="text-[11px] text-slate-400">אידיאלי: שווה לכלור חופשי</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TOTAL_CL_RANGES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedTotalClRange(r.id)}
                        className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                          selectedTotalClRange === r.id
                            ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold shadow"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ב-ppm:</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={noNumericTotalCl}
                          onChange={(e) => {
                            setNoNumericTotalCl(e.target.checked);
                            if (e.target.checked) setManualTotalCl("");
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                      </label>
                    </div>
                    {!noNumericTotalCl && (
                      <input
                        type="number"
                        step="0.1"
                        placeholder="הזן ערך מספרי (למשל: 3.2)"
                        value={manualTotalCl}
                        onChange={(e) => setManualTotalCl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 7. CYA */}
              {activeParams.includes("cya") && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">מייצב / חומצה ציאנורית (CYA):</span>
                    <span className="text-[11px] text-slate-400">אידיאלי: 20 - 50 ppm</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CYA_RANGES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedCyaRange(r.id)}
                        className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                          selectedCyaRange === r.id
                            ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold shadow"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ב-ppm:</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={noNumericCya}
                          onChange={(e) => {
                            setNoNumericCya(e.target.checked);
                            if (e.target.checked) setManualCya("");
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                      </label>
                    </div>
                    {!noNumericCya && (
                      <input
                        type="number"
                        step="5"
                        placeholder="הזן ערך מספרי (למשל: 30)"
                        value={manualCya}
                        onChange={(e) => setManualCya(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 8. Salt */}
              {activeParams.includes("salt") && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">רמת מלח (למערכות מלח):</span>
                    <span className="text-[11px] text-slate-400">אידיאלי: 1500 - 2500 ppm</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SALT_RANGES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedSaltRange(r.id)}
                        className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                          selectedSaltRange === r.id
                            ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold shadow"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ב-ppm:</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={noNumericSalt}
                          onChange={(e) => {
                            setNoNumericSalt(e.target.checked);
                            if (e.target.checked) setManualSalt("");
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                      </label>
                    </div>
                    {!noNumericSalt && (
                      <input
                        type="number"
                        step="50"
                        placeholder="הזן ערך מספרי (למשל: 2100)"
                        value={manualSalt}
                        onChange={(e) => setManualSalt(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 9. Water Temp */}
              {activeParams.includes("waterTemp") && (
                <div className="space-y-1.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-xs font-semibold text-slate-300">טמפרטורת מים (°C)</label>
                    <span className="text-[11px] text-slate-400">אידיאלי: 36°C - 39°C</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="הזן טמפרטורה (למשל: 38.0)"
                    value={manualWaterTemp}
                    onChange={(e) => setManualWaterTemp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-medium"
                  />
                </div>
              )}

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
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all cursor-pointer select-none"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>מאבחן ושומר תוצאות בדיקה...</span>
                    </>
                  ) : (
                    <span>שמור תוצאות בדיקה</span>
                  )}
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

              {/* 1. pH */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
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
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק:</label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.noNumericPh}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            noNumericPh: e.target.checked,
                            manualPh: e.target.checked ? "" : editForm.manualPh,
                          })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                    </label>
                  </div>
                  {!editForm.noNumericPh && (
                    <input
                      type="number"
                      step="0.01"
                      placeholder="הזן ערך מספרי מדויק"
                      value={editForm.manualPh}
                      onChange={(e) => setEditForm({ ...editForm, manualPh: e.target.value })}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                    />
                  )}
                </div>
              </div>

              {/* 2. Chlorine */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
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
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק:</label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.noNumericCl}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            noNumericCl: e.target.checked,
                            manualCl: e.target.checked ? "" : editForm.manualCl,
                          })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                    </label>
                  </div>
                  {!editForm.noNumericCl && (
                    <input
                      type="number"
                      step="0.1"
                      placeholder="הזן ערך מספרי מדויק"
                      value={editForm.manualCl}
                      onChange={(e) => setEditForm({ ...editForm, manualCl: e.target.value })}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                    />
                  )}
                </div>
              </div>

              {/* 3. Alkalinity */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
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
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק:</label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.noNumericAlk}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            noNumericAlk: e.target.checked,
                            manualAlk: e.target.checked ? "" : editForm.manualAlk,
                          })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                    </label>
                  </div>
                  {!editForm.noNumericAlk && (
                    <input
                      type="number"
                      step="1"
                      placeholder="הזן ערך מספרי מדויק"
                      value={editForm.manualAlk}
                      onChange={(e) => setEditForm({ ...editForm, manualAlk: e.target.value })}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                    />
                  )}
                </div>
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
                  disabled={savingEdit}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer select-none"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>מאבחן ושומר שינויים...</span>
                    </>
                  ) : (
                    <span>שמור שינויים</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
