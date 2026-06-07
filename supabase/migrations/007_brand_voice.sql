alter table public.users
  add column if not exists brand_voice jsonb;
