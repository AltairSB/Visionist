import { getMockRecommendation } from '@/lib/mock-recommendation'
import type { RecommendationRequest, RecommendationResponse } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true'
const RECOMMENDATION_TIMEOUT_MS = 4000

type RecommendationOptions = {
  replaceItemId?: number
  replaceRequest?: string
  currentItems?: RecommendationResponse['items']
}

const getFallbackRecommendation = (
  payload: RecommendationRequest,
  options?: RecommendationOptions,
): RecommendationResponse =>
  getMockRecommendation(payload.profile, payload.prompt, payload.preference, {
    replaceItemId: options?.replaceItemId,
    replaceRequest: options?.replaceRequest,
    currentItems: options?.currentItems,
  })

export const requestRecommendation = async (
  payload: RecommendationRequest,
  options?: RecommendationOptions,
): Promise<RecommendationResponse> => {
  if (!USE_LIVE_API) {
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
    return getFallbackRecommendation(payload, options)
  }

  const body = {
    ...payload,
    replace_item_id: options?.replaceItemId,
    item_update_note: options?.replaceRequest,
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), RECOMMENDATION_TIMEOUT_MS)

    const response = await fetch(`${API_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Kombin önerisi alınamadı')
    }

    return response.json()
  } catch {
    return getFallbackRecommendation(payload, options)
  }
}
