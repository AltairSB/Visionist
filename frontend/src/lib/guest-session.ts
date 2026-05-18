const GUEST_SESSION_KEY = 'visionist-guest-session'
export const GUEST_PROFILE_STORAGE_KEY = 'visionist-profile'

export const getGuestSessionId = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(GUEST_SESSION_KEY)
}

export const setGuestSessionId = (sessionId: string | null) => {
  if (typeof window === 'undefined') {
    return
  }

  if (!sessionId) {
    window.localStorage.removeItem(GUEST_SESSION_KEY)
    return
  }

  window.localStorage.setItem(GUEST_SESSION_KEY, sessionId)
}

export const clearGuestSessionId = () => {
  setGuestSessionId(null)
}

export const resetGuestClientState = () => {
  clearGuestSessionId()

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(GUEST_PROFILE_STORAGE_KEY)
  }
}
