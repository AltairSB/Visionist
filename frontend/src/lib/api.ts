import { getAccessToken } from '@/lib/supabase/auth'
import { getGuestSessionId, setGuestSessionId } from '@/lib/guest-session'
import { getMockRecommendation } from '@/lib/mock-recommendation'
import type { RecommendationRequest, RecommendationResponse } from '@/lib/types'

/** Same-origin proxy via next.config rewrites → avoids CORS / localhost issues on Windows */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/backend'
const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API !== 'false'
const RECOMMENDATION_TIMEOUT_MS = 90_000
const FIT_RECOMMENDATION_TIMEOUT_MS = 120_000

type RecommendationOptions = {
  replaceItemId?: number
  replaceRequest?: string
  currentItems?: RecommendationResponse['items']
}

const parseApiErrorDetail = (body: unknown, fallback: string): string => {
  if (!body || typeof body !== 'object') {
    return fallback
  }

  const detail = (body as { detail?: unknown }).detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: string }).msg)
        }

        return String(item)
      })
      .join(' ')
  }

  return fallback
}

const buildAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = await getAccessToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const guestSessionId = getGuestSessionId()

  if (guestSessionId && !token) {
    headers['X-Guest-Session-Id'] = guestSessionId
  }

  return headers
}

export const requestRecommendation = async (
  payload: RecommendationRequest,
  options?: RecommendationOptions,
): Promise<RecommendationResponse> => {
  if (!USE_LIVE_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
    return getMockRecommendation(payload.profile, payload.prompt, payload.preference, {
      mode: payload.mode,
      replaceItemId: options?.replaceItemId,
      replaceRequest: options?.replaceRequest,
      currentItems: options?.currentItems,
    })
  }

  const body = {
    ...payload,
    replace_item_id: options?.replaceItemId,
    item_update_note: options?.replaceRequest,
    current_items: options?.currentItems,
  }

  const isFitMode = payload.mode === 'fit'
  const timeoutMs = isFitMode ? FIT_RECOMMENDATION_TIMEOUT_MS : RECOMMENDATION_TIMEOUT_MS

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response

  try {
    response = await fetch(`${API_URL}/recommend`, {
      method: 'POST',
      headers: await buildAuthHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutHint = isFitMode
        ? 'Görsel analizi uzun sürebilir; tekrar deneyin veya daha küçük bir fotoğraf yükleyin.'
        : 'Gemini yanıtı gecikmiş olabilir; bir kez daha deneyin.'
      throw new Error(`Kombin isteği zaman aşımına uğradı. ${timeoutHint}`)
    }
    throw new Error(
      'Backend’e bağlanılamadı. Terminalde: cd backend && uvicorn app.main:app --reload --port 8000 — ardından frontend’i yeniden başlatın (npm run dev).',
    )
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    let detail = 'Kombin önerisi alınamadı'

    try {
      const errorBody = await response.json()
      detail = parseApiErrorDetail(errorBody, detail)
    } catch {
      if (response.status === 422) {
        detail = 'İstek doğrulanamadı. Profil ve görsel formatını kontrol edin.'
      } else if (response.status === 504) {
        detail =
          'Görsel analizi zaman aşımına uğradı. Daha küçük bir fotoğraf deneyin veya biraz sonra tekrarlayın.'
      } else if (response.status === 502) {
        detail =
          'Backend’e bağlanılamadı. Terminalde: cd backend && uvicorn app.main:app --reload --port 8000'
      } else if (response.status >= 500) {
        detail = 'Sunucu hatası. Backend terminalindeki logları kontrol edin.'
      }
    }

    throw new Error(detail)
  }

  const data = (await response.json()) as RecommendationResponse

  if (data.guest_session_id) {
    setGuestSessionId(data.guest_session_id)
  }

  return data
}

export const deleteAccount = async (): Promise<void> => {
  const token = await getAccessToken()

  if (!token) {
    throw new Error('Oturum açmanız gerekiyor.')
  }

  const response = await fetch(`${API_URL}/me/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let detail = 'Hesap silinemedi'

    try {
      const errorBody = await response.json()
      detail = parseApiErrorDetail(errorBody, detail)
    } catch {
      if (response.status >= 500) {
        detail = 'Sunucu hatası. Backend terminalindeki logları kontrol edin.'
      }
    }

    throw new Error(detail)
  }
}
