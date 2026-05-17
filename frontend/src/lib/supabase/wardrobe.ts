import { getAccessToken } from '@/lib/supabase/auth'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Product, RecommendationResponse, RecommendedItem } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/backend'

export type SavedOutfit = {
  id: string
  savedAt: string
  prompt: string
  recommendation: RecommendationResponse
}

type ItemRow = {
  slot_index: number
  product_id: string
  reason: string
  product_snapshot: Product
}

type RecommendationRow = {
  summary: string
  list_total: number
  sale_total: number
  savings: number
  market_note: string
  source: string
  recommendation_items: ItemRow[]
}

type SavedOutfitRow = {
  id: string
  prompt: string
  saved_at: string
  recommendations: RecommendationRow | RecommendationRow[] | null
}

const mapRecommendation = (row: RecommendationRow): RecommendationResponse => ({
  items: (row.recommendation_items ?? [])
    .sort((a, b) => a.slot_index - b.slot_index)
    .map(
      (item): RecommendedItem => ({
        id: item.slot_index,
        reason: item.reason,
        product: {
          ...item.product_snapshot,
          id: item.product_snapshot.id ?? item.product_id,
        },
      }),
    ),
  summary: row.summary,
  list_total: Number(row.list_total),
  sale_total: Number(row.sale_total),
  savings: Number(row.savings),
  market_note: row.market_note,
  source: row.source === 'gemini' ? 'gemini' : 'fallback',
})

export const fetchSavedOutfits = async (): Promise<SavedOutfit[]> => {
  if (!isSupabaseConfigured) {
    return []
  }

  const supabase = getSupabase()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('saved_outfits')
    .select(
      `
      id,
      prompt,
      saved_at,
      recommendations (
        summary,
        list_total,
        sale_total,
        savings,
        market_note,
        source,
        recommendation_items (
          slot_index,
          product_id,
          reason,
          product_snapshot
        )
      )
    `,
    )
    .order('saved_at', { ascending: false })

  if (error || !data) {
    console.error('fetchSavedOutfits', error)
    return []
  }

  return (data as SavedOutfitRow[])
    .map((row) => {
      const recommendationRow = Array.isArray(row.recommendations)
        ? row.recommendations[0]
        : row.recommendations

      if (!recommendationRow) {
        return null
      }

      return {
        id: row.id,
        savedAt: row.saved_at,
        prompt: row.prompt,
        recommendation: mapRecommendation(recommendationRow),
      }
    })
    .filter((outfit): outfit is SavedOutfit => outfit !== null)
}

export const saveOutfitToDatabase = async (
  recommendationId: string,
  prompt: string,
): Promise<boolean> => {
  const token = await getAccessToken()

  if (!token) {
    return false
  }

  const response = await fetch(`${API_URL}/wardrobe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recommendation_id: recommendationId,
      prompt,
    }),
  })

  return response.ok
}

export const deleteOutfitFromDatabase = async (outfitId: string): Promise<boolean> => {
  const token = await getAccessToken()

  if (!token) {
    return false
  }

  const response = await fetch(`${API_URL}/wardrobe/${outfitId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.ok
}
