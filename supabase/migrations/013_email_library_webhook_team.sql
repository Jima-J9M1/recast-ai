-- ── Email sequence: no schema change needed (output type stored as text) ────

-- ── Content library: star any output ────────────────────────────────────────
ALTER TABLE public.outputs ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;

-- ── Webhooks ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhooks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url         text        NOT NULL,
  secret      text,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Teams ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  owner_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  team_id     uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'member',
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_invites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  token       text        NOT NULL UNIQUE,
  created_by  uuid        NOT NULL REFERENCES public.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

-- Add team_id to users so we can quickly look up membership
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- RLS: users can only read/write their own webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own webhooks" ON public.webhooks
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS: team members can view their team
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team members can view team" ON public.teams
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "owner can manage team" ON public.teams
  FOR ALL USING (owner_id = auth.uid());

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view team roster" ON public.team_members
  FOR SELECT USING (
    team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
    OR user_id = auth.uid()
  );

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner can manage invites" ON public.team_invites
  USING (created_by = auth.uid());
CREATE POLICY "anyone can read invite by token" ON public.team_invites
  FOR SELECT USING (true);
