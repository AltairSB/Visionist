import { clearGuestSessionId } from '@/lib/guest-session'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Account } from '@/lib/types'

export const signUp = async (email: string, password: string, displayName: string) => {
  const supabase = getSupabase()

  if (!supabase) {
    throw new Error('Supabase yapılandırılmamış.')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })

  if (error) {
    throw error
  }

  return data
}

export const signIn = async (email: string, password: string) => {
  const supabase = getSupabase()

  if (!supabase) {
    throw new Error('Supabase yapılandırılmamış.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw error
  }

  return data
}

export const signOut = async () => {
  const supabase = getSupabase()

  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}

export const getAccessToken = async (): Promise<string | null> => {
  const supabase = getSupabase()

  if (!supabase) {
    return null
  }

  const { data } = await supabase.auth.getSession()

  return data.session?.access_token ?? null
}

export const mapSessionToAccount = (
  user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> },
  onboardingCompleted: boolean,
): Account => {
  const displayName =
    (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
    user.email?.split('@')[0] ||
    'Stil Üyesi'

  return {
    id: user.id,
    name: displayName,
    email: user.email ?? '',
    createdAt: user.created_at ?? new Date().toISOString(),
    hasCompletedOnboarding: onboardingCompleted,
  }
}

export const updatePassword = async (newPassword: string) => {
  const supabase = getSupabase()

  if (!supabase) {
    throw new Error('Supabase yapılandırılmamış.')
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    throw error
  }
}

export const mergeGuestSessionForUser = async (userId: string, guestSessionId: string | null) => {
  if (!guestSessionId || !isSupabaseConfigured) {
    return
  }

  const supabase = getSupabase()

  if (!supabase) {
    return
  }

  await supabase.rpc('merge_guest_session', {
    p_user_id: userId,
    p_guest_session_id: guestSessionId,
  })

  clearGuestSessionId()
}
