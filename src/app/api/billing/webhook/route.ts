import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbSchema } from "@/lib/prisma";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { isAdminUser } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: any;

  try {
    if (STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  await ensureDbSchema();

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
        } else if (customerId) {
          const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
          if (user && !isAdminUser(user.email)) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: "ACTIVE",
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
            data: {
              subscriptionStatus: "EXPIRED",
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (user && !isAdminUser(user.email)) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "ACTIVE",
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (user && !isAdminUser(user.email)) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "PAST_DUE",
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing Stripe webhook:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
