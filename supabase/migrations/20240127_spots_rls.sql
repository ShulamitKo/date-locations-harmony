-- הפעלת RLS על טבלת המקומות
alter table spots enable row level security;

-- הסרת מדיניות קיימת אם יש
drop policy if exists "spots_access" on spots;
drop policy if exists "spots_update" on spots;
drop policy if exists "spots_insert" on spots;

-- הגדרת מדיניות גישה למקומות - מאפשר צפייה בכל המקומות
create policy "spots_access" on spots for select using (true);

-- הגדרת מדיניות עדכון מקומות
create policy "spots_update" on spots for update using (true) with check (
  name is not null and
  address is not null and
  category in ('בית קפה', 'מסעדה', 'בר', 'אטרקציה', 'טבע', 'אחר') and
  (price_range is null or price_range in ('זול', 'בינוני', 'יקר')) and
  (
    (category in ('בית קפה', 'מסעדה', 'בר') and kosher_type in ('מהדרין', 'רבנות', '?')) or
    (category not in ('בית קפה', 'מסעדה', 'בר') and kosher_type is null)
  ) and
  (region is null or region in ('צפון', 'מרכז', 'דרום', 'ירושלים'))
);

-- הגדרת מדיניות להוספת מקומות חדשים
create policy "spots_insert" on spots for insert with check (
  name is not null and
  address is not null and
  category in ('בית קפה', 'מסעדה', 'בר', 'אטרקציה', 'טבע', 'אחר') and
  (price_range is null or price_range in ('זול', 'בינוני', 'יקר')) and
  (
    (category in ('בית קפה', 'מסעדה', 'בר') and kosher_type in ('מהדרין', 'רבנות', '?')) or
    (category not in ('בית קפה', 'מסעדה', 'בר') and kosher_type is null)
  ) and
  (region is null or region in ('צפון', 'מרכז', 'דרום', 'ירושלים'))
);

-- הגדרת טבלת לוגים (אם לא קיימת)
create table if not exists logs (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  data jsonb,
  severity text default 'info',
  timestamp timestamptz default now(),
  ip_address text,
  user_agent text
);

-- אינדקסים לביצועים (אם לא קיימים)
create index if not exists logs_timestamp_idx on logs(timestamp);
create index if not exists logs_type_idx on logs(type);
create index if not exists logs_severity_idx on logs(severity);

-- עדכון האילוץ של kosher_type
ALTER TABLE spots DROP CONSTRAINT IF EXISTS spots_kosher_type_check;
ALTER TABLE spots ADD CONSTRAINT spots_kosher_type_check 
  CHECK (
    (category in ('בית קפה', 'מסעדה', 'בר') and kosher_type in ('מהדרין', 'רבנות', '?')) or
    (category not in ('בית קפה', 'מסעדה', 'בר') and kosher_type is null)
  );

-- עדכון ערכים קיימים בטבלה
UPDATE spots 
SET kosher_type = 
  CASE 
    WHEN category not in ('בית קפה', 'מסעדה', 'בר') THEN NULL
    WHEN kosher_type not in ('מהדרין', 'רבנות', '?') THEN '?'
    ELSE kosher_type
  END; 