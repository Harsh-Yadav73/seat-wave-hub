
-- Fix search_path on generate_booking_code
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE code TEXT;
BEGIN
  code := 'TKT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  RETURN code;
END; $$;

-- Revoke public execute on all SECURITY DEFINER helpers; only the roles that need them get EXECUTE.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_expired_seat_holds() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_seat_holds() TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.generate_booking_code() FROM public, anon;
