alter table public.nutrition_entries
  alter column calories type numeric(8,2) using calories::numeric,
  alter column protein_g type numeric(8,2) using protein_g::numeric,
  alter column carbs_g type numeric(8,2) using carbs_g::numeric,
  alter column fats_g type numeric(8,2) using fats_g::numeric;
