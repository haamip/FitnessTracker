-- Weekly text answers only. Progress photos are deliberately kept device-local.
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_reviews_user_week_unique unique (user_id, week_start)
);

alter table public.weekly_reviews enable row level security;

create policy "weekly reviews own rows" on public.weekly_reviews
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.weekly_reviews to authenticated;
revoke all on public.weekly_reviews from anon;
