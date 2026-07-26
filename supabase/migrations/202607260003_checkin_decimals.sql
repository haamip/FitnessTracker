alter table public.daily_checkins
  alter column protein_g type numeric(8,1)
  using protein_g::numeric;