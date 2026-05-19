-- Visionist initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Guest sessions (pre-login kombin history)
CREATE TABLE public.guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  merged_into_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

-- Account metadata (1:1 with auth.users)
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Personal + categorical style preferences
CREATE TABLE public.user_style_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  segment text NOT NULL,
  gender text NOT NULL,
  height_cm numeric(5, 2) NOT NULL,
  weight_kg numeric(5, 2) NOT NULL,
  style text NOT NULL,
  default_preference text NOT NULL DEFAULT 'balanced',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_style_profiles_segment_check
    CHECK (segment IN ('child', 'young', 'adult')),
  CONSTRAINT user_style_profiles_gender_check
    CHECK (gender IN ('female', 'male')),
  CONSTRAINT user_style_profiles_style_check
    CHECK (style IN ('classic', 'sport', 'daily', 'chic', 'vintage', 'minimal')),
  CONSTRAINT user_style_profiles_preference_check
    CHECK (default_preference IN ('balanced', 'cheaper', 'sportier', 'elegant'))
);

-- Each successful kombin request
CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  guest_session_id uuid REFERENCES public.guest_sessions (id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'text',
  preference text NOT NULL DEFAULT 'balanced',
  prompt text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  list_total numeric(12, 2) NOT NULL DEFAULT 0,
  sale_total numeric(12, 2) NOT NULL DEFAULT 0,
  savings numeric(12, 2) NOT NULL DEFAULT 0,
  market_note text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'fallback',
  profile_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recommendations_owner_check
    CHECK (num_nonnulls(user_id, guest_session_id) = 1),
  CONSTRAINT recommendations_mode_check
    CHECK (mode IN ('text', 'fit')),
  CONSTRAINT recommendations_preference_check
    CHECK (preference IN ('balanced', 'cheaper', 'sportier', 'elegant')),
  CONSTRAINT recommendations_source_check
    CHECK (source IN ('gemini', 'fallback'))
);

CREATE INDEX recommendations_user_id_idx ON public.recommendations (user_id);
CREATE INDEX recommendations_guest_session_id_idx ON public.recommendations (guest_session_id);
CREATE INDEX recommendations_created_at_idx ON public.recommendations (created_at DESC);

-- Outfit line items
CREATE TABLE public.recommendation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.recommendations (id) ON DELETE CASCADE,
  slot_index smallint NOT NULL,
  product_id text NOT NULL,
  reason text NOT NULL DEFAULT '',
  product_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX recommendation_items_recommendation_id_idx
  ON public.recommendation_items (recommendation_id);

-- Wardrobe (saved outfits)
CREATE TABLE public.saved_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  recommendation_id uuid NOT NULL REFERENCES public.recommendations (id) ON DELETE CASCADE,
  prompt text NOT NULL DEFAULT '',
  title text,
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX saved_outfits_user_id_idx ON public.saved_outfits (user_id);

-- Optional profile audit
CREATE TABLE public.profile_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profile_audit_log_user_id_idx ON public.profile_audit_log (user_id);

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_style_profiles_set_updated_at
  BEFORE UPDATE ON public.user_style_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
