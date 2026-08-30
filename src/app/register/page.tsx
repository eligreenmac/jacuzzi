"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Droplets, Mail, Lock, User, Sparkles, ArrowLeft, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    jacuzziName: "הג'קוזי שלי",
    volumeLiters: "1200",
    sanitizationType: "CHLORINE",
    location: "OUTDOOR",
    usageFrequency: "MEDIUM",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "הרשמה נכשלה");
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
    <div className="max-w-xl mx-auto py-8">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 items-center justify-center shadow-lg shadow-cyan-500/20">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">פתיחת חשבון והגדרת ג'קוזי</h1>
          <p className="text-sm text-slate-400">הזן פרטים אישיים ומאפייני הג'קוזי לחישוב מינונים מדויק</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Quick Sign-Up */}
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
          <span>הרשמה מהירה בלחיצה אחת עם Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-slate-800" />
          <span className="text-[11px] text-slate-500 font-semibold uppercase">או מלא פרטים ידנית</span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <User className="w-4 h-4" />
              <span>1. פרטים אישיים</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">שם מלא</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ישראל ישראלי"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">כתובת אימייל לתזכורות</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your-email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">סיסמה</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="לפחות 6 תווים"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
            </div>
          </div>

          {/* Jacuzzi Parameters */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4" />
              <span>2. מאפייני הג'קוזי שלך</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">שם או כינוי הג'קוזי</label>
                <input
                  type="text"
                  value={formData.jacuzziName}
                  onChange={(e) => setFormData({ ...formData, jacuzziName: e.target.value })}
                  placeholder="הג'קוזי במרפסת"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">נפח מים (בליטרים)</label>
                <input
                  type="number"
                  required
                  min="300"
                  max="10000"
                  step="50"
                  value={formData.volumeLiters}
                  onChange={(e) => setFormData({ ...formData, volumeLiters: e.target.value })}
                  placeholder="1200"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm font-bold text-cyan-300"
                />
                <span className="text-[11px] text-slate-500">משמש לחישוב מינונים מדויק בגרמים</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">שיטת חיטוי עיקרית</label>
                <select
                  value={formData.sanitizationType}
                  onChange={(e) => setFormData({ ...formData, sanitizationType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="CHLORINE">גרגירי כלור (Chlorine)</option>
                  <option value="BROMINE">טבליות ברום (Bromine)</option>
                  <option value="SALT">מערכת מלח (Salt System)</option>
                  <option value="ACTIVE_OXYGEN">חמצן פעיל (Active Oxygen)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">מיקום הג'קוזי</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="OUTDOOR">חצר / גינה פתוחה</option>
                  <option value="ROOF">גג / מרפסת</option>
                  <option value="INDOOR">חלל סגור / בית</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">תדירות שימוש</label>
                <select
                  value={formData.usageFrequency}
                  onChange={(e) => setFormData({ ...formData, usageFrequency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="LIGHT">קלה (פעם-פעמיים בשבוע)</option>
                  <option value="MEDIUM">בינונית (3-4 פעמים בשבוע)</option>
                  <option value="HEAVY">אינטנסיבית (יומיומי / אורחים)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? "יוצר חשבון ומגדיר לוח טיפולים..." : "צור חשבון והתחל לנהל את הג'קוזי"}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          כבר יש לך חשבון?{" "}
          <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
            התחבר כאן
          </Link>
        </div>
      </div>
    </div>
  );
}
