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
                  <button
                    type="button"
                    onClick={() => { window.location.href = "/api/auth/google"; }}
                    className="flex items-center gap-2 text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                    <span>כניסה עם Google</span>
                  </button>
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

