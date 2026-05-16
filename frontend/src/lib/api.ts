import { getMockRecommendation } from '@/lib/mock-recommendation'
import type { RecommendationRequest, RecommendationResponse } from '@/lib/types'

/** Same-origin proxy via next.config rewrites → avoids CORS / localhost issues on Windows */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/backend'
const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API !== 'false'
const RECOMMENDATION_TIMEOUT_MS = 30000

type RecommendationOptions = {
  replaceItemId?: number
  replaceRequest?: string
  currentItems?: RecommendationResponse['items']
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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), RECOMMENDATION_TIMEOUT_MS)

  let response: Response

  try {
    response = await fetch(`${API_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Kombin isteği zaman aşımına uğradı. Backend çalışıyor mu kontrol edin.')
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
      const errorBody = (await response.json()) as { detail?: string }
      if (errorBody.detail) {
        detail = errorBody.detail
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail)
  }

  return response.json() as Promise<RecommendationResponse>
}
