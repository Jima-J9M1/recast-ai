alter table public.jobs
  add column if not exists seo_mode boolean not null default false;
