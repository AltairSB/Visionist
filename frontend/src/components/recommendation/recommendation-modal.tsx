'use client'

import { BadgePercent, RefreshCw, Shirt, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { requestRecommendation } from '@/lib/api'
import type { RecommendationResponse, RecommendedItem, UserProfile } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

type RecommendationModalProps = {
  isOpen: boolean
  recommendation: RecommendationResponse
  prompt: string
  profile: UserProfile
  isAuthenticated: boolean
  onClose: () => void
  onSaveToWardrobe: (recommendation: RecommendationResponse) => void | Promise<void>
  onRecommendationChange: (recommendation: RecommendationResponse) => void
}

export const RecommendationModal = ({
  isOpen,
  recommendation,
  prompt,
  profile,
  isAuthenticated,
  onClose,
  onSaveToWardrobe,
  onRecommendationChange,
}: RecommendationModalProps) => {
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({})
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const handleItemUpdate = async (item: RecommendedItem) => {
    const note = itemNotes[item.id]?.trim()

    if (!note) {
      return
    }

    setUpdatingItemId(item.id)

    try {
      const response = await requestRecommendation(
        {
          profile,
          prompt,
          preference: 'balanced',
        },
        {
          replaceItemId: item.id,
          replaceRequest: note,
          currentItems: recommendation.items,
        },
      )

      onRecommendationChange(response)
      setItemNotes((current) => ({ ...current, [item.id]: '' }))
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveToWardrobe(recommendation)
    } finally {
      setIsSaving(false)
    }
  }

  const savingsPercent =
    recommendation.list_total > 0
      ? Math.round((recommendation.savings / recommendation.list_total) * 100)
      : 0

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-md sm:items-center sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kombin önerisi"
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] border border-white/20 bg-mist shadow-atelier sm:rounded-[2rem]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-plum/10 bg-white/80 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet">
              {recommendation.source === 'gemini' ? 'Gemini seçimi' : 'Kural tabanlı öneri'}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-ink sm:text-3xl">
              Senin için seçilen kombin
            </h2>
            <p className="mt-1 text-sm text-ink/60">{prompt}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kombin penceresini kapat"
            className="shrink-0 rounded-full border border-plum/15 bg-white p-2 text-plum transition hover:bg-lilac"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recommendation.items.map((item) => (
              <article
                key={`${item.id}-${item.product.id}`}
                className="relative h-64 overflow-hidden rounded-2xl bg-plum shadow-card sm:h-84"
              >
                <Image
                  src={item.product.image_url}
                  alt={item.product.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 22vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-plum/95 via-plum/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-lilac">
                    {item.product.article_type}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight">
                    {item.product.name}
                  </p>
                  <p className="mt-1 text-base font-bold">{formatCurrency(item.product.sale_price)}</p>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-6 rounded-2xl bg-gradient-to-br from-plum to-violet p-5 text-white">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-lilac">
              <Sparkles size={16} />
              AI özeti
            </p>
            <p className="mt-3 leading-7 text-white/80">{recommendation.summary}</p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-white/60 line-through">{formatCurrency(recommendation.list_total)}</p>
                <p className="text-2xl font-bold">{formatCurrency(recommendation.sale_total)}</p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
                %{savingsPercent} tasarruf
              </span>
            </div>
          </section>

          <section className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">
              Parça bazlı güncelleme
            </p>
            <p className="mt-1 text-sm text-ink/60">
              Sadece değiştirmek istediğin parça için istek yaz; kombinin geri kalanı aynı kalır.
            </p>
            <div className="mt-4 space-y-4">
              {recommendation.items.map((item) => (
                <div
                  key={`update-${item.id}-${item.product.id}`}
                  className="rounded-2xl border border-plum/10 bg-white/90 p-4 shadow-card"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-plum">{item.product.name}</p>
                      <p className="mt-1 text-sm text-ink/60">{item.reason}</p>
                    </div>
                    <p className="text-lg font-bold text-ink">{formatCurrency(item.product.sale_price)}</p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={itemNotes[item.id] ?? ''}
                      onChange={(event) =>
                        setItemNotes((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      placeholder="Örn: daha koyu renk, daha spor bir alternatif..."
                      className="flex-1 rounded-xl border border-plum/15 bg-mist px-4 py-2.5 text-sm text-ink outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={updatingItemId === item.id || !(itemNotes[item.id]?.trim())}
                      onClick={() => void handleItemUpdate(item)}
                      className="shrink-0"
                    >
                      <RefreshCw size={16} className={updatingItemId === item.id ? 'animate-spin' : ''} />
                      {updatingItemId === item.id ? 'Güncelleniyor...' : 'Parçayı Güncelle'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <p className="mt-4 flex items-start gap-2 rounded-xl border border-plum/10 bg-white/70 p-3 text-sm text-ink/70">
            <BadgePercent size={18} className="mt-0.5 shrink-0 text-plum" />
            {recommendation.market_note}
          </p>
        </div>

        <footer className="shrink-0 border-t border-plum/10 bg-white/90 px-5 py-4 sm:px-7">
          <div
            className={
              isAuthenticated
                ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
                : ''
            }
          >
            <p className="text-sm text-ink/60">
              {isAuthenticated
                ? 'Kapatınca veya kaydedince bu kombin oturumu sona erer. Yeni arama için tekrar istek yazabilirsin.'
                : 'Kapatınca bu kombin oturumu sona erer. Yeni arama için tekrar istek yazabilirsin.'}
            </p>
            {isAuthenticated ? (
              <Button type="button" onClick={() => void handleSave()} disabled={isSaving} className="mt-3 shrink-0 sm:mt-0">
                <Shirt size={18} />
                Dolabıma Kaydet
              </Button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  )
}
