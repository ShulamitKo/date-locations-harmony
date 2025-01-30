-- Create backup tables
create table if not exists spots_backup (
  like spots including all,
  backup_timestamp timestamptz default now(),
  operation text,
  changed_by text
);

create table if not exists reports_backup (
  like reports including all,
  backup_timestamp timestamptz default now(),
  operation text,
  changed_by text
);

-- Create backup functions
create or replace function backup_spot()
returns trigger as $$
begin
  insert into spots_backup 
  select OLD.*, now(), TG_OP, current_user;
  return NEW;
end;
$$ language plpgsql;

create or replace function backup_report()
returns trigger as $$
begin
  insert into reports_backup
  select OLD.*, now(), TG_OP, current_user;
  return NEW;
end;
$$ language plpgsql;

-- Create triggers
create trigger spots_backup_trigger
before update or delete on spots
for each row execute function backup_spot();

create trigger reports_backup_trigger
before update or delete on reports
for each row execute function backup_report();

-- Create cleanup function
create or replace function cleanup_old_backups()
returns void as $$
begin
  -- שמירת גיבויים למשך 30 יום
  delete from spots_backup 
  where backup_timestamp < now() - interval '30 days';
  
  delete from reports_backup
  where backup_timestamp < now() - interval '30 days';
end;
$$ language plpgsql;

-- Schedule cleanup
select cron.schedule(
  'cleanup-backups',
  '0 0 * * *',  -- רץ כל יום בחצות
  $$
  select cleanup_old_backups();
  $$
); 