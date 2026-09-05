"use client";

import { useState, useEffect } from "react";
import {
  X,
  Shield,
  Crown,
  Users,
  CreditCard,
  Clock,
  DollarSign,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Waves,
  Mail,
} from "lucide-react";

interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  trialEndsAt: string | null;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  jacuzziName: string;
  waterLogsCount: number;
  tasksCount: number;
  chemicalsCount: number;
  subDetails: {
    status: string;
    isAdmin: boolean;
    hasAccess: boolean;
    isTrial: boolean;
    isPaying: boolean;
    daysLeftInTrial: number;
    formattedStatus: string;
    badgeColor: string;
  };
}

interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  trialUsers: number;
  expiredUsers: number;
  adminUsers: number;
  estimatedMonthlyRevenueUSD: number;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminUsersModal({ isOpen, onClose }: AdminUsersModalProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "PAYING" | "TRIAL" | "EXPIRED">("ALL");

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "שגיאה בטעינת נתוני מנהל");
      }
      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.jacuzziName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === "PAYING") {
      return u.subDetails.status === "ACTIVE";
    }
    if (selectedFilter === "TRIAL") {
      return u.subDetails.status === "TRIAL";
    }
    if (selectedFilter === "EXPIRED") {
      return u.subDetails.status === "EXPIRED" || u.subDetails.status === "CANCELED";
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b131b] border border-purple-900/40 rounded-3xl shadow-2xl overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-900/30 bg-gradient-to-l from-purple-950/40 via-slate-900/60 to-[#0b131b]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-300 shadow-inner">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  מרכז ניהול מערכת ומנויים
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  ADMIN EXCLUSIVE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                מעקב משתמשים רשומים, הכנסות, מנויים פעילים וסטטוס תקופות ניסיון
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAdminData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="רענן נתונים"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* KPI Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Total Users */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-950/70 border border-blue-800/50 flex items-center justify-center text-blue-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">סה"כ משתמשים</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{stats.totalUsers}</span>
                </div>
              </div>

              {/* Card 2: Active Subscribers */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-900/40 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-emerald-400 block font-medium">משלמים פעילים ($5)</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-300">{stats.activeSubscribers}</span>
                </div>
              </div>

              {/* Card 3: Free Trial Users */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-900/40 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-950/70 border border-sky-800/50 flex items-center justify-center text-sky-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-sky-400 block font-medium">בניסיון חינם (14 יום)</span>
                  <span className="text-xl sm:text-2xl font-black text-sky-300">{stats.trialUsers}</span>
                </div>
              </div>

              {/* Card 4: Estimated MRR */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-900/40 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-amber-400 block font-medium">הכנסה חודשית (MRR)</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-300">${stats.estimatedMonthlyRevenueUSD}</span>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חיפוש לפי אימייל או שם..."
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-purple-500 focus:outline-none text-xs text-white placeholder-slate-500 transition-all"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === "ALL"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                הכל ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("PAYING")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === "PAYING"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                משלמים ({stats?.activeSubscribers || 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("TRIAL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === "TRIAL"
                    ? "bg-sky-600 text-white shadow-md"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                בניסיון ({stats?.trialUsers || 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("EXPIRED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === "EXPIRED"
                    ? "bg-rose-600 text-white shadow-md"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                פג תוקף ({stats?.expiredUsers || 0})
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2.5">
            {loading && users.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                <span>טוען רשימת משתמשים...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                לא נמצאו משתמשים תואמים לחיפוש
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredUsers.map((u) => {
                  const regDate = new Date(u.createdAt).toLocaleDateString("he-IL");
                  const isUserAdmin = u.subDetails.isAdmin;
                  const isPaying = u.subDetails.status === "ACTIVE";
                  const isTrial = u.subDetails.status === "TRIAL";

                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isUserAdmin
                          ? "bg-purple-950/20 border-purple-800/40"
                          : isPaying
                          ? "bg-emerald-950/20 border-emerald-800/40"
                          : isTrial
                          ? "bg-sky-950/20 border-sky-800/40"
                          : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 font-black text-sm ${
                            isUserAdmin
                              ? "bg-purple-950 text-amber-300 border-purple-700"
                              : isPaying
                              ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                              : isTrial
                              ? "bg-sky-950 text-sky-300 border-sky-700"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {isUserAdmin ? <Crown className="w-5 h-5 text-amber-400" /> : u.email.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm truncate">
                              {u.name || u.email.split("@")[0]}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({u.email})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>הצטרף: {regDate}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Waves className="w-3 h-3 text-sky-400" />
                              <span>{u.jacuzziName}</span>
                            </span>
                            <span>• {u.waterLogsCount} בדיקות</span>
                            <span>• {u.tasksCount} משימות</span>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Status Badge */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${u.subDetails.badgeColor}`}
                        >
                          {isUserAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                          {isPaying && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {isTrial && <Clock className="w-3.5 h-3.5 text-sky-400" />}
                          <span>{u.subDetails.formattedStatus}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-900/30 bg-[#080e14] flex items-center justify-between text-xs text-slate-400">
          <span>ניהול מאובטח • מוגבל למנהל המערכת בלבד</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            סגור חלון
          </button>
        </div>
      </div>
    </div>
  );
}
