# TrackFit AI workout importer

The API key stays inside the Supabase Edge Function and is never exposed to the React app.

## One-time setup

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
supabase functions deploy parse-workout
```

Optional model override:

```bash
supabase secrets set OPENAI_WORKOUT_MODEL=gpt-4.1-mini
```

The frontend already invokes the function through the configured Supabase client.

Required Vite environment variables:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

After deployment, paste a workout into **Train > Import Workout** and use **AI reader**. The local parser remains available as the faster no-cost option.
