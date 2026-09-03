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
} from "lucide-react";

import WaterTestsPage from "@/app/water-tests/page";
import CalendarPage from "@/app/calendar/page";
import InventoryPage from "@/app/inventory/page";
import WaterDoctorPage from "@/app/water-doctor/page";
import SettingsPage from "@/app/settings/page";
import { ALL_PARAMS_WITH_CLARITY, DEFAULT_TEST_STRIP_PARAM_IDS } from "@/lib/test-strip-params";

export const CARD_TABS = [
  { id: "water-tests", title: "מצב איכות המים", subtitle: "בדיקת מקלון אחרונה, איזון ומדדים", icon: FlaskConical, color: "text-cyan-400", badgeBg: "bg-cyan-950/60 border-cyan-500/50 text-cyan-200" },
  { id: "calendar", title: "שגרת תחזוקה וגיל המים", subtitle: "משימות לביצוע, שטיפות והחלפות", icon: Calendar, color: "text-purple-400", badgeBg: "bg-purple-950/60 border-purple-500/50 text-purple-200" },
  { id: "inventory", title: "ארון חומרים ומלאי", subtitle: "מעקב כמויות, התראות חוסר וחומרים חיוניים", icon: Package, color: "text-blue-400", badgeBg: "bg-blue-950/60 border-blue-500/50 text-blue-200" },
  { id: "water-doctor", title: "רופא מים AI", subtitle: "אבחון מים מבוסס AI וחישוב מינונים", icon: Sparkles, color: "text-emerald-400", badgeBg: "bg-emerald-950/60 border-emerald-500/50 text-emerald-200" },
  { id: "settings", title: "הגדרות הג'קוזי והמקלון", subtitle: "נפח, סוג חיטוי ומדדים פעילים", icon: Settings, color: "text-slate-300", badgeBg: "bg-slate-800 border-slate-600 text-white" },
];

interface SwipeableMainViewProps {
  initialTab?: string;
}

function SwipeableMainContent({ initialTab }: SwipeableMainViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Full page view state (when a card is clicked)
  const [openPageId, setOpenPageId] = useState<string | null>(null);

  // Carousel index state (0..4 with infinite wrap)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  // App Data for live summary cards
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSummaryData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        setData(json.user);
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
      const idx = CARD_TABS.findIndex((t) => t.id === tab);
      if (idx >= 0) {
        setCurrentIndex(idx);
      }
    }
  }, [searchParams, initialTab]);

  const getContainerWidth = () => {
    return containerRef.current?.offsetWidth || window.innerWidth || 600;
  };

  const nextCard = () => {
    if (isAnimating || isDragging) return;
    const width = getContainerWidth();
    setIsAnimating(true);
    setDragOffset(-width);

    setTimeout(() => {
      setIsAnimating(false);
      setDragOffset(0);
      setCurrentIndex((prev) => (prev + 1) % CARD_TABS.length);
    }, 350);
  };

  const prevCard = () => {
    if (isAnimating || isDragging) return;
    const width = getContainerWidth();
    setIsAnimating(true);
    setDragOffset(width);

    setTimeout(() => {
      setIsAnimating(false);
      setDragOffset(0);
      setCurrentIndex((prev) => (prev - 1 + CARD_TABS.length) % CARD_TABS.length);
    }, 350);
  };

  const goToCard = (newIndex: number) => {
    if (isAnimating || isDragging || newIndex === currentIndex) return;
    const safe = (newIndex + CARD_TABS.length) % CARD_TABS.length;
    const isForward = (safe > currentIndex && !(currentIndex === 0 && safe === CARD_TABS.length - 1)) || (currentIndex === CARD_TABS.length - 1 && safe === 0);
    const width = getContainerWidth();

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
        // Vertical scroll - release horizontal drag
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

    // Threshold to trigger swipe (45px or 12% of card width)
    const threshold = Math.min(60, width * 0.15);

    if (offset < -threshold) {
      // Swiped left in RTL -> animate next card into view
      setIsAnimating(true);
      setDragOffset(-width);
      setTimeout(() => {
        setIsAnimating(false);
        setDragOffset(0);
        setCurrentIndex((prev) => (prev + 1) % CARD_TABS.length);
      }, 350);
    } else if (offset > threshold) {
      // Swiped right in RTL -> animate prev card into view
      setIsAnimating(true);
      setDragOffset(width);
      setTimeout(() => {
        setIsAnimating(false);
        setDragOffset(0);
        setCurrentIndex((prev) => (prev - 1 + CARD_TABS.length) % CARD_TABS.length);
      }, 350);
    } else {
      // Snap back to current card with spring bounce
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

  // If a full page is opened, render it with a smooth return bar
  if (openPageId) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Floating Top Return Bar */}
        <div className="sticky top-14 sm:top-16 z-50 bg-slate-900/95 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 border-b border-cyan-800/60 shadow-xl flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setOpenPageId(null);
              loadSummaryData();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer select-none"
          >
            <ChevronRight className="w-4 h-4" />
            <span>חזרה לכרטיסי הבקרה</span>
          </button>

          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
            {CARD_TABS.find((t) => t.id === openPageId)?.title}
          </span>
        </div>

        {/* Full Page View Component */}
        <div className="pt-2">
          {openPageId === "water-tests" && <WaterTestsPage />}
          {openPageId === "calendar" && <CalendarPage />}
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

  // Render a specific card by its index (0..4)
  const renderCard = (cardIdx: number) => {
    switch (cardIdx) {
      case 0:
        return (
          <div
            onClick={() => setOpenPageId("water-tests")}
            className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-cyan-950/30"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                    מצב איכות המים
                  </h2>
                  <p className="text-xs text-slate-400">
                    {latestWaterLog
                      ? `בדיקה אחרונה: ${new Date(latestWaterLog.testedAt).toLocaleDateString("he-IL")} (${new Date(latestWaterLog.testedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})`
                      : "טרם בוצעה בדיקת מים"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-cyan-950/80 px-3 py-1.5 rounded-xl border border-cyan-800/60">
                <span>פתח יומן בדיקות</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            {latestWaterLog ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                  <span className="text-[11px] text-slate-400">חומציות (pH)</span>
                  <div className="text-lg font-bold text-cyan-300">{latestWaterLog.ph || latestWaterLog.phRange || "7.4"}</div>
                  <span className="text-[10px] text-slate-500">אידיאלי: 7.2 - 7.6</span>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                  <span className="text-[11px] text-slate-400">כלור / חיטוי</span>
                  <div className="text-lg font-bold text-sky-300">{latestWaterLog.freeChlorine || latestWaterLog.chlorineRange || "3.0"}</div>
                  <span className="text-[10px] text-slate-500">אידיאלי: 2.0 - 4.0 ppm</span>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                  <span className="text-[11px] text-slate-400">בסיסיות כוללת (TA)</span>
                  <div className="text-lg font-bold text-blue-300">{latestWaterLog.alkalinity || latestWaterLog.alkalinityRange || "90"}</div>
                  <span className="text-[10px] text-slate-500">אידיאלי: 80 - 120 ppm</span>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                  <span className="text-[11px] text-slate-400">צלילות ומראה</span>
                  <div className="text-lg font-bold text-emerald-300">
                    {latestWaterLog.waterClarity === "CLEAR" ? "צלול ונקי" : "נדרש טיפול"}
                  </div>
                  <span className="text-[10px] text-slate-500">בדיקה ויזואלית</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs">
                לחץ כאן כדי להזין את בדיקת המקלון הראשונה שלך
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ בכל מקום בכרטיס לפתיחת יומן הבדיקות המלא והזנת בדיקה</span>
              <span className="text-cyan-400 font-bold">1 מתוך 5 ◂</span>
            </div>
          </div>
        );

      case 1:
        return (
          <div
            onClick={() => setOpenPageId("calendar")}
            className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-purple-950/30"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                    שגרת תחזוקה ויומן
                  </h2>
                  <p className="text-xs text-slate-400">
                    גיל המים: {daysSinceRefill} ימים במערכת • {overdueTasks.length > 0 ? `${overdueTasks.length} משימות באיחור` : "כל המשימות מעודכנות"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-800/60">
                <span>פתח יומן תחזוקה</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                <span className="text-[11px] text-slate-400">גיל המים הנוכחי</span>
                <div className="text-lg font-bold text-purple-300">{daysSinceRefill} ימים</div>
                <span className="text-[10px] text-slate-500">ריקון בעוד {daysUntilNextRefill} יום</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                <span className="text-[11px] text-slate-400">משימות פתוחות</span>
                <div className={`text-lg font-bold ${overdueTasks.length > 0 ? "text-rose-400" : "text-emerald-300"}`}>
                  {pendingTasks.length} משימות
                </div>
                <span className="text-[10px] text-slate-500">{overdueTasks.length} דורשות ביצוע היום</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400">שטיפת פילטר שבועית</span>
                <div className="text-lg font-bold text-cyan-300">כל 7 ימים</div>
                <span className="text-[10px] text-slate-500">שמירה על סירקולציה</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ לפתיחת יומן הטיפולים, פעולות אחזקה יזומות ותיעוד משימות</span>
              <span className="text-purple-400 font-bold">2 מתוך 5 ◂</span>
            </div>
          </div>
        );

      case 2:
        return (
          <div
            onClick={() => setOpenPageId("inventory")}
            className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-blue-950/30"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-blue-300 transition-colors">
                    ארון חומרים ומלאי
                  </h2>
                  <p className="text-xs text-slate-400">
                    {chemicals.length} חומרים במלאי • {lowStockChems.length > 0 ? `${lowStockChems.length} חומרים במלאי נמוך` : "מלאי החומרים תקין"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-800/60">
                <span>פתח ארון חומרים</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                <span className="text-[11px] text-slate-400">סך הכל חומרים</span>
                <div className="text-lg font-bold text-blue-300">{chemicals.length} פריטים</div>
                <span className="text-[10px] text-slate-500">בארון הג'קוזי</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                <span className="text-[11px] text-slate-400">התראות חוסר</span>
                <div className={`text-lg font-bold ${lowStockChems.length > 0 ? "text-amber-400" : "text-emerald-300"}`}>
                  {lowStockChems.length} פריטים
                </div>
                <span className="text-[10px] text-slate-500">{lowStockChems.length > 0 ? "נדרשת רכישה" : "מלאי מספק"}</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400">זיהוי צילום AI</span>
                <div className="text-lg font-bold text-cyan-300">פעיל ✓</div>
                <span className="text-[10px] text-slate-500">סריקה ופענוח אריזות</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ לפתיחת ארון החומרים המלא, הוספת פריטים וסריקת תמונות</span>
              <span className="text-blue-400 font-bold">3 מתוך 5 ◂</span>
            </div>
          </div>
        );

      case 3:
        return (
          <div
            onClick={() => setOpenPageId("water-doctor")}
            className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-emerald-950/30"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                    רופא מים AI
                  </h2>
                  <p className="text-xs text-slate-400">
                    אבחון מים מיידי, פענוח חריגות וחישוב מינונים מותאמים אישית
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800/60">
                <span>פתח רופא מים</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>אבחון מים עכורים / קצף</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">זיהוי מקור העכירות וקבלת תוכנית טיפול מדורגת</p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>חישוב מינון כימי מדויק</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">חישוב כמויות בגרם/מ"ל בהתאם לנפח הג'קוזי שלך</p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>בדיקת מלאי אוטומטית</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">בדיקה האם החומרים הדרושים זמינים בארון שלך</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ להפעלת אבחון רופא המים והזנת תיאור מצב המים</span>
              <span className="text-emerald-400 font-bold">4 מתוך 5 ◂</span>
            </div>
          </div>
        );

      case 4:
      default:
        return (
          <div
            onClick={() => setOpenPageId("settings")}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-500/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all group cursor-pointer hover:shadow-slate-900/40"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-slate-200 transition-colors">
                    הגדרות הג'קוזי והמקלון
                  </h2>
                  <p className="text-xs text-slate-400">
                    {jacuzzi?.name || "הג'קוזי שלי"} • {jacuzzi?.volumeLiters || 1200} ליטר • {jacuzzi?.sanitizationType === "BROMINE" ? "ברום" : "כלור"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-300 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <span>פתח הגדרות</span>
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                <span className="text-[11px] text-slate-400">נפח מים</span>
                <div className="text-lg font-bold text-white">{jacuzzi?.volumeLiters || 1200} ליטר</div>
                <span className="text-[10px] text-slate-500">לחישוב מינונים</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1">
                <span className="text-[11px] text-slate-400">שיטת חיטוי</span>
                <div className="text-lg font-bold text-cyan-300">
                  {jacuzzi?.sanitizationType === "BROMINE" ? "ברום" : jacuzzi?.sanitizationType === "SALT" ? "מלח" : "כלור"}
                </div>
                <span className="text-[10px] text-slate-500">חומר חיטוי ראשי</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400">התראות במייל</span>
                <div className="text-lg font-bold text-emerald-300">פעיל ✓</div>
                <span className="text-[10px] text-slate-500">תזכורות למשימות</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>💡 לחץ לפתיחת ההגדרות, שינוי מאפייני הג'קוזי ובחירת מדדי מקלון הבדיקה</span>
              <span className="text-slate-400 font-bold">5 מתוך 5 ◂</span>
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
      {/* 🌟 Top Navigation: Pagination Dots (Active is wider/fatter) & Arrows */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-md max-w-md mx-auto">
        <button
          type="button"
          onClick={prevCard}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 transition-all shrink-0 cursor-pointer shadow-sm"
          title="העבר ימינה (קודם)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Pagination Dots Indicator */}
        <div className="flex items-center justify-center gap-2 flex-1" dir="rtl">
          {CARD_TABS.map((card, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => goToCard(idx)}
                className={`transition-all duration-300 cursor-pointer rounded-full ${
                  isActive
                    ? "w-8 h-2.5 bg-gradient-to-r from-cyan-400 to-sky-400 shadow-md shadow-cyan-500/40"
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
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 transition-all shrink-0 cursor-pointer shadow-sm"
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
          {/* Slide 0: Previous Card (Enters from left as you drag right) */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1" dir="rtl">
            {renderCard(prevIdx)}
          </div>

          {/* Slide 1: Current Card (Moves in real-time sync with drag) */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1" dir="rtl">
            {renderCard(currIdx)}
          </div>

          {/* Slide 2: Next Card (Enters from right as you drag left) */}
          <div className="w-full min-w-full max-w-full shrink-0 px-1" dir="rtl">
            {renderCard(nextIdx)}
          </div>
        </div>
      </div>

      {/* Navigation Help Prompt */}
      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2 select-none">
        <span>◂ גרור באצבע ימינה ושמאלה לתנועה רציפה וסנכרון מלא • לחץ על כרטיס לפתיחה מלאה ▸</span>
      </div>
    </div>
  );
}

export default function SwipeableMainView(props: SwipeableMainViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-cyan-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <SwipeableMainContent {...props} />
    </Suspense>
  );
}
