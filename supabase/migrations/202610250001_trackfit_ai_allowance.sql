-- Keep AI usage bounded to avoid unexpected API costs.
-- No training or health content is stored here, only per-user daily call counts.
create table if not exists public.trackfit_ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  requests integer not null default 0 check (requests between 0 and 20),
  primary key (user_id, usage_date)
);
alter table public.trackfit_ai_daily_usage enable row level security;
revoke all on public.trackfit_ai_daily_usage from anon, authenticated;
-- No client RLS policies: the only authorised operation is an atomic, capped RPC.
create or replace function public.consume_trackfit_ai_allowance()
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  calling_user uuid := (select auth.uid());
  new_count integer;
begin
  if calling_user is null then return false; end if;
  insert into public.trackfit_ai_daily_usage (user_id, usage_date, requests)
  values (calling_user, (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, usage_date) do update
    set requests = public.trackfit_ai_daily_usage.requests + 1
    where public.trackfit_ai_daily_usage.requests < 20
  returning requests into new_count;
  return new_count is not null;
end;
$$;
revoke all on function public.consume_trackfit_ai_allowance() from public, anon;
grant execute on function public.consume_trackfit_ai_allowance() to authenticated;
comment on table public.trackfit_ai_daily_usage is 'Per-user bounded daily AI call counts. No prompts or health data stored.';
