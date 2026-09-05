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
  Edit3,
  Check,
  Info,
  Layers,
  Plus,
  Beaker,
  Activity,
  ShoppingCart,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from "lucide-react";

import WaterTestsPage, { getGenericDomain, extractParamValue } from "@/app/water-tests/page";
import CalendarPage from "@/app/calendar/page";
import InventoryPage from "@/app/inventory/page";
import SettingsPage from "@/app/settings/page";
import {
  ALL_PARAMS_WITH_CLARITY,
  ALL_TEST_STRIP_PARAMS,
  DEFAULT_TEST_STRIP_PARAM_IDS,
  PARAM_CATEGORIES,
  parseTestStripParams,
} from "@/lib/test-strip-params";

export const CARD_TABS = [
  { id: "status", title: "סטטוס", subtitle: "משימות ל-7 ימים, איכות מים, סכנות והזמנת חומרים", icon: Activity },
  { id: "jacuzzi-maintenance", title: "תחזוקת מתקן", subtitle: "שטיפת פילטר, ניקוי דפנות, מכסה, צנרת והחלפת פילטר", icon: Wrench },
  { id: "water-maintenance", title: "תחזוקת מים", subtitle: "הגדרות מקלון, מצב איכות מים ושגרת בדיקות וטיפולים", icon: Droplets },
  { id: "chemicals", title: "כימיקלים", subtitle: "היסטוריית כל החומרים והמינונים שהוספו לג'קוזי לאורך הזמן", icon: FlaskConical },
];

export const TAB_GUIDE_DEFINITIONS = [
  {
    tabIndex: 0,
    title: "לוח בקרה וסטטוס 📊",
    subtitle: "תמונת המצב המרכזית של הג'קוזי שלך בזמן אמת",
    icon: Activity,
    description: "מרכז הבקרה שמרכז עבורך במקום אחד את כל מה שחשוב לדעת ברגע זה על איכות המים, המשימות וההתראות.",
    tips: [
      "תמונת מצב חיה של איכות המים, רמת ה-pH ורמת החיטוי.",
      "ריכוז משימות קרובות ותזכורות לטיפולים המתוזמנים לימים הקרובים.",
      "מעקב אחר גיל המים והתראות מיידיות על חריגות או סכנות בריאותיות.",
    ],
  },
  {
    tabIndex: 1,
    title: "תחזוקת מתקן 🛠️",
    subtitle: "שמירה על תקינות המערכות, המסננים והמעטפת",
    icon: Wrench,
    description: "ניהול משימות התחזוקה הפיזיות של הג'קוזי להבטחת ביצועים מעולים ואריכות ימי הציוד.",
    tips: [
      "מעקב שגרות תקופתיות: שטיפת פילטרים, ניקוי קו מים, אוורור כיסוי, ניקוי צנרת והחלפת סננים.",
      "הוספת שגרות תחזוקה מותאמות אישית לפי הצורך הייחודי של המתקן שלך.",
      "חישוב אוטומטי של תאריכי יעד בהתאם לתדירות שנבחרה ותיעוד היסטוריית ביצועים.",
    ],
  },
  {
    tabIndex: 2,
    title: "תחזוקת מים ובדיקות 💧",
    subtitle: "איזון ערכים, בדיקות מקלון ושגרת חיטוי",
    icon: Droplets,
    description: "ניהול איכות המים לשמירה על מים צלולים, מאוזנים, היגייניים ובטוחים לרחצה.",
    tips: [
      "הזנת תוצאות בדיקת מקלון (pH, כלור/ברום, בסיסיות, קשיות ועוד) וקבלת הנחיות מינון מדויקות.",
      "בדיקה חושית מהירה (צלילות וריח המים) לזיהוי עכירות או ריחות לוואי.",
      "התאמה אישית של מדדי המקלון שברשותך ולוח זמנים לחיטוי תקופתי.",
    ],
  },
  {
    tabIndex: 3,
    title: "כימיקלים ומלאי 🧪",
    subtitle: "מעקב חומרים שנוספו ושליטה בארון החומרים",
    icon: FlaskConical,
    description: "מעקב היסטורי אחר כל החומרים שהוספו לג'קוזי ושליטה מלאה על ארון הכימיקלים והמלאי.",
    tips: [
      "תיעוד ומעקב היסטורי מלא אחר כל תוספת חומר, כמות ומינון שבוצעו.",
      "שליטה מלאה בכמויות החומרים שנותרו בארון וקבלת התראות לפני סיום המלאי.",
      "רישום מהיר של תוספת חומר יזומה ועדכון אוטומטי של יתרת המלאי בארון.",
    ],
  },
];

export const CLARITY_OPTIONS = [
  { id: "CLEAR", label: "צלולים ונקיים", icon: "✨", isOk: true, desc: "מים צלולים, נקיים ומבריקים" },
  { id: "SLIGHTLY_CLOUDY", label: "עכירות קלה (מעט חלבי)", icon: "🌫️", isOk: false, risk: "הצטברות חלקיקים אורגניים או פילטר סתום. מומלץ לשטוף פילטר ולבצע טיפול שוק.", desc: "עכירות קלה הדורשת סינון ושוק" },
  { id: "CLOUDY", label: "עכורים / חלביים", icon: "☁️", isOk: false, risk: "עומס אורגני גבוה, פילטרציה לקויה או חוסר חיטוי. דורש בדיקת חיטוי ושוק דחוף.", desc: "ראות לקויה במים, עומס לכלוך גבוה" },
  { id: "FOAMY", label: "קצף מוגזם במים", icon: "🫧", isOk: false, risk: "שאריות סבונים, שמנים, קוסמטיקה או TDS גבוה. מומלץ להוסיף מונע קצף / להחליף מים חלקית.", desc: "הצטברות קצף על פני המים" },
  { id: "ALGAE", label: "ירקרקים / אצות", icon: "🟢", isOk: false, risk: "התפתחות אצות בעקבות מחסור ממושך בחיטוי. דורש שוק חיטוי מיידי וניקוי פילטר.", desc: "גוון ירוק ונוכחות אצות" },
  { id: "DIRT", label: "משקעים ולכלוך", icon: "🍂", isOk: false, risk: "לכלוך פיזי שהצטבר בקרקעית או מרחף. מומלץ שאיבה / רשת ושטיפת סנן.", desc: "חלקיקים ומשקעים נראים לעין" },
];

export const ODOR_OPTIONS = [
  { id: "FRESH", label: "ריח נקי ורענן", icon: "🌿", isOk: true, desc: "ריח טבעי ונעים של מים נקיים" },
  { id: "NO_ODOR", label: "ללא ריח לוואי", icon: "💧", isOk: true, desc: "ניטרלי לחלוטין וללא ריח" },
  { id: "CHLORINE", label: "ריח כלור / ברום חריף", icon: "🧪", isOk: false, risk: "ריח חריף מעיד על כלורמינים (כלור קשור) ולא על עודף כלור. מומלץ לבצע שוק חמצון / לאוורר את הג'קוזי.", desc: "ריח חריף של כלורמינים קשורים" },
  { id: "MUSTY", label: "ריח עובש / טחב", icon: "🪵", isOk: false, risk: "ריח עבש עלול להעיד על הצטברות חיידקים בכיסוי או בצנרת. מומלץ אוורור כיסוי ופלאש צנרת.", desc: "ריח לחות ועובש מהכיסוי או הצנרת" },
  { id: "FOUL", label: "ריח לא נעים / ריקבון", icon: "⚠️", isOk: false, risk: "עומס חיידקי גבוה או הצטברות ביופילם. נדרש חיטוי שוק מיידי ושטיפת צנרת.", desc: "ריח כבד ולא נעים הדורש טיפול דחוף" },
  { id: "CHEMICAL", label: "ריח כימי חריף", icon: "⚠️", isOk: false, risk: "מינון יתר של כימיקלים או חוסר אוורור. פתח את כיסוי הג'קוזי והפעל ג'טים לאוורור.", desc: "ריח כימי מרוכז הדורש אוורור" },
];

export function getClarityDisplay(val?: string | null) {
  const found = CLARITY_OPTIONS.find((c) => c.id === val);
  if (found) return found;
  if (!val || val === "CLEAR") return CLARITY_OPTIONS[0];
  return { id: val, label: val, icon: "💧", isOk: true, desc: val };
}

export function getOdorDisplay(val?: string | null) {
  const found = ODOR_OPTIONS.find((o) => o.id === val);
  if (found) return found;
  if (!val || val === "FRESH") return ODOR_OPTIONS[0];
  return { id: val, label: val, icon: "🌿", isOk: true, desc: val };
}

interface SwipeableMainViewProps {
  initialTab?: string;
}

interface ItemModalData {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  type: "task" | "jacuzzi" | "water-test" | "params" | "refill" | "chemical" | "adhoc-chemical" | "strip-settings";
  taskId?: string;
  isCustom?: boolean;
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
  const [adhocNotes, setAdhocNotes] = useState<string>("");
  const [refillPercent, setRefillPercent] = useState<number>(25);
  const [editVolume, setEditVolume] = useState<string>("1200");
  const [editSanitization, setEditSanitization] = useState<string>("BROMINE");
  const [modalSelectedParams, setModalSelectedParams] = useState<string[]>(DEFAULT_TEST_STRIP_PARAM_IDS);
  const [modalSaving, setModalSaving] = useState<boolean>(false);
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  // 🌟 New Custom Routine Modal State (Jacuzzi Equipment Routine)
  const [isCreateRoutineModalOpen, setIsCreateRoutineModalOpen] = useState(false);
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [newRoutineFreqDays, setNewRoutineFreqDays] = useState<number>(7);
  const [newRoutineLastDoneDate, setNewRoutineLastDoneDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newRoutineNextDueDate, setNewRoutineNextDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [newRoutineSaving, setNewRoutineSaving] = useState(false);

  // 🌟 Water Clarity & Odor Modal State
  const [isClarityOdorModalOpen, setIsClarityOdorModalOpen] = useState(false);
  const [editClarity, setEditClarity] = useState("CLEAR");
  const [editOdor, setEditOdor] = useState("FRESH");
  const [editClarityOdorNotes, setEditClarityOdorNotes] = useState("");
  const [savingClarityOdor, setSavingClarityOdor] = useState(false);

  const openClarityOdorModal = () => {
    setEditClarity(latestWaterLog?.waterClarity || "CLEAR");
    setEditOdor(latestWaterLog?.waterOdor || "FRESH");
    setEditClarityOdorNotes(latestWaterLog?.clarityOdorNotes || latestWaterLog?.description || "");
    setIsClarityOdorModalOpen(true);
  };

  const handleSaveClarityOdor = async () => {
    setSavingClarityOdor(true);
    try {
      const notes = editClarityOdorNotes.trim();
      const clarityObj = getClarityDisplay(editClarity);
      const odorObj = getOdorDisplay(editOdor);

      if (latestWaterLog?.id) {
        const res = await fetch("/api/water-tests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: latestWaterLog.id,
            waterClarity: editClarity,
            waterOdor: editOdor,
            clarityOdorNotes: notes,
            description: notes,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "שגיאה בעדכון צלילות וריח");
        }
      } else {
        const res = await fetch("/api/water-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            waterClarity: editClarity,
            waterOdor: editOdor,
            clarityOdorNotes: notes,
            description: notes,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "שגיאה בשמירת צלילות וריח");
        }
      }

      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `תיעוד צלילות וריח: ${clarityObj.label} • ${odorObj.label}`,
          content: `צלילות: ${clarityObj.label} | ריח: ${odorObj.label}.${notes ? ` הערות: ${notes}` : ""}`,
          entryDate: new Date(),
        }),
      });

      setIsClarityOdorModalOpen(false);
      await loadSummaryData();
    } catch (err: any) {
      alert(err.message || "שגיאה בשמירת נתוני צלילות וריח");
    } finally {
      setSavingClarityOdor(false);
    }
  };

  // 🌟 Category Drag & Drop Reordering Across Tabs
  const DEFAULT_CARD_0_ORDER = ["upcoming-tasks", "water-status", "water-age", "chemical-inventory"];
  const DEFAULT_CARD_1_ORDER = ["filter-wash", "waterline-clean", "cover-clean", "deep-clean", "filter-replace", "custom-routines"];
  const DEFAULT_CARD_2_ORDER = ["water-quality", "water-age", "strip-settings", "scheduled-treatments"];

  const [card0Order, setCard0Order] = useState<string[]>(DEFAULT_CARD_0_ORDER);
  const [card1Order, setCard1Order] = useState<string[]>(DEFAULT_CARD_1_ORDER);
  const [card2Order, setCard2Order] = useState<string[]>(DEFAULT_CARD_2_ORDER);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const s0 = localStorage.getItem("card_0_sections_order");
        if (s0) {
          const p = JSON.parse(s0);
          if (Array.isArray(p)) setCard0Order([...p.filter((k: string) => DEFAULT_CARD_0_ORDER.includes(k)), ...DEFAULT_CARD_0_ORDER.filter((k) => !p.includes(k))]);
        }
        const s1 = localStorage.getItem("card_1_sections_order");
        if (s1) {
          const p = JSON.parse(s1);
          if (Array.isArray(p)) setCard1Order([...p.filter((k: string) => DEFAULT_CARD_1_ORDER.includes(k)), ...DEFAULT_CARD_1_ORDER.filter((k) => !p.includes(k))]);
        }
        const s2 = localStorage.getItem("card_2_sections_order");
        if (s2) {
          const p = JSON.parse(s2);
          if (Array.isArray(p)) setCard2Order([...p.filter((k: string) => DEFAULT_CARD_2_ORDER.includes(k)), ...DEFAULT_CARD_2_ORDER.filter((k) => !p.includes(k))]);
        }
      } catch (e) {
        console.warn("Error loading section orders", e);
      }
    }
  }, []);

  const [draggedSectionInfo, setDraggedSectionInfo] = useState<{ cardIndex: number; sectionId: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const touchDragRef = useRef<{
    cardIndex: number;
    startIndex: number;
    targetIndex: number;
  } | null>(null);

  const reorderArray = (list: string[], fromIndex: number, toIndex: number) => {
    const result = [...list];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  };

  const handleMoveSection = (cardIndex: number, fromIdx: number, toIdx: number) => {
    if (cardIndex === 0) {
      if (toIdx < 0 || toIdx >= card0Order.length) return;
      const newOrder = reorderArray(card0Order, fromIdx, toIdx);
      setCard0Order(newOrder);
      if (typeof window !== "undefined") localStorage.setItem("card_0_sections_order", JSON.stringify(newOrder));
    } else if (cardIndex === 1) {
      if (toIdx < 0 || toIdx >= card1Order.length) return;
      const newOrder = reorderArray(card1Order, fromIdx, toIdx);
      setCard1Order(newOrder);
      if (typeof window !== "undefined") localStorage.setItem("card_1_sections_order", JSON.stringify(newOrder));
    } else if (cardIndex === 2) {
      if (toIdx < 0 || toIdx >= card2Order.length) return;
      const newOrder = reorderArray(card2Order, fromIdx, toIdx);
      setCard2Order(newOrder);
      if (typeof window !== "undefined") localStorage.setItem("card_2_sections_order", JSON.stringify(newOrder));
    }
  };

  const handleResetCardOrder = (cardIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (cardIndex === 0) {
      setCard0Order(DEFAULT_CARD_0_ORDER);
      if (typeof window !== "undefined") localStorage.removeItem("card_0_sections_order");
    } else if (cardIndex === 1) {
      setCard1Order(DEFAULT_CARD_1_ORDER);
      if (typeof window !== "undefined") localStorage.removeItem("card_1_sections_order");
    } else if (cardIndex === 2) {
      setCard2Order(DEFAULT_CARD_2_ORDER);
      if (typeof window !== "undefined") localStorage.removeItem("card_2_sections_order");
    }
  };

  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const onDragStartSection = (cardIndex: number, sectionId: string, index: number, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedSectionInfo({ cardIndex, sectionId, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sectionId);
  };

  const onDragOverSection = (cardIndex: number, index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSectionInfo && draggedSectionInfo.cardIndex === cardIndex && dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const onDropSection = (cardIndex: number, targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSectionInfo && draggedSectionInfo.cardIndex === cardIndex && draggedSectionInfo.index !== targetIndex) {
      handleMoveSection(cardIndex, draggedSectionInfo.index, targetIndex);
    }
    setDraggedSectionInfo(null);
    setDragOverIndex(null);
  };

  const onTouchStartSection = (cardIndex: number, index: number, e: React.TouchEvent) => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    isLongPressActiveRef.current = false;
    hasMovedRef.current = false;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      touchDragRef.current = {
        cardIndex,
        startIndex: index,
        targetIndex: index,
      };
      setDraggedSectionInfo({ cardIndex, sectionId: "", index });
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(35);
        } catch {}
      }
    }, 280);
  };

  const onTouchMoveSection = (cardIndex: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!isLongPressActiveRef.current) {
      if (touchStartPosRef.current) {
        const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
        if (dx > 8 || dy > 8) {
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
        }
      }
      return;
    }

    if (!touchDragRef.current || touchDragRef.current.cardIndex !== cardIndex) return;
    hasMovedRef.current = true;

    if (e.cancelable) e.preventDefault();

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const container = el?.closest("[data-reorder-index]");
    if (container) {
      const idx = parseInt(container.getAttribute("data-reorder-index") || "-1", 10);
      if (idx >= 0 && idx !== touchDragRef.current.targetIndex) {
        touchDragRef.current.targetIndex = idx;
        setDragOverIndex(idx);
      }
    }
  };

  const onTouchEndSection = (cardIndex: number, e: React.TouchEvent) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    if (isLongPressActiveRef.current && touchDragRef.current && touchDragRef.current.cardIndex === cardIndex) {
      const { startIndex, targetIndex } = touchDragRef.current;
      if (startIndex !== targetIndex && targetIndex >= 0) {
        handleMoveSection(cardIndex, startIndex, targetIndex);
      }
    }

    isLongPressActiveRef.current = false;
    touchDragRef.current = null;
    setDraggedSectionInfo(null);
    setDragOverIndex(null);
  };

  const openCreateRoutineModal = () => {
    setNewRoutineTitle("");
    setNewRoutineFreqDays(7);
    const todayStr = new Date().toISOString().slice(0, 10);
    const nextDue = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    setNewRoutineLastDoneDate(todayStr);
    setNewRoutineNextDueDate(nextDue);
    setIsCreateRoutineModalOpen(true);
  };

  const handleCreateRoutine = async () => {
    if (!newRoutineTitle.trim()) {
      alert("נא להזין שם לשגרה");
      return;
    }
    setNewRoutineSaving(true);
    try {
      const nextDueObj = newRoutineNextDueDate
        ? new Date(newRoutineNextDueDate)
        : new Date(Date.now() + newRoutineFreqDays * 24 * 3600 * 1000);
      const lastDoneObj = newRoutineLastDoneDate ? new Date(newRoutineLastDoneDate) : null;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRoutineTitle.trim(),
          category: "JACUZZI_MAINTENANCE",
          frequencyDays: newRoutineFreqDays,
          lastDoneDate: lastDoneObj,
          nextDueDate: nextDueObj,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "שגיאה ביצירת שגרה");
      }
      const dataJson = await res.json();

      // Immediate optimistic update to state
      if (dataJson?.task) {
        setData((prev: any) => {
          if (!prev) return prev;
          const currentTasks = prev.tasks || [];
          return {
            ...prev,
            tasks: [...currentTasks.filter((t: any) => t.id !== dataJson.task.id), dataJson.task],
          };
        });
      }

      setIsCreateRoutineModalOpen(false);
      await loadSummaryData();
    } catch (err: any) {
      alert(err.message || "שגיאה ביצירת שגרה");
    } finally {
      setNewRoutineSaving(false);
    }
  };

  // Carousel index state (0..3 with infinite wrap)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visualActiveIndex, setVisualActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  // Pagination for Chemicals tab (15 items per page)
  const [chemicalsPage, setChemicalsPage] = useState(0);

  // New User Onboarding & Guidance Modals
  const [showWelcomeBlessing, setShowWelcomeBlessing] = useState(false);
  const [activeTabGuide, setActiveTabGuide] = useState<number | null>(null);

  const checkIsBrandNewUser = (userObj: any) => {
    if (!userObj) return false;
    const hasLogs = Array.isArray(userObj.waterLogs) && userObj.waterLogs.length > 0;
    const hasDiary = Array.isArray(userObj.diaryEntries) && userObj.diaryEntries.length > 0;
    const hasDoneTask = Array.isArray(userObj.tasks) && userObj.tasks.some((t: any) => Boolean(t.lastDoneDate));
    const hasUsedChem = Array.isArray(userObj.chemicals) && userObj.chemicals.some((c: any) => Boolean(c.lastUsedDate));
    return !hasLogs && !hasDiary && !hasDoneTask && !hasUsedChem;
  };

  const getWelcomeStorageKey = (userId?: string) => userId ? `has_seen_welcome_blessing_${userId}` : "has_seen_welcome_blessing";
  const getTabGuideStorageKey = (tabIdx: number, userId?: string) => userId ? `has_seen_tab_guide_${userId}_${tabIdx}` : `has_seen_tab_guide_${tabIdx}`;

  // App Data for live summary cards
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeParamIds, setActiveParamIds] = useState<string[]>(DEFAULT_TEST_STRIP_PARAM_IDS);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSummaryData = async () => {
    try {
      const res = await fetch(`/api/auth/me?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          setData(json.user);

          // Check if new user who never entered data
          const isBrandNew = checkIsBrandNewUser(json.user);

          if (typeof window !== "undefined" && isBrandNew) {
            const welcomeKey = getWelcomeStorageKey(json.user?.id);
            const hasSeenWelcome = localStorage.getItem(welcomeKey);
            if (!hasSeenWelcome) {
              setShowWelcomeBlessing(true);
            }
          }

          // Load active test strip params from user jacuzzi
          const userParams = parseTestStripParams(json.user?.jacuzzi?.testStripParams);
          if (userParams && userParams.length > 0) {
            setActiveParamIds(userParams);
            setModalSelectedParams(userParams);
            if (typeof window !== "undefined") {
              localStorage.setItem("active_test_strip_params", JSON.stringify(userParams));
            }
            return;
          }
        }
      }

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("active_test_strip_params");
        if (saved) {
          const parsed = parseTestStripParams(saved);
          if (parsed && parsed.length > 0) {
            setActiveParamIds(parsed);
            setModalSelectedParams(parsed);
          }
        }
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

  // Trigger tab guidance modal on first navigation to each tab for new users
  useEffect(() => {
    if (!data || showWelcomeBlessing) return;
    if (typeof window !== "undefined") {
      const isBrandNew = checkIsBrandNewUser(data);

      if (isBrandNew) {
        const tabKey = getTabGuideStorageKey(visualActiveIndex, data?.id);
        const hasSeenGuide = localStorage.getItem(tabKey);
        if (!hasSeenGuide) {
          setActiveTabGuide(visualActiveIndex);
        }
      }
    }
  }, [visualActiveIndex, data, showWelcomeBlessing]);

  const handleDismissWelcome = () => {
    setShowWelcomeBlessing(false);
    if (typeof window !== "undefined") {
      if (data?.id) {
        localStorage.setItem(getWelcomeStorageKey(data.id), "true");
      }
      localStorage.setItem("has_seen_welcome_blessing", "true");
      const tabKey = getTabGuideStorageKey(visualActiveIndex, data?.id);
      if (!localStorage.getItem(tabKey)) {
        setActiveTabGuide(visualActiveIndex);
      }
    }
  };

  const handleDismissTabGuide = () => {
    if (activeTabGuide !== null && typeof window !== "undefined") {
      if (data?.id) {
        localStorage.setItem(getTabGuideStorageKey(activeTabGuide, data.id), "true");
      }
      localStorage.setItem(`has_seen_tab_guide_${activeTabGuide}`, "true");
    }
    setActiveTabGuide(null);
  };

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
    setDragOffset(width);

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
    setDragOffset(-width);

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
    setDragOffset(isForward ? width : -width);

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

    if (offset > threshold) {
      // Dragged right -> advance to next card (in RTL)
      const newIdx = (currentIndex + 1) % CARD_TABS.length;
      setVisualActiveIndex(newIdx);
      setIsAnimating(true);
      setDragOffset(width);
      setTimeout(() => {
        setIsAnimating(false);
        setDragOffset(0);
        setCurrentIndex(newIdx);
      }, 350);
    } else if (offset < -threshold) {
      // Dragged left -> return to prev card (in RTL)
      const newIdx = (currentIndex - 1 + CARD_TABS.length) % CARD_TABS.length;
      setVisualActiveIndex(newIdx);
      setIsAnimating(true);
      setDragOffset(-width);
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
    setSelectedChemId(chemicals.length > 0 ? chemicals[0].id : "");
    setChemDeductQty("");
    setAdhocNotes("");
    setRefillPercent(modalData.id === "partial-refill" ? (parseInt(latestPartialPercent, 10) || 50) : 50);
    setEditVolume(modalData.volumeLiters ? String(modalData.volumeLiters) : "1200");
    setEditSanitization(modalData.sanitizationType || "BROMINE");
    if (modalData.type === "strip-settings" || modalData.id === "test-strip-settings") {
      setModalSelectedParams([...activeParamIds]);
    }
    setModalNotice(null);
  };

  // Save changes from Item Modal
  const handleSaveModalSettings = async () => {
    if (!activeItemModal) return;
    setModalSaving(true);
    setModalNotice(null);

    try {
      if (activeItemModal.id === "water-test" || activeItemModal.type === "water-test") {
        if (activeItemModal.taskId) {
          const res = await fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: activeItemModal.taskId,
              frequencyDays: editFreqDays,
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "שגיאה בעדכון משימה");
          }
        } else {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "בדיקת איכות מים (מקלון)",
              category: "WEEKLY",
              frequencyDays: editFreqDays,
              nextDueDate: new Date(Date.now() + editFreqDays * 24 * 3600 * 1000),
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "שגיאה ביצירת משימה");
          }
        }
      } else if (activeItemModal.type === "task") {
        // Find or create task
        if (activeItemModal.taskId) {
          const res = await fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: activeItemModal.taskId,
              frequencyDays: editFreqDays,
              lastDoneDate: editLastDoneDate ? new Date(editLastDoneDate) : null,
              nextDueDate: editNextDueDate ? new Date(editNextDueDate) : undefined,
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "שגיאה בעדכון משימה");
          }
        } else {
          // Create task if didn't exist
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: activeItemModal.title,
              category: activeItemModal.taskCategory || "WEEKLY",
              frequencyDays: editFreqDays,
              nextDueDate: editNextDueDate ? new Date(editNextDueDate) : new Date(Date.now() + editFreqDays * 24 * 3600 * 1000),
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "שגיאה ביצירת משימה");
          }
        }
      } else if (activeItemModal.id === "full-refill") {
        const res = await fetch("/api/jacuzzi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lastRefillDate: editLastDoneDate ? new Date(editLastDoneDate) : new Date(),
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "שגיאה בעדכון גיל המים");
        }
      } else if (activeItemModal.id === "volume" || activeItemModal.id === "sanitizer-type") {
        const res = await fetch("/api/jacuzzi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            volumeLiters: parseFloat(editVolume) || 1200,
            sanitizationType: editSanitization,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "שגיאה בעדכון הגדרות ג'קוזי");
        }
      } else if (activeItemModal.type === "strip-settings" || activeItemModal.id === "test-strip-settings") {
        const res = await fetch("/api/jacuzzi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testStripParams: modalSelectedParams,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "שגיאה בשמירת הגדרות מקלון");
        }
        setActiveParamIds(modalSelectedParams);
        if (typeof window !== "undefined") {
          localStorage.setItem("active_test_strip_params", JSON.stringify(modalSelectedParams));
        }
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

  // Mark task performed now (or record ad-hoc chemical addition)
  const handleMarkActionDone = async () => {
    if (!activeItemModal) return;
    setModalSaving(true);
    setModalNotice(null);

    try {
      const actionDateObj = actionDoneDate ? new Date(actionDoneDate) : new Date();

      if (activeItemModal.type === "adhoc-chemical") {
        // Record ad-hoc manual chemical addition (no next date)
        const chem = chemicals.find((c: any) => c.id === selectedChemId);
        const chemName = chem ? chem.name : "חומר כימי";
        const chemUnit = chem ? (chem.unit || "גרם") : "גרם";
        const amountNum = chemDeductQty ? parseFloat(chemDeductQty) : 0;

        // Deduct inventory if selected
        if (chem && amountNum > 0) {
          const newQty = Math.max(0, chem.quantity - amountNum);
          await fetch("/api/chemicals", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: chem.id,
              quantity: newQty,
              lastUsedDate: actionDateObj,
              lastUsedAmount: amountNum,
            }),
          });
        }

        // Log to Diary
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `תוספת חומר יזומה: ${chemName}`,
            content: `הוספת חומר יזומה: ${chemName} (${amountNum} ${chemUnit}). ${adhocNotes ? `הערות: ${adhocNotes}` : ""}`,
            chemicalsAdded: `${chemName}: ${amountNum} ${chemUnit}`,
            entryDate: actionDateObj,
          }),
        });
      } else if (activeItemModal.id === "full-refill") {
        // Full refill (100%)
        const res = await fetch("/api/jacuzzi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastRefillDate: actionDateObj }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "שגיאה בעדכון ריקון מים");
        }
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "החלפת מים מלאה (100%)",
            content: "בוצע ריקון ומילוי מים מלא במים טריים. גיל המים אופס בהצלחה.",
            entryDate: actionDateObj,
          }),
        });
        setEditLastDoneDate(actionDateObj.toISOString().slice(0, 10));
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
          const res = await fetch("/api/tasks", {
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
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "שגיאה בסימון ביצוע משימה");
          }
        } else {
          // Create task and log done
          const nextDue = new Date(actionDateObj.getTime() + editFreqDays * 24 * 3600 * 1000);
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: activeItemModal.title,
              category: activeItemModal.taskCategory || "WEEKLY",
              frequencyDays: editFreqDays,
              nextDueDate: nextDue,
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "שגיאה ביצירת משימה");
          }
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

        // Immediately sync local modal inputs
        setEditLastDoneDate(actionDateObj.toISOString().slice(0, 10));
        const newNextDue = new Date(actionDateObj.getTime() + editFreqDays * 24 * 3600 * 1000);
        setEditNextDueDate(newNextDue.toISOString().slice(0, 10));
      }

      setModalNotice("הפעולה נרשמה בהצלחה!");
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

  const handleDeleteCustomRoutine = async (taskId?: string) => {
    if (!taskId) return;
    if (!confirm("האם אתה בטוח שברצונך למחוק שגרה מותאמת אישית זו?")) return;
    setModalSaving(true);
    try {
      // Immediate optimistic removal from state
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: (prev.tasks || []).filter((t: any) => t.id !== taskId),
        };
      });

      const res = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "שגיאה במחיקת שגרה");
      }
      setActiveItemModal(null);
      await loadSummaryData();
    } catch (err: any) {
      alert(err.message || "שגיאה במחיקת שגרה");
      await loadSummaryData();
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
            {openPageId === "water-tests-new"
              ? "הזנת בדיקת מקלון חדשה"
              : CARD_TABS.find((t) => t.id === openPageId)?.title || "תצוגה מלאה"}
          </span>
        </div>

        {/* Full Page View Component */}
        <div className="pt-2">
          {(openPageId === "water-tests" || openPageId === "water-tests-new") && (
            <WaterTestsPage initialOpenAddModal={openPageId === "water-tests-new"} />
          )}
          {(openPageId === "water-maintenance" || openPageId === "jacuzzi-maintenance" || openPageId === "calendar") && <CalendarPage />}
          {openPageId === "inventory" && <InventoryPage />}
          {openPageId === "settings" && <SettingsPage />}
        </div>
      </div>
    );
  }

  // Calculate live summary card data
  const jacuzzi = data?.jacuzzi;
  const chemicals = data?.chemicals || [];
  const tasks = data?.tasks || [];
  const diaryEntries = data?.diaryEntries || [];
  const waterLogs = data?.waterLogs || [];
  const latestWaterLog = waterLogs.length > 0 ? waterLogs[0] : null;

  // Date formatters and relative day helpers
  const formatDateDisplay = (date: Date | string | null | undefined) => {
    if (!date) return "טרם בוצע";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "טרם בוצע";
    return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const formatDueDateDisplay = (date: Date | string | null | undefined) => {
    if (!date) return "ללא תאריך יעד";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "ללא תאריך יעד";
    return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const getRelativeDaysDisplay = (targetDate: Date | string | null | undefined, isPast: boolean) => {
    if (!targetDate) {
      return isPast ? "" : "(ממתין לביצוע ראשון)";
    }
    const d = new Date(targetDate);
    if (isNaN(d.getTime())) return "";
    const diffDays = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (isPast) {
      const daysAgo = Math.max(0, -diffDays);
      if (daysAgo === 0) return "(היום)";
      if (daysAgo === 1) return "(אתמול)";
      return `(לפני ${daysAgo} ימים)`;
    } else {
      if (diffDays < 0) return `(פג תוקף - באיחור ${Math.abs(diffDays)} ימים!)`;
      if (diffDays === 0) return "(בתוקף - היום)";
      if (diffDays === 1) return "(בתוקף - מחר)";
      return `(בתוקף - בעוד ${diffDays} ימים)`;
    }
  };

  const getDueDateColorClass = (targetDate: Date | string | null | undefined) => {
    if (!targetDate) return "text-slate-400 font-medium";
    const d = new Date(targetDate);
    if (isNaN(d.getTime())) return "text-slate-400 font-medium";
    const diffDays = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-semibold";
  };

  const formatNextDueDaysOnly = (targetDate: Date | string | null | undefined) => {
    if (!targetDate) return "ממתין לקביעת מועד";
    const d = new Date(targetDate);
    if (isNaN(d.getTime())) return "ממתין לקביעת מועד";

    const now = new Date();
    const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((dMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return overdueDays === 1 ? "באיחור של יום אחד!" : `באיחור של ${overdueDays} ימים!`;
    }
    if (diffDays === 0) return "היום";
    if (diffDays === 1) return "בעוד יום אחד (מחר)";
    if (diffDays === 2) return "בעוד יומיים";
    return `בעוד ${diffDays} ימים`;
  };

  const isBrandNew = checkIsBrandNewUser(data);

  // 1. Water Test Dates
  const waterTestTask = tasks.find((t: any) =>
    t.title?.includes("בדיקת איכות מים") || t.title?.includes("בדיקת מים") || t.title?.includes("מקלון")
  );
  const waterTestFreqDays = waterTestTask?.frequencyDays || 3;
  const lastWaterTestDate = latestWaterLog?.testedAt
    ? new Date(latestWaterLog.testedAt)
    : waterTestTask?.lastDoneDate
    ? new Date(waterTestTask.lastDoneDate)
    : null;
  const nextWaterTestDate = lastWaterTestDate
    ? (waterTestTask?.nextDueDate
        ? new Date(waterTestTask.nextDueDate)
        : new Date(lastWaterTestDate.getTime() + waterTestFreqDays * 24 * 3600 * 1000))
    : null;

  // 2. Sanitizer Dates (חיטוי שבועי)
  const sanitizerTask = tasks.find((t: any) =>
    t.title?.includes("חיטוי") || t.title?.includes("ברום") || t.title?.includes("כלור") || t.title?.includes("הלכרה")
  );
  const sanitizerChem = chemicals.find((c: any) =>
    c.category === "SANITIZER" || c.name?.includes("כלור") || c.name?.includes("ברום")
  );
  const lastSanitizerDate = sanitizerTask?.lastDoneDate
    ? new Date(sanitizerTask.lastDoneDate)
    : sanitizerChem?.lastUsedDate
    ? new Date(sanitizerChem.lastUsedDate)
    : null;
  const nextSanitizerDate = lastSanitizerDate
    ? (sanitizerTask?.nextDueDate
        ? new Date(sanitizerTask.nextDueDate)
        : new Date(lastSanitizerDate.getTime() + (sanitizerTask?.frequencyDays || 7) * 24 * 3600 * 1000))
    : null;

  // 3. Partial Refill Dates & Percentage
  const partialDiary = diaryEntries.find((d: any) => {
    const t = `${d.title || ""} ${d.content || ""}`.toLowerCase();
    return (t.includes("החלפ") || t.includes("ריענון") || t.includes("חלקית") || t.includes("חצי מים")) && t.includes("מים") && !t.includes("100%");
  });
  const lastPartialRefillDate = partialDiary ? new Date(partialDiary.entryDate || partialDiary.createdAt) : null;
  const nextPartialRefillDate = lastPartialRefillDate
    ? new Date(lastPartialRefillDate.getTime() + 30 * 24 * 3600 * 1000)
    : null;

  // Dynamic percentage of the last recorded partial refill
  let latestPartialPercent = "50";
  if (partialDiary) {
    const text = `${partialDiary.title || ""} ${partialDiary.content || ""}`;
    const match = text.match(/(\d+)%/);
    if (match) {
      latestPartialPercent = match[1];
    } else if (text.includes("חצי")) {
      latestPartialPercent = "50";
    } else if (text.includes("שליש")) {
      latestPartialPercent = "33";
    } else if (text.includes("רבע")) {
      latestPartialPercent = "25";
    }
  }

  // 4. Full Refill Dates
  const lastFullRefillDate = isBrandNew
    ? null
    : (jacuzzi?.lastRefillDate ? new Date(jacuzzi.lastRefillDate) : null);
  const daysSinceRefill = lastFullRefillDate
    ? Math.max(0, Math.floor((Date.now() - lastFullRefillDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const daysUntilNextRefill = daysSinceRefill !== null ? Math.max(0, 90 - daysSinceRefill) : null;
  const nextFullRefillDate = lastFullRefillDate
    ? new Date(lastFullRefillDate.getTime() + 90 * 24 * 3600 * 1000)
    : null;

  // 5. Actual Chemicals Added to Jacuzzi Water (ללא תאריך הבא!)
  const itemsFromInventory = chemicals
    .filter((c: any) => c.lastUsedDate && c.lastUsedAmount && c.lastUsedAmount > 0)
    .map((c: any) => ({
      id: `chem-${c.id}-${c.lastUsedDate}`,
      title: `${c.name}: ${c.lastUsedAmount} ${c.unit === "GRAMS" ? "גר'" : c.unit === "ML" ? 'מ"ל' : c.unit || "גרם"}`,
      date: c.lastUsedDate,
      formattedDate: formatDateDisplay(c.lastUsedDate),
      relativeDate: getRelativeDaysDisplay(c.lastUsedDate, true),
    }));

  const itemsFromDiary = diaryEntries
    .filter((d: any) => {
      if (d.chemicalsAdded) return true;
      const t = `${d.title || ""} ${d.content || ""}`.toLowerCase();
      if (t.includes("הזמנ") || t.includes("הגעת") || t.includes("קני") || t.includes("רכיש")) return false;
      if (t.includes("הוספת חומר") || t.includes("תוספת חומר") || t.includes("הוסף לג'קוזי") || t.includes("חיטוי שבועי")) return true;
      return false;
    })
    .map((d: any) => ({
      id: `diary-${d.id}`,
      title: d.chemicalsAdded || d.title,
      date: d.entryDate || d.createdAt,
      formattedDate: formatDateDisplay(d.entryDate || d.createdAt),
      relativeDate: getRelativeDaysDisplay(d.entryDate || d.createdAt, true),
    }));

  const allAddedChemicalsMap = new Map();
  [...itemsFromInventory, ...itemsFromDiary].forEach((item) => {
    const key = `${item.title}-${new Date(item.date).toISOString().split("T")[0]}`;
    if (!allAddedChemicalsMap.has(key)) {
      allAddedChemicalsMap.set(key, item);
    }
  });

  const allAddedChemicalsList = Array.from(allAddedChemicalsMap.values())
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const CHEMICALS_PER_PAGE = 15;
  const totalChemicalPages = Math.max(1, Math.ceil(allAddedChemicalsList.length / CHEMICALS_PER_PAGE));
  const validChemicalsPage = Math.min(chemicalsPage, totalChemicalPages - 1);
  const displayedChemicals = allAddedChemicalsList.slice(
    validChemicalsPage * CHEMICALS_PER_PAGE,
    (validChemicalsPage + 1) * CHEMICALS_PER_PAGE
  );

  // Jacuzzi Maintenance Dates
  // 6. Weekly Filter Rinse Dates
  const filterRinseTask = tasks.find((t: any) =>
    t.title?.includes("שטיפת פילטר") || (t.title?.includes("פילטר") && !t.title?.includes("השרי") && !t.title?.includes("החלפ"))
  );
  const lastFilterRinseDate = filterRinseTask?.lastDoneDate ? new Date(filterRinseTask.lastDoneDate) : null;
  const nextFilterRinseDate = lastFilterRinseDate
    ? (filterRinseTask?.nextDueDate
        ? new Date(filterRinseTask.nextDueDate)
        : new Date(lastFilterRinseDate.getTime() + (filterRinseTask?.frequencyDays || 7) * 24 * 3600 * 1000))
    : null;

  // 7. Waterline & Shell Cleaning Dates
  const waterlineTask = tasks.find((t: any) =>
    t.title?.includes("קו מים") || t.title?.includes("דפנ") || t.title?.includes("דופן")
  );
  const lastWaterlineDate = waterlineTask?.lastDoneDate ? new Date(waterlineTask.lastDoneDate) : null;
  const nextWaterlineDate = lastWaterlineDate
    ? (waterlineTask?.nextDueDate
        ? new Date(waterlineTask.nextDueDate)
        : new Date(lastWaterlineDate.getTime() + (waterlineTask?.frequencyDays || 7) * 24 * 3600 * 1000))
    : null;

  // 8. Cover Cleaning Dates
  const coverTask = tasks.find((t: any) =>
    t.title?.includes("כיסוי") || t.title?.includes("מכסה")
  );
  const lastCoverDate = coverTask?.lastDoneDate ? new Date(coverTask.lastDoneDate) : null;
  const nextCoverDate = lastCoverDate
    ? (coverTask?.nextDueDate
        ? new Date(coverTask.nextDueDate)
        : new Date(lastCoverDate.getTime() + (coverTask?.frequencyDays || 30) * 24 * 3600 * 1000))
    : null;

  // 9. Pipe Line Cleaning (ניקוי צנרת)
  const pipeCleanTask = tasks.find((t: any) =>
    t.title?.includes("צנרת") || t.title?.includes("פלאש") || t.title?.includes("Flush")
  );
  const lastPipeCleanDate = pipeCleanTask?.lastDoneDate
    ? new Date(pipeCleanTask.lastDoneDate)
    : (jacuzzi?.lastDeepCleanDate && !isBrandNew)
    ? new Date(jacuzzi.lastDeepCleanDate)
    : null;
  const nextPipeCleanDate = lastPipeCleanDate
    ? (pipeCleanTask?.nextDueDate
        ? new Date(pipeCleanTask.nextDueDate)
        : new Date(lastPipeCleanDate.getTime() + (pipeCleanTask?.frequencyDays || 90) * 24 * 3600 * 1000))
    : null;

  // 10. Filter Replacement (החלפת פילטר)
  const filterReplaceTask = tasks.find((t: any) =>
    t.title?.includes("החלפת פילטר") || (t.title?.includes("פילטר") && t.title?.includes("החלפ"))
  );
  const lastFilterReplaceDate = filterReplaceTask?.lastDoneDate ? new Date(filterReplaceTask.lastDoneDate) : null;
  const nextFilterReplaceDate = lastFilterReplaceDate
    ? (filterReplaceTask?.nextDueDate
        ? new Date(filterReplaceTask.nextDueDate)
        : new Date(lastFilterReplaceDate.getTime() + (filterReplaceTask?.frequencyDays || 180) * 24 * 3600 * 1000))
    : null;

  // Active Pending Tasks & Low Stock Chemicals
  const lowStockChems = chemicals.filter((c: any) => (c.quantity || 0) <= (c.minThreshold || 100));

  // Compute upcoming tasks in next 7 days for the Status Card
  const nowMs = Date.now();
  // Identify all custom routines created by the user
  const isDefaultSystemTask = (t: any) => {
    const title = t.title || "";
    return (
      title.includes("בדיקת איכות מים") ||
      title.includes("תוספת אנזימים") ||
      title.includes("שטיפת פילטר") ||
      title.includes("שוק חיטוי") ||
      title.includes("ניקוי קו מים") ||
      title.includes("ניקוי פילטר עמוק") ||
      title.includes("החלפת מים חלקית") ||
      title.includes("בדיקת אטימות") ||
      title.includes("אוורור כיסוי") ||
      title.includes("ניקוי כיסוי") ||
      title.includes("שטיפת צנרת") ||
      title.includes("ניקוי צנרת") ||
      title.includes("החלפת פילטר") ||
      title.includes("חיטוי")
    );
  };

  const standardTaskIds = new Set([
    waterTestTask?.id,
    sanitizerTask?.id,
    filterRinseTask?.id,
    waterlineTask?.id,
    coverTask?.id,
    pipeCleanTask?.id,
    filterReplaceTask?.id,
  ].filter(Boolean));

  const customTasks = tasks.filter((t: any) => !standardTaskIds.has(t.id) && !isDefaultSystemTask(t) && !t.isCompleted);

  const baseScheduledEvents = [
    {
      id: "water-test",
      title: "בדיקת איכות מים (מקלון)",
      dueDate: nextWaterTestDate,
      icon: FlaskConical,
      type: "water-test",
      onOpen: () => openItemModal({
        id: "water-test",
        title: "הגדרת תדירות בדיקת איכות מים",
        subtitle: "קביעת מרווח הזמן הרצוי לביצוע בדיקת מקלון",
        icon: FlaskConical,
        type: "water-test",
        defaultFreqDays: 3,
        currentFreqDays: waterTestFreqDays,
        currentLastDoneDate: lastWaterTestDate?.toISOString() || null,
        currentNextDueDate: nextWaterTestDate ? nextWaterTestDate.toISOString() : null,
      }),
    },
    {
      id: "sanitizer-shock",
      title: "חיטוי שבועי",
      dueDate: nextSanitizerDate,
      icon: ShieldAlert,
      type: "task",
      onOpen: () => openItemModal({
        id: "sanitizer-shock",
        title: "חיטוי שבועי",
        subtitle: "הוספת מנת חיטוי / שוק תחזוקתי לג'קוזי ועדכון מלאי החומרים",
        icon: ShieldAlert,
        type: "task",
        taskId: sanitizerTask?.id,
        taskCategory: "WEEKLY",
        defaultFreqDays: 7,
        currentFreqDays: sanitizerTask?.frequencyDays || 7,
        currentLastDoneDate: lastSanitizerDate?.toISOString() || null,
        currentNextDueDate: nextSanitizerDate ? nextSanitizerDate.toISOString() : null,
      }),
    },
    {
      id: "filter-rinse",
      title: "שטיפת פילטר",
      dueDate: nextFilterRinseDate,
      icon: ShieldCheck,
      type: "task",
      onOpen: () => openItemModal({
        id: "filter-wash",
        title: "שטיפת פילטר",
        subtitle: "שטיפת הפילטר במים זורמים (אחת לשבוע או לפי תדירות)",
        icon: ShieldCheck,
        type: "task",
        taskId: filterRinseTask?.id,
        taskCategory: "WEEKLY",
        defaultFreqDays: 7,
        currentFreqDays: filterRinseTask?.frequencyDays || 7,
        currentLastDoneDate: lastFilterRinseDate?.toISOString() || null,
        currentNextDueDate: nextFilterRinseDate ? nextFilterRinseDate.toISOString() : null,
      }),
    },
    {
      id: "waterline-clean",
      title: "ניקוי דפנות וקו מים",
      dueDate: nextWaterlineDate,
      icon: Sparkles,
      type: "task",
      onOpen: () => openItemModal({
        id: "waterline-clean",
        title: "ניקוי דפנות וקו מים",
        subtitle: "ניקוי והסרת שמנים ולכלוך מקו המים והדפנות",
        icon: Sparkles,
        type: "task",
        taskId: waterlineTask?.id,
        taskCategory: "WEEKLY",
        defaultFreqDays: 7,
        currentFreqDays: waterlineTask?.frequencyDays || 7,
        currentLastDoneDate: lastWaterlineDate?.toISOString() || null,
        currentNextDueDate: nextWaterlineDate ? nextWaterlineDate.toISOString() : null,
      }),
    },
    {
      id: "cover-clean",
      title: "ניקוי ואוורור כיסוי",
      dueDate: nextCoverDate,
      icon: ShieldCheck,
      type: "task",
      onOpen: () => openItemModal({
        id: "cover-clean",
        title: "ניקוי ואוורור כיסוי",
        subtitle: "אוורור הכיסוי וניקוי החלק הפנימי והחיצוני",
        icon: ShieldCheck,
        type: "task",
        taskId: coverTask?.id,
        taskCategory: "WEEKLY",
        defaultFreqDays: 7,
        currentFreqDays: coverTask?.frequencyDays || 7,
        currentLastDoneDate: lastCoverDate?.toISOString() || null,
        currentNextDueDate: nextCoverDate ? nextCoverDate.toISOString() : null,
      }),
    },
    {
      id: "pipe-clean",
      title: "ניקוי צנרת",
      dueDate: nextPipeCleanDate,
      icon: Wrench,
      type: "task",
      onOpen: () => openItemModal({
        id: "deep-clean",
        title: "ניקוי צנרת",
        subtitle: "שטיפת פלאש לצנרת להסרת ביופילם לפני ריקון המים",
        icon: Wrench,
        type: "task",
        taskId: pipeCleanTask?.id,
        taskCategory: "MONTHLY",
        defaultFreqDays: 90,
        currentFreqDays: pipeCleanTask?.frequencyDays || 90,
        currentLastDoneDate: lastPipeCleanDate?.toISOString() || null,
        currentNextDueDate: nextPipeCleanDate ? nextPipeCleanDate.toISOString() : null,
      }),
    },
    {
      id: "filter-replace",
      title: "החלפת פילטר (סנן חדש)",
      dueDate: nextFilterReplaceDate,
      icon: RefreshCw,
      type: "task",
      onOpen: () => openItemModal({
        id: "filter-replace",
        title: "החלפת פילטר (סנן חדש)",
        subtitle: "סימון התקנת פילטר חדש, קביעת תדירות החלפה (חצי שנתי / שנתי) ומועד הבא",
        icon: RefreshCw,
        type: "task",
        taskId: filterReplaceTask?.id,
        taskCategory: "CUSTOM",
        defaultFreqDays: 180,
        currentFreqDays: filterReplaceTask?.frequencyDays || 180,
        currentLastDoneDate: lastFilterReplaceDate?.toISOString() || null,
        currentNextDueDate: nextFilterReplaceDate ? nextFilterReplaceDate.toISOString() : null,
      }),
    },
    {
      id: "full-refill",
      title: "ריקון ומילוי מים מלא",
      dueDate: nextFullRefillDate,
      icon: Waves,
      type: "refill",
      onOpen: () => openItemModal({
        id: "full-refill",
        title: "ריקון ומילוי מים מלא (100%)",
        subtitle: "מחזור רענון מים מלא (כל 90 יום / 3 חודשים)",
        icon: Waves,
        type: "refill",
        defaultFreqDays: 90,
        currentFreqDays: 90,
        currentLastDoneDate: lastFullRefillDate ? lastFullRefillDate.toISOString() : null,
        currentNextDueDate: nextFullRefillDate ? nextFullRefillDate.toISOString() : null,
      }),
    },
  ];

  const customScheduledEvents = customTasks.map((t: any) => {
    const lastDone = t.lastDoneDate ? new Date(t.lastDoneDate) : null;
    const due = t.nextDueDate
      ? new Date(t.nextDueDate)
      : (lastDone ? new Date(lastDone.getTime() + (t.frequencyDays || 7) * 24 * 3600 * 1000) : null);

    return {
      id: `custom-task-${t.id}`,
      title: t.title,
      dueDate: due,
      icon: Sparkles,
      type: "task",
      onOpen: () => openItemModal({
        id: `custom-task-${t.id}`,
        title: t.title,
        subtitle: `שגרה מותאמת אישית • כל ${t.frequencyDays || 7} ימים`,
        icon: Sparkles,
        type: "task",
        taskId: t.id,
        isCustom: true,
        taskCategory: t.category || "CUSTOM",
        defaultFreqDays: t.frequencyDays || 7,
        currentFreqDays: t.frequencyDays || 7,
        currentLastDoneDate: lastDone ? lastDone.toISOString() : null,
        currentNextDueDate: due ? due.toISOString() : null,
      }),
    };
  });

  const allScheduledEvents = [
    ...baseScheduledEvents,
    ...customScheduledEvents,
  ];

  const sevenDaysUpcomingTasks = allScheduledEvents
    .filter((evt) => evt.dueDate !== null && evt.dueDate !== undefined)
    .map((evt) => {
      const diffDays = Math.round(((evt.dueDate as Date).getTime() - nowMs) / (1000 * 60 * 60 * 24));
      return { ...evt, diffDays };
    })
    .filter((evt) => evt.diffDays <= 7)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Extract short English labels for active test strip params
  const getShortParamLabel = (paramId: string) => {
    const p = ALL_TEST_STRIP_PARAMS.find((x) => x.id === paramId);
    if (!p) return paramId.toUpperCase();
    const match = p.enName.match(/\((.*?)\)/);
    if (match) return match[1];
    if (p.enName.length <= 6) return p.enName;
    return paramId.toUpperCase();
  };

  const formatChemUnit = (unit: string) => {
    switch (unit?.toUpperCase()) {
      case "GRAMS":
      case "GR":
        return 'גרם';
      case "ML":
      case "MILLILITERS":
        return 'מ"ל';
      case "LITERS":
        return 'ליטר';
      case "TABLETS":
        return 'טבליות';
      default:
        return unit || 'יח׳';
    }
  };

  const formatChemCategory = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "SANITIZER": return "חיטוי";
      case "SHOCK": return "שוק / חמצון";
      case "PH_INCREASER": return "מעלה pH";
      case "PH_DECREASER": return "מוריד pH";
      case "ALKALINITY": return "בסיסיות (TA)";
      case "CLARIFIER": return "מבהיר מים";
      case "ANTIFOAM": return "מונע קצף";
      case "SCALE_INHIBITOR": return "מונע אבנית";
      default: return "חומר טיפול";
    }
  };

  // Compute Health & Equipment Dangers of Abnormal Test Parameters (100% Synced with Water Tests Page)
  const calculateLatestAbnormalRisks = (test: any) => {
    if (!test) return [];

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

    const risks: Array<{ name: string; statusLabel: string; risk: string }> = [];

    for (const pId of testedParamIds) {
      const pDef = ALL_PARAMS_WITH_CLARITY.find((p) => p.id === pId);
      if (!pDef) continue;

      if (pId === "clarity") {
        if (test.waterClarity && test.waterClarity !== "CLEAR") {
          const clarityObj = getClarityDisplay(test.waterClarity);
          risks.push({
            name: "צלילות המים",
            statusLabel: clarityObj.label,
            risk: clarityObj.risk || pDef.dangerLow,
          });
        }
        continue;
      }

      const { val, rangeStr } = extractParamValue(test, pId);
      const domain = getGenericDomain(pId, val, rangeStr);
      if (domain.id !== "OK" && domain.id !== "UNKNOWN") {
        const riskText = domain.id === "VERY_LOW" || domain.id === "LOW" ? pDef.dangerLow : pDef.dangerHigh;
        risks.push({
          name: pDef.nameHe,
          statusLabel: domain.label,
          risk: riskText,
        });
      }
    }

    if (test.waterOdor && test.waterOdor !== "FRESH" && test.waterOdor !== "NO_ODOR") {
      const odorObj = getOdorDisplay(test.waterOdor);
      risks.push({
        name: "ריח המים",
        statusLabel: odorObj.label,
        risk: odorObj.risk || "נוכחות ריח לוואי או כלורמינים - מומלץ אוורור וחיטוי שוק",
      });
    }

    return risks;
  };

  const latestAbnormalRisks = calculateLatestAbnormalRisks(latestWaterLog);

  // Harmonized Card Render (Unified Serene Blue & White Palette - 5 Cards Total)
  const renderCard = (cardIdx: number) => {
    switch (cardIdx) {
      // -------------------------------------------------------------
      // CARD 0: סטטוס (משימות 7 ימים, איכות מים, סכנות חריגים והזמנת חומרים)
      // -------------------------------------------------------------
      case 0:
        return (
          <div
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl transition-all h-full flex flex-col justify-between min-h-[580px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    סטטוס
                  </h2>
                  <p className="text-xs text-slate-300">
                    {sevenDaysUpcomingTasks.length} משימות מתוזמנות ל-7 הימים הקרובים
                  </p>
                </div>
              </div>

              {JSON.stringify(card0Order) !== JSON.stringify(DEFAULT_CARD_0_ORDER) && (
                <button
                  type="button"
                  onClick={(e) => handleResetCardOrder(0, e)}
                  className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-sky-950 text-slate-400 hover:text-sky-300 border border-slate-800 text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                  title="אפס לסדר ברירת המחדל"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">אפס סדר</span>
                </button>
              )}
            </div>

            {/* Reorderable Content Sections for Card 0 */}
            <div className="space-y-4 flex-1">
              {card0Order.map((sectionId, index) => {
                const isDragOver = dragOverIndex === index && draggedSectionInfo?.cardIndex === 0;
                const isItemDragging = draggedSectionInfo?.cardIndex === 0 && draggedSectionInfo?.index === index;

                return (
                  <div
                    key={sectionId}
                    data-reorder-index={index}
                    draggable
                    onDragStart={(e) => onDragStartSection(0, sectionId, index, e)}
                    onDragOver={(e) => onDragOverSection(0, index, e)}
                    onDrop={(e) => onDropSection(0, index, e)}
                    onTouchStart={(e) => onTouchStartSection(0, index, e)}
                    onTouchMove={(e) => onTouchMoveSection(0, e)}
                    onTouchEnd={(e) => onTouchEndSection(0, e)}
                    className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${
                      isDragOver ? "border-t-2 border-sky-400 pt-1 scale-[1.01]" : ""
                    } ${isItemDragging ? "opacity-40 scale-95 ring-2 ring-sky-500/50 rounded-2xl" : ""}`}
                  >

                    {/* Section: משימות קרובות */}
                    {sectionId === "upcoming-tasks" && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            <span>משימות קרובות (טווח 7 ימים):</span>
                          </span>
                          <span className="text-[10px] text-sky-300 font-semibold">
                            {sevenDaysUpcomingTasks.length} פעולות לביצוע
                          </span>
                        </div>

                        {sevenDaysUpcomingTasks.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-0.5">
                            {sevenDaysUpcomingTasks.map((t) => {
                              const IconComp = t.icon || Calendar;
                              const isOverdue = t.diffDays < 0;
                              const isToday = t.diffDays === 0;
                              const isTomorrow = t.diffDays === 1;

                              return (
                                <div
                                  key={t.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    t.onOpen();
                                  }}
                                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer group/task ${
                                    isOverdue
                                      ? "bg-rose-950/30 border-rose-900/50 hover:border-rose-500/70"
                                      : "bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-500/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${
                                        isOverdue
                                          ? "bg-rose-950/80 border-rose-800/50 text-rose-300"
                                          : "bg-emerald-950/80 border-emerald-800/50 text-emerald-300"
                                      }`}
                                    >
                                      <IconComp className="w-3.5 h-3.5" />
                                    </div>
                                    <span
                                      className={`text-xs font-bold truncate transition-colors ${
                                        isOverdue
                                          ? "text-rose-200 group-hover/task:text-rose-100"
                                          : "text-white group-hover/task:text-emerald-300"
                                      }`}
                                    >
                                      {t.title}
                                    </span>
                                  </div>

                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 border ${
                                      isOverdue
                                        ? "bg-rose-950 text-rose-300 border-rose-800"
                                        : "bg-emerald-950 text-emerald-300 border-emerald-800"
                                    }`}
                                  >
                                    {isOverdue
                                      ? `פג תוקף (באיחור של ${Math.abs(t.diffDays)} ימים!)`
                                      : isToday
                                      ? "בתוקף (היום)"
                                      : isTomorrow
                                      ? "בתוקף (מחר)"
                                      : `בתוקף (בעוד ${t.diffDays} ימים)`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 bg-[#080e14]/90 rounded-2xl border border-emerald-900/30 flex items-center justify-center gap-2 text-xs text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>אין משימות קרובות ל-7 הימים הקרובים ✓</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section: מצב איכות המים הנוכחי */}
                    {sectionId === "water-status" && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                            <span>מצב איכות המים הנוכחי:</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {latestWaterLog ? `נבדק: ${new Date(latestWaterLog.testedAt).toLocaleDateString("he-IL")}` : "טרם בוצעה בדיקה"}
                          </span>
                        </div>

                        {latestWaterLog ? (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="bg-[#080e14]/90 p-2.5 rounded-xl border border-sky-900/30 text-center space-y-0.5">
                                <span className="text-[10px] text-slate-400">חומציות (pH)</span>
                                <div className="text-sm font-black text-white">{latestWaterLog.ph || latestWaterLog.phRange || "7.4"}</div>
                                <span className="text-[9px] text-sky-300/80">יעד: 7.2 - 7.6</span>
                              </div>

                              <div className="bg-[#080e14]/90 p-2.5 rounded-xl border border-sky-900/30 text-center space-y-0.5">
                                <span className="text-[10px] text-slate-400">כלור / חיטוי</span>
                                <div className="text-sm font-black text-white">{latestWaterLog.freeChlorine || latestWaterLog.chlorineRange || "3.0"}</div>
                                <span className="text-[9px] text-sky-300/80">יעד: 2.0 - 4.0</span>
                              </div>

                              <div className="bg-[#080e14]/90 p-2.5 rounded-xl border border-sky-900/30 text-center space-y-0.5">
                                <span className="text-[10px] text-slate-400">בסיסיות (TA)</span>
                                <div className="text-sm font-black text-white">{latestWaterLog.alkalinity || latestWaterLog.alkalinityRange || "90"}</div>
                                <span className="text-[9px] text-sky-300/80">יעד: 80 - 120</span>
                              </div>

                              <div className="bg-[#080e14]/90 p-2.5 rounded-xl border border-sky-900/30 text-center space-y-0.5">
                                <span className="text-[10px] text-slate-400">צלילות ומראה</span>
                                <div className="text-sm font-black text-white">
                                  {getClarityDisplay(latestWaterLog.waterClarity).label}
                                </div>
                                <span className="text-[9px] text-sky-300/80">בדיקה חושית</span>
                              </div>
                            </div>

                            {/* צלילות, עכירות, ריח והערות בסטטוס */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsClarityOdorModalOpen(true);
                              }}
                              className="bg-[#080e14]/90 hover:bg-sky-950/40 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/50 space-y-2 text-xs transition-all cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                                  <span>צלילות ועכירות & ריח המים:</span>
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-sky-950 text-sky-200 border border-sky-800 flex items-center gap-1">
                                    <span>{getClarityDisplay(latestWaterLog.waterClarity).icon}</span>
                                    <span>{getClarityDisplay(latestWaterLog.waterClarity).label}</span>
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-sky-950 text-sky-200 border border-sky-800 flex items-center gap-1">
                                    <span>{getOdorDisplay(latestWaterLog.waterOdor).icon}</span>
                                    <span>{getOdorDisplay(latestWaterLog.waterOdor).label}</span>
                                  </span>
                                </div>
                              </div>
                              {(latestWaterLog.clarityOdorNotes || latestWaterLog.description) && (
                                <div className="text-[11px] text-slate-300 bg-sky-950/40 p-2.5 rounded-xl border border-sky-900/30 flex items-start gap-1.5">
                                  <span className="text-sky-400 font-bold shrink-0">הערות:</span>
                                  <span className="leading-snug text-slate-200">{latestWaterLog.clarityOdorNotes || latestWaterLog.description}</span>
                                </div>
                              )}
                            </div>

                            {/* סכנות המופיעות מבדיקת מים אחרונה */}
                            {latestAbnormalRisks.length > 0 ? (
                              <div className="bg-[#180e14]/95 border border-rose-900/60 rounded-2xl p-3 space-y-1.5 text-xs text-right shadow-md">
                                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span>סכנות שהתגלו בבדיקת המים האחרונה:</span>
                                </div>
                                <div className="space-y-1 pt-1 border-t border-rose-900/30">
                                  {latestAbnormalRisks.map((risk, idx) => (
                                    <div key={idx} className="text-[11px] text-slate-200">
                                      <span className="text-rose-300 font-bold">• {risk.name} ({risk.statusLabel}):</span>{" "}
                                      <span className="text-slate-300">{risk.risk}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-[#080e14]/90 p-2 rounded-xl border border-emerald-900/30 flex items-center gap-2 text-[11px] text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="font-bold">כל מדדי המים מאוזנים לחלוטין וללא סכנות ✓</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPageId("water-tests-new");
                            }}
                            className="p-3 bg-[#080e14]/90 hover:bg-sky-950/40 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 text-center text-xs text-slate-300 transition-all cursor-pointer group/test"
                          >
                            <span className="group-hover/test:text-sky-300 transition-colors font-medium">טרם תועדה בדיקת מים במערכת (לחץ כאן להזנת תוצאות בדיקת מקלון)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section: גיל המים */}
                    {sectionId === "water-age" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPageId("settings");
                        }}
                        className="bg-[#080e14]/90 hover:bg-sky-950/40 px-3.5 py-2.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 transition-all flex items-center justify-between text-xs cursor-pointer group/age"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="text-slate-300 group-hover/age:text-white transition-colors">
                            גיל המים הנוכחי:{" "}
                            <strong className="text-white">
                              {daysSinceRefill !== null ? `${daysSinceRefill} ימים` : "ממתין למילוי ראשון"}
                            </strong>
                          </span>
                        </div>
                        <span className="text-[11px] text-sky-300/90 font-medium">
                          {daysUntilNextRefill !== null ? `ריקון מלא בעוד ${daysUntilNextRefill} יום` : "ללא תאריך יעד"}
                        </span>
                      </div>
                    )}

                    {/* Section: הזמנת חומרים ומצב מלאי */}
                    {sectionId === "chemical-inventory" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = "/inventory";
                        }}
                        className="space-y-2 pt-1 border-t border-sky-900/20 cursor-pointer group/inv"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white group-hover/inv:text-sky-300 transition-colors flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-sky-400" />
                            <span>הזמנת חומרים ומצב מלאי:</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lowStockChems.length > 0 ? `${lowStockChems.length} חומרים בחוסר` : "מלאי מספק"}
                          </span>
                        </div>

                        {lowStockChems.length > 0 ? (
                          <div className="space-y-2 bg-[#180e14]/80 p-3 rounded-2xl border border-rose-900/50">
                            <div className="text-[11px] text-rose-300 font-bold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              <span>נמצאו חומרים מתחת לסף המינימום - נדרשת הזמנה:</span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                              {lowStockChems.map((c: any) => (
                                <span
                                  key={c.id}
                                  className="text-[11px] bg-rose-950/90 text-rose-200 border border-rose-800/70 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1"
                                >
                                  <span>{c.name}:</span>
                                  <span className="text-white">{c.quantity} {formatChemUnit(c.unit)}</span>
                                  <span className="text-rose-400 text-[9px]">(סף: {c.minThreshold || 100})</span>
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = "/inventory";
                              }}
                              className="w-full mt-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>פתח ארון חומרים להזמנה ועדכון מלאי</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-[#080e14]/90 rounded-xl border border-emerald-900/30 flex items-center justify-between text-[11px] text-emerald-300">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>כל החומרים בארון מעל סף המינימום ולא נדרשת הזמנה ✓</span>
                            </div>
                            <span className="text-[10px] text-sky-300 group-hover/inv:text-white underline">
                              לארון החומרים
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
              <span className="text-sky-300 font-bold">1 מתוך 4 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 1: תחזוקת מתקן (כולל ניקוי צנרת והחלפת פילטר ושגרות מותאמות)
      // -------------------------------------------------------------
      case 1:
        return (
          <div
            onClick={() => setOpenPageId("jacuzzi-maintenance")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40 h-full flex flex-col justify-between min-h-[580px]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    תחזוקת מתקן
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {JSON.stringify(card1Order) !== JSON.stringify(DEFAULT_CARD_1_ORDER) && (
                  <button
                    type="button"
                    onClick={(e) => handleResetCardOrder(1, e)}
                    className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-sky-950 text-slate-400 hover:text-sky-300 border border-slate-800 text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                    title="אפס לסדר ברירת המחדל"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">אפס סדר</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreateRoutineModal();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>שגרה חדשה</span>
                </button>
              </div>
            </div>

            {/* Reorderable Content Sections for Card 1 */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-0.5">
              {card1Order.map((sectionId, index) => {
                const isDragOver = dragOverIndex === index && draggedSectionInfo?.cardIndex === 1;
                const isItemDragging = draggedSectionInfo?.cardIndex === 1 && draggedSectionInfo?.index === index;

                return (
                  <div
                    key={sectionId}
                    data-reorder-index={index}
                    draggable
                    onDragStart={(e) => onDragStartSection(1, sectionId, index, e)}
                    onDragOver={(e) => onDragOverSection(1, index, e)}
                    onDrop={(e) => onDropSection(1, index, e)}
                    onTouchStart={(e) => onTouchStartSection(1, index, e)}
                    onTouchMove={(e) => onTouchMoveSection(1, e)}
                    onTouchEnd={(e) => onTouchEndSection(1, e)}
                    className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${
                      isDragOver ? "border-t-2 border-sky-400 pt-1 scale-[1.01]" : ""
                    } ${isItemDragging ? "opacity-40 scale-95 ring-2 ring-sky-500/50 rounded-2xl" : ""}`}
                  >

                    {/* Task 1: שטיפת פילטר שבועית */}
                    {sectionId === "filter-wash" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openItemModal({
                            id: "filter-wash",
                            title: "שטיפת פילטר",
                            subtitle: "סימון שטיפת הפילטר בזרם מים, עדכון תאריך ביצוע ושינוי תדירות",
                            icon: ShieldCheck,
                            type: "task",
                            taskId: filterRinseTask?.id,
                            taskCategory: "WEEKLY",
                            defaultFreqDays: 7,
                            currentFreqDays: filterRinseTask?.frequencyDays || 7,
                            currentLastDoneDate: lastFilterRinseDate?.toISOString() || null,
                            currentNextDueDate: nextFilterRinseDate ? nextFilterRinseDate.toISOString() : null,
                          });
                        }}
                        className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors">
                            שטיפת פילטר
                          </span>
                          <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center">
                            <Edit2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="text-xs pt-1 border-t border-sky-900/20">
                          <span className={`font-bold ${getDueDateColorClass(nextFilterRinseDate)}`}>
                            {formatNextDueDaysOnly(nextFilterRinseDate)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Task 2: ניקוי דפנות וקו מים */}
                    {sectionId === "waterline-clean" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openItemModal({
                            id: "waterline-clean",
                            title: "ניקוי דפנות וקו מים",
                            subtitle: "ניקוי והסרת שמנים ולכלוך מקו המים והדפנות",
                            icon: Sparkles,
                            type: "task",
                            taskId: waterlineTask?.id,
                            taskCategory: "WEEKLY",
                            defaultFreqDays: 7,
                            currentFreqDays: waterlineTask?.frequencyDays || 7,
                            currentLastDoneDate: lastWaterlineDate?.toISOString() || null,
                            currentNextDueDate: nextWaterlineDate ? nextWaterlineDate.toISOString() : null,
                          });
                        }}
                        className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors">
                            ניקוי דפנות וקו מים
                          </span>
                          <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center">
                            <Edit2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="text-xs pt-1 border-t border-sky-900/20">
                          <span className={`font-bold ${getDueDateColorClass(nextWaterlineDate)}`}>
                            {formatNextDueDaysOnly(nextWaterlineDate)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Task 3: ניקוי ואוורור כיסוי */}
                    {sectionId === "cover-clean" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openItemModal({
                            id: "cover-clean",
                            title: "ניקוי ואוורור כיסוי",
                            subtitle: "אוורור הכיסוי וניקוי החלק הפנימי והחיצוני",
                            icon: ShieldCheck,
                            type: "task",
                            taskId: coverTask?.id,
                            taskCategory: "WEEKLY",
                            defaultFreqDays: 7,
                            currentFreqDays: coverTask?.frequencyDays || 7,
                            currentLastDoneDate: lastCoverDate?.toISOString() || null,
                            currentNextDueDate: nextCoverDate ? nextCoverDate.toISOString() : null,
                          });
                        }}
                        className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors">
                            ניקוי ואוורור כיסוי
                          </span>
                          <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center">
                            <Edit2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="text-xs pt-1 border-t border-sky-900/20">
                          <span className={`font-bold ${getDueDateColorClass(nextCoverDate)}`}>
                            {formatNextDueDaysOnly(nextCoverDate)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Task 4: ניקוי צנרת */}
                    {sectionId === "deep-clean" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openItemModal({
                            id: "deep-clean",
                            title: "ניקוי צנרת",
                            subtitle: "שטיפת פלאש לצנרת להסרת ביופילם לפני ריקון המים",
                            icon: Wrench,
                            type: "task",
                            taskId: pipeCleanTask?.id,
                            taskCategory: "MONTHLY",
                            defaultFreqDays: 90,
                            currentFreqDays: pipeCleanTask?.frequencyDays || 90,
                            currentLastDoneDate: lastPipeCleanDate?.toISOString() || null,
                            currentNextDueDate: nextPipeCleanDate ? nextPipeCleanDate.toISOString() : null,
                          });
                        }}
                        className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors">
                            ניקוי צנרת
                          </span>
                          <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center">
                            <Edit2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="text-xs pt-1 border-t border-sky-900/20">
                          <span className={`font-bold ${getDueDateColorClass(nextPipeCleanDate)}`}>
                            {formatNextDueDaysOnly(nextPipeCleanDate)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Task 5: החלפת פילטר */}
                    {sectionId === "filter-replace" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openItemModal({
                            id: "filter-replace",
                            title: "החלפת פילטר (סנן חדש)",
                            subtitle: "סימון התקנת פילטר חדש, קביעת תדירות החלפה ומועד הבא",
                            icon: RefreshCw,
                            type: "task",
                            taskId: filterReplaceTask?.id,
                            taskCategory: "CUSTOM",
                            defaultFreqDays: 180,
                            currentFreqDays: filterReplaceTask?.frequencyDays || 180,
                            currentLastDoneDate: lastFilterReplaceDate?.toISOString() || null,
                            currentNextDueDate: nextFilterReplaceDate ? nextFilterReplaceDate.toISOString() : null,
                          });
                        }}
                        className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors">
                            החלפת פילטר (סנן חדש)
                          </span>
                          <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center">
                            <Edit2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="text-xs pt-1 border-t border-sky-900/20">
                          <span className={`font-bold ${getDueDateColorClass(nextFilterReplaceDate)}`}>
                            {formatNextDueDaysOnly(nextFilterReplaceDate)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Task 6+: שגרות מותאמות אישית */}
                    {sectionId === "custom-routines" && customTasks.length > 0 && (
                      <div className="space-y-3 pt-1 border-t border-sky-900/20">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>שגרות מותאמות אישית:</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {customTasks.map((t: any) => {
                            const lastDate = t.lastDoneDate ? new Date(t.lastDoneDate) : null;
                            const nextDate = lastDate
                              ? (t.nextDueDate ? new Date(t.nextDueDate) : new Date(lastDate.getTime() + (t.frequencyDays || 7) * 24 * 3600 * 1000))
                              : (t.nextDueDate ? new Date(t.nextDueDate) : null);

                            return (
                              <div
                                key={t.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openItemModal({
                                    id: `custom-task-${t.id}`,
                                    title: t.title,
                                    subtitle: "שגרת תחזוקת מתקן מותאמת אישית",
                                    icon: Wrench,
                                    type: "task",
                                    taskId: t.id,
                                    isCustom: true,
                                    taskCategory: t.category || "JACUZZI_MAINTENANCE",
                                    defaultFreqDays: t.frequencyDays || 7,
                                    currentFreqDays: t.frequencyDays || 7,
                                    currentLastDoneDate: lastDate?.toISOString() || null,
                                    currentNextDueDate: nextDate ? nextDate.toISOString() : null,
                                  });
                                }}
                                className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors truncate">
                                    {t.title}
                                  </span>
                                  <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center shrink-0">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                                <div className="text-xs pt-1 border-t border-sky-900/20">
                                  <span className={`font-bold ${getDueDateColorClass(nextDate)}`}>
                                    {formatNextDueDaysOnly(nextDate)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
              <span className="text-sky-300 font-bold">2 מתוך 4 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 2: תחזוקת מים (הגדרות מקלון מעל + איכות מים קודם + שגרת טיפולים ותוספות תחתיו)
      // -------------------------------------------------------------
      // CARD 2: תחזוקת מים (סידור דינמי וגרירה לאורך הכרטיס)
      // -------------------------------------------------------------
      case 2:
        return (
          <div
            onClick={() => setOpenPageId("water-maintenance")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40 h-full flex flex-col justify-between min-h-[580px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    תחזוקת מים
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {JSON.stringify(card2Order) !== JSON.stringify(DEFAULT_CARD_2_ORDER) && (
                  <button
                    type="button"
                    onClick={(e) => handleResetCardOrder(2, e)}
                    className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-sky-950 text-slate-400 hover:text-sky-300 border border-slate-800 text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                    title="אפס לסדר ברירת המחדל"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">אפס סדר</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPageId("water-tests-new");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>הזן בדיקת מקלון</span>
                </button>
              </div>
            </div>

            {/* Reorderable Content Sections for Card 2 */}
            <div className="space-y-4 flex-1">
              {card2Order.map((sectionId, index) => {
                const isDragOver = dragOverIndex === index && draggedSectionInfo?.cardIndex === 2;
                const isItemDragging = draggedSectionInfo?.cardIndex === 2 && draggedSectionInfo?.index === index;

                return (
                  <div
                    key={sectionId}
                    data-reorder-index={index}
                    draggable
                    onDragStart={(e) => onDragStartSection(2, sectionId, index, e)}
                    onDragOver={(e) => onDragOverSection(2, index, e)}
                    onDrop={(e) => onDropSection(2, index, e)}
                    onTouchStart={(e) => onTouchStartSection(2, index, e)}
                    onTouchMove={(e) => onTouchMoveSection(2, e)}
                    onTouchEnd={(e) => onTouchEndSection(2, e)}
                    className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${
                      isDragOver ? "border-t-2 border-sky-400 pt-1 scale-[1.01]" : ""
                    } ${isItemDragging ? "opacity-40 scale-95 ring-2 ring-sky-500/50 rounded-2xl" : ""}`}
                  >

                    {/* Section 1: מצב איכות המים */}
                    {sectionId === "water-quality" && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-xs text-slate-300 font-semibold">
                            {latestWaterLog
                              ? `בדיקה אחרונה: ${new Date(latestWaterLog.testedAt).toLocaleDateString("he-IL")}`
                              : "טרם בוצעה בדיקת מים"}
                          </span>
                        </div>

                        {latestWaterLog ? (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenPageId("water-tests");
                                }}
                                className="bg-[#080e14]/90 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center flex items-center justify-center min-h-[48px] cursor-pointer"
                              >
                                <span className="text-xs sm:text-sm font-bold text-white">חומציות (pH)</span>
                              </div>

                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenPageId("water-tests");
                                }}
                                className="bg-[#080e14]/90 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center flex items-center justify-center min-h-[48px] cursor-pointer"
                              >
                                <span className="text-xs sm:text-sm font-bold text-white">כלור / חיטוי</span>
                              </div>

                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenPageId("water-tests");
                                }}
                                className="bg-[#080e14]/90 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center flex items-center justify-center min-h-[48px] cursor-pointer"
                              >
                                <span className="text-xs sm:text-sm font-bold text-white">בסיסיות כוללת (TA)</span>
                              </div>

                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openClarityOdorModal();
                                }}
                                className="bg-[#080e14]/90 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center flex items-center justify-center min-h-[48px] cursor-pointer"
                              >
                                <span className="text-xs sm:text-sm font-bold text-white">צלילות ומראה</span>
                              </div>
                            </div>

                            {/* סכנות של מדדים שאינם תקינים */}
                            {latestAbnormalRisks.length > 0 ? (
                              <div className="bg-[#180e14]/95 border border-rose-900/60 rounded-2xl p-3.5 space-y-2 text-xs text-right shadow-lg">
                                <div className="text-rose-400 font-bold text-xs">
                                  <span>סכנות של מדדים שאינם תקינים:</span>
                                </div>

                                <div className="space-y-1.5 pt-1 border-t border-rose-900/30">
                                  {latestAbnormalRisks.map((risk, idx) => (
                                    <div key={idx} className="leading-relaxed text-slate-200 text-[11px]">
                                      <span className="text-rose-300 font-bold">• {risk.name} ({risk.statusLabel}):</span>{" "}
                                      <span className="text-slate-300">{risk.risk}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-[#080e14]/90 p-2.5 rounded-xl border border-emerald-900/30 text-[11px] text-emerald-300">
                                <span className="font-bold">כל המדדים שנבדקו נמצאים בטווח האידיאלי והמים מאוזנים לחלוטין ✓</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPageId("water-tests-new");
                            }}
                            className="p-4 rounded-2xl bg-[#080e14]/90 hover:bg-sky-950/40 border border-sky-900/30 hover:border-sky-500/60 text-center text-slate-300 hover:text-sky-300 text-xs transition-all cursor-pointer font-medium"
                          >
                            טרם תועדה בדיקת מים במערכת (לחץ כאן להזנת תוצאות בדיקת מקלון)
                          </div>
                        )}

                        {/* 🌟 נראות וריח */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            openClarityOdorModal();
                          }}
                          className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/clarity"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white group-hover/clarity:text-sky-300 transition-colors">
                              נראות וריח
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            <span className="text-[11px] font-bold bg-sky-950/90 text-sky-200 border border-sky-800/70 px-2.5 py-1 rounded-xl flex items-center gap-1">
                              <span>{getClarityDisplay(latestWaterLog?.waterClarity).icon}</span>
                              <span>צלילות: {getClarityDisplay(latestWaterLog?.waterClarity).label}</span>
                            </span>
                            <span className="text-[11px] font-bold bg-sky-950/90 text-sky-200 border border-sky-800/70 px-2.5 py-1 rounded-xl flex items-center gap-1">
                              <span>{getOdorDisplay(latestWaterLog?.waterOdor).label ? getOdorDisplay(latestWaterLog?.waterOdor).icon : "👃"}</span>
                              <span>ריח: {getOdorDisplay(latestWaterLog?.waterOdor).label}</span>
                            </span>
                          </div>

                          {(latestWaterLog?.clarityOdorNotes || latestWaterLog?.description) && (
                            <div className="text-[11px] text-slate-300 bg-sky-950/50 p-2.5 rounded-xl border border-sky-900/40 flex items-start gap-1.5">
                              <span className="text-sky-400 font-bold shrink-0">הערות:</span>
                              <span className="leading-snug text-slate-200">{latestWaterLog?.clarityOdorNotes || latestWaterLog?.description}</span>
                            </div>
                          )}
                        </div>

                        {/* כפתור היסטוריית בדיקות */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPageId("water-tests");
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-sky-950/70 hover:bg-sky-900/90 border border-sky-800/60 hover:border-sky-500/80 text-sky-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                        >
                          <History className="w-3.5 h-3.5 text-sky-400" />
                          <span>היסטוריית בדיקות איכות המים</span>
                          <ChevronLeft className="w-3.5 h-3.5 opacity-60 mr-auto" />
                        </button>
                      </div>
                    )}

                    {/* Section 2: גיל המים הנוכחי */}
                    {sectionId === "water-age" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPageId("settings");
                        }}
                        className="bg-[#080e14]/90 hover:bg-sky-950/40 px-3.5 py-2.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 transition-all flex items-center justify-between text-xs cursor-pointer group/age"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 group-hover/age:text-white transition-colors">
                            גיל המים הנוכחי:{" "}
                            <strong className="text-white">
                              {daysSinceRefill !== null ? `${daysSinceRefill} ימים` : "ממתין למילוי ראשון"}
                            </strong>
                          </span>
                        </div>
                        <span className="text-[11px] text-sky-300/90 font-medium">
                          {daysUntilNextRefill !== null ? `ריקון מלא בעוד ${daysUntilNextRefill} יום` : "ללא תאריך יעד"}
                        </span>
                      </div>
                    )}

                    {/* Section 3: הגדרות מקלון בדיקה */}
                    {sectionId === "strip-settings" && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalSelectedParams([...activeParamIds]);
                          openItemModal({
                            id: "test-strip-settings",
                            title: "הגדרות מקלון בדיקה",
                            subtitle: "בחירת המדדים הפעילים שברשותך בערכת הבדיקה",
                            icon: Sliders,
                            type: "strip-settings",
                            defaultFreqDays: 0,
                            currentFreqDays: 0,
                            currentLastDoneDate: null,
                            currentNextDueDate: null,
                          });
                        }}
                        className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/strip"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white group-hover/strip:text-sky-300 transition-colors">
                            מקלון בדיקה:
                          </span>
                          <span className="text-[11px] text-sky-300/80 flex items-center gap-1 font-bold bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-800/40 group-hover/strip:border-sky-500/60 transition-colors">
                            <Settings className="w-3 h-3 text-sky-400" />
                            <span>ערוך מקלון</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {activeParamIds.map((paramId) => (
                            <span
                              key={paramId}
                              className="text-[11px] font-mono font-bold bg-sky-950/90 text-sky-200 border border-sky-800/60 px-2.5 py-0.5 rounded-lg"
                            >
                              {getShortParamLabel(paramId)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 4: שגרת טיפולי מים */}
                    {sectionId === "scheduled-treatments" && (
                      <div className="space-y-3 pt-1 border-t border-sky-900/20">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>שגרת טיפולי מים:</span>
                        </div>

                        {/* List of Water Treatments */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Item 1: בדיקת איכות מים */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              openItemModal({
                                id: "water-test",
                                title: "הגדרת תדירות בדיקת איכות מים",
                                subtitle: "קביעת מרווח הזמן הרצוי לביצוע בדיקת מקלון (בימים)",
                                icon: FlaskConical,
                                type: "water-test",
                                taskId: waterTestTask?.id,
                                taskCategory: "WEEKLY",
                                defaultFreqDays: 3,
                                currentFreqDays: waterTestFreqDays,
                                currentLastDoneDate: lastWaterTestDate?.toISOString() || null,
                                currentNextDueDate: nextWaterTestDate ? nextWaterTestDate.toISOString() : null,
                              });
                            }}
                            className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors">
                                בדיקת איכות מים (מקלון)
                              </span>
                              <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center">
                                <Edit2 className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="text-xs pt-1 border-t border-sky-900/20">
                              <span className={`font-bold ${getDueDateColorClass(nextWaterTestDate)}`}>
                                {formatNextDueDaysOnly(nextWaterTestDate)}
                              </span>
                            </div>
                          </div>

                          {/* Item 2: חיטוי שבועי */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              openItemModal({
                                id: "sanitizer-shock",
                                title: "חיטוי שבועי",
                                subtitle: "סימון ביצוע חיטוי שבועי, גריעת מלאי מהארון ושליטה בתדירות",
                                icon: ShieldCheck,
                                type: "task",
                                taskId: sanitizerTask?.id,
                                taskCategory: "WEEKLY",
                                defaultFreqDays: 7,
                                currentFreqDays: sanitizerTask?.frequencyDays || 7,
                                currentLastDoneDate: lastSanitizerDate?.toISOString() || null,
                                currentNextDueDate: nextSanitizerDate ? nextSanitizerDate.toISOString() : null,
                              });
                            }}
                            className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors">
                                חיטוי שבועי
                              </span>
                              <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center">
                                <Edit2 className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="text-xs pt-1 border-t border-sky-900/20">
                              <span className={`font-bold ${getDueDateColorClass(nextSanitizerDate)}`}>
                                {formatNextDueDaysOnly(nextSanitizerDate)}
                              </span>
                            </div>
                          </div>

                          {/* Item 3: החלפת מים חלקית (אחוז דינמי לפי ביצוע אחרון) */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              openItemModal({
                                id: "partial-refill",
                                title: `החלפת מים חלקית (${latestPartialPercent}%)`,
                                subtitle: "רישום החלפת 25%-50% מים, שקלול גיל המים וקביעת תדירות",
                                icon: Waves,
                                type: "refill",
                                defaultFreqDays: 30,
                                currentFreqDays: 30,
                                currentLastDoneDate: lastPartialRefillDate?.toISOString() || null,
                                currentNextDueDate: nextPartialRefillDate ? nextPartialRefillDate.toISOString() : null,
                              });
                            }}
                            className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-white text-base sm:text-lg group-hover/item:text-sky-300 transition-colors">
                                החלפת מים חלקית ({latestPartialPercent}%)
                              </span>
                              <span className="p-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white transition-all shadow-sm group-hover/item:border-sky-500/80 flex items-center justify-center">
                                <Edit2 className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="text-xs pt-1 border-t border-sky-900/20">
                              <span className={`font-bold ${getDueDateColorClass(nextPartialRefillDate)}`}>
                                {formatNextDueDaysOnly(nextPartialRefillDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
              <span className="text-sky-300 font-bold">3 מתוך 4 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 3: כימיקלים (היסטוריית כל החומרים שהוספו לג'קוזי לאורך הזמן)
      // -------------------------------------------------------------
      case 3:
      default:
        return (
          <div
            onClick={() => setOpenPageId("inventory")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40 h-full flex flex-col justify-between min-h-[580px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <FlaskConical className="w-6 h-6 text-sky-300" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    כימיקלים
                  </h2>
                  <p className="text-xs text-slate-300">
                    היסטוריית תוספות חומרים לג'קוזי ({allAddedChemicalsList.length} תיעודים)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "adhoc-chemical",
                    title: "רישום תוספת חומר לג'קוזי",
                    subtitle: "בחירת חומר מהארון, גריעת כמות ותיעוד הוספה למים",
                    icon: Beaker,
                    type: "adhoc-chemical",
                    defaultFreqDays: 0,
                    currentFreqDays: 0,
                    currentLastDoneDate: new Date().toISOString(),
                    currentNextDueDate: null,
                  });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>הוסף חומר לג&apos;קוזי</span>
              </button>
            </div>

            {/* Body: 15 items list with pagination */}
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              {displayedChemicals.length > 0 ? (
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
                  {displayedChemicals.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between text-xs bg-sky-950/40 hover:bg-sky-950/70 px-3.5 py-2 rounded-xl border border-sky-900/30 transition-colors"
                    >
                      <span className="font-bold text-white truncate max-w-[220px] sm:max-w-sm flex items-center gap-1.5">
                        <span className="text-cyan-400">🧪</span>
                        <span>{item.title}</span>
                      </span>
                      <div className="text-left shrink-0">
                        <span className="text-slate-300 text-[11px] font-medium block">
                          {item.formattedDate}
                        </span>
                        <span className="text-emerald-400 text-[10px] block">
                          {item.relativeDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#080e14]/60 rounded-2xl border border-sky-900/20">
                  <div className="w-12 h-12 rounded-full bg-sky-950/60 border border-sky-800/40 flex items-center justify-center text-sky-400">
                    <FlaskConical className="w-6 h-6 opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">לא תועדו עדיין חומרים שנוספו לג&apos;קוזי</p>
                    <p className="text-xs text-slate-400">
                      לחץ על &quot;הוסף חומר לג&apos;קוזי&quot; למעלה כדי לרשום חומר שהוספת למים ולגרוע מהמלאי
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination Controls (15 items per page) */}
              {totalChemicalPages > 1 && (
                <div
                  className="flex items-center justify-between pt-2 border-t border-sky-900/30 text-xs mt-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={validChemicalsPage === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setChemicalsPage((p) => Math.max(0, p - 1));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-200 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer font-bold transition-all text-xs"
                    title="15 הקודמים"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>15 הקודמים</span>
                  </button>

                  <span className="text-slate-300 font-semibold text-[11px]">
                    עמוד {validChemicalsPage + 1} מתוך {totalChemicalPages} ({allAddedChemicalsList.length} סה"כ)
                  </span>

                  <button
                    type="button"
                    disabled={validChemicalsPage >= totalChemicalPages - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      setChemicalsPage((p) => Math.min(totalChemicalPages - 1, p + 1));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-200 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer font-bold transition-all text-xs"
                    title="15 הבאים"
                  >
                    <span>15 הבאים</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
              <span className="text-sky-300 font-bold">4 מתוך 4 ◂</span>
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
      {/* 🌟 Top Navigation: Pagination Dots Indicator */}
      <div className="flex items-center justify-center gap-3 bg-[#0e1823]/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-sky-900/40 shadow-md w-fit mx-auto" dir="rtl">
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
          {/* Slide 0: Next Card (revealed when dragging right) */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1 flex flex-col h-full" dir="rtl">
            {renderCard(nextIdx)}
          </div>

          {/* Slide 1: Current Card */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1 flex flex-col h-full" dir="rtl">
            {renderCard(currIdx)}
          </div>

          {/* Slide 2: Previous Card (revealed when dragging left) */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1 flex flex-col h-full" dir="rtl">
            {renderCard(prevIdx)}
          </div>
        </div>
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
            {(activeItemModal.type === "task" || activeItemModal.id === "full-refill" || activeItemModal.id === "partial-refill" || activeItemModal.type === "adhoc-chemical") && activeItemModal.id !== "water-test" && activeItemModal.type !== "water-test" && (
              <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-3">
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">תאריך ביצוע הפעולה:</label>
                    <input
                      type="date"
                      value={actionDoneDate}
                      onChange={(e) => setActionDoneDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Ad-Hoc Chemical Selection */}
                  {activeItemModal.type === "adhoc-chemical" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">בחר חומר מהארון:</label>
                          <select
                            value={selectedChemId}
                            onChange={(e) => setSelectedChemId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                          >
                            {chemicals.map((c: any) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (נותרו {c.quantity} {c.unit || "גרם"})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">כמות שהוספה:</label>
                          <input
                            type="number"
                            placeholder="כמות (לדוגמה: 30)"
                            value={chemDeductQty}
                            onChange={(e) => setChemDeductQty(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">הערות / סיבת ההוספה:</label>
                        <input
                          type="text"
                          placeholder="למשל: טיפול להורדת pH לאחר מילוי, מסיר קצף וכו'"
                          value={adhocNotes}
                          onChange={(e) => setAdhocNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  )}

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

                  {/* Chemical Selection if Sanitizer */}
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
                    <span>
                      {activeItemModal.type === "adhoc-chemical"
                        ? "שמור הוספת חומר יזומה ביומן"
                        : "סמן כבוצע עכשיו ועדכן מועד הבא"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 🧪 SECTION: הגדרת תדירות בדיקת איכות מים בלבד */}
            {(activeItemModal.id === "water-test" || activeItemModal.type === "water-test") && (
              <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-3">
                <span className="font-bold text-xs sm:text-sm text-sky-200 block">
                  תדירות בדיקת איכות מים
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[3, 7, 14, 30, 90, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditFreqDays(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editFreqDays === d
                          ? "bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-950/80 scale-[1.02]"
                          : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                      }`}
                    >
                      {d} ימים
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={modalSaving}
                  onClick={handleSaveModalSettings}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  {modalSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>שמור תדירות בדיקה (כל {editFreqDays} ימים)</span>
                </button>
              </div>
            )}

            {/* 🧪 SECTION: הגדרות מקלון בדיקה (בתוך תחזוקת מים) */}
            {(activeItemModal.type === "strip-settings" || activeItemModal.id === "test-strip-settings") && (
              <div className="space-y-4">
                {/* Top Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-900/40 pb-3">
                  <span className="text-xs font-bold text-sky-300">
                    {modalSelectedParams.length} מדדים נבחרו לבדיקה
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalSelectedParams(ALL_TEST_STRIP_PARAMS.map((p) => p.id))}
                      className="text-[11px] px-3 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 font-bold rounded-lg border border-sky-800/80 transition-colors cursor-pointer"
                    >
                      בחר הכל ({ALL_TEST_STRIP_PARAMS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalSelectedParams(DEFAULT_TEST_STRIP_PARAM_IDS)}
                      className="text-[11px] px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      ברירת מחדל (3 מדדים)
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-800/40 text-xs text-sky-200/90 leading-relaxed">
                  סמן את המדדים הנמדדים במקלון או בערכת הבדיקה שלך. המדדים המסומנים יופיעו ישירות בכרטיסיית תחזוקת מים ובדוחות האיזון והסכנות.
                </div>

                {/* Categorized List */}
                <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                  {PARAM_CATEGORIES.map((catName) => {
                    const catParams = ALL_TEST_STRIP_PARAMS.filter((p) => p.category === catName);
                    const selectedInCat = catParams.filter((p) => modalSelectedParams.includes(p.id)).length;

                    return (
                      <div key={catName} className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-sky-900/30 pb-1.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                            <span>{catName}</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 font-semibold border border-sky-800/60">
                            {selectedInCat} / {catParams.length} פעילים
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {catParams.map((param) => {
                            const isSelected = modalSelectedParams.includes(param.id);

                            return (
                              <div
                                key={param.id}
                                onClick={() => {
                                  setModalSelectedParams((prev) => {
                                    const next = prev.includes(param.id)
                                      ? prev.filter((p) => p !== param.id)
                                      : [...prev, param.id];
                                    if (next.length === 0) return prev;
                                    return next;
                                  });
                                }}
                                className={`p-3 rounded-2xl border cursor-pointer transition-all select-none flex items-start gap-3 ${
                                  isSelected
                                    ? "bg-sky-950/40 border-sky-500/60 shadow-sm"
                                    : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-85"
                                }`}
                              >
                                <div className="pt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer pointer-events-none"
                                  />
                                </div>

                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className={`font-bold text-xs sm:text-sm ${isSelected ? "text-white" : "text-slate-400"}`}>
                                      {param.nameHe} ({param.enName})
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-sky-300 font-semibold shrink-0">
                                      יעד: {param.idealRange}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-tight">
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

                {/* Save Button */}
                <button
                  type="button"
                  disabled={modalSaving}
                  onClick={handleSaveModalSettings}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  {modalSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>שמור הגדרות מקלון ({modalSelectedParams.length} מדדים פעילים)</span>
                </button>
              </div>
            )}

            {/* SECTION 2: שליטה בתדירות ובתאריכים (עבור פעולות מחזוריות) */}
            {activeItemModal.type !== "adhoc-chemical" && activeItemModal.type !== "strip-settings" && activeItemModal.id !== "test-strip-settings" && activeItemModal.id !== "water-test" && activeItemModal.type !== "water-test" && (
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
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[3, 7, 14, 30, 90, 180].map((d) => (
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
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            editFreqDays === d
                              ? "bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-950/80 scale-[1.02]"
                              : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                          }`}
                        >
                          {d} ימים
                        </button>
                      ))}
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

                {activeItemModal.isCustom && activeItemModal.taskId && (
                  <button
                    type="button"
                    disabled={modalSaving}
                    onClick={() => handleDeleteCustomRoutine(activeItemModal.taskId)}
                    className="w-full py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-800/60 text-red-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>מחק שגרה מותאמת אישית זו</span>
                  </button>
                )}
              </div>
            )}

            {/* Footer Close */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="px-4 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 New Custom Routine Creation Modal */}
      {isCreateRoutineModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsCreateRoutineModalOpen(false)}
        >
          <div
            className="bg-[#0e1823] border border-sky-800/80 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-sky-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-800 flex items-center justify-center text-sky-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">הוספת שגרת מתקן חדשה</h3>
                  <p className="text-xs text-sky-300/80">הגדרת משימת תחזוקת מתקן מחזורית מותאמת אישית</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateRoutineModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Routine Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  שם השגרה / הפעולה: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="לדוגמה: ניקוי כיסוי, בדיקת משאבה, בדיקת ג'טים, טיפול באבנית..."
                  value={newRoutineTitle}
                  onChange={(e) => setNewRoutineTitle(e.target.value)}
                  className="w-full bg-[#080e14] border border-sky-900/60 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  תדירות חזרה:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[3, 7, 14, 30, 90, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setNewRoutineFreqDays(d);
                        if (newRoutineLastDoneDate) {
                          const next = new Date(new Date(newRoutineLastDoneDate).getTime() + d * 24 * 3600 * 1000);
                          setNewRoutineNextDueDate(next.toISOString().split("T")[0]);
                        }
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newRoutineFreqDays === d
                          ? "bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-950/80 scale-[1.02]"
                          : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                      }`}
                    >
                      {d} ימים
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">תאריך ביצוע אחרון (אופציונלי):</label>
                  <input
                    type="date"
                    value={newRoutineLastDoneDate}
                    onChange={(e) => {
                      setNewRoutineLastDoneDate(e.target.value);
                      if (e.target.value && newRoutineFreqDays) {
                        const next = new Date(new Date(e.target.value).getTime() + newRoutineFreqDays * 24 * 3600 * 1000);
                        setNewRoutineNextDueDate(next.toISOString().split("T")[0]);
                      }
                    }}
                    className="w-full bg-[#080e14] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">תאריך ביצוע ראשון / הבא:</label>
                  <input
                    type="date"
                    value={newRoutineNextDueDate}
                    onChange={(e) => setNewRoutineNextDueDate(e.target.value)}
                    className="w-full bg-[#080e14] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={newRoutineSaving || !newRoutineTitle.trim()}
                onClick={handleCreateRoutine}
                className="w-full py-3 rounded-xl bg-sky-700 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                {newRoutineSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>צור שגרה חדשה</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Clarity & Odor Edit Modal */}
      {isClarityOdorModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsClarityOdorModalOpen(false);
          }}
        >
          <div
            className="bg-[#0e1823] border border-sky-800/80 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-right relative overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sky-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-300">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">צלילות, עכירות וריח המים</h3>
                  <p className="text-xs text-slate-300">תיעוד מראה המים, ריח והערות חופשיות</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClarityOdorModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clarity Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>צלילות ועכירות המים:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLARITY_OPTIONS.map((c) => {
                  const isSelected = editClarity === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setEditClarity(c.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-sky-950/90 border-sky-400 shadow-md ring-1 ring-sky-400"
                          : "bg-[#080e14]/90 border-sky-900/40 hover:border-sky-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{c.icon}</span>
                        <span className={isSelected ? "text-sky-300 font-bold" : ""}>{c.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight">{c.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Odor Selection */}
            <div className="space-y-2 pt-2 border-t border-sky-900/30">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>ריח המים:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ODOR_OPTIONS.map((o) => {
                  const isSelected = editOdor === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setEditOdor(o.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-sky-950/90 border-sky-400 shadow-md ring-1 ring-sky-400"
                          : "bg-[#080e14]/90 border-sky-900/40 hover:border-sky-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{o.icon}</span>
                        <span className={isSelected ? "text-sky-300 font-bold" : ""}>{o.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight">{o.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free Notes Text Input */}
            <div className="space-y-1.5 pt-2 border-t border-sky-900/30">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                <span>הערות וטקסט חופשי (עכירות, תחושה, ריח וכו'):</span>
              </label>
              <textarea
                rows={3}
                value={editClarityOdorNotes}
                onChange={(e) => setEditClarityOdorNotes(e.target.value)}
                placeholder="הזן כאן פירוט חופשי על מצב המים, הערות מיוחדות, פעולות שבוצעו וכו'..."
                className="w-full bg-[#080e14] border border-sky-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
              />
            </div>

              {/* Submit Button */}
            <button
              type="button"
              disabled={savingClarityOdor}
              onClick={handleSaveClarityOdor}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {savingClarityOdor ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>שמור נתוני צלילות, ריח והערות</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 NEW USER WELCOME BLESSING MODAL                                       */}
      {/* ========================================================================= */}
      {showWelcomeBlessing && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
          dir="rtl"
        >
          <div
            className="bg-[#0e1823] border-2 border-sky-500/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-sky-950/60 space-y-6 text-right relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient background glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Blessing Title */}
            <div className="text-center space-y-2 pt-2 relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-sky-400 mx-auto flex items-center justify-center text-white text-2xl shadow-lg shadow-sky-500/30 border border-white/20">
                🌊
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ברוך הבא לג&apos;קוזי מאסטר! ✨
              </h2>
              <p className="text-sky-300 font-semibold text-xs sm:text-sm">
                מזל טוב על ההצטרפות! המערכת החכמה לשמירה על ג&apos;קוזי צלול, נקי ובטוח
              </p>
            </div>

            {/* Blessing Body */}
            <div className="bg-[#080e14]/90 p-4 sm:p-5 rounded-2xl border border-sky-900/50 space-y-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed relative z-10">
              <p className="font-medium text-sky-100">
                אנו מברכים אותך ומאחלים לך חוויית שימוש מושלמת ומרגיעה תמיד! 🥂
              </p>
              <div className="space-y-2.5 text-xs text-slate-300 pt-1 border-t border-sky-900/30">
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold shrink-0">📊</span>
                  <span><strong>לוח בקרה וסטטוס:</strong> תמונת מצב חיה של איכות המים, גיל המים, משימות דחופות והתראות בזמן אמת.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold shrink-0">🛠️</span>
                  <span><strong>תחזוקת מתקן:</strong> שגרות טיפול בציוד – שטיפת פילטרים, ניקוי קו מים, אוורור כיסוי, ניקוי צנרת והחלפת סננים.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold shrink-0">💧</span>
                  <span><strong>איכות מים ובדיקות:</strong> הזנת תוצאות בדיקת מקלון ובדיקות חושיות, הנחיות מינון ולוח זמנים לחיטוי שוטף.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold shrink-0">🧪</span>
                  <span><strong>כימיקלים ומלאי:</strong> מעקב היסטורי אחר כל החומרים שנוספו לג&apos;קוזי, שליטה מלאה על ארון החומרים והתראות מלאי.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold shrink-0">🤖</span>
                  <span><strong>ניתוח AI וסיכום כולל:</strong> בדיקת כל נתוני המערכת (איכות מים, תחזוקה וארון חומרים), הפקת סיכום מקיף, אבחון תקלות והתראות חכמות.</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="relative z-10">
              <button
                type="button"
                onClick={handleDismissWelcome}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-600 hover:from-sky-400 hover:to-cyan-400 text-white font-black text-sm sm:text-base shadow-xl shadow-sky-600/30 transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>בואו נתחיל! 🚀</span>
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 TAB ONBOARDING GUIDANCE MODAL (Triggered on first visit to a tab)      */}
      {/* ========================================================================= */}
      {activeTabGuide !== null && !showWelcomeBlessing && (
        <div
          className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
          dir="rtl"
          onClick={handleDismissTabGuide}
        >
          <div
            className="bg-[#0e1823] border border-sky-600/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 text-right relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const guide = TAB_GUIDE_DEFINITIONS.find((g) => g.tabIndex === activeTabGuide) || TAB_GUIDE_DEFINITIONS[0];
              const IconComp = guide.icon || Activity;

              return (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-sky-900/40 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-sky-950/90 border border-sky-500/60 flex items-center justify-center text-sky-300 shadow-inner">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                          הסבר ללשונית {activeTabGuide + 1} מתוך 4
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                          {guide.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">{guide.subtitle}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDismissTabGuide}
                      className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* General Purpose */}
                  <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/40 text-xs text-slate-200 leading-relaxed">
                    <span className="text-sky-300 font-bold block mb-1">למה נועדה לשונית זו?</span>
                    <p>{guide.description}</p>
                  </div>

                  {/* Core Capabilities */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>יכולות מרכזיות בלשונית זו:</span>
                    </span>

                    <div className="space-y-2">
                      {guide.tips.map((tip, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#080e14]/70 border border-sky-900/30 flex items-start gap-2 text-xs text-slate-300 leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    onClick={handleDismissTabGuide}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>הבנתי, תודה! 👍</span>
                  </button>
                </>
              );
            })()}
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
