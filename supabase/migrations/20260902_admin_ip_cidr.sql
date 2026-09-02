-- ============================================================
-- שער האדמין: תמיכה ב-CIDR ב-admin_ips
-- ============================================================
-- הבעיה: is_admin() השווה את ה-IP של הבקשה (מ-cf-connecting-ip) מול
-- admin_ips.ip בהשוואת שוויון טקסט בלבד. ה-IP הביתי של המנהלת מתנדנד
-- בין כמה כתובות WAN (הראוטר מאזן חיבורים), כך ש-/admin/reports עבר את
-- השער רק לסירוגין.
--
-- הפתרון: שורה ב-admin_ips יכולה להיות כתובת בודדת (כמו קודם) או טווח
-- CIDR (למשל '79.177.132.0/23'). הקאסט ל-inet מתבצע רק כשהערך מכיל '/'.
-- CHECK על העמודה מוודא שכל ערך הוא inet/cidr תקין, כדי שהקאסט הזה
-- לא יוכל להיכשל בזמן ריצה על שורה פגומה.
--
-- הערה: אין להשתמש בבלוק EXCEPTION בתוך is_admin - כשהפונקציה נקראת
-- כ-RPC דרך PostgREST, RETURN מתוך handler החזיר false גם כשהבדיקה
-- הצליחה. ה-CHECK מחליף את הצורך ב-guard הזה.

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_ip  text;
  v_hit boolean;
begin
  v_ip := public.request_ip();
  if v_ip is null then return false; end if;

  select exists (
    select 1 from public.admin_ips a
    where a.is_active
      and (
        a.ip = v_ip
        or (position('/' in a.ip) > 0 and v_ip::inet <<= a.ip::inet)
      )
  ) into v_hit;

  return coalesce(v_hit, false);
end;
$function$;

comment on function public.is_admin() is
  'שער האדמין. שואב IP מ-request_ip() (cf-connecting-ip) ומשווה מול admin_ips - '
  'כתובת בודדת בהשוואת שוויון, או הכלה בטווח CIDR. SECURITY DEFINER, fail closed.';

alter table public.admin_ips drop constraint if exists admin_ips_ip_is_inet;
alter table public.admin_ips add constraint admin_ips_ip_is_inet
  check (ip::inet is not null);
