export type Segment = 'child' | 'young' | 'adult'
export type Gender = 'female' | 'male'
export type StylePreference = 'classic' | 'sport' | 'daily' | 'chic' | 'vintage' | 'minimal'
export type CatalogGender = 'Men' | 'Women' | 'Boys' | 'Girls'
export type PreferenceMode = 'balanced' | 'cheaper' | 'sportier' | 'elegant'

export type UserProfile = {
  segment: Segment
  gender: Gender
  height: number
  weight: number
  style: StylePreference
}

export type Account = {
  name: string
  email: string
  createdAt: string
  hasCompletedOnboarding?: boolean
}

export type Product = {
  id: number
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
}

export type RecommendationRequest = {
  profile: UserProfile
  prompt: string
  image_hint?: string
  preference: PreferenceMode
}
