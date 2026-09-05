import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { stripe, getAppUrl } from "@/lib/stripe";
import { LEMON_SQUEEZY_API_KEY } from "@/lib/lemonsqueezy";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "משתמש לא מחובר" }, { status: 401 });
    }

    const appUrl = getAppUrl();

    // 1. If user has a Lemon Squeezy Subscription
    if (user.lemonSqueezySubscriptionId && LEMON_SQUEEZY_API_KEY) {
      try {
        const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${user.lemonSqueezySubscriptionId}`, {
          headers: {
            Accept: "application/vnd.api+json",
            Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY.trim()}`,
          },
        });
        const data = await res.json();
        const portalUrl = data?.data?.attributes?.urls?.customer_portal;
        if (portalUrl) {
          return NextResponse.json({ url: portalUrl });
        }
      } catch (err) {
        console.error("Error fetching Lemon Squeezy customer portal:", err);
      }
    }

    // 2. If user has Stripe Customer ID
    if (user.stripeCustomerId && stripe) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${appUrl}/settings`,
      });

      return NextResponse.json({ url: portalSession.url });
    }

    return NextResponse.json({
      error: "טרם נמצא מנוי פעיל לניהול עבור משתמש זה",
    }, { status: 400 });
  } catch (err: any) {
    console.error("Error creating customer portal session:", err);
    return NextResponse.json({
      error: err.message || "שגיאה בפתיחת פורטל ניהול המנוי",
    }, { status: 500 });
  }
}
