import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma, ensureDbSchema } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_ID, getAppUrl } from "@/lib/stripe";
import { isLemonSqueezyConfigured, createLemonSqueezyCheckout } from "@/lib/lemonsqueezy";
import { isAdminUser } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    await ensureDbSchema();

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "משתמש לא מחובר" }, { status: 401 });
    }

    if (isAdminUser(user.email)) {
      return NextResponse.json({
        error: "הינך מנהל מערכת ופטור מתשלום לצמיתות!",
      }, { status: 400 });
    }

    const appUrl = getAppUrl();

    // 1. Prioritize Lemon Squeezy (fully supports Israel, Apple Pay, Google Pay, PayPal)
    if (isLemonSqueezyConfigured()) {
      try {
        const checkoutUrl = await createLemonSqueezyCheckout({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          redirectUrl: `${appUrl}/?billing=success`,
        });

        return NextResponse.json({ url: checkoutUrl, provider: "lemonsqueezy" });
      } catch (lemonErr: any) {
        console.error("Lemon Squeezy checkout error:", lemonErr);
        return NextResponse.json({
          error: `שגיאה ביצירת תשלום ב-Lemon Squeezy: ${lemonErr.message}`,
        }, { status: 500 });
      }
    }

    // 2. Fallback to Stripe if configured
    if (stripe) {
      // Get or Create Stripe Customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.email.split("@")[0],
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }

      let lineItems: any[] = [];
      if (STRIPE_PRICE_ID) {
        lineItems = [{ price: STRIPE_PRICE_ID, quantity: 1 }];
      } else {
        lineItems = [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Jacuzzi AI Pro - מנוי חודשי מלא",
                description: "אבחון וניתוח מים עם AI, חישוב מינונים מדויקים, שליטה במלאי והתראות תחזוקה",
              },
              unit_amount: 500, // $5.00
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ];
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: lineItems,
        success_url: `${appUrl}/?billing=success`,
        cancel_url: `${appUrl}/?billing=cancel`,
        metadata: {
          userId: user.id,
        },
      });

      return NextResponse.json({ url: session.url, provider: "stripe" });
    }

    // 3. Neither provider configured
    return NextResponse.json({
      error: "שירות הסליקה של Lemon Squeezy עדיין אינו מוגדר. אנא הגדר את LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID ו-LEMON_SQUEEZY_VARIANT_ID בהגדרות הסביבה (Environment Variables).",
    }, { status: 503 });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json({
      error: err.message || "שגיאה ביצירת קישור לתשלום",
    }, { status: 500 });
  }
}
