create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  aliases text[] not null default '{}',
  equipment text,
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  category text,
  instructions text[] not null default '{}',
  setup text,
  common_mistakes text[] not null default '{}',
  tips text[] not null default '{}',
  difficulty text,
  source_name text,
  source_url text,
  source_external_id text,
  verified boolean not null default false,
  status text not null default 'ready' check (status in ('ready', 'pending_instructions', 'needs_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, normalized_name)
);

create index if not exists exercises_normalized_name_idx on public.exercises(normalized_name);
create index if not exists exercises_owner_id_idx on public.exercises(owner_id);

create table if not exists public.saved_workouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.saved_workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  display_name text not null,
  position integer not null,
  sets integer,
  reps text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists saved_workout_exercises_workout_idx
  on public.saved_workout_exercises(workout_id, position);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.saved_workouts enable row level security;
alter table public.saved_workout_exercises enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read shared and own exercises"
  on public.exercises for select
  using (owner_id is null or owner_id = auth.uid());

create policy "Users can create own exercises"
  on public.exercises for insert
  with check (owner_id = auth.uid());

create policy "Users can update own exercises"
  on public.exercises for update
  using (owner_id = auth.uid());

create policy "Users can delete own exercises"
  on public.exercises for delete
  using (owner_id = auth.uid());

create policy "Users can manage own workouts"
  on public.saved_workouts for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can read workout exercises from own workouts"
  on public.saved_workout_exercises for select
  using (
    exists (
      select 1 from public.saved_workouts
      where saved_workouts.id = saved_workout_exercises.workout_id
        and saved_workouts.owner_id = auth.uid()
    )
  );

create policy "Users can add workout exercises to own workouts"
  on public.saved_workout_exercises for insert
  with check (
    exists (
      select 1 from public.saved_workouts
      where saved_workouts.id = saved_workout_exercises.workout_id
        and saved_workouts.owner_id = auth.uid()
    )
  );

create policy "Users can update workout exercises in own workouts"
  on public.saved_workout_exercises for update
  using (
    exists (
      select 1 from public.saved_workouts
      where saved_workouts.id = saved_workout_exercises.workout_id
        and saved_workouts.owner_id = auth.uid()
    )
  );

create policy "Users can delete workout exercises from own workouts"
  on public.saved_workout_exercises for delete
  using (
    exists (
      select 1 from public.saved_workouts
      where saved_workouts.id = saved_workout_exercises.workout_id
        and saved_workouts.owner_id = auth.uid()
    )
  );
