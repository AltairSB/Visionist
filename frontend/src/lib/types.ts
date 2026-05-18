export type Segment = 'child' | 'young' | 'adult'
export type Gender = 'female' | 'male'
export type ClothingSize = 'S' | 'M' | 'L' | 'XL'
export type StylePreference = 'classic' | 'sport' | 'daily' | 'chic' | 'vintage' | 'minimal'
export type CatalogGender = 'Men' | 'Women' | 'Boys' | 'Girls'
export type PreferenceMode = 'balanced' | 'cheaper' | 'sportier' | 'elegant'
export type RecommendationMode = 'text' | 'fit'

export type UserProfile = {
  segment: Segment
  gender: Gender
  preferred_size: ClothingSize
  style: StylePreference
}

export type Account = {
  id: string
  name: string
  email: string
  createdAt: string
  hasCompletedOnboarding?: boolean
}

export type Product = {
  id: string
  name: string
  gender: 'Men' | 'Women' | 'Boys' | 'Girls'
  master_category: string
  sub_category: string
  article_type: string
  base_colour: string
  usage: string
  price: number
  sale_price: number
  image_url: string
  product_url: string
}

export type RecommendedItem = {
  id: number
  reason: string
  product: Product
}

export type RecommendationResponse = {
  items: RecommendedItem[]
  summary: string
  list_total: number
  sale_total: number
  savings: number
  market_note: string
  source: 'gemini' | 'fallback'
  recommendation_id?: string | null
  guest_session_id?: string | null
  uploaded_slot?: 'topwear' | 'bottomwear' | 'outerwear' | 'dress' | null
}

export type RecommendationRequest = {
  profile: UserProfile
  prompt: string
  mode?: RecommendationMode
  image_base64?: string
  image_mime_type?: string
  image_hint?: string
  preference: PreferenceMode
}

export const CLOTHING_SIZES: ClothingSize[] = ['S', 'M', 'L', 'XL']
