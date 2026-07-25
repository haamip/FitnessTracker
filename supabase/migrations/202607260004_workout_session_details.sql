alter table public.workout_sessions
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists notes text,
  add column if not exists prs jsonb not null default '[]'::jsonb,
  add column if not exists completed_sets integer not null default 0,
  add column if not exists total_sets integer not null default 0;
