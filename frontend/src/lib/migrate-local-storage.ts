import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { saveUserProfile } from '@/lib/supabase/profile'
import { defaultProfile, normalizeProfile } from '@/lib/profile'
import type { PreferenceMode, UserProfile } from '@/lib/types'

const MIGRATION_KEY = 'visionist-supabase-migrated'
const LEGACY_PROFILE_KEY = 'visionist-profile'
const LEGACY_ONBOARDING_KEY = 'visionist-onboarding-complete'

const getLegacyProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(LEGACY_PROFILE_KEY)

  if (!raw) {
    return null
  }

  try {
    return normalizeProfile(JSON.parse(raw) as Partial<UserProfile>)
  } catch {
    return null
  }
}

export const migrateLocalStorageToSupabase = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured || typeof window === 'undefined') {
    return
  }

  if (window.localStorage.getItem(MIGRATION_KEY) === 'true') {
    return
  }

  const supabase = getSupabase()

  if (!supabase) {
    return
  }

  const legacyProfile = getLegacyProfile() ?? defaultProfile
  const onboardingComplete = window.localStorage.getItem(LEGACY_ONBOARDING_KEY) === 'true'

  await saveUserProfile(userId, legacyProfile, 'balanced' as PreferenceMode, onboardingComplete)

  window.localStorage.setItem(MIGRATION_KEY, 'true')
  window.localStorage.removeItem(LEGACY_PROFILE_KEY)
  window.localStorage.removeItem(LEGACY_ONBOARDING_KEY)
  window.localStorage.removeItem('visionist-account')
  window.localStorage.removeItem('visionist-wardrobe')
}
