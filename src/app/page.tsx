"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Droplets,
  Sparkles,
  Package,
  Calendar,
  MailCheck,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Flame,
  Zap,
  RefreshCw,
} from "lucide-react";
import SwipeableMainView from "@/components/SwipeableMainView";

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
      <div className="flex items-center justify-center min-h-[50vh] text-cyan-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // 🌟 If user is logged in, show the Infinite Swipeable Application (One page at a time)
  if (user) {
    return <SwipeableMainView />;
  }
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-800/40 p-8 sm:p-14 text-center shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>מופעל על ידי Gemini 3.7 AI • כימיית מים וניהול ספא חכם</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            הג'קוזי שלך תמיד{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              צלול, מאוזן ובטוח
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            מערכת ניהול מקיפה לבעלי ג'קוזי וספא: מעקב חומרים עם צילומים, אבחון מים מיידי וחישוב מינונים פרטניים, יומן
            טיפולים ותזכורות אוטומטיות ישירות למייל.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all text-base hover:scale-105"
            >
              <span>התחל עכשיו בחינם</span>
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all text-base"
            >
              כניסת משתמש רשום
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">הכלים שישמרו על הג'קוזי מושלם</h2>
          <p className="text-slate-400 text-sm sm:text-base">שקט נפשי ובריאות למתרחצים במינימום מאמץ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl space-y-4 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">ארון חומרים ומלאי</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              העלאת צילומי חומרים, מעקב כמויות בגרם/מ"ל, וזיהוי AI של חומרים חיוניים שחסרים לך בארון.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl space-y-4 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">רופא מים ומינוני AI</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              תיאור מים עכורים, ירוקים או קצף וקבלת מרשם מדויק בגרם לחיטוי ואיזון מותאם לנפח הג'קוזי שלך.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl space-y-4 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">לוח טיפולים מחזורי</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              שטיפת פילטר שבועית, הלכרה, השריה חודשית וריקון רבעוני. יומן אישי להוספת הערות חופשיות.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl space-y-4 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <MailCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">תזכורות אוטומטיות במייל</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              התראות יזומות לקראת החלפת פילטר, הוספת שוק ומילוי מים חדשים שלא תפספס אף טיפול שגרתי.
            </p>
          </div>
        </div>
      </section>

      {/* Ideal Water Parameters Cheat Sheet */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-white">ערכי היעד הרשמיים לאיכות מי ג'קוזי</h2>
            <p className="text-xs text-slate-400">הנחיות מקצועיות לאיזון כימי מושלם</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-center space-y-1">
            <div className="text-xs text-slate-400">חומציות (pH)</div>
            <div className="text-xl font-bold text-cyan-400">7.2 - 7.6</div>
            <div className="text-[11px] text-slate-500">אידיאלי: 7.4</div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-center space-y-1">
            <div className="text-xs text-slate-400">כלור חופשי (Free Cl)</div>
            <div className="text-xl font-bold text-sky-400">3.0 - 5.0 ppm</div>
            <div className="text-[11px] text-slate-500">ברום: 3.0 - 6.0 ppm</div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-center space-y-1">
            <div className="text-xs text-slate-400">בסיסיות כוללת (TA)</div>
            <div className="text-xl font-bold text-blue-400">80 - 120 ppm</div>
            <div className="text-[11px] text-slate-500">מייצב את ה-pH</div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-center space-y-1">
            <div className="text-xs text-slate-400">שטיפת פילטר</div>
            <div className="text-xl font-bold text-emerald-400">כל 7 ימים</div>
            <div className="text-[11px] text-slate-500">השריה עמוקה כל 30 יום</div>
          </div>
        </div>
      </section>
    </div>
  );
}
