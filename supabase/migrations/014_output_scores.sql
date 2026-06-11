-- Add score column to outputs for content quality scoring
ALTER TABLE public.outputs ADD COLUMN IF NOT EXISTS score jsonb;
