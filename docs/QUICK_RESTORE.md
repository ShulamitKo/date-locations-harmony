# הוראות מהירות לשחזור

## שלב 1: הרצת סקריפט SQL

1. פתח: https://supabase.com/dashboard/project/tztcllafwyyqtebpqkrj
2. לך ל-SQL Editor
3. פתח את הקובץ: `supabase/migrations/20250206_restore_database.sql`
4. העתק הכל והדבק ב-SQL Editor
5. לחץ Run

## שלב 2: עדכון טיפוסי TypeScript

לאחר שהסקריפט רץ בהצלחה, עדכן את הטיפוסים:

```bash
cd date-locations-harmony
supabase gen types typescript --linked > src/types/supabase.ts
```

**אם אין לך Supabase CLI מקושר:**
1. לך ל-Settings > API בדשבורד
2. העתק את ה-TypeScript types
3. עדכן את `src/types/supabase.ts`

## שלב 3: בדיקה

1. ודא שקובץ `.env` קיים עם המשתנים הנכונים
2. הפעל: `npm run dev`
3. בדוק שהכל עובד



