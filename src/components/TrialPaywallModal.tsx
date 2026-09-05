"use client";

import { useState } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  Lock,
  CreditCard,
  ShieldCheck,
  Zap,
  Clock,
  ArrowLeft,
  Crown,
} from "lucide-react";

interface TrialPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExpired?: boolean;
  daysLeft?: number;
}

export default function TrialPaywallModal({
  isOpen,
  onClose,
  isExpired = false,
  daysLeft = 0,
}: TrialPaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "שגיאה ביצירת קישור לתשלום");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("לא התקבל קישור תשלום מ-Stripe");
      }
    } catch (err: any) {
      setError(err.message || "שגיאה בחיבור לשירות התשלומים");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={isExpired ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0b131b] border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden text-right p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Close Button (only if not strictly expired) */}
        {!isExpired && (
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 top-4 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Header & Icon */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-950/80">
            <div className="w-full h-full bg-[#080e14] rounded-[22px] flex items-center justify-center text-sky-300">
              {isExpired ? <Lock className="w-8 h-8 text-amber-400" /> : <Crown className="w-8 h-8 text-sky-400" />}
            </div>
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-sky-950 text-sky-300 border border-sky-800/80 tracking-wider">
              JACUZZI AI PRO SUBSCRIPTION
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white pt-1">
              {isExpired ? "תקופת הניסיון החינמית הסתיימה" : "שדרג ל-Jacuzzi AI Pro"}
            </h2>
            <p className="text-xs text-slate-300">
              {isExpired
                ? "כדי להמשיך להשתמש באבחוני AI, חישוב מינונים וניהול המערכת – שדרג למנוי מלא ב-$5 בלבד לחודש."
                : `נשארו לך עוד ${daysLeft} ימים לתקופת הניסיון. שדרג עכשיו והבטח שימוש רציף ללא הגבלה.`}
            </p>
          </div>
        </div>

        {/* Pricing Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 via-indigo-950/60 to-cyan-950/80 border border-sky-700/50 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-300 block">מחיר מנוי חודשי מלא:</span>
            <div className="flex items-baseline gap-1 pt-0.5">
              <span className="text-3xl font-black text-white">$5.00</span>
              <span className="text-xs text-sky-300 font-bold">/ חודש</span>
            </div>
          </div>

          <div className="text-left space-y-0.5">
            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold block">
              ✓ ללא התחייבות
            </span>
            <span className="text-[10px] text-slate-400 block text-right">ביטול בכל עת בלחיצה</span>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>אבחון וסריקת מים מלאה עם AI:</strong> זיהוי בעיות, עכירות וחריגות</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>מחשבון מינונים והוראות איזון:</strong> חישוב מדויק לפי נפח הג'קוזי שלך</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>ניהול ארון חומרים ומלאי:</strong> זיהוי צילומי חומרים והתראות חוסר</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>שגרות תחזוקת מתקן ותזכורות:</strong> שטיפת פילטרים, חיטוי, צנרת והחלפות מים</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-black text-sm shadow-lg shadow-sky-900/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>מעביר לדף תשלום מאובטח...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>המשך לתשלום מאובטח של $5</span>
                <ArrowLeft className="w-4 h-4 mr-auto" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>סליקה מאובטחת ע"י Lemon Squeezy • תמיכה ב-Apple Pay, Google Pay, PayPal וכרטיסי אשראי</span>
          </div>
        </div>
      </div>
    </div>
  );
}
