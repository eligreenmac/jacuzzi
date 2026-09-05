"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import SwipeableMainView from "@/components/SwipeableMainView";

function GoogleAuthCard() {
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const error = searchParams.get("error");

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4" dir="rtl">
      <div className="max-w-md w-full bg-[#0e1823] border-2 border-sky-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-sky-950/70 space-y-6 text-right relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Jacuzzi Spa Master
          </h1>
          <p className="text-sky-300 font-semibold text-xs sm:text-sm">
            המערכת החכמה לשמירה על ג&apos;קוזי צלול, נקי ובטוח
          </p>
        </div>

        {/* Notice Message */}
        {notice === "account_deleted" && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs leading-relaxed relative z-10">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>החשבון שלך וכל הנתונים נמחקו בהצלחה מהמערכת.</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs leading-relaxed relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              {error === "google_not_configured"
                ? "התחברות עם Google דורשת הגדרת מזהה GOOGLE_CLIENT_ID ו-GOOGLE_CLIENT_SECRET ב-Vercel."
                : `שגיאת התחברות: ${error}`}
            </span>
          </div>
        )}

        {/* Single Big Google Sign-in Button */}
        <div className="relative z-10 pt-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-base shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>כניסה מהירה עם Google</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="bg-[#080e14]/90 p-4 rounded-2xl border border-sky-900/40 space-y-2.5 text-xs text-slate-300 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold">💧</span>
            <span>מעקב איכות מים ובדיקות מקלון</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold">🛠️</span>
            <span>שגרות תחזוקת מתקן וסינון</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold">🧪</span>
            <span>שליטה בארון החומרים והמלאי</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold">🤖</span>
            <span>ניתוח AI וסיכום מערכת מקיף</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-sky-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // If user is logged in, show the main dashboard application
  if (user) {
    return <SwipeableMainView />;
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-sky-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <GoogleAuthCard />
    </Suspense>
  );
}
