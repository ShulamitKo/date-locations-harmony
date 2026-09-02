-- ============================================================
-- שער האדמין: תמיכה ב-CIDR ב-admin_ips
-- ============================================================
-- הבעיה: is_admin() השווה את ה-IP של הבקשה (מ-cf-connecting-ip) מול
-- admin_ips.ip בהשוואת שוויון טקסט בלבד. חיבור dual-stack מוציא חלק
-- מהבקשות ב-IPv6, שהסיומת שלו מתחלפת, כך ש-/admin/reports נכשל לסירוגין.
--
-- הפתרון: שורה ב-admin_ips יכולה להיות כתובת בודדת (כמו קודם) או טווח
-- CIDR (למשל '2a06:c701:4388:d800::/64'). הקאסט ל-inet מתבצע רק כשהערך
-- מכיל '/', והכול עטוף ב-exception guard שמחזיר false על כל ערך לא תקין
-- (fail closed).

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

  begin
    select exists (
      select 1 from public.admin_ips a
      where a.is_active
        and (
          a.ip = v_ip
          or (position('/' in a.ip) > 0 and v_ip::inet <<= a.ip::inet)
        )
    ) into v_hit;
  exception when others then
    return false;
  end;

  return coalesce(v_hit, false);
end;
$function$;

comment on function public.is_admin() is
  'שער האדמין. שואב IP מ-request_ip() (cf-connecting-ip) ומשווה מול admin_ips - '
  'כתובת בודדת בהשוואת שוויון, או הכלה בטווח CIDR. SECURITY DEFINER, fail closed.';
