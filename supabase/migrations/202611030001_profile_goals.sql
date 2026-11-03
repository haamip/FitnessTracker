alter table public.profiles
  add column if not exists fitness_goal text not null default 'general_fitness',
  add column if not exists starting_weight_kg numeric(6,2),
  add column if not exists goal_weight_kg numeric(6,2),
  add column if not exists workouts_per_week integer not null default 3,
  add column if not exists shift_pattern text not null default 'standard';

alter table public.profiles
  add constraint trackfit_profile_fitness_goal_check
  check (fitness_goal in ('lose_fat', 'build_muscle', 'general_fitness', 'maintain', 'performance')),
  add constraint trackfit_profile_start_weight_check
  check (starting_weight_kg is null or starting_weight_kg between 20 and 400),
  add constraint trackfit_profile_goal_weight_check
  check (goal_weight_kg is null or goal_weight_kg between 20 and 400),
  add constraint trackfit_profile_workouts_per_week_check
  check (workouts_per_week between 1 and 7),
  add constraint trackfit_profile_shift_pattern_check
  check (shift_pattern in ('standard', 'days', 'nights', 'rotating'));

comment on column public.profiles.starting_weight_kg is 'Optional member-reported starting weight for goal progress; private via profiles RLS';
comment on column public.profiles.goal_weight_kg is 'Optional member-selected goal weight; not a medical recommendation';
