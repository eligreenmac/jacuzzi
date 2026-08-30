"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Droplets,
  Calendar,
  Sparkles,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  FlaskConical,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
    { href: "/water-doctor", label: "רופא מים AI", icon: Sparkles },
    { href: "/settings", label: "הגדרות", icon: Settings },
  ];

  // Don't show full navigation on login/register/landing pages if not logged in
  const isAuthPage = pathname === "/login" || pathname === "/register" || (pathname === "/" && !user);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-cyan-900/40 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Droplets className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-wide bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Jacuzzi Spa Master
              </span>
              <span className="text-[11px] text-cyan-200/60 -mt-1 font-medium">ניהול תחזוקה ובינה מלאכותית</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          {!isAuthPage && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner font-bold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full">
                  👤 {user.name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/40 transition-colors"
                  title="התנתק"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>התנתקות</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  התחברות
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-4 py-1.5 rounded-lg shadow-md shadow-cyan-600/30 transition-all"
                >
                  הרשמה חינם
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-cyan-900/40 px-4 pt-2 pb-4 space-y-2">
          {!isAuthPage &&
            navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium ${
                    isActive ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <div className="text-xs text-slate-400 px-4">מחובר כ: {user.name || user.email}</div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-right px-4 py-2 text-rose-400 hover:bg-rose-950/30 rounded-lg text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>התנתקות מהחשבון</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg bg-slate-800 text-slate-200 text-sm"
                >
                  התחברות
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium"
                >
                  הרשמה חינם
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
