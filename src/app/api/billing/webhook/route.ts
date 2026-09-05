import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbSchema } from "@/lib/prisma";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy";
import { isAdminUser } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const lemonSig = req.headers.get("x-signature");
  const stripeSig = req.headers.get("stripe-signature");

  await ensureDbSchema();

  // 1. Handle Lemon Squeezy Webhook
  if (lemonSig || (!stripeSig && body.includes("meta") && body.includes("event_name"))) {
    try {
      if (!verifyLemonSqueezySignature(body, lemonSig)) {
        console.error("Lemon Squeezy signature verification failed");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      const payload = JSON.parse(body);
      const eventName = payload?.meta?.event_name;
      const customData = payload?.meta?.custom_data;
      const attributes = payload?.data?.attributes;
      const dataId = payload?.data?.id;

      const userId = customData?.user_id;
      const userEmail = attributes?.user_email || attributes?.customer_email;
      const customerId = attributes?.customer_id ? String(attributes.customer_id) : null;
      const subscriptionId = dataId ? String(dataId) : null;
      const status = attributes?.status;
      const renewsAt = attributes?.renews_at || attributes?.ends_at;

      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      }
      if (!user && userEmail) {
        user = await prisma.user.findFirst({
          where: { email: { equals: userEmail, mode: "insensitive" } },
        });
      }
      if (!user && customerId) {
        user = await prisma.user.findFirst({
          where: { lemonSqueezyCustomerId: customerId },
        });
      }

      if (user && !isAdminUser(user.email)) {
        switch (eventName) {
          case "subscription_created":
          case "subscription_updated":
          case "subscription_resumed":
          case "subscription_payment_success": {
            let subscriptionStatus = "ACTIVE";
            if (status === "cancelled") {
              subscriptionStatus = renewsAt && new Date(renewsAt).getTime() > Date.now() ? "ACTIVE" : "EXPIRED";
            } else if (status === "past_due" || status === "unpaid") {
              subscriptionStatus = "PAST_DUE";
            } else if (status === "expired") {
              subscriptionStatus = "EXPIRED";
            }

            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus,
                lemonSqueezyCustomerId: customerId || user.lemonSqueezyCustomerId,
                lemonSqueezySubscriptionId: subscriptionId || user.lemonSqueezySubscriptionId,
                currentPeriodEnd: renewsAt ? new Date(renewsAt) : user.currentPeriodEnd,
              },
            });
            break;
          }

          case "subscription_cancelled": {
            const isStillValid = renewsAt && new Date(renewsAt).getTime() > Date.now();
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: isStillValid ? "ACTIVE" : "CANCELED",
                currentPeriodEnd: renewsAt ? new Date(renewsAt) : user.currentPeriodEnd,
              },
            });
            break;
          }

          case "subscription_expired": {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: "EXPIRED" },
            });
            break;
          }

          case "subscription_payment_failed": {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: "PAST_DUE" },
            });
            break;
          }

          case "order_created": {
            if (status === "paid") {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  subscriptionStatus: "ACTIVE",
                  lemonSqueezyCustomerId: customerId || user.lemonSqueezyCustomerId,
                },
              });
            }
            break;
          }
        }
      }

      return NextResponse.json({ received: true, provider: "lemonsqueezy" });
    } catch (err: any) {
      console.error("Error processing Lemon Squeezy webhook:", err);
      return NextResponse.json({ error: "Lemon Squeezy webhook handler failed" }, { status: 500 });
    }
  }

  // 2. Handle Stripe Webhook
  if (stripe) {
    let event: any;
    try {
      if (STRIPE_WEBHOOK_SECRET && stripeSig) {
        event = stripe.webhooks.constructEvent(body, stripeSig, STRIPE_WEBHOOK_SECRET);
      } else {
        event = JSON.parse(body);
      }
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const userId = session.metadata?.userId;

          if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && !isAdminUser(user.email)) {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  subscriptionStatus: "ACTIVE",
                  stripeCustomerId: customerId || user.stripeCustomerId,
                  stripeSubscriptionId: subscriptionId || user.stripeSubscriptionId,
                },
              });
            }
          }
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.created": {
          const subscription = event.data.object as any;
          const customerId = subscription.customer as string;
          const status = subscription.status;
          const periodEndMs = subscription.current_period_end ? subscription.current_period_end * 1000 : null;

          const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
          if (user && !isAdminUser(user.email)) {
            let newStatus = user.subscriptionStatus;
            if (status === "active" || status === "trialing") {
              newStatus = "ACTIVE";
            } else if (status === "past_due") {
              newStatus = "PAST_DUE";
            } else if (status === "canceled" || status === "unpaid") {
              newStatus = "EXPIRED";
            }

            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: newStatus,
                stripeSubscriptionId: subscription.id,
                currentPeriodEnd: periodEndMs ? new Date(periodEndMs) : user.currentPeriodEnd,
              },
            });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as any;
          const customerId = subscription.customer as string;

          const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
          if (user && !isAdminUser(user.email)) {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: "EXPIRED" },
            });
          }
          break;
        }
      }

      return NextResponse.json({ received: true, provider: "stripe" });
    } catch (err: any) {
      console.error("Error processing Stripe webhook:", err);
      return NextResponse.json({ error: "Stripe webhook handler failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "No billing provider configured" }, { status: 500 });
}
