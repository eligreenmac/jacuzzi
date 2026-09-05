export const ADMIN_EMAILS = [
  "eligreenmail@gmail.com",
];

export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase().trim() === normalized);
}

export type SubscriptionStatus = "ADMIN" | "ACTIVE" | "TRIAL" | "EXPIRED" | "PAST_DUE" | "CANCELED";

export interface UserSubscriptionDetails {
  status: SubscriptionStatus;
  isAdmin: boolean;
  hasAccess: boolean;
  isTrial: boolean;
  isPaying: boolean;
  daysLeftInTrial: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  formattedStatus: string;
  badgeColor: string;
}

export function getUserSubscriptionInfo(user?: {
  email?: string | null;
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  createdAt?: Date | string | null;
} | null): UserSubscriptionDetails {
  if (!user || !user.email) {
    return {
      status: "EXPIRED",
      isAdmin: false,
      hasAccess: false,
      isTrial: false,
      isPaying: false,
      daysLeftInTrial: 0,
      trialEndsAt: null,
      currentPeriodEnd: null,
      formattedStatus: "לא מחובר",
      badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    };
  }

  // 1. Check if user is system administrator
  if (isAdminUser(user.email) || user.subscriptionStatus === "ADMIN") {
    return {
      status: "ADMIN",
      isAdmin: true,
      hasAccess: true,
      isTrial: false,
      isPaying: true,
      daysLeftInTrial: 9999,
      trialEndsAt: null,
      currentPeriodEnd: null,
      formattedStatus: "מנהל מערכת (גישה מלאה ללא הגבלה)",
      badgeColor: "bg-purple-950/80 text-purple-200 border-purple-800/80",
    };
  }

  // 2. Check if user has active paid subscription
  if (user.subscriptionStatus === "ACTIVE") {
    return {
      status: "ACTIVE",
      isAdmin: false,
      hasAccess: true,
      isTrial: false,
      isPaying: true,
      daysLeftInTrial: 0,
      trialEndsAt: user.trialEndsAt ? new Date(user.trialEndsAt).toISOString() : null,
      currentPeriodEnd: user.currentPeriodEnd ? new Date(user.currentPeriodEnd).toISOString() : null,
      formattedStatus: "מנוי Pro פעיל ($5/חודש)",
      badgeColor: "bg-emerald-950/80 text-emerald-200 border-emerald-800/80",
    };
  }

  // 3. Check Free Trial status (14 days)
  let trialEndMs: number;
  if (user.trialEndsAt) {
    trialEndMs = new Date(user.trialEndsAt).getTime();
  } else if (user.createdAt) {
    // Default 14 days from registration if trialEndsAt is not yet set
    trialEndMs = new Date(user.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000;
  } else {
    trialEndMs = Date.now() + 14 * 24 * 60 * 60 * 1000;
  }

  const nowMs = Date.now();
  const msRemaining = trialEndMs - nowMs;
  const daysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  if (msRemaining > 0) {
    return {
      status: "TRIAL",
      isAdmin: false,
      hasAccess: true,
      isTrial: true,
      isPaying: false,
      daysLeftInTrial: daysLeft,
      trialEndsAt: new Date(trialEndMs).toISOString(),
      currentPeriodEnd: null,
      formattedStatus: `תקופת ניסיון (${daysLeft} ימים נותרו)`,
      badgeColor: "bg-sky-950/80 text-sky-200 border-sky-800/80",
    };
  }

  // 4. Trial Expired
  return {
    status: (user.subscriptionStatus as SubscriptionStatus) || "EXPIRED",
    isAdmin: false,
    hasAccess: false,
    isTrial: false,
    isPaying: false,
    daysLeftInTrial: 0,
    trialEndsAt: new Date(trialEndMs).toISOString(),
    currentPeriodEnd: user.currentPeriodEnd ? new Date(user.currentPeriodEnd).toISOString() : null,
    formattedStatus: "תקופת הניסיון הסתיימה",
    badgeColor: "bg-rose-950/80 text-rose-200 border-rose-800/80",
  };
}
