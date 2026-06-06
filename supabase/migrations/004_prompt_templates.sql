create table if not exists public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  format text not null check (format in ('blog', 'twitter_thread', 'linkedin', 'newsletter')),
  prompt text not null,
  updated_at timestamptz not null default now(),
  unique(user_id, format)
);

alter table public.prompt_templates enable row level security;

create policy "Users can manage own prompt templates" on public.prompt_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index prompt_templates_user_id_idx on public.prompt_templates(user_id);
