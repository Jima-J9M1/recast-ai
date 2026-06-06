-- Fix status check constraint to include 'cancelled'
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in ('pending', 'transcribing', 'generating', 'completed', 'failed', 'cancelled'));

-- Add tone column for content style selection
alter table public.jobs
  add column if not exists tone text default 'professional'
  check (tone in ('professional', 'casual', 'storytelling', 'educational', 'humorous'));
