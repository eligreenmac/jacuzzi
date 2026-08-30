# 💧 Jacuzzi Spa Master (ניהול ותחזוקת ג'קוזי חכמה עם Gemini AI)

מערכת Full-Stack מתקדמת בעברית לניהול שגרת תחזוקה של ג'קוזי וספא ביתי, ניטור מלאי כימיקלים עם העלאת תמונות, אבחון מים חכם מבוסס AI (Google Gemini 3.7 / 2.5), יומן טיפולים ותזכורות תקופתיות במייל.

---

## ✨ פיצ'רים מרכזיים

- 🔐 **אימות ורישום משתמשים**: הרשמה והתחברות מאובטחת עם הצפנת סיסמאות ו-JWT Sessions.
- 🛁 **פרופיל ג'קוזי מותאם אישית**: הגדרת נפח מדויק בליטרים, שיטת חיטוי (כלור / ברום / מלח / חמצן פעיל), מיקום ותדירות שימוש.
- 📦 **ארון חומרים ומלאי עם סריקת תמונות**:
  - צילום והעלאת תמונות של תוויות החומרים.
  - מעקב כמויות בגרם/מ"ל עם אזהרות מלאי נמוך וכפתורי הוספה מהירים.
  - **בדיקת AI לחוסרים קריטיים**: זיהוי אוטומטי של חומרים חיוניים שחסרים בארון והסבר מדוע הם נחוצים.
- 🩺 **רופא מים AI (Google Gemini)**:
  - הזנת צלילות מים (צלול, עכור, מקציף, ירוק, ריח חריף) וערכי בדיקת מקלון (pH, כלור, בסיסיות).
  - חישוב מינונים פרטניים בגרמים לפי נפח הג'קוזי שלך.
  - הערכת בטיחות רחצה מיידית ("בטוח לרחצה" / "אין להתרחץ כרגע").
- 📅 **לוח טיפולים מחזורי ויומן אישי**:
  - שגרת טיפולים מובנית (שטיפת פילטר שבועית, שוק חיטוי, ניקוי עמוק חודשי, ריקון צנרת רבעוני).
  - יומן חופשי להוספת הערות, דירוג איכות מים ב-5 כוכבים, ותיעוד פעולות.
- 📩 **התראות ותזכורות במייל**:
  - שליחת תזכורות מעוצבות ב-HTML למייל המשתמש.
  - אפשרות לשליחה ידנית יזומה או תזמון אוטומטי (Cron).

---

## 🚀 טכנולוגיות

- **Framework**: Next.js 14+ (App Router, TypeScript, Tailwind CSS v4)
- **Database & ORM**: Prisma ORM עם SQLite (לוקאלי) ומוכן למעבר ל-PostgreSQL בענן
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Email**: Nodemailer (תמיכה מלאה ב-Gmail App Password, Resend, ו-SMTP)
- **UI & Icons**: Lucide React, תמיכה מלאה ב-RTL ועיצוב Spa Blue יוקרתי

---

## 🛠️ התקנה והרצה מקומית

### 1. שכפול הפרויקט והתקנת תלויות
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd jaccuzy
npm install
```

### 2. הגדרת משתני סביבה (.env)
העתק את קובץ הדוגמה לקובץ `.env`:
```bash
cp .env.example .env
```

ערוך את קובץ `.env` לפי הצורך:
```env
# מסד נתונים (SQLite לוקאלי)
DATABASE_URL="file:./dev.db"

# מפתח JWT
JWT_SECRET="your-super-secret-jwt-key"

# מפתח Google Gemini API (חינם מ-Google AI Studio)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GEMINI_MODEL="gemini-2.5-flash"

# הגדרות שליחת מיילים (Nodemailer / Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-gmail-app-password"
SMTP_FROM="Jacuzzi Spa Master <your-email@gmail.com>"
```

> **הערה לגבי Gmail**: מומלץ להפעיל אימות דו-שלבי ב-Google ולהפיק "סיסמת אפליקציה" (App Password) בכתובת [Google App Passwords](https://myaccount.google.com/apppasswords).

### 3. יצירת מסד הנתונים
```bash
npx prisma db push
```

### 4. הרצת שרת הפיתוח
```bash
npm run dev
```
פתח את הדפדפן בכתובת: [http://localhost:3000](http://localhost:3000)

---

## 🌐 העלאה ל-GitHub ופריסה בענן (Vercel)

### העלאה ל-GitHub
```bash
git init
git add .
git commit -m "Initial commit - Jacuzzi Spa Master"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### פריסה ב-Vercel
1. חבר את חשבון ה-GitHub שלך ל-[Vercel](https://vercel.com).
2. ייבא את הפרויקט.
3. הגדר את משתני הסביבה (Environment Variables) ב-Vercel Dashboard (`GEMINI_API_KEY`, `JWT_SECRET`, `SMTP_USER`, `SMTP_PASS` וכו').
4. ב-Production מומלץ לחבר מסד נתונים PostgreSQL חינמי (כגון **Supabase** או **Neon Serverless Postgres**) ולהגדיר את ה-`DATABASE_URL` בהתאם.

---

## ⏰ תזמון התראות אוטומטיות (Cron Job)

המערכת מספקת נקודת קצה ייעודית לשליחת מיילים למשימות שהגיע מועדן:
`POST /api/reminders/send`

ניתן לתזמן קריאה יומית או שבועית באמצעות:
- **Vercel Cron Jobs** (קובץ `vercel.json`)
- **GitHub Actions Scheduled Workflow** (למשל כל יום שישי בבוקר)
- **cron-job.org** (שירות חינמי לקריאת Webhook)

---

## 📄 רישיון

פרויקט זה מופץ תחת רישיון MIT.
