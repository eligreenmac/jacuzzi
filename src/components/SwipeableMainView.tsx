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
  Plus,
  Beaker,
  Activity,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import WaterTestsPage, { getGenericDomain, extractParamValue } from "@/app/water-tests/page";
import CalendarPage from "@/app/calendar/page";
import InventoryPage from "@/app/inventory/page";
import SettingsPage from "@/app/settings/page";
import { ALL_PARAMS_WITH_CLARITY, ALL_TEST_STRIP_PARAMS, DEFAULT_TEST_STRIP_PARAM_IDS, PARAM_CATEGORIES } from "@/lib/test-strip-params";

export const CARD_TABS = [
  { id: "status", title: "סטטוס", subtitle: "משימות ל-7 ימים, איכות מים, סכנות והזמנת חומרים", icon: Activity },
  { id: "water-maintenance", title: "תחזוקת מים", subtitle: "הגדרות מקלון, מצב איכות מים, שגרת טיפולים ותוספות חומרים", icon: Droplets },
  { id: "jacuzzi-maintenance", title: "תחזוקת מתקן", subtitle: "שטיפת פילטר, ניקוי דפנות, מכסה, צנרת והחלפת פילטר", icon: Wrench },
];

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

  // 🌟 New Custom Routine Modal State
  const [isCreateRoutineModalOpen, setIsCreateRoutineModalOpen] = useState(false);
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [newRoutineCategory, setNewRoutineCategory] = useState<"WATER" | "JACUZZI">("WATER");
  const [newRoutineFreqDays, setNewRoutineFreqDays] = useState<number>(7);
  const [newRoutineLastDoneDate, setNewRoutineLastDoneDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newRoutineNextDueDate, setNewRoutineNextDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [newRoutineSaving, setNewRoutineSaving] = useState(false);

  const openCreateRoutineModal = (initialCat: "WATER" | "JACUZZI" = "WATER") => {
    setNewRoutineTitle("");
    setNewRoutineCategory(initialCat);
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
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRoutineTitle.trim(),
          category: newRoutineCategory === "WATER" ? "WATER_MAINTENANCE" : "JACUZZI_MAINTENANCE",
          frequencyDays: newRoutineFreqDays,
          lastDoneDate: newRoutineLastDoneDate ? new Date(newRoutineLastDoneDate) : null,
          nextDueDate: newRoutineNextDueDate ? new Date(newRoutineNextDueDate) : new Date(Date.now() + newRoutineFreqDays * 24 * 3600 * 1000),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "שגיאה ביצירת שגרה");
      }
      setIsCreateRoutineModalOpen(false);
      await loadSummaryData();
    } catch (err: any) {
      alert(err.message || "שגיאה ביצירת שגרה");
    } finally {
      setNewRoutineSaving(false);
    }
  };

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
    setSelectedChemId(chemicals.length > 0 ? chemicals[0].id : "");
    setChemDeductQty("");
    setAdhocNotes("");
    setRefillPercent(modalData.id === "partial-refill" ? (parseInt(latestPartialPercent, 10) || 50) : 50);
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
  const waterTestTask = tasks.find((t: any) =>
    t.title?.includes("בדיקת איכות מים") || t.title?.includes("בדיקת מים") || t.title?.includes("מקלון")
  );
  const waterTestFreqDays = waterTestTask?.frequencyDays || 3;
  const lastWaterTestDate = latestWaterLog?.testedAt
    ? new Date(latestWaterLog.testedAt)
    : waterTestTask?.lastDoneDate
    ? new Date(waterTestTask.lastDoneDate)
    : null;
  const nextWaterTestDate = waterTestTask?.nextDueDate
    ? new Date(waterTestTask.nextDueDate)
    : lastWaterTestDate
    ? new Date(lastWaterTestDate.getTime() + waterTestFreqDays * 24 * 3600 * 1000)
    : new Date();

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
  const nextSanitizerDate = sanitizerTask?.nextDueDate
    ? new Date(sanitizerTask.nextDueDate)
    : lastSanitizerDate
    ? new Date(lastSanitizerDate.getTime() + (sanitizerTask?.frequencyDays || 7) * 24 * 3600 * 1000)
    : new Date(Date.now() + 2 * 24 * 3600 * 1000);

  // 3. Partial Refill Dates & Percentage
  const partialDiary = diaryEntries.find((d: any) => {
    const t = `${d.title || ""} ${d.content || ""}`.toLowerCase();
    return (t.includes("החלפ") || t.includes("ריענון") || t.includes("חלקית") || t.includes("חצי מים")) && t.includes("מים") && !t.includes("100%");
  });
  const lastPartialRefillDate = partialDiary ? new Date(partialDiary.entryDate || partialDiary.createdAt) : null;
  const nextPartialRefillDate = lastPartialRefillDate
    ? new Date(lastPartialRefillDate.getTime() + 30 * 24 * 3600 * 1000)
    : new Date(Date.now() + 14 * 24 * 3600 * 1000);

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
  const lastFullRefillDate = jacuzzi?.lastRefillDate ? new Date(jacuzzi.lastRefillDate) : new Date();
  const daysSinceRefill = Math.max(0, Math.floor((Date.now() - lastFullRefillDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilNextRefill = Math.max(0, 90 - daysSinceRefill);
  const nextFullRefillDate = new Date(lastFullRefillDate.getTime() + 90 * 24 * 3600 * 1000);

  // 5. Actual Chemicals Added to Jacuzzi Water (ללא תאריך הבא!)
  const itemsFromInventory = chemicals
    .filter((c: any) => c.lastUsedDate && c.lastUsedAmount && c.lastUsedAmount > 0)
    .map((c: any) => ({
      id: `chem-${c.id}`,
      title: `${c.name}: ${c.lastUsedAmount} ${c.unit || "גרם"}`,
      date: c.lastUsedDate,
      formattedDate: formatDateDisplay(c.lastUsedDate),
      relativeDate: getRelativeDaysDisplay(c.lastUsedDate, true),
    }));

  const itemsFromDiary = diaryEntries
    .filter((d: any) => {
      if (!d.chemicalsAdded) return false;
      const t = `${d.title || ""} ${d.content || ""}`.toLowerCase();
      if (t.includes("הזמנ") || t.includes("הגעת") || t.includes("קני") || t.includes("רכיש")) return false;
      return true;
    })
    .map((d: any) => ({
      id: `diary-${d.id}`,
      title: d.chemicalsAdded,
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

  const adHocChemicalList = Array.from(allAddedChemicalsMap.values())
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Jacuzzi Maintenance Dates
  // 6. Weekly Filter Rinse Dates
  const filterRinseTask = tasks.find((t: any) =>
    t.title?.includes("שטיפת פילטר") || (t.title?.includes("פילטר") && !t.title?.includes("השרי") && !t.title?.includes("החלפ"))
  );
  const lastFilterRinseDate = filterRinseTask?.lastDoneDate ? new Date(filterRinseTask.lastDoneDate) : null;
  const nextFilterRinseDate = filterRinseTask?.nextDueDate
    ? new Date(filterRinseTask.nextDueDate)
    : lastFilterRinseDate
    ? new Date(lastFilterRinseDate.getTime() + (filterRinseTask?.frequencyDays || 7) * 24 * 3600 * 1000)
    : new Date(Date.now() + 7 * 24 * 3600 * 1000);

  // 7. Waterline & Shell Cleaning Dates
  const waterlineTask = tasks.find((t: any) =>
    t.title?.includes("קו מים") || t.title?.includes("דפנ") || t.title?.includes("דופן")
  );
  const lastWaterlineDate = waterlineTask?.lastDoneDate ? new Date(waterlineTask.lastDoneDate) : null;
  const nextWaterlineDate = waterlineTask?.nextDueDate
    ? new Date(waterlineTask.nextDueDate)
    : lastWaterlineDate
    ? new Date(lastWaterlineDate.getTime() + (waterlineTask?.frequencyDays || 14) * 24 * 3600 * 1000)
    : new Date(Date.now() + 14 * 24 * 3600 * 1000);

  // 8. Cover Cleaning Dates
  const coverTask = tasks.find((t: any) =>
    t.title?.includes("כיסוי") || t.title?.includes("מכסה")
  );
  const lastCoverDate = coverTask?.lastDoneDate ? new Date(coverTask.lastDoneDate) : null;
  const nextCoverDate = coverTask?.nextDueDate
    ? new Date(coverTask.nextDueDate)
    : lastCoverDate
    ? new Date(lastCoverDate.getTime() + (coverTask?.frequencyDays || 30) * 24 * 3600 * 1000)
    : new Date(Date.now() + 21 * 24 * 3600 * 1000);

  // 9. Pipe Line Cleaning (ניקוי צנרת)
  const pipeCleanTask = tasks.find((t: any) =>
    t.title?.includes("צנרת") || t.title?.includes("פלאש") || t.title?.includes("Flush")
  );
  const lastPipeCleanDate = pipeCleanTask?.lastDoneDate
    ? new Date(pipeCleanTask.lastDoneDate)
    : jacuzzi?.lastDeepCleanDate
    ? new Date(jacuzzi.lastDeepCleanDate)
    : null;
  const nextPipeCleanDate = pipeCleanTask?.nextDueDate
    ? new Date(pipeCleanTask.nextDueDate)
    : lastPipeCleanDate
    ? new Date(lastPipeCleanDate.getTime() + (pipeCleanTask?.frequencyDays || 90) * 24 * 3600 * 1000)
    : new Date(Date.now() + 90 * 24 * 3600 * 1000);

  // 10. Filter Replacement (החלפת פילטר)
  const filterReplaceTask = tasks.find((t: any) =>
    t.title?.includes("החלפת פילטר") || (t.title?.includes("פילטר") && t.title?.includes("החלפ"))
  );
  const lastFilterReplaceDate = filterReplaceTask?.lastDoneDate ? new Date(filterReplaceTask.lastDoneDate) : null;
  const nextFilterReplaceDate = filterReplaceTask?.nextDueDate
    ? new Date(filterReplaceTask.nextDueDate)
    : lastFilterReplaceDate
    ? new Date(lastFilterReplaceDate.getTime() + (filterReplaceTask?.frequencyDays || 180) * 24 * 3600 * 1000)
    : new Date(Date.now() + 180 * 24 * 3600 * 1000);

  // Active Pending Tasks & Low Stock Chemicals
  const lowStockChems = chemicals.filter((c: any) => (c.quantity || 0) <= (c.minThreshold || 100));

  // Compute upcoming tasks in next 7 days for the Status Card
  const nowMs = Date.now();
  // Identify all custom routines created by the user
  const standardTaskIds = new Set([
    waterTestTask?.id,
    sanitizerTask?.id,
    filterRinseTask?.id,
    waterlineTask?.id,
    coverTask?.id,
    pipeCleanTask?.id,
    filterReplaceTask?.id,
  ].filter(Boolean));

  const customTasks = tasks.filter((t: any) => !standardTaskIds.has(t.id) && !t.isCompleted);

  // Group custom tasks into Water Maintenance vs Jacuzzi Equipment Maintenance
  const waterCustomTasks = customTasks.filter((t: any) =>
    t.category === "WATER_MAINTENANCE" || t.category === "WATER" ||
    t.title?.includes("מים") || t.title?.includes("כלור") || t.title?.includes("ברום") || t.title?.includes("חומצ") || t.title?.includes("בסיס") || t.title?.includes("מלח") || t.title?.includes("חיטוי")
  );

  const jacuzziCustomTasks = customTasks.filter((t: any) => !waterCustomTasks.includes(t));

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
        currentNextDueDate: nextWaterTestDate.toISOString(),
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
        currentNextDueDate: nextSanitizerDate.toISOString(),
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
        currentNextDueDate: nextFilterRinseDate.toISOString(),
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
        currentNextDueDate: nextWaterlineDate.toISOString(),
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
        currentNextDueDate: nextCoverDate.toISOString(),
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
        currentNextDueDate: nextPipeCleanDate.toISOString(),
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
        currentNextDueDate: nextFilterReplaceDate.toISOString(),
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
        currentLastDoneDate: lastFullRefillDate.toISOString(),
        currentNextDueDate: nextFullRefillDate.toISOString(),
      }),
    },
  ];

  const customScheduledEvents = customTasks.map((t: any) => {
    const due = t.nextDueDate ? new Date(t.nextDueDate) : new Date();
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
        currentLastDoneDate: t.lastDoneDate ? new Date(t.lastDoneDate).toISOString() : null,
        currentNextDueDate: due.toISOString(),
      }),
    };
  });

  const allScheduledEvents = [
    ...baseScheduledEvents,
    ...customScheduledEvents,
  ];

  const sevenDaysUpcomingTasks = allScheduledEvents
    .map((evt) => {
      const diffDays = Math.round((evt.dueDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));
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
        const clarityMap: Record<string, string> = {
          CLEAR: "מים צלולים",
          SLIGHTLY_CLOUDY: "עכירות קלה",
          CLOUDY: "עכורים",
          FOAMY: "קצף במים",
          ALGAE: "ירוקת / אצות",
          BAD_SMELL: "ריח חריף",
        };
        if (test.waterClarity && test.waterClarity !== "CLEAR") {
          risks.push({
            name: pDef.nameHe,
            statusLabel: clarityMap[test.waterClarity] || "נדרש טיפול",
            risk: pDef.dangerLow,
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
            onClick={() => setOpenPageId("calendar")}
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40 h-full flex flex-col justify-between min-h-[580px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-sky-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-200 transition-colors">
                    סטטוס
                  </h2>
                  <p className="text-xs text-slate-300">
                    {sevenDaysUpcomingTasks.length} משימות מתוזמנות ל-7 הימים הקרובים
                  </p>
                </div>
              </div>
            </div>

            {/* 1. משימות קרובות בטווח של 7 ימים */}
            <div className="space-y-2.5">
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
                            : isToday
                            ? "bg-amber-950/30 border-amber-900/50 hover:border-amber-500/70"
                            : "bg-[#080e14]/90 border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-300 shrink-0">
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-white truncate group-hover/task:text-sky-300 transition-colors">
                            {t.title}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 border ${
                            isOverdue
                              ? "bg-rose-950 text-rose-300 border-rose-800"
                              : isToday
                              ? "bg-amber-950 text-amber-300 border-amber-800"
                              : isTomorrow
                              ? "bg-sky-950 text-sky-300 border-sky-800"
                              : "bg-slate-900 text-slate-300 border-slate-700"
                          }`}
                        >
                          {isOverdue
                            ? `באיחור של ${Math.abs(t.diffDays)} ימים!`
                            : isToday
                            ? "היום!"
                            : isTomorrow
                            ? "מחר"
                            : `בעוד ${t.diffDays} ימים`}
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

            {/* 2. מצב המים הנוכחי, גיל המים וסכנות חריגים */}
            <div className="space-y-2.5 pt-1 border-t border-sky-900/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                  <span>מצב איכות המים הנוכחי:</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {latestWaterLog ? `נבדק: ${new Date(latestWaterLog.testedAt).toLocaleDateString("he-IL")}` : "טרם בוצעה בדיקה"}
                </span>
              </div>

              {/* גיל המים הנוכחי ומועד החלפה הבא */}
              <div className="bg-[#080e14]/90 px-3.5 py-2.5 rounded-2xl border border-sky-900/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-slate-300">
                    גיל המים הנוכחי: <strong className="text-white">{daysSinceRefill} ימים</strong>
                  </span>
                </div>
                <span className="text-[11px] text-sky-300/90 font-medium">
                  ריקון מלא בעוד {daysUntilNextRefill} יום
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
                        {latestWaterLog.waterClarity === "CLEAR" ? "צלול ונקי" : "נדרש טיפול"}
                      </div>
                      <span className="text-[9px] text-sky-300/80">בדיקה ויזואלית</span>
                    </div>
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
                <div className="p-3 bg-[#080e14]/90 rounded-2xl border border-sky-900/30 text-center text-xs text-slate-300">
                  טרם תועדה בדיקת מים במערכת
                </div>
              )}
            </div>

            {/* 3. הזמנת חומרים במידה ויש חוסר */}
            <div className="space-y-2 pt-1 border-t border-sky-900/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
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
                      setOpenPageId("inventory");
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenPageId("inventory");
                    }}
                    className="text-[10px] text-sky-300 hover:text-white underline cursor-pointer"
                  >
                    לארון החומרים
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
              <span className="text-sky-300 font-bold">1 מתוך 3 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 1: תחזוקת מים (הגדרות מקלון מעל + איכות מים קודם + שגרת טיפולים ותוספות תחתיו)
      // -------------------------------------------------------------
      case 1:
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
            </div>

            {/* 🌟 כפתור הזנת בדיקת מקלון חדשה */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPageId("water-tests-new");
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group/btn"
            >
              <FlaskConical className="w-4 h-4 text-sky-100 group-hover/btn:scale-110 transition-transform" />
              <span>הזן בדיקת מקלון חדשה</span>
            </button>

            {/* 🌟 1. מעליו: הגדרות מקלון (Test Strip Settings) */}
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
                <span className="font-bold text-white flex items-center gap-1.5 group-hover/strip:text-sky-300 transition-colors">
                  <Settings className="w-3.5 h-3.5 text-sky-400" />
                  <span>מקלון בדיקה ({activeParamIds.length} מדדים פעילים):</span>
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

            {/* 🌟 גיל המים הנוכחי ומועד החלפה הבא */}
            <div className="bg-[#080e14]/90 px-3.5 py-2.5 rounded-2xl border border-sky-900/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-slate-300">
                  גיל המים הנוכחי: <strong className="text-white">{daysSinceRefill} ימים</strong>
                </span>
              </div>
              <span className="text-[11px] text-sky-300/90 font-medium">
                ריקון מלא בעוד {daysUntilNextRefill} יום
              </span>
            </div>

            {/* 🌟 2. קודם: מצב איכות המים (Water Quality Status & Dangers) */}
            <div className="space-y-3 pt-1 border-t border-sky-900/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                  <span>מצב איכות המים</span>
                </span>
                <span className="text-[11px] text-slate-300">
                  {latestWaterLog
                    ? `בדיקה אחרונה: ${new Date(latestWaterLog.testedAt).toLocaleDateString("he-IL")} (${new Date(latestWaterLog.testedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})`
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
                      className="bg-[#080e14]/90 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
                    >
                      <span className="text-[10px] text-slate-400">חומציות (pH)</span>
                      <div className="text-base sm:text-lg font-black text-white">{latestWaterLog.ph || latestWaterLog.phRange || "7.4"}</div>
                      <span className="text-[9px] text-sky-300/80">יעד: 7.2 - 7.6</span>
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenPageId("water-tests");
                      }}
                      className="bg-[#080e14]/90 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
                    >
                      <span className="text-[10px] text-slate-400">כלור / חיטוי</span>
                      <div className="text-base sm:text-lg font-black text-white">{latestWaterLog.freeChlorine || latestWaterLog.chlorineRange || "3.0"}</div>
                      <span className="text-[9px] text-sky-300/80">יעד: 2.0 - 4.0 ppm</span>
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenPageId("water-tests");
                      }}
                      className="bg-[#080e14]/90 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
                    >
                      <span className="text-[10px] text-slate-400">בסיסיות כוללת (TA)</span>
                      <div className="text-base sm:text-lg font-black text-white">{latestWaterLog.alkalinity || latestWaterLog.alkalinityRange || "90"}</div>
                      <span className="text-[9px] text-sky-300/80">יעד: 80 - 120 ppm</span>
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenPageId("water-tests");
                      }}
                      className="bg-[#080e14]/90 p-3 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all text-center space-y-1 cursor-pointer"
                    >
                      <span className="text-[10px] text-slate-400">צלילות ומראה</span>
                      <div className="text-base sm:text-lg font-black text-white">
                        {latestWaterLog.waterClarity === "CLEAR" ? "צלול ונקי" : "נדרש טיפול"}
                      </div>
                      <span className="text-[9px] text-sky-300/80">בדיקה ויזואלית</span>
                    </div>
                  </div>

                  {/* סכנות של מדדים שאינם תקינים */}
                  {latestAbnormalRisks.length > 0 ? (
                    <div className="bg-[#180e14]/95 border border-rose-900/60 rounded-2xl p-3.5 space-y-2 text-xs text-right shadow-lg">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
                    <div className="bg-[#080e14]/90 p-2.5 rounded-xl border border-emerald-900/30 flex items-center gap-2 text-[11px] text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-bold">כל המדדים שנבדקו נמצאים בטווח האידיאלי והמים מאוזנים לחלוטין ✓</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-[#080e14]/90 border border-sky-900/30 text-center text-slate-300 text-xs">
                  לחץ כאן כדי להזין את בדיקת המקלון הראשונה שלך
                </div>
              )}

              {/* כפתור היסטוריית בדיקות שמעביר ליומן בדיקות איכות המים */}
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

            {/* 🌟 3. תחתיו: שגרת טיפולי מים ותוספות חומרים */}
            <div className="space-y-3 pt-1 border-t border-sky-900/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>שגרת טיפולי מים:</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreateRoutineModal("WATER");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-950/90 hover:bg-sky-900 border border-sky-800/80 text-sky-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3 h-3 text-sky-400" />
                  <span>+ הוסף שגרה</span>
                </button>
              </div>

              {/* List of Water Treatments with Both Last & Next Dates */}
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
                      <span>כל {waterTestFreqDays} ימים</span>
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
                      currentNextDueDate: nextSanitizerDate.toISOString(),
                    });
                  }}
                  className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>חיטוי שבועי</span>
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
                      currentNextDueDate: nextPartialRefillDate.toISOString(),
                    });
                  }}
                  className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                      <Waves className="w-3.5 h-3.5 text-sky-400" />
                      <span>החלפת מים חלקית ({latestPartialPercent}%)</span>
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

                {/* Item 4: ריקון ומילוי מים מלא (100%) */}
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

                {/* 🌟 Custom Water Routines Added by User */}
                {waterCustomTasks.map((t: any) => {
                  const lastDate = t.lastDoneDate ? new Date(t.lastDoneDate) : null;
                  const nextDate = t.nextDueDate ? new Date(t.nextDueDate) : new Date();
                  return (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openItemModal({
                          id: `custom-task-${t.id}`,
                          title: t.title,
                          subtitle: `שגרה מותאמת אישית • כל ${t.frequencyDays || 7} ימים`,
                          icon: Sparkles,
                          type: "task",
                          taskId: t.id,
                          isCustom: true,
                          taskCategory: t.category || "WATER_MAINTENANCE",
                          defaultFreqDays: t.frequencyDays || 7,
                          currentFreqDays: t.frequencyDays || 7,
                          currentLastDoneDate: lastDate?.toISOString() || null,
                          currentNextDueDate: nextDate.toISOString(),
                        });
                      }}
                      className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                          <span className="truncate">{t.title}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1 shrink-0">
                          <Edit2 className="w-2.5 h-2.5 opacity-60" />
                          <span>כל {t.frequencyDays || 7} ימים</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                        <div>
                          <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                          <span className="text-white font-semibold">{formatDateDisplay(lastDate)}</span>{" "}
                          <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastDate, true)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                          <span className="text-sky-300 font-bold">{formatDateDisplay(nextDate)}</span>{" "}
                          <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextDate, false)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* חומרים שנוספו לג'קוזי (ללא תאריך הבא!) */}
              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Beaker className="w-3.5 h-3.5 text-sky-400" />
                    <span>חומרים שנוספו לג'קוזי (ללא תאריך הבא):</span>
                  </span>

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
                    className="px-2.5 py-1 rounded-lg bg-sky-950/90 hover:bg-sky-900 border border-sky-800/80 text-sky-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-sky-400" />
                    <span>+ הוסף חומר</span>
                  </button>
                </div>

                {adHocChemicalList.length > 0 ? (
                  <div className="space-y-1.5 pt-1 border-t border-sky-900/20">
                    {adHocChemicalList.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-[11px] bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-900/30"
                      >
                        <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                          🧪 {item.title}
                        </span>
                        <span className="text-slate-300 text-[10px] shrink-0">
                          הוסף בתאריך {item.formattedDate} {item.relativeDate}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 text-center py-1">
                    לא תועדו חומרים שנוספו לג'קוזי • לחץ על "+ הוסף חומר" לתיעוד הוספה
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
              <span className="text-sky-300 font-bold">2 מתוך 3 ◂</span>
            </div>
          </div>
        );

      // -------------------------------------------------------------
      // CARD 2: תחזוקת מתקן (כולל ניקוי צנרת והחלפת פילטר)
      // -------------------------------------------------------------
      case 2:
      default:
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

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateRoutineModal("JACUZZI");
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-950/90 hover:bg-sky-900 border border-sky-800/80 text-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>+ הוסף שגרה</span>
              </button>
            </div>

            {/* List of Specific Jacuzzi Equipment Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Item 1: שטיפת פילטר שבועית */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openItemModal({
                    id: "filter-rinse",
                    title: "שטיפת פילטר שבועית",
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
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>שטיפת פילטר</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {filterRinseTask?.frequencyDays || 7} יום</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastFilterRinseDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastFilterRinseDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">יעד הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextFilterRinseDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextFilterRinseDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Task 2: ניקוי דפנות וקו מים */}
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
                    currentNextDueDate: nextWaterlineDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>ניקוי דפנות וקו מים</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {waterlineTask?.frequencyDays || 7} יום</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastWaterlineDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastWaterlineDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">יעד הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextWaterlineDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextWaterlineDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Task 3: ניקוי ואוורור כיסוי */}
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
                    currentNextDueDate: nextCoverDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>ניקוי ואוורור כיסוי</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {coverTask?.frequencyDays || 7} יום</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastCoverDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastCoverDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">יעד הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextCoverDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextCoverDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Task 4: ניקוי צנרת */}
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
                    currentNextDueDate: nextPipeCleanDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <Wrench className="w-3.5 h-3.5 text-sky-400" />
                    <span>ניקוי צנרת</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {pipeCleanTask?.frequencyDays || 90} יום</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastPipeCleanDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastPipeCleanDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">יעד הבא:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextPipeCleanDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextPipeCleanDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Task 5: החלפת פילטר */}
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
                    currentNextDueDate: nextFilterReplaceDate.toISOString(),
                  });
                }}
                className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item sm:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                    <span>החלפת פילטר (סנן חדש)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                    <span>כל {filterReplaceTask?.frequencyDays || 180} יום</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                  <div>
                    <span className="text-slate-400 block text-[10px]">החלפה אחרונה:</span>
                    <span className="text-white font-semibold">{formatDateDisplay(lastFilterReplaceDate)}</span>{" "}
                    <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastFilterReplaceDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">החלפה הבאה:</span>
                    <span className="text-sky-300 font-bold">{formatDateDisplay(nextFilterReplaceDate)}</span>{" "}
                    <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextFilterReplaceDate, false)}</span>
                  </div>
                </div>
              </div>

              {/* Custom Jacuzzi Equipment Routines */}
              {jacuzziCustomTasks.map((t: any) => {
                const lastDate = t.lastDoneDate ? new Date(t.lastDoneDate) : null;
                const nextDate = t.nextDueDate
                  ? new Date(t.nextDueDate)
                  : lastDate
                  ? new Date(lastDate.getTime() + (t.frequencyDays || 7) * 24 * 3600 * 1000)
                  : new Date(Date.now() + (t.frequencyDays || 7) * 24 * 3600 * 1000);

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
                        currentNextDueDate: nextDate.toISOString(),
                      });
                    }}
                    className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 hover:border-sky-500/60 hover:bg-sky-950/40 transition-all space-y-2 cursor-pointer group/item"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 group-hover/item:text-sky-300 transition-colors">
                        <Wrench className="w-3.5 h-3.5 text-sky-400" />
                        <span className="truncate">{t.title}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950 text-sky-200 border border-sky-800/60 flex items-center gap-1 shrink-0">
                        <Edit2 className="w-2.5 h-2.5 opacity-60" />
                        <span>כל {t.frequencyDays || 7} ימים</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-sky-900/20">
                      <div>
                        <span className="text-slate-400 block text-[10px]">בוצע לאחרונה:</span>
                        <span className="text-white font-semibold">{formatDateDisplay(lastDate)}</span>{" "}
                        <span className="text-slate-400 text-[10px]">{getRelativeDaysDisplay(lastDate, true)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ביצוע הבא:</span>
                        <span className="text-sky-300 font-bold">{formatDateDisplay(nextDate)}</span>{" "}
                        <span className="text-sky-400/90 text-[10px]">{getRelativeDaysDisplay(nextDate, false)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end text-xs text-slate-400 pt-1">
              <span className="text-sky-300 font-bold">3 מתוך 3 ◂</span>
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
      <div className="flex items-center justify-center gap-3 bg-[#0e1823]/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-sky-900/40 shadow-md w-fit mx-auto" dir="ltr">
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
          {/* Slide 0: Previous Card */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1 flex flex-col h-full" dir="rtl">
            {renderCard(prevIdx)}
          </div>

          {/* Slide 1: Current Card */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1 flex flex-col h-full" dir="rtl">
            {renderCard(currIdx)}
          </div>

          {/* Slide 2: Next Card */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1 flex flex-col h-full" dir="rtl">
            {renderCard(nextIdx)}
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
            {(activeItemModal.type === "task" || activeItemModal.id === "full-refill" || activeItemModal.id === "partial-refill" || activeItemModal.type === "adhoc-chemical") && activeItemModal.id !== "water-test" && activeItemModal.type !== "water-test" && (
              <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-sky-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {activeItemModal.type === "adhoc-chemical" ? "תיעוד הוספת חומר יזומה" : "סימון ביצוע הפעולה עכשיו"}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {activeItemModal.type === "adhoc-chemical" ? "רישום ביומן ללא תאריך יעד" : "יעדכן יומן ויקדם תאריך הבא"}
                  </span>
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
              <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-sky-200 block">
                    תדירות בדיקת איכות מים (בימים):
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    קבע את מרווח הימים הרצוי בין בדיקות מקלון שגרתיות.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editFreqDays}
                    onChange={(e) => setEditFreqDays(parseInt(e.target.value, 10) || 1)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-center font-bold focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-xs text-slate-300">ימים</span>

                  <div className="flex items-center gap-1.5 mr-auto flex-wrap">
                    {[2, 3, 5, 7, 14].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEditFreqDays(d)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          editFreqDays === d
                            ? "bg-sky-950 text-sky-200 border-sky-500 shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {d} ימים
                      </button>
                    ))}
                  </div>
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
                        {[7, 14, 30, 90, 180].map((d) => (
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
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">הוספת שגרה חדשה</h3>
                  <p className="text-xs text-sky-300/80">הגדרת שגרת תחזוקה מחזורית מותאמת אישית</p>
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
                  placeholder="לדוגמה: בדיקת משאבות, הוספת מלח, ניקוי כיסוי..."
                  value={newRoutineTitle}
                  onChange={(e) => setNewRoutineTitle(e.target.value)}
                  className="w-full bg-[#080e14] border border-sky-900/60 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Category Choice */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  קטגוריית שגרה:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoutineCategory("WATER")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newRoutineCategory === "WATER"
                        ? "bg-sky-950 text-sky-200 border-sky-500 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Droplets className="w-4 h-4 text-sky-400" />
                    <span>תחזוקת מים</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoutineCategory("JACUZZI")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newRoutineCategory === "JACUZZI"
                        ? "bg-sky-950 text-sky-200 border-sky-500 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-sky-400" />
                    <span>תחזוקת מתקן</span>
                  </button>
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  תדירות חזרה (כל כמה ימים תתבצע הפעולה?):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={newRoutineFreqDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setNewRoutineFreqDays(val);
                      if (newRoutineLastDoneDate) {
                        const next = new Date(new Date(newRoutineLastDoneDate).getTime() + val * 24 * 3600 * 1000);
                        setNewRoutineNextDueDate(next.toISOString().split("T")[0]);
                      }
                    }}
                    className="w-24 bg-[#080e14] border border-sky-900/60 rounded-xl px-3 py-2 text-xs text-white text-center font-bold focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-xs text-slate-300">ימים</span>

                  <div className="flex items-center gap-1.5 mr-auto flex-wrap">
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
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          newRoutineFreqDays === d
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
