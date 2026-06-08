-- Add version tracking to outputs so every regeneration is stored, never overwritten
ALTER TABLE public.outputs ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Index for fast "get latest version per type" queries
CREATE INDEX IF NOT EXISTS outputs_job_type_version_idx ON public.outputs (job_id, type, version DESC);
