"use client";

import { useState, useEffect, useRef, useTransition, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  FlaskConical,
  Calendar,
  Package,
  Sparkles,
  Settings,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";

import WaterTestsPage from "@/app/water-tests/page";
import CalendarPage from "@/app/calendar/page";
import InventoryPage from "@/app/inventory/page";
import WaterDoctorPage from "@/app/water-doctor/page";
import SettingsPage from "@/app/settings/page";

export const APP_PAGES = [
  { id: "water-tests", title: "בדיקות איכות מים", shortTitle: "בדיקות מים", icon: FlaskConical, color: "text-cyan-400", activeBg: "bg-cyan-950/60 border-cyan-500 text-cyan-200" },
  { id: "calendar", title: "יומן תחזוקה ומשימות", shortTitle: "יומן תחזוקה", icon: Calendar, color: "text-purple-400", activeBg: "bg-purple-950/60 border-purple-500 text-purple-200" },
  { id: "inventory", title: "ארון חומרים ומלאי", shortTitle: "ארון חומרים", icon: Package, color: "text-blue-400", activeBg: "bg-blue-950/60 border-blue-500 text-blue-200" },
  { id: "water-doctor", title: "רופא מים AI", shortTitle: "רופא מים AI", icon: Sparkles, color: "text-emerald-400", activeBg: "bg-emerald-950/60 border-emerald-500 text-emerald-200" },
  { id: "settings", title: "הגדרות הג'קוזי והתראות", shortTitle: "הגדרות", icon: Settings, color: "text-slate-300", activeBg: "bg-slate-800 border-slate-600 text-white" },
];

interface SwipeableMainViewProps {
  initialTab?: string;
}

function SwipeableMainContent({ initialTab }: SwipeableMainViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const tabParam = searchParams.get("tab") || initialTab || "water-tests";
  const initialIndex = Math.max(0, APP_PAGES.findIndex((p) => p.id === tabParam));
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | "none">("none");

  // Sync tab with URL
  const goToTab = (index: number, direction?: "left" | "right") => {
    const safeIndex = (index + APP_PAGES.length) % APP_PAGES.length;
    setSlideDirection(direction || (safeIndex > activeIndex ? "left" : "right"));
    setActiveIndex(safeIndex);

    const targetTabId = APP_PAGES[safeIndex].id;
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", targetTabId);
      window.history.replaceState(null, "", url.pathname + url.search);
    });
  };

  const nextTab = () => goToTab(activeIndex + 1, "left");
  const prevTab = () => goToTab(activeIndex - 1, "right");

  // Keep state synced if URL changes from outside
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab) {
      const foundIdx = APP_PAGES.findIndex((p) => p.id === currentTab);
      if (foundIdx >= 0 && foundIdx !== activeIndex) {
        setActiveIndex(foundIdx);
      }
    }
  }, [searchParams]);

  // Touch Swipe Gesture Management (Horizontal swipe with infinite wrap)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.closest(".fixed")
    ) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Must be predominantly horizontal and at least 50px
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      // In RTL (Hebrew):
      // Swiping to Left (deltaX < 0) -> move forward to Next Tab
      // Swiping to Right (deltaX > 0) -> move backward to Prev Tab
      if (deltaX < 0) {
        nextTab();
      } else {
        prevTab();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  };

  // Keyboard Navigation (Arrow navigation when not typing in inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }
      if (e.key === "ArrowLeft") {
        nextTab();
      } else if (e.key === "ArrowRight") {
        prevTab();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex]);

  return (
    <div
      className="space-y-4 sm:space-y-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 🌟 Unified Modern Top Pager Bar (Swipeable & Infinite) */}
      <div className="sticky top-14 sm:top-16 z-40 bg-[#0e161c]/95 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 border-b border-slate-800/90 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Previous Tab Button */}
          <button
            type="button"
            onClick={prevTab}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all shrink-0 cursor-pointer shadow-sm"
            title="עמוד קודם (חץ ימינה / החלקה)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Tab Pills with active highlight */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-0.5 no-scrollbar scroll-smooth flex-1 justify-center">
            {APP_PAGES.map((page, idx) => {
              const Icon = page.icon;
              const isActive = idx === activeIndex;

              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => goToTab(idx)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer select-none ${
                    isActive
                      ? `${page.activeBg} shadow-lg scale-105`
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? page.color : "text-slate-400"}`} />
                  <span className="hidden sm:inline">{page.title}</span>
                  <span className="sm:hidden">{page.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Next Tab Button */}
          <button
            type="button"
            onClick={nextTab}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all shrink-0 cursor-pointer shadow-sm"
            title="עמוד הבא (חץ שמאלה / החלקה)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🌟 Active Page Content (Single-Screen Render with Full Feature Preservation) */}
      <div className="transition-all duration-200 ease-out">
        {activeIndex === 0 && <WaterTestsPage />}
        {activeIndex === 1 && <CalendarPage />}
        {activeIndex === 2 && <InventoryPage />}
        {activeIndex === 3 && <WaterDoctorPage />}
        {activeIndex === 4 && <SettingsPage />}
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
