# אבטחת מידע - נקודות חיוניות

## 1. אבטחת קלט
חיוני למניעת התקפות XSS והזרקת קוד זדוני.

### וולידציה
```typescript
// src/lib/validation.ts
export const validateSpotData = (data: SpotInput) => {
  // וולידציה של שם
  if (!data.name?.trim() || data.name.length < 2) {
    throw new Error('שם המקום חייב להכיל לפחות 2 תווים');
  }
  
  // וולידציה של כתובת
  if (!data.address?.trim()) {
    throw new Error('חובה להזין כתובת');
  }
  
  // וולידציה של מיקום - חייב להיות בתחומי ישראל
  if (data.latitude < 29 || data.latitude > 34 || 
      data.longitude < 34 || data.longitude > 36) {
    throw new Error('המיקום חייב להיות בתחומי ישראל');
  }

  // וולידציה של קטגוריה
  if (!['בית קפה', 'מסעדה', 'בר', 'אטרקציה'].includes(data.category)) {
    throw new Error('קטגוריה לא חוקית');
  }
};
```

### סניטציה
```typescript
// src/lib/security.ts
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')    // מניעת XSS בסיסית
    .replace(/&/g, '&amp;')  // המרת תווים מיוחדים
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 1000);         // הגבלת אורך
};

// שימוש בכל הטפסים
const handleSubmit = (data: FormData) => {
  const sanitizedData = {
    name: sanitizeInput(data.name),
    address: sanitizeInput(data.address),
    notes: sanitizeInput(data.notes)
  };
};
```

## 2. הגדרות Supabase RLS
הגנה על הנתונים ברמת בסיס הנתונים.

```sql
-- הגדרת מדיניות גישה למקומות
create policy "spots_access" on spots for select using (
  status in ('active', 'under_review')
);

-- הגבלת עדכונים
create policy "spots_update" on spots for update using (
  status = 'active'
) with check (
  name is not null and
  address is not null and
  category in ('בית קפה', 'מסעדה', 'בר', 'אטרקציה')
);

-- הגבלת מחיקות
create policy "spots_delete" on spots for delete using (false);
```

## 3. מערכת לוגים
חיונית למעקב אחר פעילות ואיתור בעיות.

### הגדרת טבלת לוגים
```sql
create table logs (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  data jsonb,
  severity text default 'info',
  timestamp timestamptz default now(),
  ip_address text,
  user_agent text
);

-- אינדקסים לביצועים
create index logs_timestamp_idx on logs(timestamp);
create index logs_type_idx on logs(type);
create index logs_severity_idx on logs(severity);
```

### מערכת לוגים
```typescript
// src/lib/logging.ts
export const logTypes = {
  SPOT_ADDED: 'spot_added',
  SPOT_EDITED: 'spot_edited',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ERROR: 'error'
} as const;

export const logEvent = async (
  type: keyof typeof logTypes,
  data: any,
  severity: 'info' | 'warning' | 'error' = 'info'
) => {
  await supabase.from('logs').insert({
    type,
    data,
    severity,
    timestamp: new Date().toISOString(),
    ip_address: getUserIP(),
    user_agent: navigator.userAgent
  });

  // שליחת התראה במקרה של אירוע חשוד
  if (severity === 'warning' || severity === 'error') {
    await notifyAdmin({
      type,
      data,
      severity
    });
  }
};
```

## 4. מערכת גיבויים
הגנה על הנתונים מפני אובדן או שיבוש.

```sql
-- טבלת גיבויים למקומות
create table spots_backup (
  like spots including all,
  backup_timestamp timestamptz default now(),
  operation text,
  changed_by text
);

-- טריגר לגיבוי אוטומטי
create or replace function backup_spot()
returns trigger as $$
begin
  insert into spots_backup 
  select OLD.*, now(), TG_OP, current_user;
  return NEW;
end;
$$ language plpgsql;

create trigger spots_backup_trigger
before update or delete on spots
for each row execute function backup_spot();
```

## 5. הגבלת פעולות (Rate Limiting)
מניעת ספאם והתקפות אוטומטיות.

```typescript
// src/lib/rateLimit.ts
const rateLimits = {
  addSpot: {
    maxPerDay: 3,    // מקסימום מקומות ליום
    maxPerHour: 1    // מקסימום מקומות לשעה
  },
  editSpot: {
    maxPerHour: 5    // מקסימום עריכות לשעה
  }
};

export const checkRateLimit = async (
  action: keyof typeof rateLimits,
  userIP: string
): Promise<boolean> => {
  const key = `${action}:${userIP}`;
  const now = Date.now();
  
  // בדיקת מגבלות
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60 * 60); // תוקף של שעה
  }
  
  return count <= rateLimits[action].maxPerHour;
};
```

## 6. התראות אדמין
מערכת התראות על פעילות חשודה.

```typescript
// src/lib/notifications.ts
export const notifyAdmin = async (event: SecurityEvent) => {
  const webhook = process.env.ADMIN_WEBHOOK_URL;
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: event.type,
      data: event.data,
      severity: event.severity,
      timestamp: new Date().toISOString()
    })
  });
};
```

## סדר עדיפויות ליישום

1. **דחוף ומיידי:**
   - וולידציה וסניטציה של קלט
   - הגדרות RLS בסיסיות
   - מערכת לוגים בסיסית

2. **חשוב:**
   - מערכת גיבויים
   - הגבלת פעולות
   - התראות על פעילות חשודה

3. **משלים:**
   - שיפור והרחבת הלוגים
   - הוספת מערכת ניטור מתקדמת
   - הגדרת התראות נוספות

## הערות חשובות

1. **אבטחה:**
   - לעולם לא לשמור סיסמאות או מפתחות API בקוד
   - לתעד כל שינוי במסד הנתונים
   - לבדוק באופן קבוע את הלוגים

2. **תחזוקה:**
   - לעדכן חבילות באופן שוטף
   - לבדוק את הגיבויים באופן קבוע
   - לנטר שימוש חריג במשאבים

3. **ביצועים:**
   - להוסיף אינדקסים לפי הצורך
   - לנקות לוגים ישנים
   - לבצע אופטימיזציה של שאילתות

## מערכות נוספות

1. **מערכת דיווחים:**
   מערכת הדיווחים והטיפול בתוכן לא ראוי מתועדת בקובץ נפרד - `REPORT_SYSTEM_IMPLEMENTATION.md`.
   המערכת כוללת:
   - דיווח על תוכן לא ראוי
   - טיפול אוטומטי במקומות בעייתיים
   - מערכת ערעורים
   - ניהול סטטוס מקומות 