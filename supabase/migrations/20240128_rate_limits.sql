-- Create rate limits table
create table if not exists rate_limits (
  key text primary key,
  attempts integer default 1,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists rate_limits_expires_at_idx on rate_limits(expires_at);

-- Create cleanup function
create or replace function cleanup_rate_limits()
returns void as $$
begin
  delete from rate_limits
  where expires_at < now();
end;
$$ language plpgsql;

-- Schedule cleanup
select cron.schedule(
  'cleanup-rate-limits',
  '*/15 * * * *',  -- רץ כל 15 דקות
  $$
  select cleanup_rate_limits();
  $$
); 