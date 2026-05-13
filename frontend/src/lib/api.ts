import type { RecommendationRequest, RecommendationResponse } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const requestRecommendation = async (
  payload: RecommendationRequest,
): Promise<RecommendationResponse> => {
  const response = await fetch(`${API_URL}/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Kombin önerisi alınamadı')
  }

  return response.json()
}
