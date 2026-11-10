-- TrackFit testing dashboard: app_metadata.trackfit_admin is assigned only by a trusted server.
-- Existing per-user policies remain in place. This adds read-only administrator access.
-- Never authorize from user_metadata or a browser-controlled setting.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles','workout_sessions','daily_checkins','nutrition_entries',
    'cardio_sessions','trackfit_ai_daily_usage','beta_feedback'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "trackfit_admin_read_%s" ON public.%I FOR SELECT TO authenticated USING ((auth.jwt() -> ''app_metadata'' ->> ''trackfit_admin'') = ''true'')',
      table_name, table_name
    );
  END LOOP;
END $$;
