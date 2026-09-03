"use client";

import { useState, useEffect, useRef, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FlaskConical,
  Calendar,
  Package,
  Sparkles,
  Settings,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Waves,
  ArrowLeft,
  Zap,
  Sliders,
  X,
  History,
  ShieldCheck,
  Wrench,
  ShieldAlert,
  CalendarDays,
  Edit2,
  Check,
  Info,
  Layers,
} from "lucide-react";

import WaterTestsPage from "@/app/water-tests/page";
import CalendarPage from "@/app/calendar/page";
import InventoryPage from "@/app/inventory/page";
import WaterDoctorPage from "@/app/water-doctor/page";
import SettingsPage from "@/app/settings/page";
import { ALL_PARAMS_WITH_CLARITY, ALL_TEST_STRIP_PARAMS, DEFAULT_TEST_STRIP_PARAM_IDS } from "@/lib/test-strip-params";

export const CARD_TABS = [
  { id: "water-tests", title: "מצב איכות המים", subtitle: "בדיקת מקלון אחרונה, איזון ומדדים", icon: FlaskConical },
  { id: "water-maintenance", title: "תחזוקת מים וגיל המים", subtitle: "בדיקות, חיטוי שבועי, ריענון וריקון מלא", icon: Droplets },
  { id: "jacuzzi-maintenance", title: "תחזוקת הג'קוזי", subtitle: "שטיפת פילטר, ניקוי דפנות, מכסה וצנרת", icon: Wrench },
  { id: "inventory", title: "ארון חומרים ומלאי", subtitle: "מעקב כמויות, התראות חוסר וחומרים חיוניים", icon: Package },
  { id: "water-doctor", title: "רופא מים AI", subtitle: "אבחון מים מבוסס AI וחישוב מינונים", icon: Sparkles },
  { id: "settings", title: "הגדרות הג'קוזי והמקלון", subtitle: "נפח, סוג חיטוי ומדדים פעילים", icon: Settings },
];

interface SwipeableMainViewProps {
  initialTab?: string;
}

interface ItemModalData {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  type: "task" | "jacuzzi" | "water-test" | "params" | "refill" | "chemical";
  taskId?: string;
  taskCategory?: string;
  defaultFreqDays: number;
  currentFreqDays: number;
  currentLastDoneDate: string | null;
  currentNextDueDate: string | null;
  volumeLiters?: number;
  sanitizationType?: string;
}

function SwipeableMainContent({ initialTab }: SwipeableMainViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Full page view state (when a card background / main button is clicked)
  const [openPageId, setOpenPageId] = useState<string | null>(null);

  // Specific Item Configuration Modal State (when a specific item/box is clicked)
  const [activeItemModal, setActiveItemModal] = useState<ItemModalData | null>(null);
  const [editFreqDays, setEditFreqDays] = useState<number>(7);
  const [editLastDoneDate, setEditLastDoneDate] = useState<string>("");
  const [editNextDueDate, setEditNextDueDate] = useState<string>("");
  const [actionDoneDate, setActionDoneDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedChemId, setSelectedChemId] = useState<string>("");
  const [chemDeductQty, setChemDeductQty] = useState<string>("");
  const [refillPercent, setRefillPercent] = useState<number>(25);
  const [editVolume, setEditVolume] = useState<string>("1200");
  const [editSanitization, setEditSanitization] = useState<string>("BROMINE");
  const [modalSaving, setModalSaving] = useState<boolean>(false);
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  // Carousel index state (0..5 with infinite wrap)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visualActiveIndex, setVisualActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  // App Data for live summary cards
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeParamIds, setActiveParamIds] = useState<string[]>(DEFAULT_TEST_STRIP_PARAM_IDS);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSummaryData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        setData(json.user);

        // Load active test strip params from user jacuzzi / localStorage
        if (json.user?.jacuzzi?.activeTestStripParams) {
          try {
            const parsed = JSON.parse(json.user.jacuzzi.activeTestStripParams);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setActiveParamIds(parsed);
              return;
            }
          } catch {}
        }
      }

      const saved = localStorage.getItem("active_test_strip_params");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveParamIds(parsed);
          }
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, []);

  // Sync initial tab from URL if present
  useEffect(() => {
    const tab = searchParams.get("tab") || initialTab;
    if (tab) {
      const idx = CARD_TABS.findIndex((t) => t.id === tab || (tab === "calendar" && (t.id === "water-maintenance" || t.id === "jacuzzi-maintenance")));
      if (idx >= 0) {
        setCurrentIndex(idx);
        setVisualActiveIndex(idx);
      }
    }
  }, [searchParams, initialTab]);

  const getContainerWidth = () => {
    return containerRef.current?.offsetWidth || window.innerWidth || 600;
  };

  const nextCard = () => {
    if (isAnimating || isDragging) return;
    const width = getContainerWidth();
    const newIdx = (currentIndex + 1) % CARD_TABS.length;

    // 🌟 Update visual dot indicator SIMULTANEOUSLY (0 lag)
    setVisualActiveIndex(newIdx);
    setIsAnimating(true);
    setDragOffset(-width);

    setTimeout(() => {
      setIsAnimating(false);
      setDragOffset(0);
      setCurrentIndex(newIdx);
    }, 350);
  };

  const prevCard = () => {
    if (isAnimating || isDragging) return;
    const width = getContainerWidth();
    const newIdx = (currentIndex - 1 + CARD_TABS.length) % CARD_TABS.length;

    // 🌟 Update visual dot indicator SIMULTANEOUSLY (0 lag)
    setVisualActiveIndex(newIdx);
    setIsAnimating(true);
    setDragOffset(width);

    setTimeout(() => {
      setIsAnimating(false);
      setDragOffset(0);
      setCurrentIndex(newIdx);
    }, 350);
  };

  const goToCard = (newIndex: number) => {
    if (isAnimating || isDragging || newIndex === currentIndex) return;
    const safe = (newIndex + CARD_TABS.length) % CARD_TABS.length;
    const isForward = (safe > currentIndex && !(currentIndex === 0 && safe === CARD_TABS.length - 1)) || (currentIndex === CARD_TABS.length - 1 && safe === 0);
    const width = getContainerWidth();

    // 🌟 Update visual dot indicator SIMULTANEOUSLY (0 lag)
    setVisualActiveIndex(safe);
    setIsAnimating(true);
    setDragOffset(isForward ? -width : width);

    setTimeout(() => {
      setIsAnimating(false);
      setDragOffset(0);
      setCurrentIndex(safe);
    }, 350);
  };

  // Touch drag & real-time continuous synchronized movement
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const currentDragX = useRef<number>(0);
  const hasMovedHorizontal = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (openPageId || activeItemModal || isAnimating) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input")) return;

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    currentDragX.current = 0;
    hasMovedHorizontal.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartX.current === null || touchStartY.current === null) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (!hasMovedHorizontal.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
        hasMovedHorizontal.current = true;
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
        setIsDragging(false);
        return;
      }
    }

    if (hasMovedHorizontal.current) {
      currentDragX.current = deltaX;
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const offset = currentDragX.current;
    const width = getContainerWidth();
    setIsDragging(false);

    const threshold = Math.min(60, width * 0.15);

    if (offset < -threshold) {
      const newIdx = (currentIndex + 1) % CARD_TABS.length;
      setVisualActiveIndex(newIdx);
      setIsAnimating(true);
      setDragOffset(-width);
      setTimeout(() => {
        setIsAnimating(false);
        setDragOffset(0);
        setCurrentIndex(newIdx);
      }, 350);
    } else if (offset > threshold) {
      const newIdx = (currentIndex - 1 + CARD_TABS.length) % CARD_TABS.length;
      setVisualActiveIndex(newIdx);
      setIsAnimating(true);
      setDragOffset(width);
      setTimeout(() => {
        setIsAnimating(false);
        setDragOffset(0);
        setCurrentIndex(newIdx);
      }, 350);
    } else {
      setVisualActiveIndex(currentIndex);
      setIsBouncing(true);
      setDragOffset(0);
      setTimeout(() => setIsBouncing(false), 380);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    currentDragX.current = 0;
  };

  // Keyboard navigation
  useEffect(() => {
    if (openPageId || activeItemModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") nextCard();
      else if (e.key === "ArrowRight") prevCard();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, openPageId, activeItemModal, isAnimating]);

  // Open item-specific modal
  const openItemModal = (modalData: ItemModalData) => {
    setActiveItemModal(modalData);
    setEditFreqDays(modalData.currentFreqDays || modalData.defaultFreqDays || 7);
    setEditLastDoneDate(modalData.currentLastDoneDate ? modalData.currentLastDoneDate.split("T")[0] : "");
    setEditNextDueDate(modalData.currentNextDueDate ? modalData.currentNextDueDate.split("T")[0] : "");
    setActionDoneDate(new Date().toISOString().split("T")[0]);
    setSelectedChemId("");
    setChemDeductQty("");
    setRefillPercent(25);
    setEditVolume(modalData.volumeLiters ? String(modalData.volumeLiters) : "1200");
    setEditSanitization(modalData.sanitizationType || "BROMINE");
    setModalNotice(null);
  };

  // Save changes from Item Modal
  const handleSaveModalSettings = async () => {
    if (!activeItemModal) return;
    setModalSaving(true);
    setModalNotice(null);

    try {
      if (activeItemModal.type === "task") {
        // Find or create task
        if (activeItemModal.taskId) {
          await fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: activeItemModal.taskId,
              frequencyDays: editFreqDays,
              lastDoneDate: editLastDoneDate ? new Date(editLastDoneDate) : null,
              nextDueDate: editNextDueDate ? new Date(editNextDueDate) : undefined,
            }),
          });
        } else {
          // Create task if didn't exist
          await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: activeItemModal.title,
              category: activeItemModal.taskCategory || "WEEKLY",
              frequencyDays: editFreqDays,
              nextDueDate: editNextDueDate ? new Date(editNextDueDate) : new Date(Date.now() + editFreqDays * 24 * 3600 * 1000),
            }),
          });
        }
      } else if (activeItemModal.id === "full-refill") {
        await fetch("/api/jacuzzi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lastRefillDate: editLastDoneDate ? new Date(editLastDoneDate) : new Date(),
          }),
        });
      } else if (activeItemModal.id === "volume" || activeItemModal.id === "sanitizer-type") {
        await fetch("/api/jacuzzi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            volumeLiters: parseFloat(editVolume) || 1200,
            sanitizationType: editSanitization,
          }),
        });
      }

      setModalNotice("ההגדרות עודכנו בהצלחה!");
      await loadSummaryData();
      setTimeout(() => {
        setActiveItemModal(null);
        setModalNotice(null);
      }, 1200);
    } catch (err: any) {
      alert(err.message || "שגיאה בשמירת הנתונים");
    } finally {
      setModalSaving(false);
    }
  };

  // Mark task performed now
  const handleMarkActionDone = async () => {
    if (!activeItemModal) return;
    setModalSaving(true);
    setModalNotice(null);

    try {
      const actionDateObj = actionDoneDate ? new Date(actionDoneDate) : new Date();

      if (activeItemModal.id === "full-refill") {
        // Full refill (100%)
        await fetch("/api/jacuzzi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastRefillDate: actionDateObj }),
        });
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "החלפת מים מלאה (100%)",
            content: "בוצע ריקון ומילוי מים מלא במים טריים. גיל המים אופס בהצלחה.",
            entryDate: actionDateObj,
          }),
        });
      } else if (activeItemModal.id === "partial-refill") {
        // Partial Refill (25% / 30% / 50%)
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `החלפת מים חלקית (${refillPercent}%)`,
            content: `הוחלפו ${refillPercent}% ממי הג'קוזי במים טריים לריענון והורדת TDS.`,
            entryDate: actionDateObj,
          }),
        });
      } else if (activeItemModal.type === "task") {
        if (activeItemModal.taskId) {
          await fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: activeItemModal.taskId,
              markDoneAndReschedule: true,
              actionDate: actionDateObj,
              chemicalInventoryId: selectedChemId || undefined,
              deductAmount: chemDeductQty ? parseFloat(chemDeductQty) : undefined,
              frequencyDays: editFreqDays,
            }),
          });
        } else {
          // Create task and log done
          const nextDue = new Date(actionDateObj.getTime() + editFreqDays * 24 * 3600 * 1000);
          await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: activeItemModal.title,
              category: activeItemModal.taskCategory || "WEEKLY",
              frequencyDays: editFreqDays,
              nextDueDate: nextDue,
            }),
          });
          await fetch("/api/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `בוצע: ${activeItemModal.title}`,
              content: `פעולת תחזוקה בוצעה בהצלחה בתאריך ${actionDateObj.toLocaleDateString("he-IL")}. המועד הבא עודכן בהתאם.`,
              entryDate: actionDateObj,
            }),
          });
        }
      }

      setModalNotice("הפעולה נרשמה בהצלחה והמועד הבא חושב מחדש!");
      await loadSummaryData();
      setTimeout(() => {
        setActiveItemModal(null);
        setModalNotice(null);
      }, 1200);
    } catch (err: any) {
      alert(err.message || "שגיאה בסימון ביצוע");
    } finally {
      setModalSaving(false);
    }
  };

  // If a full page is opened, render it with a calm ocean return bar
  if (openPageId) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Floating Top Return Bar */}
        <div className="sticky top-14 sm:top-16 z-50 bg-[#0e1823]/95 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 border-b border-sky-900/50 shadow-xl flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setOpenPageId(null);
              loadSummaryData();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer select-none"
          >
            <ChevronRight className="w-4 h-4" />
            <span>חזרה לכרטיסי הבקרה</span>
          </button>

          <span className="text-xs font-semibold text-sky-100 hidden sm:inline">
            {CARD_TABS.find((t) => t.id === openPageId)?.title || "תצוגה מלאה"}
          </span>
        </div>

        {/* Full Page View Component */}
        <div className="pt-2">
          {openPageId === "water-tests" && <WaterTestsPage />}
          {(openPageId === "water-maintenance" || openPageId === "jacuzzi-maintenance" || openPageId === "calendar") && <CalendarPage />}
          {openPageId === "inventory" && <InventoryPage />}
          {openPageId === "water-doctor" && <WaterDoctorPage />}
          {openPageId === "settings" && <SettingsPage />}
        </div>
      </div>
    );
  }

  // Calculate live summary card data
  const jacuzzi = data?.jacuzzi;
  const chemicals = data?.chemicals || [];
  const tasks = data?.tasks || [];
  const waterLogs = data?.waterLogs || [];
  const latestWaterLog = waterLogs.length > 0 ? waterLogs[0] : null;

  // Date formatters and relative day helpers
  const formatDateDisplay = (date: Date | string | null | undefined) => {
    if (!date) return "טרם תועד";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "טרם תועד";
    return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const getRelativeDaysDisplay = (targetDate: Date | string | null | undefined, isPast: boolean) => {
    if (!targetDate) return "";
    const d = new Date(targetDate);
    if (isNaN(d.getTime())) return "";
    const diffDays = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (isPast) {
      const daysAgo = Math.max(0, -diffDays);
      if (daysAgo === 0) return "(היום)";
      if (daysAgo === 1) return "(אתמול)";
      return `(לפני ${daysAgo} ימים)`;
    } else {
      if (diffDays < 0) return "(באיחור!)";
      if (diffDays === 0) return "(היום!)";
      if (diffDays === 1) return "(מחר)";
      return `(בעוד ${diffDays} ימים)`;
    }
  };

  // 1. Water Test Dates
  const lastWaterTestDate = latestWaterLog?.testedAt ? new Date(latestWaterLog.testedAt) : null;
  const nextWaterTestDate = lastWaterTestDate
    ? new Date(lastWaterTestDate.getTime() + 3 * 24 * 3600 * 1000)
    : new Date();

  // 2. Sanitizer / Shock Treatment Dates
  const sanitizerTask = tasks.find((t: any) =>
    t.title?.includes("חיטוי") || t.title?.includes("שוק") || t.title?.includes("ברום") || t.title?.includes("כלור") || t.title?.includes("הלכרה")
  );
  const sanitizerChem = chemicals.find((c: any) =>
    c.category === "SANITIZER" || c.name?.includes("כלור") || c.name?.includes("ברום")
  );
  const lastSanitizerDate = sanitizerTask?.lastDoneDate
    ? new Date(sanitizerTask.lastDoneDate)
    : sanitizerChem?.lastUsedDate
    ? new Date(sanitizerChem.lastUsedDate)
    : null;
  const nextSanitizerDate = sanitizerTask?.nextDueDate
    ? new Date(sanitizerTask.nextDueDate)
    : lastSanitizerDate
    ? new Date(lastSanitizerDate.getTime() + (sanitizerTask?.frequencyDays || 7) * 24 * 3600 * 1000)
    : new Date(Date.now() + 2 * 24 * 3600 * 1000);

  // 3. Partial Refill Dates
  const partialDiary = data?.diaryEntries?.find((d: any) => {
    const t = `${d.title || ""} ${d.content || ""}`.toLowerCase();
    return (t.includes("החלפ") || t.includes("ריענון") || t.includes("חלקית")) && t.includes("מים") && !t.includes("100%");
  });
  const lastPartialRefillDate = partialDiary ? new Date(partialDiary.entryDate || partialDiary.createdAt) : null;
  const nextPartialRefillDate = lastPartialRefillDate
    ? new Date(lastPartialRefillDate.getTime() + 30 * 24 * 3600 * 1000)
    : new Date(Date.now() + 14 * 24 * 3600 * 1000);

  // 4. Full Refill Dates
  const lastFullRefillDate = jacuzzi?.lastRefillDate ? new Date(jacuzzi.lastRefillDate) : new Date();
  const daysSinceRefill = Math.max(0, Math.floor((Date.now() - lastFullRefillDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilNextRefill = Math.max(0, 90 - daysSinceRefill);
  const nextFullRefillDate = new Date(lastFullRefillDate.getTime() + 90 * 24 * 3600 * 1000);

  // 5. Weekly Filter Rinse Dates
  const filterRinseTask = tasks.find((t: any) =>
    t.title?.includes("שטיפת פילטר") || (t.title?.includes("פילטר") && !t.title?.includes("השרי") && !t.title?.includes("החלפ"))
  );
  const lastFilterRinseDate = filterRinseTask?.lastDoneDate ? new Date(filterRinseTask.lastDoneDate) : null;
  const nextFilterRinseDate = filterRinseTask?.nextDueDate
    ? new Date(filterRinseTask.nextDueDate)
    : lastFilterRinseDate
    ? new Date(lastFilterRinseDate.getTime() + (filterRinseTask?.frequencyDays || 7) * 24 * 3600 * 1000)
    : new Date(Date.now() + 7 * 24 * 3600 * 1000);

  // 6. Waterline & Shell Cleaning Dates
  const waterlineTask = tasks.find((t: any) =>
    t.title?.includes("קו מים") || t.title?.includes("דפנ") || t.title?.includes("דופן")
  );
  const lastWaterlineDate = waterlineTask?.lastDoneDate ? new Date(waterlineTask.lastDoneDate) : null;
  const nextWaterlineDate = waterlineTask?.nextDueDate
    ? new Date(waterlineTask.nextDueDate)
    : lastWaterlineDate
    ? new Date(lastWaterlineDate.getTime() + (waterlineTask?.frequencyDays || 14) * 24 * 3600 * 1000)
    : new Date(Date.now() + 14 * 24 * 3600 * 1000);

  // 7. Cover Cleaning Dates
  const coverTask = tasks.find((t: any) =>
    t.title?.includes("כיסוי") || t.title?.includes("מכסה")
  );
  const lastCoverDate = coverTask?.lastDoneDate ? new Date(coverTask.lastDoneDate) : null;
  const nextCoverDate = coverTask?.nextDueDate
    ? new Date(coverTask.nextDueDate)
    : lastCoverDate
    ? new Date(lastCoverDate.getTime() + (coverTask?.frequencyDays || 30) * 24 * 3600 * 1000)
    : new Date(Date.now() + 21 * 24 * 3600 * 1000);

  // 8. Monthly Filter Soak / Deep Pipe Flush Dates
  const deepCleanTask = tasks.find((t: any) =>
    t.title?.includes("השרי") || t.title?.includes("צנרת") || t.title?.includes("פלאש")
  );
  const lastDeepCleanDate = deepCleanTask?.lastDoneDate
    ? new Date(deepCleanTask.lastDoneDate)
    : jacuzzi?.lastDeepCleanDate
    ? new Date(jacuzzi.lastDeepCleanDate)
    : null;
  const nextDeepCleanDate = deepCleanTask?.nextDueDate
    ? new Date(deepCleanTask.nextDueDate)
    : lastDeepCleanDate
    ? new Date(lastDeepCleanDate.getTime() + (deepCleanTask?.frequencyDays || 30) * 24 * 3600 * 1000)
    : new Date(Date.now() + 30 * 24 * 3600 * 1000);

  // Active Pending Tasks & Low Stock Chemicals
  const lowStockChems = chemicals.filter((c: any) => (c.quantity || 0) <= (c.minThreshold || 100));

  // Extract short English labels for active test strip params
  const getShortParamLabel = (paramId: string) => {
    const p = ALL_TEST_STRIP_PARAMS.find((x) => x.id === paramId);
    if (!p) return paramId.toUpperCase();
    const match = p.enName.match(/\((.*?)\)/);
    if (match) return match[1];
    if (p.enName.length <= 6) return p.enName;
    return paramId.toUpperCase();
  };

  // Harmonized Card Render (Unified Serene Blue & White Palette)
  const renderCard = (cardIdx: number) => {
    switch (cardIdx) {
      // -------------------------------------------------------------
      // CARD 0: מצב איכות המים
      // -------------------------------------------------------------
      case 0:
        return (
          <div
            onClick={() => setOpenPageId("water-tests")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40"
          >
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    מצב איכות המים
                  </h2>
                  <p className="text-xs text-slate-300">
                    {latestWaterLog
                      ? `בדיקה אחרונה: ${new Date(latestWaterLog.testedAt).toLocaleDateString("he-IL")} (${new Date(latestWaterLog.testedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})`
                      : "טרם בוצעה בדיקת מים"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-sky-200 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60">
                <span>פתח יומן בדיקות</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            {latestWaterLog ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPageId("water-tests");
                  }}
                  className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
                >
                  <span className="text-[11px] text-slate-400">חומציות (pH)</span>
                  <div className="text-lg font-black text-white">{latestWaterLog.ph || latestWaterLog.phRange || "7.4"}</div>
                  <span className="text-[10px] text-sky-300/80">יעד: 7.2 - 7.6</span>
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPageId("water-tests");
                  }}
                  className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
                >
                  <span className="text-[11px] text-slate-400">כלור / חיטוי</span>
                  <div className="text-lg font-black text-white">{latestWaterLog.freeChlorine || latestWaterLog.chlorineRange || "3.0"}</div>
                  <span className="text-[10px] text-sky-300/80">יעד: 2.0 - 4.0 ppm</span>
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPageId("water-tests");
                  }}
                  className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
                >
                  <span className="text-[11px] text-slate-400">בסיסיות כוללת (TA)</span>
                  <div className="text-lg font-black text-white">{latestWaterLog.alkalinity || latestWaterLog.alkalinityRange || "90"}</div>
                  <span className="text-[10px] text-sky-300/80">יעד: 80 - 120 ppm</span>
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPageId("water-tests");
                  }}
                  className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
                >
                  <span className="text-[11px] text-slate-400">צלילות ומראה</span>
                  <div className="text-lg font-black text-white">
                    {latestWaterLog.waterClarity === "CLEAR" ? "צלול ונקי" : "נדרש טיפול"}
                  </div>
                  <span className="text-[10px] text-sky-300/80">בדיקה ויזואלית</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#080e14]/90 border border-sky-900/30 text-center text-slate-300 text-xs">
                לחץ כאן כדי להזין את בדיקת המקלון הראשונה שלך
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ בכל מקום בכרטיס לפתיחת יומן הבדיקות המלא והזנת תוצאות</span>
              <span className="text-sky-300 font-bold">1 מתוך 6 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 1: תחזוקת מים וגיל המים
      // -------------------------------------------------------------
      case 1:
        return (
          <div
            onClick={() => setOpenPageId("water-maintenance")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40"
          >
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    תחזוקת מים וגיל המים
                  </h2>
                  <p className="text-xs text-slate-300">
                    גיל המים הנוכחי: <strong className="text-white">{daysSinceRefill} ימים</strong> • ריקון מלא בעוד {daysUntilNextRefill} יום
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-sky-200 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60">
                <span>פתח יומן מים</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            {/* List of 4 Specific Water Treatments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Item 1: בדיקת איכות מים */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "water-test",
                    title: "בדיקת איכות מים (מקלון)",
                    subtitle: "קביעת תדירות בדיקה, רישום בדיקה אחרונה וקביעת המועד הבא",
                    icon: FlaskConical,
                    type: "water-test",
                    defaultFreqDays: 3,
                    currentFreqDays: 3,
                    currentLastDoneDate: lastWaterTestDate?.toISOString() || null,
                    currentNextDueDate: nextWaterTestDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                    <span>בדיקת איכות מים (מקלון)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל 2-3 ימים</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastWaterTestDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastWaterTestDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextWaterTestDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextWaterTestDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Item 2: חיטוי שבועי / טיפול שוק */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "sanitizer-shock",
                    title: "חיטוי שבועי / טיפול שוק",
                    subtitle: "סימון ביצוע חיטוי/שוק, גריעת מלאי מהארון ושליטה בתדירות",
                    icon: ShieldCheck,
                    type: "task",
                    taskId: sanitizerTask?.id,
                    taskCategory: "WEEKLY",
                    defaultFreqDays: 7,
                    currentFreqDays: sanitizerTask?.frequencyDays || 7,
                    currentLastDoneDate: lastSanitizerDate?.toISOString() || null,
                    currentNextDueDate: nextSanitizerDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>חיטוי שבועי / טיפול שוק</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {sanitizerTask?.frequencyDays || 7} ימים</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastSanitizerDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastSanitizerDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextSanitizerDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextSanitizerDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Item 3: ריענון מים חלקי (25%) */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "partial-refill",
                    title: "החלפת מים חלקית (ריענון TDS)",
                    subtitle: "רישום החלפת 25%-50% מים, שקלול גיל המים וקביעת תדירות",
                    icon: Waves,
                    type: "refill",
                    defaultFreqDays: 30,
                    currentFreqDays: 30,
                    currentLastDoneDate: lastPartialRefillDate?.toISOString() || null,
                    currentNextDueDate: nextPartialRefillDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <Waves className="w-3.5 h-3.5 text-sky-400" />
                    <span>החלפת מים חלקית (25%)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>חודשי (TDS)</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastPartialRefillDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastPartialRefillDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextPartialRefillDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextPartialRefillDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Item 4: ריקון מים מלא (100%) */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "full-refill",
                    title: "ריקון ומילוי מים מלא (100%)",
                    subtitle: "איפוס גיל המים, עדכון תאריך מילוי מלא ושינוי מחזור היעד",
                    icon: CalendarDays,
                    type: "jacuzzi",
                    defaultFreqDays: 90,
                    currentFreqDays: 90,
                    currentLastDoneDate: lastFullRefillDate.toISOString(),
                    currentNextDueDate: nextFullRefillDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                    <span>ריקון ומילוי מים מלא (100%)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל 90 ימים</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">מילוי אחרון:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastFullRefillDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastFullRefillDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ריקון הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextFullRefillDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextFullRefillDate, false)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>💡 לחץ על כל פריט להגדרת תדירות, עדכון תאריכים וסימון ביצוע</span>
              <span className="text-sky-300 font-bold">2 מתוך 6 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 2: תחזוקת הג'קוזי
      // -------------------------------------------------------------
      case 2:
        return (
          <div
            onClick={() => setOpenPageId("jacuzzi-maintenance")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40"
          >
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    תחזוקת הג'קוזי
                  </h2>
                  <p className="text-xs text-slate-300">
                    שטיפת פילטרים, ניקוי דפנות, מכסה וצנרת הג'קוזי
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-sky-200 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60">
                <span>פתח משימות ג'קוזי</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            {/* List of 4 Specific Jacuzzi Equipment Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Item 1: שטיפת פילטר שבועית */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "filter-rinse",
                    title: "שטיפת פילטר שבועית בזרם מים",
                    subtitle: "סימון שטיפת פילטר, קביעת תדירות ושליטה בתאריכי היעד",
                    icon: RefreshCw,
                    type: "task",
                    taskId: filterRinseTask?.id,
                    taskCategory: "WEEKLY",
                    defaultFreqDays: 7,
                    currentFreqDays: filterRinseTask?.frequencyDays || 7,
                    currentLastDoneDate: lastFilterRinseDate?.toISOString() || null,
                    currentNextDueDate: nextFilterRinseDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                    <span>שטיפת פילטר שבועית בזרם</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {filterRinseTask?.frequencyDays || 7} ימים</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastFilterRinseDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastFilterRinseDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextFilterRinseDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextFilterRinseDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Item 2: ניקוי קו מים ודפנות */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "waterline-clean",
                    title: "ניקוי קו מים ודפנות הג'קוזי",
                    subtitle: "סימון ניקוי דפנות, קביעת תדירות ושליטה בתאריכי היעד",
                    icon: Waves,
                    type: "task",
                    taskId: waterlineTask?.id,
                    taskCategory: "MONTHLY",
                    defaultFreqDays: 14,
                    currentFreqDays: waterlineTask?.frequencyDays || 14,
                    currentLastDoneDate: lastWaterlineDate?.toISOString() || null,
                    currentNextDueDate: nextWaterlineDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <Waves className="w-3.5 h-3.5 text-sky-400" />
                    <span>ניקוי קו מים ודפנות הג'קוזי</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {waterlineTask?.frequencyDays || 14} יום</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastWaterlineDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastWaterlineDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextWaterlineDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextWaterlineDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Item 3: ניקוי וטיפול במכסה הג'קוזי */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "cover-clean",
                    title: "ניקוי וטיפול במכסה / כיסוי הג'קוזי",
                    subtitle: "סימון ניקוי המכסה, טיפול UV, קביעת תדירות ומועדים",
                    icon: ShieldCheck,
                    type: "task",
                    taskId: coverTask?.id,
                    taskCategory: "MONTHLY",
                    defaultFreqDays: 30,
                    currentFreqDays: coverTask?.frequencyDays || 30,
                    currentLastDoneDate: lastCoverDate?.toISOString() || null,
                    currentNextDueDate: nextCoverDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>ניקוי וטיפול במכסה הג'קוזי</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {coverTask?.frequencyDays || 30} יום</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastCoverDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastCoverDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextCoverDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextCoverDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Item 4: השרית פילטר / שטיפת צנרת (Line Flush) */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "deep-clean",
                    title: "השרית פילטר / שטיפת צנרת עמוקה",
                    subtitle: "סימון שטיפת פלאש לצנרת, השרית פילטר בחומר ייעודי ותדירות",
                    icon: Wrench,
                    type: "task",
                    taskId: deepCleanTask?.id,
                    taskCategory: "MONTHLY",
                    defaultFreqDays: 30,
                    currentFreqDays: deepCleanTask?.frequencyDays || 30,
                    currentLastDoneDate: lastDeepCleanDate?.toISOString() || null,
                    currentNextDueDate: nextDeepCleanDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <Wrench className="w-3.5 h-3.5 text-sky-400" />
                    <span>השרית פילטר / שטיפת צנרת</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {deepCleanTask?.frequencyDays || 30} יום</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastDeepCleanDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastDeepCleanDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextDeepCleanDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextDeepCleanDate, false)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>💡 לחץ על כל פריט להגדרת תדירות, עדכון תאריכים וסימון ביצוע</span>
              <span className="text-sky-300 font-bold">3 מתוך 6 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 3: ארון חומרים ומלאי
      // -------------------------------------------------------------
      case 3:
        return (
          <div
            onClick={() => setOpenPageId("inventory")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40"
          >
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    ארון חומרים ומלאי
                  </h2>
                  <p className="text-xs text-slate-300">
                    {chemicals.length} חומרים במלאי • {lowStockChems.length > 0 ? `${lowStockChems.length} חומרים במלאי נמוך` : "מלאי החומרים תקין"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-sky-200 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60">
                <span>פתח ארון חומרים</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenPageId("inventory");
                }}
                className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
              >
                <span className="text-[11px] text-slate-400">סך הכל חומרים</span>
                <div className="text-xl font-black text-white">{chemicals.length} פריטים</div>
                <span className="text-[10px] text-sky-300/80">לחץ לניהול מלאי בארון</span>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenPageId("inventory");
                }}
                className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
              >
                <span className="text-[11px] text-slate-400">התראות חוסר</span>
                <div className="text-xl font-black text-white">
                  {lowStockChems.length} פריטים
                </div>
                <span className="text-[10px] text-sky-300/80">{lowStockChems.length > 0 ? "נדרשת רכישה" : "מלאי מספק ✓"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ לפתיחת ארון החומרים המלא, הוספת פריטים וסריקת תמונות</span>
              <span className="text-sky-300 font-bold">4 מתוך 6 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 4: רופא מים AI
      // -------------------------------------------------------------
      case 4:
        return (
          <div
            onClick={() => setOpenPageId("water-doctor")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40"
          >
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    רופא מים AI
                  </h2>
                  <p className="text-xs text-slate-300">
                    אבחון מים מיידי, פענוח חריגות וחישוב מינונים מותאמים אישית
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-sky-200 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60">
                <span>פתח רופא מים</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 space-y-1">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-300" />
                  <span>אבחון מים עכורים / קצף</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">זיהוי מקור העכירות וקבלת תוכנית טיפול מדורגת</p>
              </div>

              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 space-y-1">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-300" />
                  <span>חישוב מינון כימי מדויק</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">חישוב כמויות בגרם/מ"ל בהתאם לנפח הג'קוזי שלך</p>
              </div>

              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 space-y-1">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                  <span>בדיקת מלאי אוטומטית</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">בדיקה האם החומרים הדרושים זמינים בארון שלך</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ להפעלת אבחון רופא המים והזנת תיאור מצב המים</span>
              <span className="text-sky-300 font-bold">5 מתוך 6 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 5: הגדרות הג'קוזי והמקלון
      // -------------------------------------------------------------
      case 5:
      default:
        return (
          <div
            onClick={() => setOpenPageId("settings")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40"
          >
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    הגדרות הג'קוזי והמקלון
                  </h2>
                  <p className="text-xs text-slate-300">
                    {jacuzzi?.name || "הג'קוזי שלי"} • {jacuzzi?.volumeLiters || 1200} ליטר • {jacuzzi?.sanitizationType === "BROMINE" ? "ברום" : "כלור"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-sky-200 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60">
                <span>פתח הגדרות</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            {/* Jacuzzi Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Tile 1: Volume */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "volume",
                    title: "נפח מים בג'קוזי",
                    subtitle: "עדכון כמות המים בליטרים לצורך חישוב מינונים מדויק",
                    icon: Droplets,
                    type: "jacuzzi",
                    defaultFreqDays: 0,
                    currentFreqDays: 0,
                    currentLastDoneDate: null,
                    currentNextDueDate: null,
                    volumeLiters: jacuzzi?.volumeLiters || 1200,
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer group/spec"
              >
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <span>נפח מים</span>
                  <Edit2 className="w-2.5 h-2.5 opacity-60 group-hover/spec:opacity-100 text-sky-300" />
                </span>
                <div className="text-lg font-black text-white">{jacuzzi?.volumeLiters || 1200} ליטר</div>
                <span className="text-[10px] text-sky-300/80">לחץ לעדכון נפח</span>
              </div>

              {/* Tile 2: Sanitization Type */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "sanitizer-type",
                    title: "שיטת חיטוי ראשית",
                    subtitle: "בחירת חומר החיטוי העיקרי בג'קוזי (ברום, כלור או מלח)",
                    icon: ShieldCheck,
                    type: "jacuzzi",
                    defaultFreqDays: 0,
                    currentFreqDays: 0,
                    currentLastDoneDate: null,
                    currentNextDueDate: null,
                    sanitizationType: jacuzzi?.sanitizationType || "BROMINE",
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer group/spec"
              >
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <span>שיטת חיטוי</span>
                  <Edit2 className="w-2.5 h-2.5 opacity-60 group-hover/spec:opacity-100 text-sky-300" />
                </span>
                <div className="text-lg font-black text-white">
                  {jacuzzi?.sanitizationType === "BROMINE" ? "ברום" : jacuzzi?.sanitizationType === "SALT" ? "מלח" : "כלור"}
                </div>
                <span className="text-[10px] text-sky-300/80">לחץ לשינוי שיטה</span>
              </div>

              {/* Tile 3: Email Reminders */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenPageId("settings");
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 col-span-2 sm:col-span-1 cursor-pointer"
              >
                <span className="text-[11px] text-slate-400">התראות במייל</span>
                <div className="text-lg font-black text-white">פעיל ✓</div>
                <span className="text-[10px] text-sky-300/80">תזכורות למשימות</span>
              </div>
            </div>

            {/* Active Test Strip Parameters Chip List */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setOpenPageId("settings");
              }}
              className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/params"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5 group-hover/params:text-sky-300 transition-colors">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>מדדי מקלון פעילים לבדיקה:</span>
                </span>
                <span className="text-[11px] text-sky-300/80 flex items-center gap-1">
                  <span>{activeParamIds.length} מדדים</span>
                  <Edit2 className="w-2.5 h-2.5" />
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {activeParamIds.map((paramId) => (
                  <span
                    key={paramId}
                    className="text-[11px] font-mono font-bold bg-sky-950/90 text-sky-200 border border-sky-800/60 px-2.5 py-1 rounded-lg"
                  >
                    {getShortParamLabel(paramId)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ על כל פרמטר להגדרה ספציפית או על הכרטיס לפתיחה מלאה</span>
              <span className="text-sky-300 font-bold">6 מתוך 6 ◂</span>
            </div>
          </div>
        );
    }
  };

  const prevIdx = (currentIndex - 1 + CARD_TABS.length) % CARD_TABS.length;
  const currIdx = currentIndex;
  const nextIdx = (currentIndex + 1) % CARD_TABS.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* 🌟 Top Navigation: Pagination Dots & Arrows */}
      <div className="flex items-center justify-between gap-4 bg-[#0e1823]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-sky-900/40 shadow-md max-w-xs mx-auto">
        <button
          type="button"
          onClick={prevCard}
          className="p-2 rounded-xl bg-sky-950/80 hover:bg-sky-900/80 border border-sky-900/50 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm"
          title="העבר ימינה (קודם)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Pagination Dots Indicator */}
        <div className="flex items-center justify-center gap-3 flex-1 h-6" dir="ltr">
          {CARD_TABS.map((card, idx) => {
            const isActive = idx === visualActiveIndex;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => goToCard(idx)}
                className={`transition-all duration-200 cursor-pointer rounded-full aspect-square flex items-center justify-center ${
                  isActive
                    ? "w-4.5 h-4.5 bg-sky-400 border-2 border-white/70 shadow-md shadow-sky-500/40 scale-110"
                    : "w-2.5 h-2.5 bg-slate-700/90 hover:bg-slate-500 hover:scale-125"
                }`}
                title={card.title}
                aria-label={card.title}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={nextCard}
          className="p-2 rounded-xl bg-sky-950/80 hover:bg-sky-900/80 border border-sky-900/50 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm"
          title="העבר שמאלה (הבא)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 🌟 Continuous Synchronized Multi-Card Viewport Track */}
      <div
        ref={containerRef}
        className="relative overflow-hidden w-full select-none cursor-grab active:cursor-grabbing touch-pan-y"
        dir="ltr"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex w-full items-stretch"
          style={{
            transform: `translateX(calc(-100% + ${dragOffset}px))`,
            transition: isAnimating
              ? "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
              : isBouncing
              ? "transform 0.38s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              : "none",
          }}
        >
          {/* Slide 0: Previous Card */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1" dir="rtl">
            {renderCard(prevIdx)}
          </div>

          {/* Slide 1: Current Card */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1" dir="rtl">
            {renderCard(currIdx)}
          </div>

          {/* Slide 2: Next Card */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1" dir="rtl">
            {renderCard(nextIdx)}
          </div>
        </div>
      </div>

      {/* Navigation Help Prompt */}
      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2 select-none">
        <span>◂ לחץ על כל פריט להגדרות ספציפיות • גרור באצבע למעבר בין הכרטיסים ▸</span>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 DEDICATED ITEM SETTINGS & ACTION MODAL (Specific to the clicked item) */}
      {/* ========================================================================= */}
      {activeItemModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
          dir="rtl"
          onClick={() => setActiveItemModal(null)}
        >
          <div
            className="bg-[#0e1823] border border-sky-800/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 text-right relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-950/80 border border-sky-800/80 flex items-center justify-center text-sky-400 shadow-inner">
                  {(() => {
                    const IconComponent = activeItemModal.icon || Wrench;
                    return <IconComponent className="w-5 h-5" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                    {activeItemModal.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">{activeItemModal.subtitle}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-bold text-center animate-fade-in">
                {modalNotice}
              </div>
            )}

            {/* SECTION 1: סימון ביצוע מיידי של הפעולה */}
            {(activeItemModal.type === "task" || activeItemModal.id === "full-refill" || activeItemModal.id === "partial-refill") && (
              <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-sky-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>סימון ביצוע הפעולה עכשיו</span>
                  </span>
                  <span className="text-[11px] text-slate-400">יעדכן יומן ויקדם תאריך הבא</span>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">תאריך ביצוע הפעולה:</label>
                    <input
                      type="date"
                      value={actionDoneDate}
                      onChange={(e) => setActionDoneDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Partial Refill Percentage Selector */}
                  {activeItemModal.id === "partial-refill" && (
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">אחוז החלפת המים:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[25, 33, 50].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setRefillPercent(pct)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              refillPercent === pct
                                ? "bg-sky-950 text-sky-200 border-sky-500 shadow-md"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {pct}% מים טריים
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chemical Selection if Sanitizer/Shock */}
                  {activeItemModal.id === "sanitizer-shock" && chemicals.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">חומר חיטוי מהארון:</label>
                        <select
                          value={selectedChemId}
                          onChange={(e) => setSelectedChemId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        >
                          <option value="">ללא גריעת מלאי</option>
                          {chemicals.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.quantity} {c.unit || "גרם"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">כמות להסרה מהמלאי:</label>
                        <input
                          type="number"
                          placeholder="כמות (לדוגמה: 20)"
                          value={chemDeductQty}
                          onChange={(e) => setChemDeductQty(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={modalSaving}
                    onClick={handleMarkActionDone}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {modalSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>סמן כבוצע עכשיו ועדכן מועד הבא</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Water Test Shortcut */}
            {activeItemModal.id === "water-test" && (
              <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-3 text-center">
                <p className="text-xs text-slate-300">
                  ניתן לפתוח ישירות את טופס הזנת בדיקת המקלון עם כל המדדים והצבעים.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveItemModal(null);
                    setOpenPageId("water-tests");
                  }}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>פתח טופס הזנת בדיקת מים מלאה</span>
                </button>
              </div>
            )}

            {/* SECTION 2: שליטה בתדירות ובתאריכים */}
            <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-3">
              <span className="font-bold text-xs sm:text-sm text-sky-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>הגדרת תדירות ותאריכי ביצוע</span>
              </span>

              {/* Volume setting */}
              {activeItemModal.id === "volume" && (
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">נפח מי הג'קוזי (בליטרים):</label>
                  <input
                    type="number"
                    value={editVolume}
                    onChange={(e) => setEditVolume(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    משמש לחישוב מדויק של מינוני כימיקלים וטיפולי AI.
                  </p>
                </div>
              )}

              {/* Sanitizer setting */}
              {activeItemModal.id === "sanitizer-type" && (
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">שיטת החיטוי הראשית:</label>
                  <select
                    value={editSanitization}
                    onChange={(e) => setEditSanitization(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="BROMINE">ברום (Bromine) - מומלץ לג'קוזי חם</option>
                    <option value="CHLORINE">כלור (Chlorine) - כלור גרגרים / טבליות</option>
                    <option value="SALT">מלח (Salt System) - תא אלקטרוליזה</option>
                    <option value="ACTIVE_OXYGEN">חמצן פעיל (Active Oxygen / MPS)</option>
                  </select>
                </div>
              )}

              {/* Frequency Days (for tasks & refill) */}
              {(activeItemModal.type === "task" || activeItemModal.id === "full-refill" || activeItemModal.id === "partial-refill") && (
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-300 block">
                    תדירות ביצוע מחזורית (בימים):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={editFreqDays}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setEditFreqDays(val);
                        if (editLastDoneDate) {
                          const next = new Date(new Date(editLastDoneDate).getTime() + val * 24 * 3600 * 1000);
                          setEditNextDueDate(next.toISOString().split("T")[0]);
                        }
                      }}
                      className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-center font-bold focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-xs text-slate-300">ימים</span>

                    <div className="flex items-center gap-1.5 mr-auto">
                      {[7, 14, 30, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setEditFreqDays(d);
                            if (editLastDoneDate) {
                              const next = new Date(new Date(editLastDoneDate).getTime() + d * 24 * 3600 * 1000);
                              setEditNextDueDate(next.toISOString().split("T")[0]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            editFreqDays === d
                              ? "bg-sky-950 text-sky-200 border-sky-500"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {d} יום
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Date Inputs */}
              {(activeItemModal.type === "task" || activeItemModal.id === "full-refill" || activeItemModal.id === "partial-refill") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">תאריך ביצוע אחרון:</label>
                    <input
                      type="date"
                      value={editLastDoneDate}
                      onChange={(e) => {
                        setEditLastDoneDate(e.target.value);
                        if (e.target.value && editFreqDays) {
                          const next = new Date(new Date(e.target.value).getTime() + editFreqDays * 24 * 3600 * 1000);
                          setEditNextDueDate(next.toISOString().split("T")[0]);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">תאריך יעד ביצוע הבא:</label>
                    <input
                      type="date"
                      value={editNextDueDate}
                      onChange={(e) => setEditNextDueDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={modalSaving}
                onClick={handleSaveModalSettings}
                className="w-full py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                {modalSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>שמור שינויים והגדרות</span>
              </button>
            </div>

            {/* Footer Close */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="px-4 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SwipeableMainView(props: SwipeableMainViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-sky-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <SwipeableMainContent {...props} />
    </Suspense>
  );
}
