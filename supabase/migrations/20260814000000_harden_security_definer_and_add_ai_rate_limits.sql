BEGIN;

REVOKE EXECUTE ON FUNCTION public.check_teacher_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_teacher_update() TO service_role, postgres;

DO $$
BEGIN
  IF to_regprocedure('public.set_teacher_username()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.set_teacher_username() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.set_teacher_username() TO service_role, postgres';
  END IF;
END
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role, postgres;

CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  user_id UUID PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.ai_rate_limits TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_rate_limit(
  p_user_id UUID,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  retry_after_seconds INTEGER,
  request_count INTEGER,
  window_start TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_retry_after INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_limit IS NULL OR p_limit < 1 OR p_limit > 1000 OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO public.ai_rate_limits (user_id, request_count, window_start)
  VALUES (p_user_id, 0, v_now)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT arl.request_count, arl.window_start
  INTO v_count, v_window_start
  FROM public.ai_rate_limits AS arl
  WHERE arl.user_id = p_user_id
  FOR UPDATE;

  IF v_window_start <= v_now - make_interval(secs => p_window_seconds) THEN
    UPDATE public.ai_rate_limits AS arl
    SET request_count = 1, window_start = v_now
    WHERE arl.user_id = p_user_id;
    RETURN QUERY SELECT TRUE, 0, 1, v_now;
    RETURN;
  END IF;

  IF v_count >= p_limit THEN
    v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::INTEGER);
    RETURN QUERY SELECT FALSE, v_retry_after, v_count, v_window_start;
    RETURN;
  END IF;

  UPDATE public.ai_rate_limits AS arl
  SET request_count = v_count + 1
  WHERE arl.user_id = p_user_id;
  RETURN QUERY SELECT TRUE, 0, v_count + 1, v_window_start;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_ai_rate_limit(UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_rate_limit(UUID, INTEGER, INTEGER) TO service_role, postgres;

COMMIT;
