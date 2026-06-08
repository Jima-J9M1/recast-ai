create or replace function public.get_user_stats(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
begin
  return json_build_object(
    'total_jobs',      (select count(*)  from public.jobs where user_id = p_user_id),
    'completed_jobs',  (select count(*)  from public.jobs where user_id = p_user_id and status = 'completed'),
    'failed_jobs',     (select count(*)  from public.jobs where user_id = p_user_id and status = 'failed'),
    'blog_count',      (select count(*)  from public.outputs o join public.jobs j on o.job_id = j.id where j.user_id = p_user_id and o.type = 'blog'),
    'twitter_count',   (select count(*)  from public.outputs o join public.jobs j on o.job_id = j.id where j.user_id = p_user_id and o.type = 'twitter_thread'),
    'linkedin_count',  (select count(*)  from public.outputs o join public.jobs j on o.job_id = j.id where j.user_id = p_user_id and o.type = 'linkedin'),
    'newsletter_count',(select count(*)  from public.outputs o join public.jobs j on o.job_id = j.id where j.user_id = p_user_id and o.type = 'newsletter')
  );
end;
$$;
