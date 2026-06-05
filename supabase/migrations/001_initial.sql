-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  polar_customer_id text unique,
  polar_subscription_id text unique,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Jobs table
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text,
  source_type text not null check (source_type in ('youtube', 'upload')),
  source_url text,
  status text not null default 'pending' check (status in ('pending', 'transcribing', 'generating', 'completed', 'failed')),
  transcript text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.jobs enable row level security;

create policy "Users can view own jobs" on public.jobs
  for select using (auth.uid() = user_id);

create policy "Users can insert own jobs" on public.jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own jobs" on public.jobs
  for update using (auth.uid() = user_id);

-- Outputs table
create table if not exists public.outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  type text not null check (type in ('blog', 'twitter_thread', 'linkedin', 'newsletter')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.outputs enable row level security;

create policy "Users can view outputs for own jobs" on public.outputs
  for select using (
    exists (
      select 1 from public.jobs
      where jobs.id = outputs.job_id and jobs.user_id = auth.uid()
    )
  );

-- Monthly usage tracking
create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  month text not null,
  count integer not null default 0,
  unique(user_id, month)
);

alter table public.usage enable row level security;

create policy "Users can view own usage" on public.usage
  for select using (auth.uid() = user_id);

-- Function to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for performance
create index jobs_user_id_idx on public.jobs(user_id);
create index jobs_created_at_idx on public.jobs(created_at desc);
create index outputs_job_id_idx on public.outputs(job_id);
create index usage_user_month_idx on public.usage(user_id, month);
