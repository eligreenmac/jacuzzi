import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { stripe, getAppUrl } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "משתמש לא מחובר" }, { status: 401 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({
        error: "טרם הוקם חשבון סליקה עבור משתמש זה",
      }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({
        error: "שירות הסליקה אינו מוגדר",
      }, { status: 503 });
    }

    const appUrl = getAppUrl();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Error creating customer portal session:", err);
    return NextResponse.json({
      error: err.message || "שגיאה בפתיחת פורטל ניהול המנוי",
    }, { status: 500 });
  }
}
