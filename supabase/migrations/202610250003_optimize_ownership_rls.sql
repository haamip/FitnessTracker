-- Supabase RLS performance cleanup; ownership decisions are unchanged.
-- A scalar SELECT lets Postgres evaluate auth.uid() once per statement.
-- Existing FOR/TO/grants remain unchanged; duplicate profile SELECT/UPDATE
-- policies are redundant because the equivalent ALL policy remains.
alter policy "profiles own rows" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

alter policy "checkins own rows" on public.daily_checkins
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "nutrition own rows" on public.nutrition_entries
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "cardio own rows" on public.cardio_sessions
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "templates own rows" on public.workout_templates
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "plans own rows" on public.training_plans
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "sessions own rows" on public.workout_sessions
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy "Users can create own exercises" on public.exercises
  with check (owner_id = (select auth.uid()));
alter policy "Users can delete own exercises" on public.exercises
  using (owner_id = (select auth.uid()));
alter policy "Users can read shared and own exercises" on public.exercises
  using ((owner_id is null) or (owner_id = (select auth.uid())));
alter policy "Users can update own exercises" on public.exercises
  using (owner_id = (select auth.uid()));

alter policy "Users can manage own workouts" on public.saved_workouts
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

alter policy "Users can add workout exercises to own workouts" on public.saved_workout_exercises
  with check (exists (
    select 1 from public.saved_workouts w
    where w.id = saved_workout_exercises.workout_id and w.owner_id = (select auth.uid())
  ));
alter policy "Users can read workout exercises from own workouts" on public.saved_workout_exercises
  using (exists (
    select 1 from public.saved_workouts w
    where w.id = saved_workout_exercises.workout_id and w.owner_id = (select auth.uid())
  ));
alter policy "Users can update workout exercises in own workouts" on public.saved_workout_exercises
  using (exists (
    select 1 from public.saved_workouts w
    where w.id = saved_workout_exercises.workout_id and w.owner_id = (select auth.uid())
  ));
alter policy "Users can delete workout exercises from own workouts" on public.saved_workout_exercises
  using (exists (
    select 1 from public.saved_workouts w
    where w.id = saved_workout_exercises.workout_id and w.owner_id = (select auth.uid())
  ));
