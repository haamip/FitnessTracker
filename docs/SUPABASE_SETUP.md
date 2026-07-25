# TrackFit Supabase setup

## 1. Create the project

1. Create a new project in Supabase.
2. Open **SQL Editor**.
3. Copy and run:

   `supabase/migrations/202607250001_initial_trackfit.sql`

This creates profiles, exercises, saved workouts, workout exercises, indexes, and row-level security policies.

## 2. Add local environment variables

Copy `.env.example` to `.env.local` and replace the placeholders:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The URL and anon key are available in **Project Settings → API**.

Do not add the service-role key to the Vite app. It bypasses row-level security and must only be used in a protected server or Supabase Edge Function.

## 3. Install and test

```bash
npm install
npm run check
npm run dev
```

The app remains usable with local storage when the Supabase variables are absent.

## 4. Vercel variables

In the Vercel project, add these environment variables for Production, Preview, and Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Redeploy after adding them.

## 5. Exercise enrichment flow

The database supports this workflow:

1. Preserve the imported workout exercise display name.
2. Normalise the name only for lookup.
3. Reuse an existing shared or user-owned exercise when found.
4. Create a user-owned exercise with `pending_instructions` when no match exists.
5. Fetch exercise details through a protected server or Supabase Edge Function.
6. Save sourced instructions as `needs_review` until approved.

Do not call a paid third-party exercise API directly from the browser because the API key would be exposed.
