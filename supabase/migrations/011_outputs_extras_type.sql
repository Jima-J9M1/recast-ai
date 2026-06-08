-- Add 'extras' to the allowed output types
ALTER TABLE public.outputs
  DROP CONSTRAINT IF EXISTS outputs_type_check;

ALTER TABLE public.outputs
  ADD CONSTRAINT outputs_type_check
  CHECK (type IN ('blog', 'twitter_thread', 'linkedin', 'newsletter', 'extras'));
