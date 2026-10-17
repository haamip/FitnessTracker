-- Preserve step totals, their origin and the daily training choice for coaching.
-- Safe additive migration; existing records remain untouched.
alter table public.daily_checkins
  add column if not exists steps integer,
  add column if not exists steps_source text,
  add column if not exists steps_synced_at timestamptz,
  add column if not exists activity_type text;

alter table public.daily_checkins
  add constraint daily_checkins_steps_valid check (steps is null or (steps >= 0 and steps <= 150000)),
  add constraint daily_checkins_steps_source_valid check (steps_source is null or steps_source in ('manual','health_connect','apple_health')),
  add constraint daily_checkins_activity_type_valid check (activity_type is null or activity_type in ('workout','cardio','both','rest'));

-- Existing row-level security policies continue to restrict rows to auth.uid() = user_id.
