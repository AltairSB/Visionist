import { getGuestSessionId, setGuestSessionId } from '@/lib/guest-session'
import type { UserProfile } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/backend'

let saveChain: Promise<string | null> = Promise.resolve(getGuestSessionId())

const runSerialized = <T>(task: () => Promise<T>): Promise<T> => {
  const next = saveChain.then(task, task)
  saveChain = next.then(
    () => getGuestSessionId(),
    () => getGuestSessionId(),
  )
  return next
}

export const saveGuestProfile = async (profile: UserProfile): Promise<string | null> =>
  runSerialized(async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const guestSessionId = getGuestSessionId()

    if (guestSessionId) {
      headers['X-Guest-Session-Id'] = guestSessionId
    }

    let response: Response

    try {
      response = await fetch(`${API_URL}/guest/profile`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ profile }),
      })
    } catch {
      return getGuestSessionId()
    }

    if (!response.ok) {
      return getGuestSessionId()
    }

    const data = (await response.json()) as { guest_session_id?: string }

    if (data.guest_session_id) {
      setGuestSessionId(data.guest_session_id)
    }

    return getGuestSessionId()
  })

export const initGuestSession = async (profile: UserProfile): Promise<string | null> => {
  if (getGuestSessionId()) {
    return getGuestSessionId()
  }

  return saveGuestProfile(profile)
}
