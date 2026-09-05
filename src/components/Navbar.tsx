"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Settings,
  LogOut,
  FlaskConical,
  Calendar,
  Package,
  Droplets,
  Activity,
  Crown,
  Clock,
  CreditCard,
} from "lucide-react";
import FullDiagnosticModal from "./FullDiagnosticModal";
import AdminUsersModal from "./AdminUsersModal";
import TrialPaywallModal from "./TrialPaywallModal";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    isAdmin?: boolean;
    subscriptionDetails?: {
      status: string;
      isAdmin: boolean;
      hasAccess: boolean;
      isTrial: boolean;
      isPaying: boolean;
      daysLeftInTrial: number;
      formattedStatus: string;
      badgeColor: string;
    };
  } | null>(null);

  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleDirectCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutLoading(false);
        throw new Error(data.error || "שגיאה ביצירת קישור לתשלום");
      }

      if (data.url) {
        window.location.href = data.url;
        setTimeout(() => {
          setCheckoutLoading(false);
        }, 3000);
      } else {
        setCheckoutLoading(false);
        throw new Error("לא התקבל קישור תשלום");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "שגיאה בחיבור לשירות התשלומים");
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const handlePageShow = () => {
      setCheckoutLoading(false);
    };
    const handleFocus = () => {
      setCheckoutLoading(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isExpired = !!(user && !user.isAdmin && user.subscriptionDetails && !user.subscriptionDetails.hasAccess);

  if (!user) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0e1823]/95 backdrop-blur-md border-b border-sky-900/40 text-slate-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo / App Title */}
            <Link
              href="/"
              className="flex items-center gap-2 text-sm sm:text-base font-black text-white hover:text-sky-300 transition-colors select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-950 border border-sky-800/80 flex items-center justify-center text-sky-400 shadow-inner">
                <Droplets className="w-4 h-4" />
              </div>
              <span>Jacuzzi Spa Master</span>
            </Link>

            {/* User actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <span className="hidden lg:inline text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full">
                    👤 {user.name || user.email}
                  </span>

                  {/* 📦 ארון חומרים ומלאי */}
                  <Link
                    href="/inventory"
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-sky-300 hover:text-white bg-sky-950/80 hover:bg-sky-900 border border-sky-800/70 rounded-xl transition-all shadow-sm"
                    title="ארון חומרים ומלאי"
                  >
                    <Package className="w-4 h-4" />
                  </Link>

                  {/* 🩺 אבחון כולל לג'קוזי עם AI */}
                  <button
                    type="button"
                    onClick={() => setIsDiagnosticModalOpen(true)}
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/70 rounded-xl transition-all shadow-sm group/diag cursor-pointer"
                    title="אבחון כולל לג'קוזי (AI)"
                  >
                    <Activity className="w-4 h-4 text-cyan-400 group-hover/diag:scale-110 group-hover/diag:text-cyan-200 transition-all" />
                  </button>

                  {/* 👑 מסך ניהול מנהל מערכת (מוצג אך ורק למשתמש המנהל eligreenmail@gmail.com) */}
                  {user.isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsAdminModalOpen(true)}
                      className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-amber-300 hover:text-white bg-purple-950/90 hover:bg-purple-900 border border-purple-700/80 rounded-xl transition-all shadow-md group/admin cursor-pointer"
                      title="מרכז ניהול מערכת ומנויים (Admin)"
                    >
                      <Crown className="w-4 h-4 text-amber-400 group-hover/admin:scale-110 transition-transform" />
                    </button>
                  )}

                  {/* ⚙️ הגדרות הג'קוזי (גלגל שיניים) */}
                  <Link
                    href="/settings"
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-sky-300 hover:text-white bg-sky-950/80 hover:bg-sky-900 border border-sky-800/70 rounded-xl transition-all shadow-sm"
                    title="הגדרות"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-850 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-800 transition-colors"
                    title="התנתק"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">התנתקות</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* 🌟 Free Trial Banner (Shown for non-paying users within trial) */}
        {user && user.subscriptionDetails?.isTrial && !user.isAdmin && (
          <div className="bg-gradient-to-r from-sky-950/95 via-indigo-950/90 to-sky-950/95 border-t border-sky-800/40 py-2 px-4 text-center text-xs flex items-center justify-center gap-3 shadow-inner">
            <span className="text-sky-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                <strong>תקופת ניסיון חינם:</strong> נותרו לך עוד{" "}
                <strong className="text-white bg-sky-900/80 px-1.5 py-0.5 rounded-md border border-sky-700/60">
                  {user.subscriptionDetails.daysLeftInTrial} ימים
                </strong>
              </span>
            </span>
            <button
              type="button"
              onClick={handleDirectCheckout}
              disabled={checkoutLoading}
              className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-[11px] transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {checkoutLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>מעביר לתשלום...</span>
                </>
              ) : (
                <span>קנה מנוי</span>
              )}
            </button>
          </div>
        )}
      </header>

      {/* 🌟 Comprehensive AI Diagnostic Modal */}
      <FullDiagnosticModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
      />

      {/* 👑 Admin Users & Business Dashboard Modal */}
      {user?.isAdmin && (
        <AdminUsersModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}

      {/* 💳 Free Trial / Paywall Modal */}
      <TrialPaywallModal
        isOpen={isPaywallModalOpen || isExpired}
        onClose={() => setIsPaywallModalOpen(false)}
        isExpired={isExpired}
        daysLeft={user?.subscriptionDetails?.daysLeftInTrial || 0}
      />
    </>
  );
}

