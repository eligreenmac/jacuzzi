import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { identifyChemicalFromImage } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const { imageBase64, imageMimeType } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "חובה להעלות או לצלם תמונה של המוצר" }, { status: 400 });
    }

    const result = await identifyChemicalFromImage(imageBase64, imageMimeType || "image/jpeg");

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Identify chemical route error:", error);
    return NextResponse.json({ error: error.message || "שגיאה בזיהוי התמונה" }, { status: 500 });
  }
}
