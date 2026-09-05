import { NextRequest, NextResponse } from "next/server";

function getCanonicalOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    return `${protocol}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return "https://jacuzzi-five.vercel.app";
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = getCanonicalOrigin(req);
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent("openid email profile")}&` +
    `access_type=offline&` +
    `prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}
