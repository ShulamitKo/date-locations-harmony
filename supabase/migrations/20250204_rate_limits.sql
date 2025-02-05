-- טבלת מגבלות פעולות
create table if not exists public.rate_limits (
  id bigint primary key generated always as identity,
  key text unique not null,
  attempts integer default 1,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- אינדקס לביצועים טובים יותר
create index if not exists rate_limits_expires_at_idx on public.rate_limits(expires_at);
create index if not exists rate_limits_key_idx on public.rate_limits(key);

-- פונקציה לניקוי רשומות ישנות
create or replace function cleanup_expired_rate_limits()
returns void as $$
begin
  delete from public.rate_limits
  where expires_at < now();
end;
$$ language plpgsql;

-- פונקציה לעדכון updated_at
create or replace function update_rate_limits_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- טריגר לעדכון updated_at
create trigger update_rate_limits_updated_at
  before update on public.rate_limits
  for each row
  execute function update_rate_limits_updated_at();

-- הרשאות
alter table public.rate_limits enable row level security;

-- מדיניות הרשאות - רק קריאה וכתיבה מהאפליקציה
create policy "rate_limits_policy"
  on public.rate_limits
  for all
  using (true)
  with check (true); 