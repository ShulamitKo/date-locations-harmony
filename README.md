<div align="center">

# 📍 מקומות לדייטים

### פלטפורמה חברתית למציאה, שיתוף ודירוג של מקומות לדייטים ברחבי הארץ

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=flat-square&logo=mapbox&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

**[לאתר החי →](https://datespots.vercel.app/)**

</div>

<div dir="rtl" align="right">

## מה הבעיה

"איפה יוצאים הערב?" היא שאלה שחוזרת אצל כולם, והתשובה מפוזרת: המלצות בקבוצות וואטסאפ, פוסטים ישנים, וזיכרון של חבר. אין מקום אחד שמרכז מקומות שמתאימים באמת לדייט — עם האווירה הנכונה, ברמת הרעש הנכונה, ובכשרות שמתאימה לך.

## מה הפלטפורמה עושה

מרכזת מקומות לדייטים ברחבי הארץ במפה אחת, עם סינון לפי מה שבאמת משנה: קטגוריה, אזור, טווח מחירים, כשרות, רמת רעש, וחניה. כל אחד יכול להוסיף מקום, לדרג ולכתוב ביקורת — והתוכן עובר מודרציה.

## תכונות

- **מפה אינטראקטיבית** — מאות מקומות, מרקרים לפי קטגוריה, וחיפוש גיאוגרפי
- **סינון מתקדם** — קטגוריה, אזור, מחיר, כשרות, רעש, התאמה לדייט ראשון
- **ביקורות ודירוגים** — מהקהילה, עם ממוצע לכל מקום
- **מערכת דיווחים ומודרציה** — דיווח על תוכן בעייתי, טריגרים אוטומטיים והתראות למנהל
- **הגבלת קצב** — הגנה מפני הצפה בהוספות ובדיווחים
- **ולידציה בשני הצדדים** — כולל בדיקה שהקואורדינטות בתחומי ישראל

## הסטאק

| שכבה | טכנולוגיה |
|---|---|
| ממשק | React · TypeScript · Vite · Tailwind · shadcn/ui |
| מפות | Mapbox |
| מסד נתונים ואימות | Supabase (PostgreSQL + RLS + Auth) |
| פריסה | Vercel |

## מבנה הפרויקט

```
src/
├── components/        רכיבי ממשק — מפה, כרטיסי מקום, סינון, ביקורות
├── pages/             דפי האפליקציה
├── lib/
│   └── validation.ts  ולידציה של קלט לפני שליחה
└── integrations/      חיבור ל-Supabase

supabase/
└── migrations/        סכימה, מדיניות RLS והגבלת קצב

docs/                  פריסה, אבטחה, שחזור וייבוא נתונים
```

## הרצה מקומית

דרישות: Node.js 18+, פרויקט Supabase, ומפתח Mapbox.

```bash
npm install
cp .env.example .env     # ומלאו את הערכים
npm run dev
```

את הסכימה ומדיניות ההרשאות מריצים פעם אחת ב-SQL Editor של Supabase, מהקבצים שב-`supabase/migrations/`.

## סטטוס

הפלטפורמה חיה ופעילה. פירוט על הפריסה, האבטחה וייבוא הנתונים נמצא ב-[docs/](docs/).

</div>
