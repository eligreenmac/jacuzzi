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
} from "lucide-react";
import FullDiagnosticModal from "./FullDiagnosticModal";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

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

                  {/* 🩺 אבחון כולל לג'קוזי עם AI (ליד כפתור הגדרות) */}
                  <button
                    type="button"
                    onClick={() => setIsDiagnosticModalOpen(true)}
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/70 rounded-xl transition-all shadow-sm group/diag cursor-pointer relative"
                    title="אבחון כולל לג'קוזי (AI)"
                  >
                    <Activity className="w-4 h-4 text-cyan-400 group-hover/diag:scale-110 group-hover/diag:text-cyan-200 transition-all" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0e1823]" />
                  </button>

                  {/* ⚙️ הגדרות הג'קוזי (גלגל שיניים בלבד) */}
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
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    href="/login"
                    className="text-xs text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
                  >
                    התחברות
                  </Link>
                  <Link
                    href="/register"
                    className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                  >
                    הרשמה
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🌟 Comprehensive AI Diagnostic Modal */}
      <FullDiagnosticModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
      />
    </>
  );
}

