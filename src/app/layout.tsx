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
      <body className="min-h-screen bg-[#0b1115] text-slate-200 antialiased selection:bg-teal-700/40 selection:text-white flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
