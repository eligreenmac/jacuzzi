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
} from "lucide-react";

import WaterTestsPage from "@/app/water-tests/page";
import CalendarPage from "@/app/calendar/page";
import InventoryPage from "@/app/inventory/page";
import WaterDoctorPage from "@/app/water-doctor/page";
import SettingsPage from "@/app/settings/page";
import { ALL_PARAMS_WITH_CLARITY, ALL_TEST_STRIP_PARAMS, DEFAULT_TEST_STRIP_PARAM_IDS } from "@/lib/test-strip-params";

export const CARD_TABS = [
  { id: "water-tests", title: "מצב איכות המים", subtitle: "בדיקת מקלון אחרונה, איזון ומדדים", icon: FlaskConical },
  { id: "water-maintenance", title: "תחזוקת מים וגיל המים", subtitle: "גיל המים, ריקון מלא, ריענון וטיפול שוק", icon: Droplets },
  { id: "jacuzzi-maintenance", title: "תחזוקת הג'קוזי", subtitle: "שטיפת פילטר, ניקוי דפנות וחיטוי צנרת", icon: Wrench },
  { id: "inventory", title: "ארון חומרים ומלאי", subtitle: "מעקב כמויות, התראות חוסר וחומרים חיוניים", icon: Package },
  { id: "water-doctor", title: "רופא מים AI", subtitle: "אבחון מים מבוסס AI וחישוב מינונים", icon: Sparkles },
  { id: "settings", title: "הגדרות הג'קוזי והמקלון", subtitle: "נפח, סוג חיטוי ומדדים פעילים", icon: Settings },
];

interface SwipeableMainViewProps {
  initialTab?: string;
}

function SwipeableMainContent({ initialTab }: SwipeableMainViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Full page view state (when a card is clicked)
  const [openPageId, setOpenPageId] = useState<string | null>(null);

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
    if (openPageId || isAnimating) return;
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
      // 🌟 Update visual dot indicator SIMULTANEOUSLY (0 lag)
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
      // 🌟 Update visual dot indicator SIMULTANEOUSLY (0 lag)
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
    if (openPageId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") nextCard();
      else if (e.key === "ArrowRight") prevCard();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, openPageId, isAnimating]);

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

  // Water Age & Refill calculations
  const refillDate = jacuzzi?.lastRefillDate ? new Date(jacuzzi.lastRefillDate) : new Date();
  const daysSinceRefill = Math.max(0, Math.floor((Date.now() - refillDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilNextRefill = Math.max(0, 90 - daysSinceRefill);

  // Active Pending Tasks
  const pendingTasks = tasks.filter((t: any) => !t.isCompleted);
  const overdueTasks = pendingTasks.filter((t: any) => new Date(t.nextDueDate).getTime() < Date.now());

  // Low Stock Chemicals
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
                <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                  <span className="text-[11px] text-slate-400">חומציות (pH)</span>
                  <div className="text-lg font-black text-white">{latestWaterLog.ph || latestWaterLog.phRange || "7.4"}</div>
                  <span className="text-[10px] text-sky-300/80">יעד: 7.2 - 7.6</span>
                </div>

                <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                  <span className="text-[11px] text-slate-400">כלור / חיטוי</span>
                  <div className="text-lg font-black text-white">{latestWaterLog.freeChlorine || latestWaterLog.chlorineRange || "3.0"}</div>
                  <span className="text-[10px] text-sky-300/80">יעד: 2.0 - 4.0 ppm</span>
                </div>

                <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                  <span className="text-[11px] text-slate-400">בסיסיות כוללת (TA)</span>
                  <div className="text-lg font-black text-white">{latestWaterLog.alkalinity || latestWaterLog.alkalinityRange || "90"}</div>
                  <span className="text-[10px] text-sky-300/80">יעד: 80 - 120 ppm</span>
                </div>

                <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
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
              <span>💡 לחץ לפתיחת יומן הבדיקות המלא והזנת תוצאות</span>
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
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40"
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
                    גיל המים: {daysSinceRefill} ימים • ריקון מלא מתוכנן בעוד {daysUntilNextRefill} יום
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-sky-200 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60">
                <span>פתח יומן מים</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                <span className="text-[11px] text-slate-400">גיל המים הנוכחי</span>
                <div className="text-lg font-black text-white">{daysSinceRefill} ימים</div>
                <span className="text-[10px] text-sky-300/80">מילוי מלא / משוקלל</span>
              </div>

              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                <span className="text-[11px] text-slate-400">מועד ריקון מלא</span>
                <div className="text-lg font-black text-white">בעוד {daysUntilNextRefill} יום</div>
                <span className="text-[10px] text-sky-300/80">מחזור של 90 יום</span>
              </div>

              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400">ריענון מים חלקי</span>
                <div className="text-lg font-black text-white">החלפת 25%</div>
                <span className="text-[10px] text-sky-300/80">להורדת עומס מומסים (TDS)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ לפתיחת יומן הטיפולים ותיעוד החלפות מים וריענון</span>
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
            className="bg-[#0e1823]/95 border border-sky-900/40 hover:border-sky-600/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-sky-950/40"
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
                    שטיפת פילטרים, ניקוי דפנות, שטיפת צנרת וטיפולים תקופתיים
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-sky-200 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60">
                <span>פתח משימות ג'קוזי</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                <span className="text-[11px] text-slate-400">שטיפת פילטר שבועית</span>
                <div className="text-lg font-black text-white">כל 7 ימים</div>
                <span className="text-[10px] text-sky-300/80">שמירה על סירקולציה</span>
              </div>

              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                <span className="text-[11px] text-slate-400">ניקוי קו מים ודפנות</span>
                <div className="text-lg font-black text-white">כל 14 יום</div>
                <span className="text-[10px] text-sky-300/80">הסרת טבעת שומנים</span>
              </div>

              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400">שטיפת צנרת (Line Flush)</span>
                <div className="text-lg font-black text-white">לפני ריקון</div>
                <span className="text-[10px] text-sky-300/80">הסרת ביופילם בצנרת</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ לפתיחת יומן הפעולות ותיעוד שטיפות וטיפולי ג'קוזי</span>
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
              <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 text-center space-y-1">
                <span className="text-[11px] text-slate-400">סך הכל חומרים</span>
                <div className="text-xl font-black text-white">{chemicals.length} פריטים</div>
                <span className="text-[10px] text-sky-300/80">בארון הג'קוזי</span>
              </div>

              <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/30 text-center space-y-1">
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
              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                <span className="text-[11px] text-slate-400">נפח מים</span>
                <div className="text-lg font-black text-white">{jacuzzi?.volumeLiters || 1200} ליטר</div>
                <span className="text-[10px] text-sky-300/80">לחישוב מינונים</span>
              </div>

              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1">
                <span className="text-[11px] text-slate-400">שיטת חיטוי</span>
                <div className="text-lg font-black text-white">
                  {jacuzzi?.sanitizationType === "BROMINE" ? "ברום" : jacuzzi?.sanitizationType === "SALT" ? "מלח" : "כלור"}
                </div>
                <span className="text-[10px] text-sky-300/80">חומר חיטוי ראשי</span>
              </div>

              <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400">התראות במייל</span>
                <div className="text-lg font-black text-white">פעיל ✓</div>
                <span className="text-[10px] text-sky-300/80">תזכורות למשימות</span>
              </div>
            </div>

            {/* 🌟 Active Test Strip Parameters Chip List (Short English Names) */}
            <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>מדדי מקלון פעילים לבדיקה:</span>
                </span>
                <span className="text-[11px] text-sky-300/80">{activeParamIds.length} מדדים נבחרו</span>
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
              <span>💡 לחץ לפתיחת ההגדרות, שינוי מאפייני הג'קוזי ובחירת מדדי מקלון הבדיקה</span>
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
      {/* 🌟 Top Navigation: Pagination Dots (dir="ltr" for exact direction alignment, active dot is a larger circle) & Arrows */}
      <div className="flex items-center justify-between gap-4 bg-[#0e1823]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-sky-900/40 shadow-md max-w-xs mx-auto">
        <button
          type="button"
          onClick={prevCard}
          className="p-2 rounded-xl bg-sky-950/80 hover:bg-sky-900/80 border border-sky-900/50 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm"
          title="העבר ימינה (קודם)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Pagination Dots Indicator - Synchronized Direction, Selected is Larger Circle */}
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
        <span>◂ החלק באצבע ימינה ושמאלה למעבר בין הכרטיסים • לחץ על כרטיס לפתיחה מלאה ▸</span>
      </div>
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
