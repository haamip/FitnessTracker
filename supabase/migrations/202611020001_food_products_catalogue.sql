-- Community-submitted packaged foods are private to the submitter until approved.
-- Each entry stores verified-as-entered (not automatically trusted) per-100g values.
create table if not exists public.food_products (
  id uuid primary key default gen_random_uuid(),
  barcode text not null check (barcode ~ '^[0-9]{8,14}$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  brand text not null default '' check (char_length(brand) <= 80),
  calories_100g numeric(8,2) not null check (calories_100g between 0 and 1000),
  protein_100g numeric(6,2) not null check (protein_100g between 0 and 100),
  carbs_100g numeric(6,2) check (carbs_100g between 0 and 100),
  fats_100g numeric(6,2) check (fats_100g between 0 and 100),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists food_products_barcode_idx on public.food_products(barcode);
create unique index if not exists food_products_approved_barcode_idx
  on public.food_products(barcode) where status = 'approved';

alter table public.food_products enable row level security;
revoke all on public.food_products from anon, authenticated;
grant select (barcode, name, brand, calories_100g, protein_100g, carbs_100g, fats_100g, status)
  on public.food_products to authenticated;
grant insert (barcode, name, brand, calories_100g, protein_100g, carbs_100g, fats_100g, submitted_by, status)
  on public.food_products to authenticated;

create policy "Approved foods or own submissions" on public.food_products
  for select to authenticated
  using (status = 'approved' or submitted_by = (select auth.uid()));
create policy "Authenticated users submit foods for review" on public.food_products
  for insert to authenticated
  with check (status = 'pending' and submitted_by = (select auth.uid()));
