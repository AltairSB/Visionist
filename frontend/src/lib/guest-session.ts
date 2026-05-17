const GUEST_SESSION_KEY = 'visionist-guest-session'

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
