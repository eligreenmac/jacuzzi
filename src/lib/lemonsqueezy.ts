import crypto from "crypto";
import { getAppUrl } from "./stripe";

export const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY || "";
export const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID || "";
export const LEMON_SQUEEZY_VARIANT_ID = process.env.LEMON_SQUEEZY_VARIANT_ID || "";
export const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "";

export function isLemonSqueezyConfigured(): boolean {
  return Boolean(LEMON_SQUEEZY_API_KEY && LEMON_SQUEEZY_STORE_ID && LEMON_SQUEEZY_VARIANT_ID);
}

export async function createLemonSqueezyCheckout({
  userId,
  userEmail,
  userName,
  redirectUrl,
}: {
  userId: string;
  userEmail: string;
  userName?: string | null;
  redirectUrl?: string;
}): Promise<string> {
  if (!isLemonSqueezyConfigured()) {
    throw new Error("Lemon Squeezy is not fully configured (missing API_KEY, STORE_ID, or VARIANT_ID)");
  }

  const successRedirect = redirectUrl || `${getAppUrl()}/?billing=success`;

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: userEmail,
          name: userName || "",
          custom: {
            user_id: userId,
          },
        },
        product_options: {
          redirect_url: successRedirect,
        },
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: String(LEMON_SQUEEZY_STORE_ID).trim(),
          },
        },
        variant: {
          data: {
            type: "variants",
            id: String(LEMON_SQUEEZY_VARIANT_ID).trim(),
          },
        },
      },
    },
  };

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY.trim()}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg =
      data?.errors?.[0]?.detail ||
      data?.errors?.[0]?.title ||
      data?.message ||
      "Failed to create Lemon Squeezy checkout";
    console.error("Lemon Squeezy checkout error response:", data);
    throw new Error(errorMsg);
  }

  const checkoutUrl = data?.data?.attributes?.url;
  if (!checkoutUrl) {
    throw new Error("Lemon Squeezy did not return a valid checkout URL");
  }

  return checkoutUrl;
}

export function verifyLemonSqueezySignature(rawBody: string, signatureHeader?: string | null): boolean {
  if (!LEMON_SQUEEZY_WEBHOOK_SECRET) {
    // If webhook secret not set, accept in development or return true
    return true;
  }
  if (!signatureHeader) return false;

  try {
    const hmac = crypto.createHmac("sha256", LEMON_SQUEEZY_WEBHOOK_SECRET.trim());
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signature = Buffer.from(signatureHeader, "utf8");

    if (digest.length !== signature.length) {
      return false;
    }
    return crypto.timingSafeEqual(digest, signature);
  } catch (err) {
    console.error("Error verifying Lemon Squeezy webhook signature:", err);
    return false;
  }
}
