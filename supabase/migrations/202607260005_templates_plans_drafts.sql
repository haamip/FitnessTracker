alter table public.workout_templates
  add column if not exists local_id text;

drop index if exists workout_templates_user_local_id_idx;
create unique index if not exists workout_templates_user_local_id_unique
  on public.workout_templates(user_id, local_id);

alter table public.workout_sessions
  add column if not exists local_id text,
  add column if not exists status text not null default 'completed'
    check (status in ('active', 'completed')),
  add column if not exists notes text,
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists completed_sets integer not null default 0,
  add column if not exists total_sets integer not null default 0,
  add column if not exists prs jsonb not null default '[]'::jsonb;

drop index if exists workout_sessions_active_user_local_id_idx;
create unique index if not exists workout_sessions_user_local_id_unique
  on public.workout_sessions(user_id, local_id);