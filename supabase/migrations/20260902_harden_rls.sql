-- ============================================================
-- הידוק אבטחה: RLS, הרשאות ואימות בצד השרת
-- תאריך: 02.09.2026
--
-- מה זה מתקן (כל אלה היו פתוחים לכל אורח אנונימי):
--   1. spots UPDATE  - כל אחד יכל לשנות כל מקום, כולל status
--   2. rate_limits   - כל אחד יכל למחוק/לאפס את המונים ולעקוף את הגבלת הקצב
--   3. reports       - כל אחד יכל לקרוא דיווחים (כולל reporter_ip) ולשנות סטטוס
--   4. admin_ips     - כל אחד יכל לקרוא את רשימת ה-IP של המנהלת
--   5. check_admin_access(client_ip) - קיבל IP מהלקוח, כלומר כל אחד יכל
--      להעביר IP של מנהלת ולקבל true. עקיפה מלאה של שער הניהול.
--   6. כל הוולידציה רצה בדפדפן בלבד - פנייה ישירה ל-Supabase עקפה אותה
--
-- העיקרון החדש: הטבלאות סגורות לכתיבה. כל כתיבה עוברת דרך פונקציות
-- SECURITY DEFINER שמאמתות, מגבילות קצב ושואבות את ה-IP מהשרת ולא מהלקוח.
--
-- הרצה: Supabase → SQL Editor → הדבקה → Run. אידמפוטנטי, אפשר להריץ שוב.
-- ============================================================

begin;

-- ============================================================
-- 1. עזרי תשתית
-- ============================================================

-- ה-IP האמיתי של הפונה, כפי שהשרת רואה אותו.
--
-- אימות בפועל מול הפרויקט החי (2.9.2026): הכותרת x-real-ip שהקוד הישן קרא
-- (get_client_ip) בכלל לא נשלחת על ידי התשתית - כלומר היא מגיעה רק אם
-- *הפונה* טרח לשלוח אותה. גם האיבר הראשון ב-x-forwarded-for הוא מה שהלקוח
-- שלח. שניהם ניתנים לזיוף מלא.
--
-- מה כן אמין: cf-connecting-ip. Cloudflare מגדיר אותו בעצמו, ובקשה שמנסה
-- לשלוח אותו נחסמת עוד לפני שהיא מגיעה לבסיס הנתונים (CF error 1000).
-- גיבוי: האיבר האחרון ב-x-forwarded-for - זה שהפרוקסי הקרוב הוסיף.
create or replace function public.request_ip()
returns text
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  h       jsonb;
  v_xff   text;
  v_parts text[];
  v_ip    text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    h := null;
  end;

  if h is null then
    return null;
  end if;

  v_ip := h ->> 'cf-connecting-ip';

  if v_ip is null or btrim(v_ip) = '' then
    v_xff := coalesce(h ->> 'x-forwarded-for', '');
    v_parts := string_to_array(v_xff, ',');
    if v_parts is not null and coalesce(array_length(v_parts, 1), 0) > 0 then
      v_ip := v_parts[array_length(v_parts, 1)];
    end if;
  end if;

  v_ip := btrim(coalesce(v_ip, ''));
  if v_ip = '' then
    return null;
  end if;

  return v_ip;
end;
$fn$;

-- הפונקציה הישנה קראה את x-real-ip הניתן לזיוף. אין לה יורש - request_ip מחליף אותה.
drop function if exists public.get_client_ip();

-- שער הניהול. אין פרמטר בכוונה - ה-IP נקבע בשרת בלבד.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  -- שם המשתנה חייב להיות שונה מ-admin_ips.ip, אחרת plpgsql
  -- מחזיר "column reference is ambiguous" והשער נשבר
  v_ip text;
begin
  v_ip := public.request_ip();
  if v_ip is null then
    return false;
  end if;

  return exists (
    select 1 from public.admin_ips a
    where a.ip = v_ip and a.is_active
  );
end;
$fn$;

-- נשמר לתאימות עם הקוד הקיים (App.tsx / AdminReports.tsx).
-- הפרמטר מתקבל ומתעלמים ממנו - זו בדיוק החור שנסגר כאן.
create or replace function public.check_admin_access(client_ip text default null)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  return public.is_admin();
end;
$fn$;

comment on function public.check_admin_access(text) is
  'הפרמטר client_ip מתעלמים ממנו בכוונה. ה-IP נקבע בשרת דרך request_ip().';

-- ניקוי טקסט חופשי שמגיע ממשתמש: בלי תגיות, בלי תווי בקרה, באורך חסום.
create or replace function public.clean_text(t text, max_len int)
returns text
language sql
immutable
as $fn$
  select nullif(
    left(
      btrim(regexp_replace(regexp_replace(coalesce(t, ''), '[<>]', '', 'g'), '[\r\n\t]+', ' ', 'g')),
      max_len
    ),
    ''
  );
$fn$;

-- ============================================================
-- 2. הגבלת קצב בצד השרת
--    לפי ה-IP שהשרת רואה, ובטבלה שהלקוח כבר לא נוגע בה.
-- ============================================================

create or replace function public.rl_hit(p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_ip        text;
  v_max_hour  int;
  v_max_day   int;
  v_hits_hour int;
  v_hits_day  int;
begin
  select h, d into v_max_hour, v_max_day
  from (values
    ('addSpot',  3, 6),
    ('editSpot', 3, 5),
    ('report',   2, 5),
    ('review',   3, 6)
  ) as lim(a, h, d)
  where lim.a = p_action;

  if v_max_hour is null then
    raise exception 'פעולה לא מוכרת' using errcode = '22023';
  end if;

  -- למנהלת אין מגבלת קצב
  if public.is_admin() then
    return;
  end if;

  v_ip := coalesce(public.request_ip(), 'unknown');

  insert into public.rate_limits as r (key, attempts, expires_at)
  values (p_action || ':' || v_ip || ':hourly', 1, now() + interval '1 hour')
  on conflict (key) do update
    set attempts   = case when r.expires_at < now() then 1 else r.attempts + 1 end,
        expires_at = case when r.expires_at < now() then now() + interval '1 hour' else r.expires_at end,
        updated_at = now()
  returning attempts into v_hits_hour;

  insert into public.rate_limits as r (key, attempts, expires_at)
  values (p_action || ':' || v_ip || ':daily', 1, date_trunc('day', now()) + interval '1 day')
  on conflict (key) do update
    set attempts   = case when r.expires_at < now() then 1 else r.attempts + 1 end,
        expires_at = case when r.expires_at < now() then date_trunc('day', now()) + interval '1 day' else r.expires_at end,
        updated_at = now()
  returning attempts into v_hits_day;

  if v_hits_hour > v_max_hour or v_hits_day > v_max_day then
    raise exception 'הגעת למכסת הפעולות לתקופה הזו. אפשר לנסות שוב מאוחר יותר.'
      using errcode = 'P0001';
  end if;
end;
$fn$;

-- ============================================================
-- 3. אילוצי תקינות בבסיס הנתונים
--    NOT VALID = חל על כל כתיבה חדשה, בלי לגעת ב-78 השורות הקיימות.
-- ============================================================

alter table public.spots   drop constraint if exists spots_name_len_chk;
alter table public.spots   drop constraint if exists spots_address_len_chk;
alter table public.spots   drop constraint if exists spots_geo_chk;
alter table public.spots   drop constraint if exists spots_free_text_len_chk;
alter table public.reviews drop constraint if exists reviews_text_len_chk;
alter table public.reports drop constraint if exists reports_desc_len_chk;
alter table public.logs    drop constraint if exists logs_size_chk;

alter table public.spots
  add constraint spots_name_len_chk
  check (char_length(btrim(name)) between 2 and 120) not valid;

alter table public.spots
  add constraint spots_address_len_chk
  check (char_length(btrim(address)) between 2 and 200) not valid;

-- גבולות ישראל - אותה בדיקה שרצה היום רק בדפדפן (validation.ts)
alter table public.spots
  add constraint spots_geo_chk
  check (latitude between 29 and 34 and longitude between 34 and 36) not valid;

alter table public.spots
  add constraint spots_free_text_len_chk
  check (
    char_length(coalesce(notes, ''))              <= 1000
    and char_length(coalesce(phone, ''))              <= 30
    and char_length(coalesce(website, ''))            <= 300
    and char_length(coalesce(opening_hours, ''))      <= 300
    and char_length(coalesce(recommended_time, ''))   <= 120
    and char_length(coalesce(kosher_certificate, '')) <= 120
  ) not valid;

alter table public.reviews
  add constraint reviews_text_len_chk
  check (
    char_length(btrim(reviewer_name)) between 2 and 60
    and char_length(btrim(content))   between 2 and 2000
  ) not valid;

alter table public.reports
  add constraint reports_desc_len_chk
  check (char_length(btrim(description)) between 2 and 1000) not valid;

alter table public.logs
  add constraint logs_size_chk
  check (
    char_length(coalesce(type, '')) <= 60
    and char_length(coalesce(user_agent, '')) <= 500
    and octet_length(coalesce(data::text, '')) <= 4000
  ) not valid;

-- ============================================================
-- 4. שערי הכתיבה הציבוריים (SECURITY DEFINER)
-- ============================================================

-- הוספת מקום
create or replace function public.submit_spot(p jsonb)
returns public.spots
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.spots;
begin
  perform public.rl_hit('addSpot');

  insert into public.spots (
    name, address, latitude, longitude, category, price_range,
    kosher_type, kosher_certificate, noise_level, region,
    suitable_for_first_date, parking_available, public_transport,
    reservation_required, opening_hours, recommended_time, notes,
    phone, website, status
  )
  values (
    public.clean_text(p ->> 'name', 120),
    public.clean_text(p ->> 'address', 200),
    (p ->> 'latitude')::double precision,
    (p ->> 'longitude')::double precision,
    p ->> 'category',
    p ->> 'price_range',
    nullif(p ->> 'kosher_type', ''),
    public.clean_text(p ->> 'kosher_certificate', 120),
    p ->> 'noise_level',
    p ->> 'region',
    coalesce((p ->> 'suitable_for_first_date')::boolean, false),
    coalesce((p ->> 'parking_available')::boolean, false),
    coalesce((p ->> 'public_transport')::boolean, false),
    coalesce((p ->> 'reservation_required')::boolean, false),
    public.clean_text(p ->> 'opening_hours', 300),
    public.clean_text(p ->> 'recommended_time', 120),
    public.clean_text(p ->> 'notes', 1000),
    public.clean_text(p ->> 'phone', 30),
    public.clean_text(p ->> 'website', 300),
    -- מקום חדש נכנס תמיד כ-'under_review', בדיוק כמו שהטופס שולח היום.
    -- הסטטוס נקבע בשרת ולא מתקבל מהלקוח.
    'under_review'
  )
  returning * into v_row;

  return v_row;
end;
$fn$;

-- עריכת מקום קיים. ציבורי במכוון (זו תכונת המוצר), אבל:
-- רק שדות מהרשימה הלבנה ניתנים לעריכה - status, average_rating,
-- id ו-created_at לא ניתנים לשינוי מבחוץ בשום מצב.
create or replace function public.edit_spot(p_id uuid, p jsonb)
returns public.spots
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.spots;
begin
  perform public.rl_hit('editSpot');

  update public.spots s set
    name = case when p ? 'name'
      then public.clean_text(p ->> 'name', 120) else s.name end,
    address = case when p ? 'address'
      then public.clean_text(p ->> 'address', 200) else s.address end,
    latitude = case when p ? 'latitude'
      then (p ->> 'latitude')::double precision else s.latitude end,
    longitude = case when p ? 'longitude'
      then (p ->> 'longitude')::double precision else s.longitude end,
    category = case when p ? 'category'
      then p ->> 'category' else s.category end,
    price_range = case when p ? 'price_range'
      then p ->> 'price_range' else s.price_range end,
    kosher_type = case when p ? 'kosher_type'
      then nullif(p ->> 'kosher_type', '') else s.kosher_type end,
    kosher_certificate = case when p ? 'kosher_certificate'
      then public.clean_text(p ->> 'kosher_certificate', 120) else s.kosher_certificate end,
    noise_level = case when p ? 'noise_level'
      then p ->> 'noise_level' else s.noise_level end,
    region = case when p ? 'region'
      then p ->> 'region' else s.region end,
    suitable_for_first_date = case when p ? 'suitable_for_first_date'
      then coalesce((p ->> 'suitable_for_first_date')::boolean, false) else s.suitable_for_first_date end,
    parking_available = case when p ? 'parking_available'
      then coalesce((p ->> 'parking_available')::boolean, false) else s.parking_available end,
    public_transport = case when p ? 'public_transport'
      then coalesce((p ->> 'public_transport')::boolean, false) else s.public_transport end,
    reservation_required = case when p ? 'reservation_required'
      then coalesce((p ->> 'reservation_required')::boolean, false) else s.reservation_required end,
    opening_hours = case when p ? 'opening_hours'
      then public.clean_text(p ->> 'opening_hours', 300) else s.opening_hours end,
    recommended_time = case when p ? 'recommended_time'
      then public.clean_text(p ->> 'recommended_time', 120) else s.recommended_time end,
    notes = case when p ? 'notes'
      then public.clean_text(p ->> 'notes', 1000) else s.notes end,
    phone = case when p ? 'phone'
      then public.clean_text(p ->> 'phone', 30) else s.phone end,
    website = case when p ? 'website'
      then public.clean_text(p ->> 'website', 300) else s.website end
  where s.id = p_id
    and (s.status in ('active', 'under_review') or public.is_admin())
  returning * into v_row;

  if v_row.id is null then
    raise exception 'המקום לא נמצא במערכת' using errcode = 'P0002';
  end if;

  return v_row;
end;
$fn$;

-- הוספת ביקורת
create or replace function public.submit_review(
  p_spot_id       uuid,
  p_reviewer_name text,
  p_rating        int,
  p_content       text,
  p_visit_date    date default null
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.reviews;
begin
  perform public.rl_hit('review');

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'הדירוג חייב להיות בין 1 ל-5' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.spots
    where id = p_spot_id and status in ('active', 'under_review')
  ) then
    raise exception 'המקום לא נמצא במערכת' using errcode = 'P0002';
  end if;

  insert into public.reviews (spot_id, reviewer_name, rating, content, visit_date)
  values (
    p_spot_id,
    public.clean_text(p_reviewer_name, 60),
    p_rating,
    public.clean_text(p_content, 2000),
    p_visit_date
  )
  returning * into v_row;

  return v_row;
end;
$fn$;

-- שליחת דיווח. ה-IP של המדווח נלקח מהשרת, לא מהלקוח.
-- מוחזרים גם מוני הדיווחים הפתוחים, כדי שהלקוח לא יצטרך לקרוא את הטבלה.
create or replace function public.submit_report(
  p_spot_id     uuid,
  p_report_type text,
  p_description text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row        public.reports;
  v_pending    int;
  v_in_review  int;
begin
  perform public.rl_hit('report');

  if p_report_type not in ('spam', 'inappropriate', 'closed', 'duplicate', 'other') then
    raise exception 'סוג דיווח לא חוקי' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.spots
    where id = p_spot_id and status in ('active', 'under_review')
  ) then
    raise exception 'המקום לא נמצא במערכת' using errcode = 'P0002';
  end if;

  insert into public.reports (spot_id, report_type, description, reporter_ip, status)
  values (
    p_spot_id,
    p_report_type,
    public.clean_text(p_description, 1000),
    coalesce(public.request_ip(), 'unknown'),
    'pending'
  )
  returning * into v_row;

  select
    count(*) filter (where status = 'pending'),
    count(*) filter (where status = 'in_review')
  into v_pending, v_in_review
  from public.reports
  where spot_id = p_spot_id;

  return jsonb_build_object(
    'id',             v_row.id,
    'spot_id',        v_row.spot_id,
    'report_type',    v_row.report_type,
    'status',         v_row.status,
    'created_at',     v_row.created_at,
    'open_pending',   v_pending,
    'open_in_review', v_in_review,
    'open_total',     v_pending + v_in_review
  );
end;
$fn$;

-- ============================================================
-- 5. פעולות ניהול - כל אחת בודקת is_admin() בשרת
-- ============================================================

create or replace function public.admin_list_reports()
returns setof public.reports
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'אין הרשאה' using errcode = '42501';
  end if;

  return query
    select * from public.reports order by created_at desc;
end;
$fn$;

create or replace function public.admin_get_spot(p_id uuid)
returns public.spots
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.spots;
begin
  if not public.is_admin() then
    raise exception 'אין הרשאה' using errcode = '42501';
  end if;

  select * into v_row from public.spots where id = p_id;
  return v_row;
end;
$fn$;

create or replace function public.admin_update_report_status(
  p_id     uuid,
  p_status text,
  p_notes  text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.reports;
begin
  if not public.is_admin() then
    raise exception 'אין הרשאה' using errcode = '42501';
  end if;

  if p_status not in ('pending', 'in_review', 'resolved', 'rejected') then
    raise exception 'סטטוס לא חוקי' using errcode = '22023';
  end if;

  update public.reports
  set status      = p_status,
      admin_notes = public.clean_text(p_notes, 1000),
      updated_at  = now()
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'הדיווח לא נמצא' using errcode = 'P0002';
  end if;

  return v_row;
end;
$fn$;

create or replace function public.admin_set_spot_status(p_id uuid, p_status text)
returns public.spots
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.spots;
begin
  if not public.is_admin() then
    raise exception 'אין הרשאה' using errcode = '42501';
  end if;

  if p_status not in ('active', 'under_review', 'blocked') then
    raise exception 'סטטוס לא חוקי' using errcode = '22023';
  end if;

  update public.spots set status = p_status
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'המקום לא נמצא' using errcode = 'P0002';
  end if;

  return v_row;
end;
$fn$;

create or replace function public.admin_delete_spot(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'אין הרשאה' using errcode = '42501';
  end if;

  delete from public.spots where id = p_id;
end;
$fn$;

-- טריגר הדירוג רץ בעקבות הוספת ביקורת דרך פונקציית ה-definer
create or replace function public.update_spot_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.spots
  set average_rating = (
    select avg(rating)::double precision
    from public.reviews
    where spot_id = coalesce(new.spot_id, old.spot_id)
  )
  where id = coalesce(new.spot_id, old.spot_id);
  return coalesce(new, old);
end;
$fn$;

-- ============================================================
-- 6. סגירת הטבלאות - מדיניות RLS
-- ============================================================

-- spots: קריאה ציבורית למקומות פעילים/בבדיקה, כתיבה רק דרך הפונקציות
drop policy if exists "Enable read access for all users"   on public.spots;
drop policy if exists "Enable insert access for all users"  on public.spots;
drop policy if exists "Enable update access for all users"  on public.spots;
drop policy if exists "Enable delete access for all users"  on public.spots;
drop policy if exists "spots_public_read"                   on public.spots;

create policy "spots_public_read"
on public.spots for select
to anon, authenticated
using (status in ('active', 'under_review'));

-- reviews: קריאה ציבורית, כתיבה רק דרך submit_review
drop policy if exists "Enable read access for all users"  on public.reviews;
drop policy if exists "Enable insert access for all users" on public.reviews;
drop policy if exists "reviews_public_read"                on public.reviews;

create policy "reviews_public_read"
on public.reviews for select
to anon, authenticated
using (true);

-- reports: סגור לחלוטין. גישה רק דרך פונקציות הניהול.
drop policy if exists "Enable read access for all users"   on public.reports;
drop policy if exists "Enable insert access for all users"  on public.reports;
drop policy if exists "Enable update access for all users"  on public.reports;
drop policy if exists "Enable delete access for all users"  on public.reports;

-- rate_limits: סגור לחלוטין. זה היה חור העקיפה המרכזי.
drop policy if exists "Enable read access for all users"   on public.rate_limits;
drop policy if exists "Enable insert access for all users"  on public.rate_limits;
drop policy if exists "Enable update access for all users"  on public.rate_limits;
drop policy if exists "Enable delete access for all users"  on public.rate_limits;

-- admin_ips: סגור לחלוטין. רק is_admin() קורא אותו, והוא SECURITY DEFINER.
drop policy if exists "Enable read access for all users" on public.admin_ips;

-- logs: כתיבה בלבד, בלי קריאה
drop policy if exists "Enable insert access for all users" on public.logs;
drop policy if exists "logs_public_insert"                 on public.logs;

create policy "logs_public_insert"
on public.logs for insert
to anon, authenticated
with check (severity in ('info', 'warning', 'error'));

-- ============================================================
-- 7. סגירת הטבלאות - הרשאות טבלה
--    RLS לבד לא מספיק: בלי זה נשארת ההרשאה מ-grant all
-- ============================================================

revoke all on public.spots       from anon, authenticated;
revoke all on public.reviews     from anon, authenticated;
revoke all on public.reports     from anon, authenticated;
revoke all on public.logs        from anon, authenticated;
revoke all on public.rate_limits from anon, authenticated;
revoke all on public.admin_ips   from anon, authenticated;

grant select on public.spots   to anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant insert on public.logs    to anon, authenticated;

-- ============================================================
-- 8. הרשאות הרצה לפונקציות
-- ============================================================

-- פונקציות פנימיות - לא נקראות מבחוץ
revoke all on function public.request_ip()                        from public, anon, authenticated;
revoke all on function public.rl_hit(text)                        from public, anon, authenticated;
revoke all on function public.clean_text(text, int)               from public, anon, authenticated;
revoke all on function public.update_spot_rating()                from public, anon, authenticated;
revoke all on function public.update_updated_at_column()          from public, anon, authenticated;
revoke all on function public.trigger_cleanup_expired_rate_limits() from public, anon, authenticated;

-- שערי הכתיבה הציבוריים
grant execute on function public.submit_spot(jsonb)                       to anon, authenticated;
grant execute on function public.edit_spot(uuid, jsonb)                   to anon, authenticated;
grant execute on function public.submit_review(uuid, text, int, text, date) to anon, authenticated;
grant execute on function public.submit_report(uuid, text, text)          to anon, authenticated;

-- שער הניהול (הפונקציות עצמן בודקות is_admin בשרת)
grant execute on function public.is_admin()                                to anon, authenticated;
grant execute on function public.check_admin_access(text)                  to anon, authenticated;
grant execute on function public.admin_list_reports()                      to anon, authenticated;
grant execute on function public.admin_get_spot(uuid)                      to anon, authenticated;
grant execute on function public.admin_update_report_status(uuid, text, text) to anon, authenticated;
grant execute on function public.admin_set_spot_status(uuid, text)         to anon, authenticated;
grant execute on function public.admin_delete_spot(uuid)                   to anon, authenticated;

-- נעילת search_path על הפונקציות הישנות (אזהרת Supabase advisor:
-- search_path משתנה בפונקציית SECURITY DEFINER הוא וקטור הסלמה)
alter function public.clean_text(text, int)                 set search_path = public;
alter function public.cleanup_expired_rate_limits()         set search_path = public;
alter function public.update_updated_at_column()            set search_path = public;
alter function public.trigger_cleanup_expired_rate_limits() set search_path = public;

-- ניקוי מונים שפג תוקפם - נקרא מה-App בטעינה, לא מסוכן
grant execute on function public.cleanup_expired_rate_limits() to anon, authenticated;

notify pgrst, 'reload schema';

commit;
