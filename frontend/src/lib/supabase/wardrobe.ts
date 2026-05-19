import { getAccessToken } from '@/lib/supabase/auth'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Product, RecommendationResponse, RecommendedItem } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/backend'
const FIT_UPLOADS_BUCKET = 'fit-uploads'
const SIGNED_URL_EXPIRES_SECONDS = 3600

export type SavedOutfit = {
  id: string
  savedAt: string
  prompt: string
  recommendation: RecommendationResponse
  uploadedGarmentPreviewUrl?: string
}

type RequestMeta = {
  uploaded_garment_path?: string
  uploaded_slot?: string
  image_mime_type?: string
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
  request_meta?: RequestMeta | null
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
  uploaded_slot: row.request_meta?.uploaded_slot as RecommendationResponse['uploaded_slot'],
})

const resolveUploadedPreviewUrl = async (
  storagePath: string | undefined,
): Promise<string | undefined> => {
  if (!storagePath) {
    return undefined
  }

  const supabase = getSupabase()
  if (!supabase) {
    return undefined
  }

  const { data, error } = await supabase.storage
    .from(FIT_UPLOADS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_SECONDS)

  if (error || !data?.signedUrl) {
    console.error('createSignedUrl', error)
    return undefined
  }

  return data.signedUrl
}

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
        request_meta,
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

  const rows = (data as SavedOutfitRow[]).filter((row) => {
    const recommendationRow = Array.isArray(row.recommendations)
      ? row.recommendations[0]
      : row.recommendations
    return Boolean(recommendationRow)
  })

  return Promise.all(
    rows.map(async (row) => {
      const recommendationRow = Array.isArray(row.recommendations)
        ? row.recommendations[0]!
        : row.recommendations!

      const uploadedGarmentPreviewUrl = await resolveUploadedPreviewUrl(
        recommendationRow.request_meta?.uploaded_garment_path,
      )

      return {
        id: row.id,
        savedAt: row.saved_at,
        prompt: row.prompt,
        recommendation: mapRecommendation(recommendationRow),
        uploadedGarmentPreviewUrl,
      }
    }),
  )
}

export type SaveOutfitResult = {
  ok: boolean
  error?: string
}

type FitImagePayload = {
  base64: string
  mimeType: string
}

export const saveOutfitToDatabase = async (
  recommendationId: string,
  prompt: string,
  accessToken?: string | null,
  fitImage?: FitImagePayload,
): Promise<SaveOutfitResult> => {
  const token = accessToken ?? (await getAccessToken())

  if (!token) {
    return {
      ok: false,
      error: 'Oturum doğrulanamadı. Çıkış yapıp tekrar giriş yapın.',
    }
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}/wardrobe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recommendation_id: recommendationId,
        prompt,
        ...(fitImage
          ? {
              image_base64: fitImage.base64,
              image_mime_type: fitImage.mimeType,
            }
          : {}),
      }),
    })
  } catch {
    return { ok: false, error: 'Backend’e bağlanılamadı.' }
  }

  if (response.ok) {
    return { ok: true }
  }

  if (response.status === 401) {
    return {
      ok: false,
      error: 'Oturum süresi dolmuş veya geçersiz. Çıkış yapıp tekrar giriş yapın.',
    }
  }

  if (response.status === 503) {
    return {
      ok: false,
      error: 'Dolap servisi yapılandırılmamış. Backend Supabase ayarlarını kontrol edin.',
    }
  }

  let error = 'Dolaba kaydedilemedi.'

  try {
    const body = (await response.json()) as { detail?: string }
    if (body.detail) {
      error = body.detail
    }
  } catch {
    // ignore parse errors
  }

  return { ok: false, error }
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
