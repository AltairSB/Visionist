import type { RecommendationResponse } from '@/lib/types'

const WARDROBE_KEY = 'visionist-wardrobe'

export type SavedOutfit = {
  id: string
  savedAt: string
  prompt: string
  recommendation: RecommendationResponse
}

export const getSavedOutfits = (): SavedOutfit[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(WARDROBE_KEY)

  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as SavedOutfit[]
  } catch {
    return []
  }
}

export const saveOutfitToWardrobe = (prompt: string, recommendation: RecommendationResponse) => {
  const outfits = getSavedOutfits()
  const nextOutfit: SavedOutfit = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    prompt,
    recommendation,
  }

  window.localStorage.setItem(WARDROBE_KEY, JSON.stringify([nextOutfit, ...outfits]))
}
