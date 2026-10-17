-- Preserve step totals, their origin and the daily training choice for coaching.
-- Safe additive migration; existing records remain untouched.
alter table public.daily_checkins
  add column if not exists steps integer,
  add column if not exists steps_source text,
  add column if not exists steps_synced_at timestamptz,
  add column if not exists activity_type text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'daily_checkins_steps_valid') then
    alter table public.daily_checkins add constraint daily_checkins_steps_valid
      check (steps is null or steps between 0 and 150000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'daily_checkins_steps_source_valid') then
    alter table public.daily_checkins add constraint daily_checkins_steps_source_valid
      check (steps_source is null or steps_source in ('manual','health_connect','apple_health'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'daily_checkins_activity_type_valid') then
    alter table public.daily_checkins add constraint daily_checkins_activity_type_valid
      check (activity_type is null or activity_type in ('workout','cardio','both','rest'));
  end if;
end
$$;

-- Existing per-user row-level security policies remain in place.
