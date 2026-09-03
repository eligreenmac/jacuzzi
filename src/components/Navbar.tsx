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
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

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

  const navLinks = [
    { href: "/?tab=water-tests", label: "בדיקות מים", icon: FlaskConical },
    { href: "/?tab=calendar", label: "יומן תחזוקה", icon: Calendar },
    { href: "/?tab=inventory", label: "ארון חומרים", icon: Package },
    { href: "/?tab=water-doctor", label: "רופא מים AI", icon: Sparkles },
    { href: "/?tab=settings", label: "הגדרות", icon: Settings },
  ];

  // Don't show full navigation on login/register/landing pages if not logged in
  const isAuthPage = pathname === "/login" || pathname === "/register" || (pathname === "/" && !user);

  return (
    <header className="sticky top-0 z-50 bg-[#0e161c]/90 backdrop-blur-md border-b border-slate-800/80 text-slate-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Navigation Links (Visible on All Devices) */}
          {!isAuthPage && (
            <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                      isActive
                        ? "bg-sky-950/80 text-sky-200 border border-sky-800/80 font-bold shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-sky-300" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <span className="hidden lg:inline text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full">
                  👤 {user.name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-850 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
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
  );
}
