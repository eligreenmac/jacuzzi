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
  Waves,
  Sparkles,
  X,
  Info,
  History,
  CalendarDays,
} from "lucide-react";
import { getParamDomain } from "@/app/water-tests/page";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWaterAgeModalOpen, setIsWaterAgeModalOpen] = useState(false);

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

  const sanitizerLabel =
    jacuzzi?.sanitizationType === "BROMINE"
      ? "חיטוי (ברום)"
      : jacuzzi?.sanitizationType === "SALT"
      ? "חיטוי (מלח)"
      : jacuzzi?.sanitizationType === "ACTIVE_OXYGEN"
      ? "חיטוי (חמצן פעיל)"
      : "חיטוי (כלור)";

  // Calculate days since last refill
  const refillDate = jacuzzi?.lastRefillDate ? new Date(jacuzzi.lastRefillDate) : new Date();
  const daysSinceRefill = Math.max(0, Math.floor((Date.now() - refillDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilNextRefill = Math.max(0, 90 - daysSinceRefill);
  const nextRefillDate = new Date(refillDate.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Calculate days since last deep clean / pipe flush
  const deepCleanDate = jacuzzi?.lastDeepCleanDate ? new Date(jacuzzi.lastDeepCleanDate) : null;
  const daysSinceDeepClean = deepCleanDate
    ? Math.max(0, Math.floor((Date.now() - deepCleanDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const daysUntilNextDeepClean = deepCleanDate ? Math.max(0, 90 - (daysSinceDeepClean || 0)) : 90;
  const nextDeepCleanDate = deepCleanDate
    ? new Date(deepCleanDate.getTime() + 90 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  // Calculate Last Enzyme Addition
  const enzymeTask = tasks.find((t: any) => t.title?.includes("אנזים") || t.title?.includes("אנזימים"));
  const enzymeDiary = data?.diaryEntries?.find((d: any) => 
    d.title?.includes("אנזים") || d.content?.includes("אנזים") || d.chemicalsAdded?.includes("אנזים")
  );
  const lastEnzymeDate = enzymeTask?.lastDoneDate 
    ? new Date(enzymeTask.lastDoneDate) 
    : enzymeDiary?.createdAt 
    ? new Date(enzymeDiary.createdAt) 
    : null;
  const daysSinceEnzyme = lastEnzymeDate 
    ? Math.max(0, Math.floor((Date.now() - lastEnzymeDate.getTime()) / (1000 * 60 * 60 * 24))) 
    : null;
  const daysUntilNextEnzyme = lastEnzymeDate ? Math.max(0, 7 - (daysSinceEnzyme || 0)) : 7;
  const nextEnzymeDate = lastEnzymeDate
    ? new Date(lastEnzymeDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Calculate Last Partial Water Refill
  const isPartialRefillText = (text: string) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    const isFull = lower.includes("100%") || lower.includes("מלאה") || lower.includes("ריקון מלא") || lower.includes("שטיפת צנרת");
    if (isFull) return false;

    return (
      lower.includes("חלקית") ||
      lower.includes("ריענון") ||
      lower.includes("חצי מים") ||
      lower.includes("החלפת חצי") ||
      lower.includes("מים טריים") ||
      lower.includes("מים חדשים") ||
      (lower.includes("החלפ") && lower.includes("מים")) ||
      (lower.includes("מילוי") && lower.includes("מים") && !lower.includes("מלא")) ||
      lower.includes("50%") ||
      lower.includes("30%") ||
      lower.includes("25%") ||
      lower.includes("20%")
    );
  };

  const partialRefillTask = tasks.find((t: any) => 
    t.lastDoneDate && (isPartialRefillText(t.title) || isPartialRefillText(t.description))
  );

  const partialRefillDiaries = (data?.diaryEntries || []).filter((d: any) => 
    isPartialRefillText(d.title) || isPartialRefillText(d.content)
  );

  partialRefillDiaries.sort((a: any, b: any) => new Date(b.entryDate || b.createdAt).getTime() - new Date(a.entryDate || a.createdAt).getTime());
  const latestPartialDiary = partialRefillDiaries[0] || null;

  const lastPartialRefillDate = latestPartialDiary?.entryDate 
    ? new Date(latestPartialDiary.entryDate) 
    : latestPartialDiary?.createdAt 
    ? new Date(latestPartialDiary.createdAt) 
    : partialRefillTask?.lastDoneDate 
    ? new Date(partialRefillTask.lastDoneDate) 
    : null;

  const daysSincePartialRefill = lastPartialRefillDate 
    ? Math.max(0, Math.floor((Date.now() - lastPartialRefillDate.getTime()) / (1000 * 60 * 60 * 24))) 
    : null;

  let partialPct = "30";
  if (latestPartialDiary) {
    const fullDiaryText = `${latestPartialDiary.title || ""} ${latestPartialDiary.content || ""}`;
    const match = fullDiaryText.match(/(\d+)%/);
    if (match) {
      partialPct = match[1];
    } else if (fullDiaryText.includes("חצי") || fullDiaryText.includes("50")) {
      partialPct = "50";
    } else if (fullDiaryText.includes("רבע") || fullDiaryText.includes("25")) {
      partialPct = "25";
    } else if (fullDiaryText.includes("שליש") || fullDiaryText.includes("33")) {
      partialPct = "33";
    }
  } else if (partialRefillTask) {
    const fullTaskText = `${partialRefillTask.description || ""} ${partialRefillTask.title || ""}`;
    const match = fullTaskText.match(/(\d+)%/);
    if (match) {
      partialPct = match[1];
    } else if (fullTaskText.includes("חצי") || fullTaskText.includes("50")) {
      partialPct = "50";
    }
  }
  const partialLiters = Math.round(((jacuzzi?.volumeLiters || 1200) * parseInt(partialPct, 10)) / 100);
  const daysUntilNextPartialRefill = lastPartialRefillDate ? Math.max(0, 30 - (daysSincePartialRefill || 0)) : 30;
  const nextPartialRefillDate = lastPartialRefillDate
    ? new Date(lastPartialRefillDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Calculate Next Water Test
  const waterTestTask = tasks.find((t: any) => t.title?.includes("בדיק") || t.title?.includes("מקלון"));
  const daysSinceLastWaterTest = latestWaterLog
    ? Math.max(0, Math.floor((Date.now() - new Date(latestWaterLog.testedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const daysUntilNextWaterTest = daysSinceLastWaterTest !== null ? Math.max(0, 7 - daysSinceLastWaterTest) : 7;
  const nextWaterTestDate = latestWaterLog
    ? new Date(new Date(latestWaterLog.testedAt).getTime() + 7 * 24 * 60 * 60 * 1000)
    : (waterTestTask?.nextDueDate ? new Date(waterTestTask.nextDueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Calculate Wall & Waterline Cleaning (14 days cycle)
  const wallCleanTask = tasks.find((t: any) => t.title?.includes("דפנ") || t.title?.includes("קו מים") || t.title?.includes("דופן"));
  const wallCleanDiary = data?.diaryEntries?.find((d: any) => d.title?.includes("דפנ") || d.content?.includes("דפנ") || d.title?.includes("דופן"));
  const lastWallCleanDate = wallCleanTask?.lastDoneDate
    ? new Date(wallCleanTask.lastDoneDate)
    : wallCleanDiary?.createdAt
    ? new Date(wallCleanDiary.createdAt)
    : null;
  const daysSinceWallClean = lastWallCleanDate
    ? Math.max(0, Math.floor((Date.now() - lastWallCleanDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const daysUntilNextWallClean = lastWallCleanDate ? Math.max(0, 14 - (daysSinceWallClean || 0)) : 14;
  const nextWallCleanDate = lastWallCleanDate
    ? new Date(lastWallCleanDate.getTime() + 14 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // Calculate Filter Wash (7 days cycle)
  const filterWashTask = tasks.find((t: any) => (t.title?.includes("שטיפת פילטר") || t.title?.includes("ניקוי פילטר") || t.title?.includes("שטיפת מסנן")) && !t.title?.includes("חדש") && !t.title?.includes("החלפ"));
  const filterWashDiary = data?.diaryEntries?.find((d: any) => (d.title?.includes("שטיפת פילטר") || d.content?.includes("שטיפת פילטר")) && !d.title?.includes("חדש"));
  const lastFilterWashDate = filterWashTask?.lastDoneDate
    ? new Date(filterWashTask.lastDoneDate)
    : filterWashDiary?.createdAt
    ? new Date(filterWashDiary.createdAt)
    : null;
  const daysSinceFilterWash = lastFilterWashDate
    ? Math.max(0, Math.floor((Date.now() - lastFilterWashDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const daysUntilNextFilterWash = lastFilterWashDate ? Math.max(0, 7 - (daysSinceFilterWash || 0)) : 7;
  const nextFilterWashDate = lastFilterWashDate
    ? new Date(lastFilterWashDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Calculate New Filter Replacement (annual 365 days cycle)
  const filterReplaceTask = tasks.find((t: any) => t.title?.includes("החלפת פילטר") || t.title?.includes("פילטר חדש") || t.title?.includes("החלפת מסנן"));
  const filterReplaceDiary = data?.diaryEntries?.find((d: any) => d.title?.includes("החלפת פילטר") || d.content?.includes("החלפת פילטר") || d.title?.includes("פילטר חדש"));
  const lastFilterReplaceDate = jacuzzi?.lastFilterReplaceDate
    ? new Date(jacuzzi.lastFilterReplaceDate)
    : filterReplaceTask?.lastDoneDate
    ? new Date(filterReplaceTask.lastDoneDate)
    : filterReplaceDiary?.createdAt
    ? new Date(filterReplaceDiary.createdAt)
    : null;
  const daysSinceFilterReplace = lastFilterReplaceDate
    ? Math.max(0, Math.floor((Date.now() - lastFilterReplaceDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const daysUntilNextFilterReplace = lastFilterReplaceDate ? Math.max(0, 365 - (daysSinceFilterReplace || 0)) : 365;
  const nextFilterReplaceDate = lastFilterReplaceDate
    ? new Date(lastFilterReplaceDate.getTime() + 365 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // Calculate Cover Cleaning / Maintenance (30 days cycle)
  const coverCleanTask = tasks.find((t: any) => t.title?.includes("כיסוי"));
  const coverCleanDiary = data?.diaryEntries?.find((d: any) => d.title?.includes("כיסוי") || d.content?.includes("כיסוי"));
  const lastCoverCleanDate = coverCleanTask?.lastDoneDate
    ? new Date(coverCleanTask.lastDoneDate)
    : coverCleanDiary?.createdAt
    ? new Date(coverCleanDiary.createdAt)
    : null;
  const daysSinceCoverClean = lastCoverCleanDate
    ? Math.max(0, Math.floor((Date.now() - lastCoverCleanDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const daysUntilNextCoverClean = lastCoverCleanDate ? Math.max(0, 30 - (daysSinceCoverClean || 0)) : 30;
  const nextCoverCleanDate = lastCoverCleanDate
    ? new Date(lastCoverCleanDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // All custom / recurring chemical tasks (exclude purchase recommendations)
  const recurringChemicalTasks = tasks.filter((t: any) => {
    if (t.isCompleted) return false;
    const titleLower = (t.title || "").toLowerCase();
    const isPurchase = titleLower.includes("רכש") || titleLower.includes("להזמין") || titleLower.includes("קנייה") || titleLower.includes("חוסרים");
    if (isPurchase) return false;

    const isCoreRoutine =
      titleLower.includes("צנרת") ||
      titleLower.includes("דפנ") ||
      titleLower.includes("קו מים") ||
      titleLower.includes("פילטר") ||
      titleLower.includes("כיסוי") ||
      titleLower.includes("החלפת מים") ||
      titleLower.includes("חלקית") ||
      titleLower.includes("מקלון") ||
      titleLower.includes("בדיקת מים");
    return !isCoreRoutine;
  });

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
    const titleLower = (t.title || "").toLowerCase();
    if (titleLower.includes("רכש")) return false;
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
    const titleLower = (t.title || "").toLowerCase();
    const isPurchase = titleLower.includes("רכש") || titleLower.includes("להזמין") || titleLower.includes("קנייה") || titleLower.includes("חוסרים");
    if (isPurchase) return false;

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

  // AI Recommended Purchases (from AI inventory check task, diary entries, or low stock)
  const aiPurchaseTask = tasks.find((t: any) => 
    t.title?.includes("רכש מומלץ") || t.title?.includes("רכש AI") || t.title?.includes("המלצת רכש")
  );
  const aiPurchaseDiary = (data?.diaryEntries || []).find((d: any) =>
    d.title?.includes("בדיקת חומרים") || d.title?.includes("חומרים חסרים") || d.content?.includes("מומלצים לרכש")
  );

  let recommendedPurchaseItems: string[] = [];
  if (aiPurchaseTask) {
    const raw = aiPurchaseTask.title.replace(/רכש מומלץ AI:\s*/g, "").replace(/רכש מומלץ:\s*/g, "").replace(/רכש AI:\s*/g, "").trim();
    if (raw && !raw.includes("אין חוסרים")) {
      recommendedPurchaseItems = raw.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (aiPurchaseDiary) {
    const match = aiPurchaseDiary.content?.match(/מומלצים לרכש:\s*([^.\n]+)/);
    if (match && match[1] && !match[1].includes("אין חוסרים")) {
      recommendedPurchaseItems = match[1].split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  } else  if (lowStockChemicals.length > 0) {
    recommendedPurchaseItems = lowStockChemicals.map((c: any) => c.name);
  }

  // Helper to format relative days in Hebrew
  const formatRelativeDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "היום";
    if (diffDays === 1) return "אתמול";
    if (diffDays === 2) return "שלשום";
    if (diffDays < 0) return `בעוד ${Math.abs(diffDays)} ימים`;
    return `לפני ${diffDays} ימים`;
  };

  // Build Recent Chemical Additions List combining chemicalInventory and diary entries
  const recentChemicalAdditions = (() => {
    const list: Array<{
      id: string;
      text: string;
      amount?: string | null;
      date: Date;
      formattedDate: string;
      relative: string;
    }> = [];

    // 1. From chemicalInventory items that have lastUsedDate
    chemicals.forEach((c: any) => {
      if (c.lastUsedDate) {
        const d = new Date(c.lastUsedDate);
        const unitLabel = c.unit === "GRAMS" ? 'גר\'' : c.unit === "ML" ? 'מ"ל' : c.unit === "TABLETS" ? "טבליות" : c.unit;
        const amountStr = c.lastUsedAmount ? `${c.lastUsedAmount} ${unitLabel}` : "";
        list.push({
          id: `chem-${c.id}-${d.getTime()}`,
          text: `הוספת ${amountStr ? amountStr + " " : ""}${c.name}`,
          amount: amountStr || null,
          date: d,
          formattedDate: d.toLocaleDateString("he-IL"),
          relative: formatRelativeDays(d),
        });
      }
    });

    // 2. From diary entries that contain chemical additions (excluding purchase checks)
    (data?.diaryEntries || []).forEach((entry: any) => {
      const rawText = `${entry.title || ""} ${entry.content || ""} ${entry.chemicalsAdded || ""}`;
      const isPurchase =
        rawText.includes("רכש") ||
        rawText.includes("חומרים חסרים") ||
        rawText.includes("מומלצים לרכש") ||
        rawText.includes("להזמין") ||
        rawText.includes("בדיקת חומרים") ||
        rawText.includes("קנייה");

      if (isPurchase) return;

      const isChemAction =
        rawText.includes("הוספ") ||
        rawText.includes("שמתי") ||
        rawText.includes("גרם") ||
        rawText.includes("GRAMS") ||
        rawText.includes("ML") ||
        rawText.includes("מ\"ל") ||
        rawText.includes("ברום") ||
        rawText.includes("כלור") ||
        rawText.includes("אלקליניטי") ||
        rawText.includes("pH") ||
        rawText.includes("אנזים") ||
        rawText.includes("שוק") ||
        rawText.includes("חמצן") ||
        rawText.includes("טבליות") ||
        entry.chemicalsAdded;

      if (isChemAction) {
        const d = new Date(entry.entryDate || entry.createdAt);
        let clean = (entry.chemicalsAdded || entry.content || entry.title || "").trim();
        clean = clean.replace(/^(בוצעה פעולה יזומה:\s*|פעולת אחזקה יזומה:\s*|פעולת אחזקה:\s*)+/gi, "");
        clean = clean.replace(/פעולת אחזקה יזומה בג'קוזי\.?/gi, "").trim();
        clean = clean.replace(/\.?\s*הפעולה תועדה בהצלחה ולוח הזמנים עודכן\.?/gi, "");
        clean = clean.replace(/\.?\s*הפעולה תועדה בהצלחה\.?/gi, "");
        clean = clean.replace(/\.?\s*ולוח הזמנים עודכן\.?/gi, "");

        if (
          clean &&
          !clean.includes("רכש") &&
          !clean.includes("חסרים") &&
          !list.some((existing) => existing.text.includes(clean.slice(0, 20)) && Math.abs(existing.date.getTime() - d.getTime()) < 3600000)
        ) {
          list.push({
            id: `diary-${entry.id}`,
            text: clean,
            amount: null,
            date: d,
            formattedDate: d.toLocaleDateString("he-IL"),
            relative: formatRelativeDays(d),
          });
        }
      }
    });

    return list.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  })();

  return (
    <div className="space-y-8 pb-12">
      {/* 🌟 Unified Master Board: הג'קוזי שלי ובדיקות מים */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0f171e] border border-slate-800/80 p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header Area */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <span>{jacuzzi?.name || "הג'קוזי שלי"}</span>
          </h1>

          <span className="text-xs font-semibold text-slate-300 bg-[#0a0f13] px-3 py-1.5 rounded-full border border-slate-800">
            נפח: {jacuzzi?.volumeLiters || 1200} ליטר
          </span>
        </div>

        {/* 3 Quick Metrics Cards (Unified & Minimalist, No Icons) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: מצב ואיכות המים -> /water-tests */}
          <div
            onClick={() => router.push("/water-tests")}
            className="bg-[#0a0f13] hover:bg-[#0f171e] border border-slate-800/80 hover:border-cyan-500/60 p-4 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:scale-[1.01] shadow-sm group"
            title="לחץ למעבר לבדיקות ואיכות המים"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
                מצב ואיכות המים
              </span>
              {lastPartialRefillDate ? (
                <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                  גיל משוקלל
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  מילוי מלא
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">גיל המים:</span>
                <span className="text-sm font-black text-white">{daysSinceRefill} ימים</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">החלפת מים מלאה:</span>
                <span className="font-semibold text-slate-200">
                  {refillDate ? refillDate.toLocaleDateString("he-IL") : "תאריך הקמה"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">החלפה חלקית:</span>
                <span className="font-semibold text-slate-200">
                  {lastPartialRefillDate
                    ? `${lastPartialRefillDate.toLocaleDateString("he-IL")} (${partialPct}% / ${partialLiters} ליטר)`
                    : "טרם בוצעה"}
                </span>
              </div>

              {/* Full Last Water Test Data */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] pb-0.5">
                  <span className="font-bold text-teal-300">בדיקת מים אחרונה:</span>
                  <span className="text-slate-400">
                    {latestWaterLog ? new Date(latestWaterLog.testedAt).toLocaleDateString("he-IL") : "אין בדיקות"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">חומציות (pH):</span>
                  <span className="font-bold text-white">
                    {latestWaterLog?.phRange || (latestWaterLog?.ph !== null ? `pH ${latestWaterLog?.ph}` : "—")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{sanitizerLabel}:</span>
                  <span className="font-bold text-white">
                    {latestWaterLog?.chlorineRange || (latestWaterLog?.freeChlorine !== null ? `${latestWaterLog?.freeChlorine} ppm` : "—")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">בסיסיות (TA):</span>
                  <span className="font-bold text-white">
                    {latestWaterLog?.alkalinityRange || (latestWaterLog?.alkalinity !== null ? `${latestWaterLog?.alkalinity} ppm` : "—")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">צלילות המים:</span>
                  <span className="font-semibold text-blue-300">
                    {latestWaterLog?.waterClarity === "CLEAR" ? "צלול ונקי" : latestWaterLog?.waterClarity === "SLIGHTLY_CLOUDY" ? "עכירות קלה" : "צלול"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-slate-300">
                <span className="text-slate-400">ריקון מלא הבא:</span>
                <span className="font-bold text-amber-300">
                  בעוד {daysUntilNextRefill} יום ({nextRefillDate.toLocaleDateString("he-IL")})
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: תחזוקה -> /calendar */}
          <div
            onClick={() => router.push("/calendar")}
            className="bg-[#0a0f13] hover:bg-[#0f171e] border border-slate-800/80 hover:border-teal-500/60 p-4 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:scale-[1.01] shadow-sm group"
            title="לחץ למעבר ליומן התחזוקה והשגרות"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-teal-300 group-hover:text-teal-200 transition-colors">
                תחזוקה
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {pendingTasks.length} משימות פתוחות
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/50">
                <span className="text-slate-400">משימות פתוחות השבוע:</span>
                <span className="font-semibold text-white">
                  {pendingTasks.length > 0
                    ? pendingTasks.map((t: any) => t.title).slice(0, 2).join(", ") + (pendingTasks.length > 2 ? ` (+${pendingTasks.length - 2})` : "")
                    : "הכל הושלם ✓"}
                </span>
              </div>

              {/* בדיקת איכות מים */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">בדיקת איכות מים:</span>
                <span className="font-semibold text-slate-200">
                  {nextWaterTestDate.toLocaleDateString("he-IL")} (בעוד {daysUntilNextWaterTest} יום)
                </span>
              </div>

              {/* ניקוי צנרת ושטיפה */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ניקוי צנרת ושטיפה:</span>
                <span className="font-semibold text-slate-200">
                  {nextDeepCleanDate.toLocaleDateString("he-IL")} (בעוד {daysUntilNextDeepClean} יום)
                </span>
              </div>

              {/* ניקוי דפנות וקו מים */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ניקוי דפנות וקו מים:</span>
                <span className="font-semibold text-slate-200">
                  {nextWallCleanDate.toLocaleDateString("he-IL")} (בעוד {daysUntilNextWallClean} יום)
                </span>
              </div>

              {/* שטיפת פילטר */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">שטיפת פילטר:</span>
                <span className="font-semibold text-slate-200">
                  {nextFilterWashDate.toLocaleDateString("he-IL")} (בעוד {daysUntilNextFilterWash} יום)
                </span>
              </div>

              {/* החלפת פילטר */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">החלפת פילטר:</span>
                <span className="font-semibold text-teal-300">
                  {nextFilterReplaceDate.toLocaleDateString("he-IL")} (בעוד {daysUntilNextFilterReplace} יום)
                </span>
              </div>

              {/* ניקוי כיסוי */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ניקוי כיסוי:</span>
                <span className="font-semibold text-slate-200">
                  {nextCoverCleanDate.toLocaleDateString("he-IL")} (בעוד {daysUntilNextCoverClean} יום)
                </span>
              </div>

              {/* החלפת מים חלקית */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">החלפת מים חלקית:</span>
                <span className="font-semibold text-slate-200">
                  {nextPartialRefillDate.toLocaleDateString("he-IL")} (בעוד {daysUntilNextPartialRefill} יום)
                </span>
              </div>

              {/* כל משימות החומרים והשגרות המחזוריות שהוזנו */}
              {recurringChemicalTasks.map((t: any) => {
                const tDate = new Date(t.nextDueDate);
                const daysRemaining = Math.max(0, Math.ceil((tDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                let cleanTitle = t.title;
                if (!cleanTitle.endsWith(":")) cleanTitle += ":";
                return (
                  <div key={t.id} className="flex items-center justify-between pt-0.5 border-t border-slate-800/40">
                    <span className="text-slate-400 truncate max-w-[150px]" title={t.title}>
                      {cleanTitle}
                    </span>
                    <span className="font-semibold text-pink-300 shrink-0">
                      {tDate.toLocaleDateString("he-IL")} (בעוד {daysRemaining} יום)
                    </span>
                  </div>
                );
              })}

              {/* 🧪 Recent Chemical Additions Log inside Maintenance Card */}
              {recentChemicalAdditions.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-teal-300">
                    <span>🧪 תיעוד הוספת חומרים לאחרונה:</span>
                  </div>

                  <div className="space-y-1">
                    {recentChemicalAdditions.map((item) => (
                      <div
                        key={item.id}
                        className="p-1.5 rounded-lg bg-teal-950/30 border border-teal-900/40 text-[10px] flex items-center justify-between gap-1.5"
                      >
                        <span className="text-teal-200 font-medium truncate max-w-[160px]" title={item.text}>
                          • {item.text}
                        </span>
                        <span className="text-cyan-300 font-bold shrink-0">
                          {item.formattedDate} ({item.relative})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: ארון חומרים ומלאי -> /inventory */}
          <div
            onClick={() => router.push("/inventory")}
            className="bg-[#0a0f13] hover:bg-[#0f171e] border border-slate-800/80 hover:border-purple-500/60 p-4 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:scale-[1.01] shadow-sm group"
            title="לחץ למעבר לארון החומרים והמלאי"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-purple-300 group-hover:text-purple-200 transition-colors">
                ארון חומרים ומלאי
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {chemicals.length} פריטים
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/50">
                <span className="text-slate-400">סטטוס מלאי כללי:</span>
                <span className={`font-semibold ${lowStockChemicals.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {lowStockChemicals.length > 0 ? `${lowStockChemicals.length} במלאי נמוך ⚠️` : "תקין ומלא ✓"}
                </span>
              </div>

              {/* Chemical Inventory Stock Levels */}
              <div className="space-y-1 pt-0.5">
                {chemicals.map((chem: any) => {
                  const isLow = chem.minThreshold && chem.quantity <= chem.minThreshold;
                  const unitLabel = chem.unit === "GRAMS" ? 'גר\'' : chem.unit === "ML" ? 'מ"ל' : chem.unit === "TABLETS" ? "טבליות" : chem.unit;

                  return (
                    <div key={chem.id} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-b-0">
                      <span className="text-slate-300 truncate max-w-[160px]" title={chem.name}>
                        {chem.name}:
                      </span>
                      <span className={`font-semibold ${isLow ? "text-amber-400 font-bold" : "text-slate-200"}`}>
                        {chem.quantity} {unitLabel} {isLow ? "(נמוך)" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-slate-800/60 space-y-1">
                <div className="flex items-center justify-between pb-0.5">
                  <span className="text-slate-400 font-bold text-[11px]">רכש מומלץ:</span>
                  {recommendedPurchaseItems.length === 0 && (
                    <span className="font-semibold text-emerald-400 text-xs">אין חוסרים ✓</span>
                  )}
                </div>

                {recommendedPurchaseItems.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-slate-300 truncate max-w-[170px]" title={item}>
                      • {item}
                    </span>
                    <span className="font-bold text-amber-400 text-[11px] shrink-0">
                      להזמין
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* 🌟 Animated Expanding Water Age & Refill Modal */}
      {isWaterAgeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsWaterAgeModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-cyan-700/60 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/50 animate-in zoom-in-95 duration-200 text-right overflow-hidden relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 flex items-center justify-center shadow-inner">
                  <Waves className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    ניתוח גיל המים והחלפות מים
                  </h3>
                  <p className="text-xs text-slate-400">
                    מעקב מדויק אחר מילוי מים מלא, ריענונים חלקיים ומועדי ריקון
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWaterAgeModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                title="סגור חלון"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <div className="text-[11px] text-slate-400">גיל המים הנוכחי</div>
                <div className="text-lg font-black text-cyan-300">{daysSinceRefill} ימים</div>
                <div className="text-[9px] text-slate-500">{lastPartialRefillDate ? "משוקלל לאחר ריענון" : "מילוי מלא"}</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <div className="text-[11px] text-slate-400">ריקון מלא הבא</div>
                <div className="text-lg font-black text-amber-300">בעוד {daysUntilNextRefill} יום</div>
                <div className="text-[9px] text-slate-500">{nextRefillDate.toLocaleDateString("he-IL")}</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl col-span-2 sm:col-span-1">
                <div className="text-[11px] text-slate-400">נפח מים כולל</div>
                <div className="text-lg font-black text-white">{jacuzzi?.volumeLiters || 1200} ליטר</div>
                <div className="text-[9px] text-slate-500">{jacuzzi?.name || "ג'קוזי"}</div>
              </div>
            </div>

            {/* Detailed Cards Section */}
            <div className="space-y-3">
              {/* Card 1: מילוי מים מלא לאחרונה */}
              <div className="bg-slate-950/90 border border-slate-800/90 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs sm:text-sm">מילוי מים מלא (100%)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {daysSinceRefill} ימים במערכת
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>תאריך מילוי מלא אחרון:</span>
                    <span className="font-semibold text-white">
                      {refillDate ? refillDate.toLocaleDateString("he-IL") : "תאריך הקמה ראשוני"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>כמות מים שמולאה:</span>
                    <span className="font-semibold text-white">{jacuzzi?.volumeLiters || 1200} ליטר (100%)</span>
                  </div>
                </div>
              </div>

              {/* Card 2: החלפת מים חלקית (ריענון תקופתי) */}
              <div className="bg-slate-950/90 border border-teal-900/40 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-white text-xs sm:text-sm">החלפת מים חלקית (ריענון TDS)</span>
                  </div>
                  {lastPartialRefillDate ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      בוצע בהצלחה ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      טרם תועד
                    </span>
                  )}
                </div>

                {lastPartialRefillDate ? (
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>תאריך החלפה חלקית אחרונה:</span>
                      <span className="font-semibold text-white">
                        {lastPartialRefillDate.toLocaleDateString("he-IL")} (לפני {daysSincePartialRefill} ימים)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>כמות שהוחלפה:</span>
                      <span className="font-semibold text-teal-300">
                        כ-25% (~{Math.round((jacuzzi?.volumeLiters || 1200) * 0.25)} ליטר מים טריים)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                      💡 <strong>השפעה על גיל המים:</strong> החלפת המים החלקית דיללה את ריכוז המלחים והמוצקים המומסים (TDS), שקללה את גיל המים והעניקה ימי שימוש נקיים נוספים עד למועד הריקון המלא הבא.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      טרם תועדה החלפת מים חלקית לג׳קוזי זה.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <div className="font-bold text-cyan-300 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>למה מומלץ להחליף מים חלקית?</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        החלפה חודשית של 20%-30% (~{Math.round((jacuzzi?.volumeLiters || 1200) * 0.25)} ליטר) מרעננת את המים, משקללת את גיל המים ומאפשרת לדחות את הריקון המלא בבטחה.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: הנחיית מחזור ריקון מלא */}
              <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>מחזור ריקון מלא מומלץ: כל 90 ימים</span>
                </div>
                <p className="text-slate-400">
                  מועד הריקון המלא הבא מתוכנן לתאריך <strong>{nextRefillDate.toLocaleDateString("he-IL")}</strong> (בעוד {daysUntilNextRefill} יום).
                </p>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsWaterAgeModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                הבנתי, תודה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
