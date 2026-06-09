-- Rate limiting table: one row per (user, endpoint), reset when window expires
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint     text        NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count int        NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, endpoint)
);

-- Atomic check-and-increment: returns true if the request is allowed
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id       uuid,
  p_endpoint      text,
  p_max_requests  int,
  p_window_seconds int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start  timestamptz;
  v_count         int;
  v_window_cutoff timestamptz;
BEGIN
  v_window_cutoff := now() - (p_window_seconds || ' seconds')::interval;

  SELECT window_start, request_count
    INTO v_window_start, v_count
    FROM public.rate_limits
   WHERE user_id = p_user_id AND endpoint = p_endpoint;

  -- No existing record, or window has expired → start a fresh window
  IF NOT FOUND OR v_window_start < v_window_cutoff THEN
    INSERT INTO public.rate_limits (user_id, endpoint, window_start, request_count)
    VALUES (p_user_id, p_endpoint, now(), 1)
    ON CONFLICT (user_id, endpoint)
    DO UPDATE SET window_start = now(), request_count = 1;
    RETURN true;
  END IF;

  -- Within the window: check limit
  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits
     SET request_count = request_count + 1
   WHERE user_id = p_user_id AND endpoint = p_endpoint;
  RETURN true;
END;
$$;
