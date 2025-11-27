# הוראות פריסה ב-Vercel

## בעיה נוכחית
האתר מחזיר 404 כי משתני הסביבה של Supabase לא מוגדרים ב-Vercel.

## פתרון - הוספת משתני סביבה ב-Vercel

### שלב 1: כניסה להגדרות Vercel

1. כנסי ל-Vercel Dashboard: https://vercel.com/dashboard
2. בחרי את הפרויקט `date-locations-harmony`
3. לחצי על **Settings** (בתפריט העליון)

### שלב 2: הוספת משתני סביבה

1. בתפריט הצד, לחצי על **Environment Variables**
2. הוסיפי את המשתנים הבאים:

#### משתנה ראשון:
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://iamgpzrpkybnzkthjcja.supabase.co`
- **Environment**: סמני את כל האפשרויות (Production, Preview, Development)

#### משתנה שני:
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbWdwenJwa3libnprdGhqY2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODMzMTcsImV4cCI6MjA3OTA1OTMxN30.R7WYBMMIpblgiHk7d_9_J4hi4ZVN3gd6TkF21mPvBtw`
- **Environment**: סמני את כל האפשרויות (Production, Preview, Development)

### שלב 3: פריסה מחדש (Redeploy)

אחרי הוספת משתני הסביבה:

1. חזרי ל-**Deployments** (בתפריט העליון)
2. מצאי את הפריסה האחרונה
3. לחצי על שלוש הנקודות (...) ליד הפריסה
4. בחרי **Redeploy**
5. אשרי את הפריסה מחדש

### שלב 4: בדיקה

אחרי שהפריסה תסתיים:
1. כנסי ל-https://date-locations-harmony.vercel.app
2. ודאי שהאתר נטען כראוי
3. בדקי שאת רואה את המפה ואת המקומות (אחרי שתייבאי אותם ל-Supabase)

## הערות חשובות

- משתני סביבה שמתחילים ב-`VITE_` נחשפים ב-client side
- ה-anon key הוא ציבורי ובטוח לחשיפה (Row Level Security מגן על הנתונים)
- אם תשני את ה-Supabase project בעתיד, תצטרכי לעדכן את המשתנים ב-Vercel
