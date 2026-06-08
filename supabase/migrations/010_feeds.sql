CREATE TABLE IF NOT EXISTS public.feeds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  rss_url text NOT NULL,
  last_video_id text,
  tone text NOT NULL DEFAULT 'professional',
  language text NOT NULL DEFAULT 'English',
  seo_mode boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, channel_id)
);

ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feeds"
  ON public.feeds
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS feeds_user_active_idx ON public.feeds (user_id, active);
