"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Droplets, Lock, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState(
    searchParams.get("notice") === "account_deleted"
      ? "החשבון שלך וכל הנתונים נמחקו בהצלחה מהמערכת."
      : ""
  );
  const [error, setError] = useState(
    searchParams.get("error") === "google_not_configured"
      ? "התחברות רשמית ב-Google דורשת הזנת מזהה GOOGLE_CLIENT_ID בהגדרות הסביבה (Google Cloud). עד אז ניתן להיכנס רגיל עם אימייל וסיסמה."
      : searchParams.get("error")
      ? "אימות עם Google נכשל, נסה שנית או התחבר עם אימייל."
      : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "התחברות נכשלה");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 items-center justify-center shadow-lg shadow-cyan-500/20">
          <Droplets className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">כניסה למערכת</h1>
        <p className="text-sm text-slate-400">הזן פרטים לגישה לניהול הג'קוזי שלך</p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs leading-relaxed">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Official Google OAuth Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 hover:scale-[1.01]"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
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
        <span>התחבר עם Google</span>
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-slate-800" />
        <span className="text-[11px] text-slate-500 font-semibold uppercase">או באמצעות אימייל וסיסמה</span>
        <div className="flex-1 border-t border-slate-800" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">כתובת אימייל</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm"
            />
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">סיסמה</label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm"
            />
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? "מתחבר..." : "התחבר עכשיו"}
          <ArrowLeft className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
        עדיין אין לך חשבון?{" "}
        <Link href="/register" className="text-cyan-400 hover:underline font-semibold">
          הרשם כאן בחינם
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-12">
      <Suspense fallback={<div className="text-center text-cyan-400">טוען...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
