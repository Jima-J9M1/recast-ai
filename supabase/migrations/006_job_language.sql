alter table public.jobs
  add column if not exists language text not null default 'English';
