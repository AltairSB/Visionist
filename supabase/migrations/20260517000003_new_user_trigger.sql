-- Auto-create profile rows on signup + merge guest session RPC

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name_value text;
BEGIN
  display_name_value := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    split_part(NEW.email, '@', 1),
    'Stil Üyesi'
  );

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, display_name_value);

  INSERT INTO public.user_style_profiles (
    user_id,
    segment,
    gender,
    height_cm,
    weight_kg,
    style,
    default_preference
  )
  VALUES (
    NEW.id,
    'adult',
    'female',
    170,
    65,
    'classic',
    'balanced'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Merge anonymous kombin history into authenticated user
CREATE OR REPLACE FUNCTION public.merge_guest_session(
  p_user_id uuid,
  p_guest_session_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_guest_session_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.recommendations
  SET user_id = p_user_id,
      guest_session_id = NULL
  WHERE guest_session_id = p_guest_session_id;

  UPDATE public.guest_sessions
  SET merged_into_user_id = p_user_id
  WHERE id = p_guest_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_guest_session(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_guest_session(uuid, uuid) TO service_role;
