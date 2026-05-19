-- Replace height/weight with preferred_size; extend guest_sessions for profile

ALTER TABLE public.user_style_profiles
  ADD COLUMN IF NOT EXISTS preferred_size text;

UPDATE public.user_style_profiles
SET preferred_size = 'M'
WHERE preferred_size IS NULL;

ALTER TABLE public.user_style_profiles
  ALTER COLUMN preferred_size SET NOT NULL,
  ALTER COLUMN preferred_size SET DEFAULT 'M';

ALTER TABLE public.user_style_profiles
  DROP CONSTRAINT IF EXISTS user_style_profiles_preferred_size_check;

ALTER TABLE public.user_style_profiles
  ADD CONSTRAINT user_style_profiles_preferred_size_check
  CHECK (preferred_size IN ('S', 'M', 'L', 'XL'));

ALTER TABLE public.user_style_profiles
  DROP COLUMN IF EXISTS height_cm,
  DROP COLUMN IF EXISTS weight_kg;

ALTER TABLE public.guest_sessions
  ADD COLUMN IF NOT EXISTS segment text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS preferred_size text,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.guest_sessions
  DROP CONSTRAINT IF EXISTS guest_sessions_segment_check;

ALTER TABLE public.guest_sessions
  ADD CONSTRAINT guest_sessions_segment_check
  CHECK (segment IS NULL OR segment IN ('child', 'young', 'adult'));

ALTER TABLE public.guest_sessions
  DROP CONSTRAINT IF EXISTS guest_sessions_gender_check;

ALTER TABLE public.guest_sessions
  ADD CONSTRAINT guest_sessions_gender_check
  CHECK (gender IS NULL OR gender IN ('female', 'male'));

ALTER TABLE public.guest_sessions
  DROP CONSTRAINT IF EXISTS guest_sessions_preferred_size_check;

ALTER TABLE public.guest_sessions
  ADD CONSTRAINT guest_sessions_preferred_size_check
  CHECK (preferred_size IS NULL OR preferred_size IN ('S', 'M', 'L', 'XL'));

ALTER TABLE public.guest_sessions
  DROP CONSTRAINT IF EXISTS guest_sessions_style_check;

ALTER TABLE public.guest_sessions
  ADD CONSTRAINT guest_sessions_style_check
  CHECK (
    style IS NULL OR style IN ('classic', 'sport', 'daily', 'chic', 'vintage', 'minimal')
  );

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
    preferred_size,
    style,
    default_preference
  )
  VALUES (
    NEW.id,
    'adult',
    'female',
    'M',
    'classic',
    'balanced'
  );

  RETURN NEW;
END;
$$;
