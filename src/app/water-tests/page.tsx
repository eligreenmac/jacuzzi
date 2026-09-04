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
  Droplets,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Activity,
  TrendingUp,
  Sliders,
} from "lucide-react";

import {
  ALL_TEST_STRIP_PARAMS,
  ALL_PARAMS_WITH_CLARITY,
  WATER_CLARITY_PARAM,
  DEFAULT_TEST_STRIP_PARAM_IDS,
  PARAM_CATEGORIES,
  parseTestStripParams,
} from "@/lib/test-strip-params";

export function getGenericDomain(
  paramId: string,
  val: number | null | undefined,
  rangeStr?: string | null
) {
  if (rangeStr) {
    const s = rangeStr.toUpperCase();
    if (
      s.includes("VERY_LOW") ||
      s.includes("VERY LOW") ||
      s.includes("חומצי מאוד") ||
      s.includes("ללא חיטוי") ||
      s.includes("נמוכה מאוד") ||
      s.includes("נמוך מאוד")
    ) {
      return { id: "VERY_LOW", label: "נמוך מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    }
    if (
      s.includes("VERY_HIGH") ||
      s.includes("VERY HIGH") ||
      s.includes("בסיסי מאוד") ||
      s.includes("שוק") ||
      s.includes("עודף") ||
      s.includes("גבוהה מאוד") ||
      s.includes("גבוה מאוד") ||
      s.includes("נעילת כלור") ||
      s.includes("מסוכן") ||
      s.includes("זיהום חמור")
    ) {
      return { id: "VERY_HIGH", label: "חריג / מסוכן", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    }
    if (s.includes("LOW") || s.includes("נמוך") || s.includes("נמוכה") || s.includes("רכים")) {
      return { id: "LOW", label: "נמוך", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    }
    if (s.includes("HIGH") || s.includes("גבוה") || s.includes("גבוהה") || s.includes("קשים") || s.includes("כלורמינים") || s.includes("נוכחות")) {
      return { id: "HIGH", label: "גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    }
    if (s.includes("OK") || s.includes("תקין") || s.includes("אידיאלי") || s.includes("תקינה") || s.includes("נקי")) {
      return { id: "OK", label: "תקין / אידיאלי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    }
  }

  if (val === null || val === undefined || isNaN(val)) {
    return { id: "UNKNOWN", label: "לא נבדק", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
  }

  if (paramId === "ph") {
    if (val < 6.8) return { id: "VERY_LOW", label: "חומצי מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 7.2) return { id: "LOW", label: "חומצי / נמוך", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 7.6) return { id: "OK", label: "אידיאלי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 8.0) return { id: "HIGH", label: "בסיסי / גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "בסיסי מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "chlorine") {
    if (val < 0.5) return { id: "VERY_LOW", label: "ללא חיטוי", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 2.0) return { id: "LOW", label: "נמוך", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 4.0) return { id: "OK", label: "אידיאלי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 8.0) return { id: "HIGH", label: "גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "שוק / עודף", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "alkalinity") {
    if (val < 40) return { id: "VERY_LOW", label: "נמוכה מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 80) return { id: "LOW", label: "נמוכה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 120) return { id: "OK", label: "אידיאלית", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 180) return { id: "HIGH", label: "גבוהה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "גבוהה מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "calcium") {
    if (val < 100) return { id: "VERY_LOW", label: "רכים מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 150) return { id: "LOW", label: "נמוך", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 250) return { id: "OK", label: "אידיאלי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 400) return { id: "HIGH", label: "קשים", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "קשים מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "carbonate") {
    if (val <= 10) return { id: "OK", label: "תקין / נמוך", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 25) return { id: "HIGH", label: "גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "גבוה מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "totalChlorine") {
    if (val <= 4.0) return { id: "OK", label: "תקין", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "HIGH", label: "גבוה / כלור קשור", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
  }
  if (paramId === "bromine") {
    if (val < 1.0) return { id: "VERY_LOW", label: "ללא חיטוי", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 3.0) return { id: "LOW", label: "נמוך", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 5.0) return { id: "OK", label: "אידיאלי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 9.0) return { id: "HIGH", label: "גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "גבוה מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "cya") {
    if (val < 20) return { id: "LOW", label: "נמוך", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 50) return { id: "OK", label: "אידיאלי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 100) return { id: "HIGH", label: "גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "נעילת כלור", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "salt") {
    if (val < 1500) return { id: "LOW", label: "נמוך", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 2500) return { id: "OK", label: "אידיאלי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "HIGH", label: "גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
  }
  if (paramId === "waterTemp") {
    if (val < 35) return { id: "LOW", label: "נמוך / קר", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 39) return { id: "OK", label: "אידיאלי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "VERY_HIGH", label: "חם מאוד / מסוכן", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "nitrate") {
    if (val <= 10) return { id: "OK", label: "תקין / נקי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 50) return { id: "HIGH", label: "בינוני-גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "עומס חריג", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "nitrite") {
    if (val <= 0.1) return { id: "OK", label: "תקין / ללא נוכחות", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 1.0) return { id: "HIGH", label: "נוכחות ניטריט", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "זיהום חמור", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "iron" || paramId === "copper") {
    if (val <= 0.2) return { id: "OK", label: "תקין / נקי", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 1.0) return { id: "HIGH", label: "נוכחות מתכת", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "גבוה / כתמים", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "chromium") {
    if (val <= 0.05) return { id: "OK", label: "תקין", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "VERY_HIGH", label: "נוכחות כרום", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "lead") {
    if (val <= 0.01) return { id: "OK", label: "תקין / אפס", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "VERY_HIGH", label: "עופרת (מסוכן!)", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "mercury") {
    if (val <= 0.002) return { id: "OK", label: "תקין / אפס", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "VERY_HIGH", label: "כספית (רעלן!)", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "fluoride") {
    if (val <= 1.5) return { id: "OK", label: "תקין", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 4.0) return { id: "HIGH", label: "גבוה", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "חריג מאוד", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }

  return { id: "UNKNOWN", label: "לא נבדק", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
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

export function extractParamValue(test: any, paramId: string): { val: number | null; rangeStr: string | null } {
  if (paramId === "ph") return { val: test.ph, rangeStr: test.phRange };
  if (paramId === "chlorine") return { val: test.freeChlorine, rangeStr: test.chlorineRange };
  if (paramId === "alkalinity") return { val: test.alkalinity, rangeStr: test.alkalinityRange };
  if (paramId === "calcium") return { val: test.calcium, rangeStr: test.calciumRange };
  if (paramId === "totalChlorine") return { val: test.totalChlorine, rangeStr: test.totalChlorineRange };
  if (paramId === "cya") return { val: test.cya, rangeStr: test.cyaRange };
  if (paramId === "salt") return { val: test.salt, rangeStr: test.saltRange };
  if (paramId === "waterTemp") return { val: test.waterTemp, rangeStr: test.waterTempRange };
  if (paramId === "carbonate") return { val: test.carbonate, rangeStr: test.carbonateRange };
  if (paramId === "bromine") return { val: test.bromine, rangeStr: test.bromineRange };
  if (paramId === "nitrate") return { val: test.nitrate, rangeStr: test.nitrateRange };
  if (paramId === "nitrite") return { val: test.nitrite, rangeStr: test.nitriteRange };
  if (paramId === "iron") return { val: test.iron, rangeStr: test.ironRange };
  if (paramId === "copper") return { val: test.copper, rangeStr: test.copperRange };
  if (paramId === "chromium") return { val: test.chromium, rangeStr: test.chromiumRange };
  if (paramId === "lead") return { val: test.lead, rangeStr: test.leadRange };
  if (paramId === "mercury") return { val: test.mercury, rangeStr: test.mercuryRange };
  if (paramId === "fluoride") return { val: test.fluoride, rangeStr: test.fluorideRange };

  if (test.extendedMetrics) {
    try {
      const ext = typeof test.extendedMetrics === "string" ? JSON.parse(test.extendedMetrics) : test.extendedMetrics;
      if (ext && ext[paramId]) {
        return {
          val: typeof ext[paramId].val === "number" ? ext[paramId].val : null,
          rangeStr: ext[paramId].range || null,
        };
      }
    } catch {}
  }
  return { val: null, rangeStr: null };
}

interface WaterTestsPageProps {
  initialOpenAddModal?: boolean;
}

export default function WaterTestsPage({ initialOpenAddModal = false }: WaterTestsPageProps) {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeParams, setActiveParams] = useState<string[]>(DEFAULT_TEST_STRIP_PARAM_IDS);

  // Add Test Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAddModal);
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 16));
  const [clarity, setClarity] = useState("CLEAR");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialOpenAddModal) {
      setTestDate(new Date().toISOString().slice(0, 16));
      setIsAddModalOpen(true);
    }
  }, [initialOpenAddModal]);

  // Generic dynamic parameter selections for Add Modal
  const [paramSelections, setParamSelections] = useState<Record<string, { rangeId: string; noNumeric: boolean; manualVal: string }>>({});

  // Edit Test Modal State
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    testedAt: string;
    waterClarity: string;
    description: string;
    params: Record<string, { rangeId: string; noNumeric: boolean; manualVal: string }>;
  }>({
    testedAt: "",
    waterClarity: "CLEAR",
    description: "",
    params: {},
  });

  // Settings Modal State (In-Page Popup)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempParams, setTempParams] = useState<string[]>(DEFAULT_TEST_STRIP_PARAM_IDS);
  const [savingSettings, setSavingSettings] = useState(false);

  const openSettingsModal = () => {
    setTempParams([...activeParams]);
    setIsSettingsModalOpen(true);
  };

  const saveSettingsModal = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/jacuzzi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testStripParams: tempParams }),
      });
      if (!res.ok) {
        throw new Error("שגיאה בשמירת הגדרות מקלון");
      }
      setActiveParams(tempParams);
      if (typeof window !== "undefined") {
        localStorage.setItem("active_test_strip_params", JSON.stringify(tempParams));
      }
      setParamSelections((prev) => {
        const next = { ...prev };
        for (const pId of tempParams) {
          if (!next[pId]) {
            next[pId] = { rangeId: "OK", noNumeric: true, manualVal: "" };
          }
        }
        return next;
      });
      setIsSettingsModalOpen(false);
      setActionNotice("הגדרות מקלון הבדיקה נשמרו בהצלחה!");
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || "שגיאה בשמירה");
    } finally {
      setSavingSettings(false);
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

        // Initialize state for active parameters
        const initialSelections: Record<string, { rangeId: string; noNumeric: boolean; manualVal: string }> = {};
        for (const pId of configuredParams) {
          initialSelections[pId] = { rangeId: "OK", noNumeric: true, manualVal: "" };
        }
        setParamSelections(initialSelections);
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

    const payload: any = {
      testedAt: new Date(testDate).toISOString(),
      testedParams: activeParams,
      description: description || null,
      waterClarity: clarity || "CLEAR",
    };

    for (const pId of activeParams) {
      if (pId === "clarity") continue;
      const sel = paramSelections[pId] || { rangeId: "OK", noNumeric: true, manualVal: "" };
      const pDef = ALL_PARAMS_WITH_CLARITY.find((p) => p.id === pId);
      const parsedNum = !sel.noNumeric && sel.manualVal.trim() ? parseFloat(sel.manualVal) : null;
      const matchedRange = pDef?.defaultRanges?.find((r) => r.id === sel.rangeId);
      const rangeLabel = matchedRange?.label || (parsedNum ? `${parsedNum} ${pDef?.unit || ""}` : sel.rangeId);

      if (pId === "ph") { payload.ph = parsedNum; payload.phRange = rangeLabel; }
      else if (pId === "chlorine") { payload.freeChlorine = parsedNum; payload.chlorineRange = rangeLabel; }
      else if (pId === "alkalinity") { payload.alkalinity = parsedNum; payload.alkalinityRange = rangeLabel; }
      else if (pId === "calcium") { payload.calcium = parsedNum; payload.calciumRange = rangeLabel; }
      else if (pId === "totalChlorine") { payload.totalChlorine = parsedNum; payload.totalChlorineRange = rangeLabel; }
      else if (pId === "cya") { payload.cya = parsedNum; payload.cyaRange = rangeLabel; }
      else if (pId === "salt") { payload.salt = parsedNum; payload.saltRange = rangeLabel; }
      else if (pId === "waterTemp") { payload.waterTemp = parsedNum; payload.waterTempRange = rangeLabel; }
      else if (pId === "carbonate") { payload.carbonate = parsedNum; payload.carbonateRange = rangeLabel; }
      else if (pId === "bromine") { payload.bromine = parsedNum; payload.bromineRange = rangeLabel; }
      else if (pId === "nitrate") { payload.nitrate = parsedNum; payload.nitrateRange = rangeLabel; }
      else if (pId === "nitrite") { payload.nitrite = parsedNum; payload.nitriteRange = rangeLabel; }
      else if (pId === "iron") { payload.iron = parsedNum; payload.ironRange = rangeLabel; }
      else if (pId === "copper") { payload.copper = parsedNum; payload.copperRange = rangeLabel; }
      else if (pId === "chromium") { payload.chromium = parsedNum; payload.chromiumRange = rangeLabel; }
      else if (pId === "lead") { payload.lead = parsedNum; payload.leadRange = rangeLabel; }
      else if (pId === "mercury") { payload.mercury = parsedNum; payload.mercuryRange = rangeLabel; }
      else if (pId === "fluoride") { payload.fluoride = parsedNum; payload.fluorideRange = rangeLabel; }
    }

    try {
      const res = await fetch("/api/water-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

    let formattedDate = "";
    if (test.testedAt) {
      const d = new Date(test.testedAt);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => n.toString().padStart(2, "0");
        formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }

    const editParamMap: Record<string, { rangeId: string; noNumeric: boolean; manualVal: string }> = {};

    ALL_PARAMS_WITH_CLARITY.forEach((param) => {
      const { val, rangeStr } = extractParamValue(test, param.id);
      const hasNum = typeof val === "number" && !isNaN(val);
      const domain = getGenericDomain(param.id, val, rangeStr);

      editParamMap[param.id] = {
        rangeId: domain.id === "UNKNOWN" ? "OK" : domain.id,
        noNumeric: !hasNum,
        manualVal: hasNum ? `${val}` : "",
      };
    });

    setEditForm({
      testedAt: formattedDate || new Date().toISOString().slice(0, 16),
      waterClarity: test.waterClarity || "CLEAR",
      description: test.description || "",
      params: editParamMap,
    });
  };

  const handleSaveEditTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;
    setSavingEdit(true);

    const payload: any = {
      id: editingTest.id,
      testedAt: editForm.testedAt ? new Date(editForm.testedAt).toISOString() : editingTest.testedAt,
      waterClarity: editForm.waterClarity,
      description: editForm.description,
    };

    Object.entries(editForm.params).forEach(([pId, sel]) => {
      const pDef = ALL_PARAMS_WITH_CLARITY.find((p) => p.id === pId);
      const parsedNum = !sel.noNumeric && sel.manualVal.trim() ? parseFloat(sel.manualVal) : null;
      const matchedRange = pDef?.defaultRanges?.find((r) => r.id === sel.rangeId);
      const rangeLabel = matchedRange?.label || (parsedNum ? `${parsedNum} ${pDef?.unit || ""}` : sel.rangeId);

      if (pId === "ph") { payload.ph = parsedNum; payload.phRange = rangeLabel; }
      else if (pId === "chlorine") { payload.freeChlorine = parsedNum; payload.chlorineRange = rangeLabel; }
      else if (pId === "alkalinity") { payload.alkalinity = parsedNum; payload.alkalinityRange = rangeLabel; }
      else if (pId === "calcium") { payload.calcium = parsedNum; payload.calciumRange = rangeLabel; }
      else if (pId === "totalChlorine") { payload.totalChlorine = parsedNum; payload.totalChlorineRange = rangeLabel; }
      else if (pId === "cya") { payload.cya = parsedNum; payload.cyaRange = rangeLabel; }
      else if (pId === "salt") { payload.salt = parsedNum; payload.saltRange = rangeLabel; }
      else if (pId === "waterTemp") { payload.waterTemp = parsedNum; payload.waterTempRange = rangeLabel; }
      else if (pId === "carbonate") { payload.carbonate = parsedNum; payload.carbonateRange = rangeLabel; }
      else if (pId === "bromine") { payload.bromine = parsedNum; payload.bromineRange = rangeLabel; }
      else if (pId === "nitrate") { payload.nitrate = parsedNum; payload.nitrateRange = rangeLabel; }
      else if (pId === "nitrite") { payload.nitrite = parsedNum; payload.nitriteRange = rangeLabel; }
      else if (pId === "iron") { payload.iron = parsedNum; payload.ironRange = rangeLabel; }
      else if (pId === "copper") { payload.copper = parsedNum; payload.copperRange = rangeLabel; }
      else if (pId === "chromium") { payload.chromium = parsedNum; payload.chromiumRange = rangeLabel; }
      else if (pId === "lead") { payload.lead = parsedNum; payload.leadRange = rangeLabel; }
      else if (pId === "mercury") { payload.mercury = parsedNum; payload.mercuryRange = rangeLabel; }
      else if (pId === "fluoride") { payload.fluoride = parsedNum; payload.fluorideRange = rangeLabel; }
    });

    try {
      const res = await fetch("/api/water-tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "שגיאה בעדכון בדיקה");
      }

      setEditingTest(null);
      loadTests();
    } catch (err: any) {
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

  const clarityLabels: Record<string, { label: string }> = {
    CLEAR: { label: "מים צלולים" },
    SLIGHTLY_CLOUDY: { label: "מעט עכורים" },
    VERY_CLOUDY: { label: "עכורים מאוד / חלביים" },
    FOAMY: { label: "מקציפים" },
    GREEN: { label: "ירוקים / אצות" },
    BAD_ODOR: { label: "ריח חריף" },
    METALLIC_COPPER: { label: "גוון ירוק-טורקיז (נחושת)" },
    METALLIC_RUST: { label: "חלודה / ברזל" },
  };

  // Metrics summary
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
            תיעוד כרונולוגי של בדיקות מקלונים, איזון מים ומעקב מדדים.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={openSettingsModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer select-none"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>הגדרות מקלון ({activeParams.length} פעילים)</span>
          </button>

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
                let list: string[] = [];
                if (test.testedParams) {
                  try {
                    const p = JSON.parse(test.testedParams);
                    if (Array.isArray(p) && p.length > 0) list = p;
                  } catch {}
                }
                if (list.length === 0) {
                  ALL_PARAMS_WITH_CLARITY.forEach((param) => {
                    if (param.id === "clarity") return;
                    const { val, rangeStr } = extractParamValue(test, param.id);
                    if (val !== null || rangeStr) list.push(param.id);
                  });
                }
                const hasClarity = list.includes("clarity") || !!test.waterClarity;
                const withoutClarity = list.filter((id) => id !== "clarity");
                return hasClarity
                  ? [...withoutClarity, "clarity"]
                  : withoutClarity.length > 0
                  ? withoutClarity
                  : DEFAULT_TEST_STRIP_PARAM_IDS;
              })();

              // Calculate Abnormal Risks dynamically
              const abnormalRisks: Array<{ name: string; risk: string }> = [];

              for (const pId of testedParamIds) {
                const pDef = ALL_PARAMS_WITH_CLARITY.find((p) => p.id === pId);
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

                const { val, rangeStr } = extractParamValue(test, pId);
                const domain = getGenericDomain(pId, val, rangeStr);
                if (domain.id !== "OK" && domain.id !== "UNKNOWN") {
                  const riskText = domain.id === "VERY_LOW" || domain.id === "LOW" ? pDef.dangerLow : pDef.dangerHigh;
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
                  {/* Top Bar */}
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
                      const pDef = ALL_PARAMS_WITH_CLARITY.find((p) => p.id === pId);
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

                      const { val, rangeStr } = extractParamValue(test, pId);
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
                            {typeof val === "number" ? `${val} ${pDef.unit}` : "—"}
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

      {/* Modal: Add New Test */}
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
                  <p className="text-[11px] text-slate-400">מוצגים {activeParams.length} מדדים פעילים לפי הגדרות המקלון שלך</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openSettingsModal}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer select-none"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>הגדרות מקלון</span>
                </button>
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

            <form onSubmit={handleSaveNewTest} className="space-y-6">
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

              {/* Categorized Active Parameters */}
              <div className="space-y-6">
                {PARAM_CATEGORIES.map((catName) => {
                  const catActiveParams = ALL_TEST_STRIP_PARAMS.filter(
                    (p) => p.category === catName && activeParams.includes(p.id) && p.id !== "clarity"
                  );
                  if (catActiveParams.length === 0) return null;

                  return (
                    <div key={catName} className="space-y-3">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{catName}</span>
                      </div>

                      <div className="space-y-3.5">
                        {catActiveParams.map((param) => {
                          const sel = paramSelections[param.id] || { rangeId: "OK", noNumeric: true, manualVal: "" };

                          return (
                            <div key={param.id} className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                              <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                                <span className="font-bold text-slate-200">
                                  {param.nameHe} ({param.enName}):
                                </span>
                                <span className="text-[11px] text-slate-400">אידיאלי: {param.idealRange}</span>
                              </div>

                              {param.defaultRanges && param.defaultRanges.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {param.defaultRanges.map((r) => (
                                    <button
                                      key={r.id}
                                      type="button"
                                      onClick={() =>
                                        setParamSelections((prev) => ({
                                          ...prev,
                                          [param.id]: { ...(prev[param.id] || { noNumeric: true, manualVal: "" }), rangeId: r.id },
                                        }))
                                      }
                                      className={`px-3 py-2 rounded-xl text-right text-xs font-medium border transition-all ${
                                        sel.rangeId === r.id
                                          ? "border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold shadow"
                                          : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                                      }`}
                                    >
                                      {r.label}
                                    </button>
                                  ))}
                                </div>
                              ) : null}

                              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ({param.unit}):</label>
                                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={sel.noNumeric}
                                      onChange={(e) =>
                                        setParamSelections((prev) => ({
                                          ...prev,
                                          [param.id]: {
                                            ...(prev[param.id] || { rangeId: "OK" }),
                                            noNumeric: e.target.checked,
                                            manualVal: e.target.checked ? "" : prev[param.id]?.manualVal || "",
                                          },
                                        }))
                                      }
                                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                                  </label>
                                </div>
                                {!sel.noNumeric && (
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder={`הזן ערך ב-${param.unit}`}
                                    value={sel.manualVal}
                                    onChange={(e) =>
                                      setParamSelections((prev) => ({
                                        ...prev,
                                        [param.id]: {
                                          ...(prev[param.id] || { rangeId: "OK", noNumeric: false }),
                                          manualVal: e.target.value,
                                        },
                                      }))
                                    }
                                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Water Clarity - Always rendered last among metrics */}
                <div className="space-y-1.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-xs font-semibold text-slate-300">צלילות ומראה המים (Water Clarity)</label>
                    <span className="text-[11px] text-slate-400">אידיאלי: צלול ונקי</span>
                  </div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
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

              <div className="space-y-4">
                {ALL_TEST_STRIP_PARAMS.filter((p) => p.id !== "clarity").map((param) => {
                  const sel = editForm.params[param.id] || { rangeId: "OK", noNumeric: true, manualVal: "" };

                  return (
                    <div key={param.id} className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{param.nameHe} ({param.enName})</span>
                        <span className="text-[11px] text-slate-400">אידיאלי: {param.idealRange}</span>
                      </div>

                      {param.defaultRanges && param.defaultRanges.length > 0 && (
                        <select
                          value={sel.rangeId}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              params: {
                                ...editForm.params,
                                [param.id]: { ...sel, rangeId: e.target.value },
                              },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                        >
                          {param.defaultRanges.map((r) => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                      )}

                      <div className="pt-1.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-slate-400 font-medium">ערך מספרי ({param.unit}):</label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sel.noNumeric}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  params: {
                                    ...editForm.params,
                                    [param.id]: {
                                      ...sel,
                                      noNumeric: e.target.checked,
                                      manualVal: e.target.checked ? "" : sel.manualVal,
                                    },
                                  },
                                })
                              }
                              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                          </label>
                        </div>
                        {!sel.noNumeric && (
                          <input
                            type="number"
                            step="any"
                            placeholder="הזן ערך מספרי מדויק"
                            value={sel.manualVal}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                params: {
                                  ...editForm.params,
                                  [param.id]: { ...sel, manualVal: e.target.value },
                                },
                              })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Water Clarity in Edit Modal - always rendered last */}
                <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-xs font-semibold text-slate-300">צלילות ומראה המים (Water Clarity)</label>
                    <span className="text-[11px] text-slate-400">אידיאלי: צלול ונקי</span>
                  </div>
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

      {/* Modal: Test Strip Settings */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">הגדרות מקלון בדיקה</h2>
                  <p className="text-xs text-slate-400">סמן את המדדים הנמדדים במקלון או בערכת הבדיקה שלך</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-semibold text-cyan-300">
                {tempParams.length} מדדים נבחרו מתוך {ALL_TEST_STRIP_PARAMS.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTempParams(ALL_TEST_STRIP_PARAMS.map((p) => p.id))}
                  className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  בחר הכל ({ALL_TEST_STRIP_PARAMS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTempParams(DEFAULT_TEST_STRIP_PARAM_IDS)}
                  className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  ברירת מחדל ({DEFAULT_TEST_STRIP_PARAM_IDS.length} מדדים)
                </button>
              </div>
            </div>

            {/* Categorized List */}
            <div className="space-y-6">
              {PARAM_CATEGORIES.map((catName) => {
                const catParams = ALL_TEST_STRIP_PARAMS.filter((p) => p.category === catName);
                if (catParams.length === 0) return null;
                const selectedCount = catParams.filter((p) => tempParams.includes(p.id)).length;

                return (
                  <div key={catName} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{catName}</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-semibold border border-slate-700">
                        {selectedCount} / {catParams.length} פעילים
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {catParams.map((param) => {
                        const isSelected = tempParams.includes(param.id);

                        return (
                          <div
                            key={param.id}
                            onClick={() => {
                              setTempParams((prev) => {
                                const next = prev.includes(param.id)
                                  ? prev.filter((p) => p !== param.id)
                                  : [...prev, param.id];
                                if (next.length === 0) return prev;
                                return next;
                              });
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all select-none flex items-start gap-3 ${
                              isSelected
                                ? "bg-cyan-950/30 border-cyan-500/60 shadow-sm"
                                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-85"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 w-4 h-4 accent-cyan-500 rounded cursor-pointer pointer-events-none"
                            />
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className={`font-bold text-xs ${isSelected ? "text-white" : "text-slate-400"}`}>
                                  {param.nameHe} ({param.enName})
                                </span>
                                <span className="text-[10px] text-cyan-400 font-medium">{param.idealRange}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-tight line-clamp-2">
                                {param.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={saveSettingsModal}
                disabled={savingSettings}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all cursor-pointer select-none"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>שומר הגדרות...</span>
                  </>
                ) : (
                  <span>שמור הגדרות מקלון</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
