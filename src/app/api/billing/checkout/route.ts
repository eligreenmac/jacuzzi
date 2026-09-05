import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma, ensureDbSchema } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_ID, getAppUrl } from "@/lib/stripe";
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

    if (!stripe) {
      return NextResponse.json({
        error: "שירות הסליקה של Stripe עדיין אינו מוגדר. אנא הגדר את STRIPE_SECRET_KEY בקובץ .env",
      }, { status: 503 });
    }

    const appUrl = getAppUrl();

    // 1. Get or Create Stripe Customer
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

    // 2. Prepare Line Items ($5 / Month)
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

    // 3. Create Checkout Session
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

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Error creating Stripe checkout session:", err);
    return NextResponse.json({
      error: err.message || "שגיאה ביצירת קישור לתשלום",
    }, { status: 500 });
  }
}
