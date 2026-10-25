-- Index straightforward user/date lookups and foreign keys flagged in Supabase advisors.
-- These do not alter rows, ownership, RLS, or any existing columns.
create index if not exists cardio_sessions_user_date_idx on public.cardio_sessions(user_id,session_date desc);
create index if not exists nutrition_entries_user_date_idx on public.nutrition_entries(user_id,entry_date desc);
create index if not exists saved_workout_exercises_exercise_id_idx on public.saved_workout_exercises(exercise_id);
create index if not exists saved_workouts_owner_id_idx on public.saved_workouts(owner_id);
create index if not exists training_plans_user_id_idx on public.training_plans(user_id);
create index if not exists workout_sessions_template_id_idx on public.workout_sessions(template_id);
create index if not exists workout_sessions_user_completed_idx on public.workout_sessions(user_id,completed_at desc);
