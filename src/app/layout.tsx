import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Jacuzzi Spa Master - ניהול תחזוקת ג'קוזי חכמה עם AI",
  description: "מערכת מתקדמת לניהול מלאי כימיקלים, אבחון מים עם Gemini 3.7 AI, יומן טיפולים ותזכורות במייל.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Jacuzzi Spa Master • מנוהל באמצעות Google Gemini AI • תחזוקת מים וספא</p>
        </footer>
      </body>
    </html>
  );
}
