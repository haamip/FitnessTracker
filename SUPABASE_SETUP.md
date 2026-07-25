# TrackFit Supabase setup

1. Create the Supabase project.
2. Open SQL Editor and run `supabase/migrations/202607260001_trackfit_core.sql`.
3. Enable Email under Authentication > Providers.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local` and Vercel.
5. Add the Vercel production URL and local development URL under Authentication > URL Configuration.
6. Redeploy TrackFit.

When Supabase variables are absent, TrackFit still opens using its existing local browser data. When configured, sign-in is required. The next migration step is moving each local repository to cloud-first reads and writes while retaining localStorage as an offline cache.
