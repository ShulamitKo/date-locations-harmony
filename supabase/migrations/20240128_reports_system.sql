-- טבלת דיווחים
create table if not exists reports (
    id uuid default uuid_generate_v4() primary key,
    spot_id uuid references spots(id) not null,
    report_type text not null check (
        report_type in (
            'spam',           -- תוכן זבל/ספאם
            'inappropriate',  -- תוכן לא ראוי
            'incorrect',     -- מידע שגוי
            'closed',        -- מקום סגור
            'duplicate',     -- מקום כפול
            'other'          -- אחר
        )
    ),
    description text,                              -- תיאור הדיווח
    reporter_ip text not null,                     -- IP של המדווח
    status text default 'pending' check (
        status in (
            'pending',       -- ממתין לבדיקה
            'in_review',     -- בבדיקה
            'approved',      -- אושר
            'rejected',      -- נדחה
            'resolved'       -- טופל
        )
    ),
    admin_notes text,                              -- הערות מנהל
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    resolved_at timestamptz,
    resolved_by uuid references auth.users(id)     -- מי טיפל בדיווח
);

-- אינדקסים לביצועים
create index if not exists reports_spot_id_idx on reports(spot_id);
create index if not exists reports_status_idx on reports(status);
create index if not exists reports_created_at_idx on reports(created_at);

-- פונקציה לעדכון זמן העדכון האחרון
create or replace function update_reports_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- טריגר לעדכון אוטומטי של updated_at
create trigger update_reports_updated_at_trigger
    before update on reports
    for each row
    execute function update_reports_updated_at();

-- פונקציה לבדיקת דיווחים מרובים
create or replace function check_multiple_reports()
returns trigger as $$
declare
    recent_reports integer;
begin
    -- בדיקת כמות דיווחים למקום ב-24 שעות האחרונות
    select count(*)
    into recent_reports
    from reports
    where spot_id = new.spot_id
    and created_at > now() - interval '24 hours'
    and status = 'pending';

    -- אם יש יותר מ-3 דיווחים, עדכון סטטוס המקום
    if recent_reports >= 3 then
        update spots
        set status = 'under_review'
        where id = new.spot_id;
    end if;

    return new;
end;
$$ language plpgsql;

-- טריגר להפעלת בדיקת דיווחים מרובים
create trigger check_multiple_reports_trigger
    after insert on reports
    for each row
    execute function check_multiple_reports();

-- RLS policies
alter table reports enable row level security;

-- מדיניות צפייה בדיווחים - רק מנהלים
create policy "reports_view_policy" on reports
    for select using (
        auth.uid() in (
            select user_id from administrators
        )
    );

-- מדיניות הוספת דיווחים - כולם יכולים
create policy "reports_insert_policy" on reports
    for insert with check (
        true
    );

-- מדיניות עדכון דיווחים - רק מנהלים
create policy "reports_update_policy" on reports
    for update using (
        auth.uid() in (
            select user_id from administrators
        )
    ); 