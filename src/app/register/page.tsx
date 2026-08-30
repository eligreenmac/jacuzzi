"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Droplets, Mail, Lock, User, Sparkles, ArrowLeft, AlertCircle, Info } from "lucide-react";

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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm"
                />
                <span className="text-[11px] text-slate-500">לרוב ג'קוזי ממוצע מכיל בין 800 ל-1,500 ליטר</span>
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
