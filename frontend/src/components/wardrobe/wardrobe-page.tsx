'use client'

import { Shirt, Sparkles, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  deleteOutfitFromWardrobe,
  getSavedOutfits,
  type SavedOutfit,
} from '@/lib/wardrobe-storage'
import { formatCurrency } from '@/lib/utils'

export const WardrobePage = () => {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([])
  const [deleteTarget, setDeleteTarget] = useState<SavedOutfit | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadOutfits = useCallback(async () => {
    setIsLoading(true)
    const saved = await getSavedOutfits()
    setOutfits(saved)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadOutfits()
  }, [loadOutfits])

  useEffect(() => {
    if (!deleteTarget) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDeleteTarget(null)
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [deleteTarget])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    await deleteOutfitFromWardrobe(deleteTarget.id)
    setDeleteTarget(null)
    await loadOutfits()
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet">Dolabım</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-ink">Kayıtlı kombinlerin</h1>
          <p className="mt-3 text-ink/65">
            Kombin önerisinden kaydettiğin setler burada listelenir.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-ink/60">Dolap yükleniyor...</p>
        ) : outfits.length === 0 ? (
          <div className="rounded-[2rem] border border-plum/10 bg-white/80 p-10 text-center shadow-card">
            <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-lilac text-plum">
              <Shirt size={28} />
            </span>
            <p className="mt-5 text-lg font-bold text-ink">Henüz kay─▒tl─▒ kombin yok</p>
            <p className="mt-2 text-ink/60">
              Asistan ekranında kombin bulup &quot;Dolabıma Kaydet&quot; ile buraya ekleyebilirsin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {outfits.map((outfit) => (
              <article
                key={outfit.id}
                className="rounded-[2rem] border border-plum/10 bg-plum p-6 text-white shadow-atelier sm:p-8"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-lilac">
                      <Sparkles size={14} />
                      Kayıtlı kombin
                    </p>
                    <h2 className="mt-2 text-xl font-bold">{outfit.prompt}</h2>
                    <p className="mt-1 text-sm text-white/60">
                      {new Date(outfit.savedAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <p className="text-2xl font-bold">{formatCurrency(outfit.recommendation.sale_total)}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDeleteTarget(outfit)}
                      className="border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      aria-label={`"${outfit.prompt}" kombinini sil`}
                    >
                      <Trash2 size={16} />
                      Sil
                    </Button>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {outfit.recommendation.items.map((item) => (
                    <div
                      key={`${outfit.id}-${item.id}-${item.product.id}`}
                      className="overflow-hidden rounded-2xl border border-white/12 bg-white/10"
                    >
                      <div className="relative h-64 overflow-hidden sm:h-72">
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 22vw"
                          className="object-cover object-center"
                        />
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 text-sm font-bold">{item.product.name}</p>
                        <p className="mt-1 text-xs text-white/70">{formatCurrency(item.product.sale_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}

        {deleteTarget ? (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/55 p-5 backdrop-blur-sm">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-outfit-title"
              aria-describedby="delete-outfit-desc"
              className="w-full max-w-md rounded-3xl border border-plum/10 bg-white p-6 shadow-atelier sm:p-8"
            >
              <h2 id="delete-outfit-title" className="text-xl font-bold text-ink">
                Emin misiniz?
              </h2>
              <p id="delete-outfit-desc" className="mt-3 leading-7 text-ink/65">
                Bu kombin dolabınızdan kalıcı olarak silinecek. İşlem geri alınamaz.
              </p>
              <p className="mt-2 line-clamp-2 text-sm font-medium text-plum">
                &quot;{deleteTarget.prompt}&quot;
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
                  İptal
                </Button>
                <Button type="button" onClick={() => void handleConfirmDelete()}>
                  <Trash2 size={16} />
                  Evet, sil
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}


