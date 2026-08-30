import { Resend } from "resend";
import nodemailer from "nodemailer";

export interface TaskEmailItem {
  title: string;
  description?: string | null;
  dueDate: Date | string;
  priority?: string;
  isOverdue?: boolean;
  isDueToday?: boolean;
  overdueDays?: number;
}

export interface SendReminderEmailParams {
  to: string;
  userName?: string;
  tasks: TaskEmailItem[];
  jacuzziName?: string;
}

export async function sendMaintenanceReminderEmail(params: SendReminderEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  mock?: boolean;
  provider?: "RESEND" | "SMTP" | "SANDBOX";
  error?: string;
}> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const tasksHtml = params.tasks
    .map((t) => {
      const isUrgentOrOverdue = t.isOverdue || t.isDueToday;
      const badgeBg = t.isOverdue ? "#fee2e2" : t.isDueToday ? "#fef3c7" : "#d1fae5";
      const badgeColor = t.isOverdue ? "#991b1b" : t.isDueToday ? "#92400e" : "#065f46";
      const borderColor = t.isOverdue ? "#ef4444" : t.isDueToday ? "#f59e0b" : "#10b981";
      const statusText = t.isOverdue
        ? `🚨 פג תוקף! באיחור של ${t.overdueDays || 1} ימים`
        : t.isDueToday
        ? `⏰ מועד ביצוע: היום!`
        : `תאריך יעד: ${new Date(t.dueDate).toLocaleDateString("he-IL")}`;

      return `
      <div style="background-color: ${isUrgentOrOverdue ? "#fffaf0" : "#f0fdf4"}; border-right: 4px solid ${borderColor}; border-radius: 10px; padding: 14px 18px; margin-bottom: 14px; direction: rtl; text-align: right; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="margin: 0; color: #111827; font-size: 16px; font-weight: bold;">💧 ${t.title}</h4>
        </div>
        <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${t.description || "ללא פירוט נוסף"}</p>
        <div>
          <span style="display: inline-block; font-size: 12px; font-weight: bold; color: ${badgeColor}; background: ${badgeBg}; padding: 3px 10px; border-radius: 9999px;">
            ${statusText}
          </span>
        </div>
      </div>
    `;
    })
    .join("");

  const hasOverdue = params.tasks.some((t) => t.isOverdue || t.isDueToday);
  const subjectPrefix = hasOverdue ? "🚨 התראת משימות שפגו תוקף בג'קוזי" : "💧 תזכורת טיפול לג'קוזי";
  const headerSubtitle = hasOverdue
    ? "נמצאו משימות שלא סומנו כבוצע ומועדן פג היום או בעבר!"
    : `תזכורת תחזוקה תקופתית עבור ${params.jacuzziName || "הג'קוזי שלך"}`;

  const emailHtml = `
  <!DOCTYPE html>
  <html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8">
    <title>${subjectPrefix}</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; direction: rtl; text-align: right;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr style="background: ${hasOverdue ? "linear-gradient(135deg, #e11d48 0%, #be123c 100%)" : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"};">
              <td style="padding: 28px 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 24px;">${hasOverdue ? "⚠️ התראת תחזוקה לג'קוזי" : "✨ Jacuzzi Spa Master"}</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 15px;">${headerSubtitle}</p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 24px;">
                <p style="font-size: 16px; color: #1f2937; margin-top: 0;">
                  שלום ${params.userName || "יקר"},
                </p>
                <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
                  ${hasOverdue
                    ? "המערכת זיהתה שישנן משימות טיפול חיוניות לג'קוזי שלא סומנו כבוצע ופג תוקפן להיום. מומלץ לבצען בהקדם לשמירה על צלילות המים ובריאות המתרחצים:"
                    : "זה הזמן להעניק לג'קוזי קצת אהבה כדי לשמור על מים צלולים ונקיים. להלן המשימות הממתינות לביצוע:"}
                </p>

                <div style="margin: 20px 0;">
                  ${tasksHtml}
                </div>

                <div style="text-align: center; margin: 28px 0 12px 0;">
                  <a href="${appUrl}/calendar" style="background-color: ${hasOverdue ? "#e11d48" : "#0284c7"}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    כניסה ליומן הטיפולים לסימון ביצוע ועדכון מלאי
                  </a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr style="background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <td style="padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
                הודעה זו נשלחה אוטומטית ממערכת Jacuzzi Spa Master.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // 1. Prioritize Resend Cloud API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.startsWith("re_")) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.EMAIL_FROM || "Jacuzzi Spa Master <onboarding@resend.dev>";

      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [params.to],
        subject: `${subjectPrefix}: ${params.tasks[0]?.title || "משימות לביצוע"}`,
        html: emailHtml,
      });

      if (error) {
        console.error("Resend API Error:", error);
      } else if (data?.id) {
        return {
          success: true,
          messageId: data.id,
          provider: "RESEND",
        };
      }
    } catch (err: any) {
      console.error("Resend delivery exception:", err);
    }
  }

  // 2. Fallback to SMTP if configured
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    try {
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = parseInt(process.env.SMTP_PORT || "465", 10);
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const from = process.env.SMTP_FROM || `"Jacuzzi Spa Master" <${smtpUser}>`;
      const info = await transporter.sendMail({
        from,
        to: params.to,
        subject: `${subjectPrefix}: ${params.tasks[0]?.title || "משימות לביצוע"}`,
        html: emailHtml,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: "SMTP",
      };
    } catch (err: any) {
      console.error("SMTP delivery error:", err);
    }
  }

  // 3. Fallback to Live Sandbox (Ethereal)
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: `"Jacuzzi Spa Master" <noreply@jacuzzi-spa.com>`,
      to: params.to,
      subject: `${subjectPrefix}: ${params.tasks[0]?.title || "משימות לביצוע"}`,
      html: emailHtml,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      provider: "SANDBOX",
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
