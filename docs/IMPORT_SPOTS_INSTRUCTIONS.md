# הוראות לייבוא המקומות

## הקובץ `import_spots.sql` מכיל 77 מקומות מהגיבוי המקורי

### איך להריץ:

1. פתח את הדשבורד של Supabase:
   https://supabase.com/dashboard/project/<project-ref>

2. לך ל-SQL Editor (בתפריט הצד)

3. פתח את הקובץ `import_spots.sql` והעתק את כל התוכן

4. הדבק ב-SQL Editor ולחץ **Run**

5. אמור לראות הודעה: "Success. No rows returned"

6. בדוק שהמקומות נוספו:
   ```sql
   SELECT COUNT(*) FROM public.spots;
   ```
   אמור להראות: 77

## אחרי הייבוא

הפעל את האפליקציה ובדוק שהכל עובד:
```bash
npm run dev
```

כנס ל-http://localhost:8080 ובדוק שאתה רואה את כל המקומות על המפה.
