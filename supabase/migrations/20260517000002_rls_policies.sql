-- Row Level Security

ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_audit_log ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_style_profiles
CREATE POLICY user_style_profiles_select_own ON public.user_style_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_style_profiles_insert_own ON public.user_style_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_style_profiles_update_own ON public.user_style_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- recommendations (authenticated users read own rows)
CREATE POLICY recommendations_select_own ON public.recommendations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- recommendation_items via parent recommendation
CREATE POLICY recommendation_items_select_own ON public.recommendation_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations r
      WHERE r.id = recommendation_id AND r.user_id = auth.uid()
    )
  );

-- saved_outfits
CREATE POLICY saved_outfits_select_own ON public.saved_outfits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY saved_outfits_insert_own ON public.saved_outfits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY saved_outfits_delete_own ON public.saved_outfits
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- profile_audit_log
CREATE POLICY profile_audit_log_select_own ON public.profile_audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY profile_audit_log_insert_own ON public.profile_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- guest_sessions: no public policies (backend service role only)
