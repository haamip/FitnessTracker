-- AI Coach monitoring is opt-in and off by default.
create table if not exists public.trackfit_ai_monitoring_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consented boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.trackfit_ai_monitoring_preferences enable row level security;
create policy "members_manage_own_monitoring" on public.trackfit_ai_monitoring_preferences
for all to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create table if not exists public.trackfit_ai_response_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('daily','weekly','chat')),
  model text not null,
  headline text not null,
  summary text not null,
  actions jsonb not null default '[]'::jsonb,
  question text,
  facts jsonb,
  prompt_version text not null default 'coach-v7'
);
create index if not exists trackfit_ai_response_logs_user_created on public.trackfit_ai_response_logs(user_id, created_at desc);
alter table public.trackfit_ai_response_logs enable row level security;
-- Read access only for the owner or trusted admin. Writes happen through the authenticated Edge Function.
create policy "owner_read_ai_logs" on public.trackfit_ai_response_logs for select to authenticated
using (user_id = (select auth.uid()));
create policy "admin_read_ai_logs" on public.trackfit_ai_response_logs for select to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'trackfit_admin') = 'true');
create policy "admin_read_monitoring_preferences" on public.trackfit_ai_monitoring_preferences for select to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'trackfit_admin') = 'true');
-- Avoid broad authenticated INSERT privileges on logs; service role inserts only.
revoke insert, update, delete on public.trackfit_ai_response_logs from anon, authenticated;
