# SafetyOS - מערכת ניהול בטיחות

פלטפורמת EHS לניהול מפגעי בטיחות, בקרת כניסה לאתר והפקת דוחות.

---

## דרישות מוקדמות

- Node.js 18+
- PostgreSQL (מקומי או Supabase)
- npm

---

## הפעלה ראשונה (Setup)

### 1. התקנת תלויות

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. הגדרת משתני סביבה

```bash
cd backend
copy .env.example .env
```

ערוך את הקובץ `.env` עם הפרטים שלך:

```
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/safetyos
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
NODE_ENV=development
```

### 3. יצירת בסיס הנתונים

```bash
# צור DB בשם safetyos ב-PostgreSQL, לאחר מכן:
cd backend
psql %DATABASE_URL% -f migrations/001_init.sql
psql %DATABASE_URL% -f seeds/seed.sql
```

---

## הפעלת השרתים

פתח **שני חלונות טרמינל** במקביל:

### טרמינל 1 — Backend (API)

```bash
cd backend
npm start
```

השרת יעלה על: **http://localhost:4000**

בדיקת תקינות: http://localhost:4000/api/health

### טרמינל 2 — Frontend (UI)

```bash
cd frontend
npm run dev
```

האפליקציה תעלה על: **http://localhost:5173**

---

## הרצת בדיקות

```bash
cd backend
npm test
```

---

## מסכי האפליקציה

| מסלול | תיאור |
|-------|-------|
| `/` | לוח בקרה — רשימת מפגעים + כפתור PDF |
| `/report` | טופס דיווח מפגע מהשטח (מותאם לנייד) |
| `/gate` | בקרת כניסה — בדיקת עובד לפי ת.ז |

---

## ממשק API

| Method | Route | תיאור |
|--------|-------|-------|
| GET | `/api/health` | בדיקת תקינות |
| POST | `/api/hazards/report` | דיווח מפגע (multipart/form-data) |
| GET | `/api/hazards` | רשימת כל המפגעים |
| POST | `/api/gate/check` | בדיקת כניסת עובד |
| GET | `/api/workers` | רשימת עובדים |
| GET | `/api/reports/pdf` | הורדת דוח PDF |

---

## נתוני בדיקה (seed)

| שם | ת.ז | סטטוס הדרכה |
|----|-----|-------------|
| משה לוי | 123456789 | תקף (100 ימים) → כניסה מאושרת |
| שרה כהן | 987654321 | פג (400 ימים) → כניסה נדחתה |
