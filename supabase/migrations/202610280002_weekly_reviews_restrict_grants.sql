-- Supabase default table privileges can include TRUNCATE, which bypasses RLS.
-- Keep the weekly reviews API limited to row-level CRUD for authenticated users.
revoke all on table public.weekly_reviews from public, anon, authenticated;
grant select, insert, update, delete on table public.weekly_reviews to authenticated;
