-- One active reusable daily meal template per signed-in TrackFit account.
-- Templates are plans, not consumed meals; the nutrition diary remains the source of actual intake.
create table if not exists public.meal_plan_templates (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  meals jsonb not null default '[]'::jsonb check (jsonb_typeof(meals) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meal_plan_templates enable row level security;

drop policy if exists "Owners manage their daily meal plan" on public.meal_plan_templates;
create policy "Owners manage their daily meal plan"
  on public.meal_plan_templates
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.meal_plan_templates from public, anon, authenticated;
grant select, insert, update, delete on table public.meal_plan_templates to authenticated;
