-- Private beta feedback for early TrackFit testers. Not public and not AI input.
create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('Bug', 'Suggestion', 'Question', 'Other')),
  description text not null check (char_length(trim(description)) between 10 and 3000),
  screenshot_paths text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  constraint beta_feedback_max_screens check (cardinality(screenshot_paths) <= 3)
);
create index if not exists beta_feedback_owner_created_idx on public.beta_feedback (user_id, created_at desc);
alter table public.beta_feedback enable row level security;
create policy beta_feedback_private_read on public.beta_feedback for select to authenticated
 using ((select auth.uid()) = user_id);
create policy beta_feedback_private_submit on public.beta_feedback for insert to authenticated
 with check ((select auth.uid()) = user_id);
revoke all on public.beta_feedback from public, anon, authenticated;
grant select, insert on public.beta_feedback to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trackfit-beta-feedback','trackfit-beta-feedback',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=5242880, allowed_mime_types=excluded.allowed_mime_types;

create policy trackfit_feedback_upload on storage.objects for insert to authenticated
 with check (bucket_id='trackfit-beta-feedback'
   and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy trackfit_feedback_read on storage.objects for select to authenticated
 using (bucket_id='trackfit-beta-feedback'
   and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy trackfit_feedback_delete on storage.objects for delete to authenticated
 using (bucket_id='trackfit-beta-feedback'
   and (storage.foldername(name))[1] = (select auth.uid())::text
   and owner_id = (select auth.uid())::text);