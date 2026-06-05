-- RPC function to safely increment usage count (upsert)
create or replace function public.increment_usage(p_user_id uuid, p_month text)
returns void as $$
begin
  insert into public.usage (user_id, month, count)
  values (p_user_id, p_month, 1)
  on conflict (user_id, month)
  do update set count = usage.count + 1;
end;
$$ language plpgsql security definer;
