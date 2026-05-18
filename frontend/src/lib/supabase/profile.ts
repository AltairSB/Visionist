import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { defaultProfile, normalizeProfile } from '@/lib/profile'
import type { ClothingSize, PreferenceMode, UserProfile } from '@/lib/types'

type StyleRow = {
  segment: string
  gender: string
  preferred_size: string
  style: string
  default_preference: string
}

type ProfileRow = {
  display_name: string
  onboarding_completed_at: string | null
}

export type LoadedUserData = {
  profile: UserProfile
  defaultPreference: PreferenceMode
  onboardingCompleted: boolean
  displayName: string
}

const mapStyleRow = (row: StyleRow): { profile: UserProfile; defaultPreference: PreferenceMode } => ({
  profile: normalizeProfile({
    segment: row.segment as UserProfile['segment'],
    gender: row.gender as UserProfile['gender'],
    preferred_size: row.preferred_size as ClothingSize,
    style: row.style as UserProfile['style'],
  }),
  defaultPreference: (row.default_preference as PreferenceMode) || 'balanced',
})

export const fetchUserData = async (userId: string): Promise<LoadedUserData | null> => {
  if (!isSupabaseConfigured) {
    return null
  }

  const supabase = getSupabase()

  if (!supabase) {
    return null
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, onboarding_completed_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError || !profileRow) {
    return null
  }

  const { data: styleRow, error: styleError } = await supabase
    .from('user_style_profiles')
    .select('segment, gender, preferred_size, style, default_preference')
    .eq('user_id', userId)
    .maybeSingle()

  if (styleError || !styleRow) {
    return null
  }

  const mapped = mapStyleRow(styleRow as StyleRow)
  const profileMeta = profileRow as ProfileRow

  return {
    ...mapped,
    onboardingCompleted: profileMeta.onboarding_completed_at !== null,
    displayName: profileMeta.display_name,
  }
}

export const saveUserProfile = async (
  userId: string,
  profile: UserProfile,
  defaultPreference: PreferenceMode,
  completeOnboarding: boolean,
) => {
  if (!isSupabaseConfigured) {
    return false
  }

  const supabase = getSupabase()

  if (!supabase) {
    return false
  }

  const { error: styleError } = await supabase
    .from('user_style_profiles')
    .update({
      segment: profile.segment,
      gender: profile.gender,
      preferred_size: profile.preferred_size,
      style: profile.style,
      default_preference: defaultPreference,
    })
    .eq('user_id', userId)

  if (styleError) {
    console.error('saveUserProfile style', styleError)
    return false
  }

  if (completeOnboarding) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (profileError) {
      console.error('saveUserProfile onboarding', profileError)
      return false
    }
  }

  return true
}

export const getDefaultUserData = (): LoadedUserData => ({
  profile: defaultProfile,
  defaultPreference: 'balanced',
  onboardingCompleted: false,
  displayName: '',
})
