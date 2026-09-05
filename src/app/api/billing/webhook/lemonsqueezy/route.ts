import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbSchema } from "@/lib/prisma";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy";
import { isAdminUser } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");

    if (!verifyLemonSqueezySignature(rawBody, signature)) {
      console.error("Lemon Squeezy invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload?.meta?.event_name;
    const customData = payload?.meta?.custom_data;
    const attributes = payload?.data?.attributes;
    const dataId = payload?.data?.id;

    console.log(`[Lemon Squeezy Webhook] Received event: ${eventName}`);

    await ensureDbSchema();

    const userId = customData?.user_id;
    const userEmail = attributes?.user_email || attributes?.customer_email;
    const customerId = attributes?.customer_id ? String(attributes.customer_id) : null;
    const subscriptionId = dataId ? String(dataId) : null;
    const status = attributes?.status; // 'active', 'on_trial', 'past_due', 'unpaid', 'cancelled', 'expired'
    const renewsAt = attributes?.renews_at || attributes?.ends_at;

    // Find the target user in database
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

    if (!user) {
      console.warn(`[Lemon Squeezy Webhook] User not found for email: ${userEmail}, userId: ${userId}`);
      return NextResponse.json({ received: true, note: "User not found" });
    }

    // Admins are always exempt
    if (isAdminUser(user.email)) {
      return NextResponse.json({ received: true, note: "Admin user skipped" });
    }

    // Update subscription according to event type
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_payment_success": {
        let subscriptionStatus = "ACTIVE";
        if (status === "cancelled") {
          // If cancelled but still active until renews_at
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
        // Keeps access until end of billing cycle if renewsAt is in future
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
          data: {
            subscriptionStatus: "EXPIRED",
          },
        });
        break;
      }

      case "subscription_payment_failed": {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "PAST_DUE",
          },
        });
        break;
      }

      case "order_created": {
        // If one-time purchase or order
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

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing Lemon Squeezy webhook:", err);
    return NextResponse.json({ error: "Internal webhook error" }, { status: 500 });
  }
}
