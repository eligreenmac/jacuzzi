import nodemailer from "nodemailer";

export interface SendReminderEmailParams {
  to: string;
  userName?: string;
  tasks: Array<{
    title: string;
    description?: string | null;
    dueDate: Date | string;
    priority?: string;
  }>;
  jacuzziName?: string;
}

export function getMailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendMaintenanceReminderEmail(params: SendReminderEmailParams): Promise<{ success: boolean; messageId?: string; mock?: boolean; error?: string }> {
  const transporter = getMailTransporter();
  const from = process.env.SMTP_FROM || `"Jacuzzi Spa Master" <${process.env.SMTP_USER || "noreply@jacuzzi.com"}>`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const tasksHtml = params.tasks
    .map(
      (t) => `
      <div style="background-color: #f0fdf4; border-right: 4px solid #10b981; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; direction: rtl; text-align: right;">
        <h4 style="margin: 0 0 4px 0; color: #065f46; font-size: 16px;">💧 ${t.title}</h4>
        <p style="margin: 0 0 6px 0; color: #4b5563; font-size: 14px;">${t.description || "ללא פירוט נוסף"}</p>
        <span style="display: inline-block; font-size: 12px; color: #047857; background: #d1fae5; padding: 2px 8px; border-radius: 9999px;">
          תאריך יעד: ${new Date(t.dueDate).toLocaleDateString("he-IL")}
        </span>
      </div>
    `
    )
    .join("");

  const emailHtml = `
  <!DOCTYPE html>
  <html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8">
    <title>תזכורת טיפול לג'קוזי שלך</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; direction: rtl; text-align: right;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
              <td style="padding: 28px 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 24px;">✨ Jacuzzi Spa Master</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">תזכורת תחזוקה תקופתית עבור ${params.jacuzziName || "הג'קוזי שלך"}</p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 24px;">
                <p style="font-size: 16px; color: #1f2937; margin-top: 0;">
                  שלום ${params.userName || "יקר"},
                </p>
                <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
                  זה הזמן להעניק לג'קוזי קצת אהבה כדי לשמור על מים צלולים, נקיים ובטוחים לרחצה.
                  להלן המשימות הממתינות לביצוע:
                </p>

                <div style="margin: 20px 0;">
                  ${tasksHtml}
                </div>

                <div style="text-align: center; margin: 28px 0 12px 0;">
                  <a href="${appUrl}/calendar" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
                    כניסה ליומן הטיפולים וסימון ביצוע
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

  if (!transporter) {
    console.log(`[SMTP Mock Mode] Email would be sent to: ${params.to}`);
    console.log(`[SMTP Tasks count]: ${params.tasks.length}`);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: `💧 תזכורת טיפול לג'קוזי: ${params.tasks[0]?.title || "משימות פתוחות"}`,
      html: emailHtml,
    });
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("Failed to send email via SMTP:", err);
    return { success: false, error: err.message };
  }
}
