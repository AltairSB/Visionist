'use client'

import { Shirt, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { getSavedOutfits, type SavedOutfit } from '@/lib/wardrobe-storage'
import { formatCurrency } from '@/lib/utils'

export const WardrobePage = () => {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([])

  useEffect(() => {
    setOutfits(getSavedOutfits())
  }, [])

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

        {outfits.length === 0 ? (
          <div className="rounded-[2rem] border border-plum/10 bg-white/80 p-10 text-center shadow-card">
            <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-lilac text-plum">
              <Shirt size={28} />
            </span>
            <p className="mt-5 text-lg font-bold text-ink">Henüz kayıtlı kombin yok</p>
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
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
                  <p className="text-2xl font-bold">{formatCurrency(outfit.recommendation.sale_total)}</p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {outfit.recommendation.items.map((item) => (
                    <div
                      key={`${outfit.id}-${item.id}-${item.product.id}`}
                      className="rounded-2xl border border-white/12 bg-white/10 p-3"
                    >
                      <div className="relative h-28 overflow-hidden rounded-xl">
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      </div>
                      <p className="mt-3 text-sm font-bold">{item.product.name}</p>
                      <p className="text-xs text-white/70">{formatCurrency(item.product.sale_price)}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
