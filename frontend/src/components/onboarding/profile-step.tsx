'use client'

import { ArrowRight, CheckCircle2, Shirt } from 'lucide-react'
import Image from 'next/image'

import { getStyleImage } from '@/lib/style-images'
import { CLOTHING_SIZES, type ClothingSize, type Gender, type Segment, type StylePreference } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const styleOptions: { id: StylePreference; label: string }[] = [
  { id: 'classic', label: 'Klasik' },
  { id: 'sport', label: 'Spor' },
  { id: 'daily', label: 'Günlük' },
  { id: 'chic', label: 'Şık' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'minimal', label: 'Minimal' },
]

type ProfileStepProps = {
  segment: Segment
  gender: Gender
  preferredSize: ClothingSize
  style: StylePreference
  onPreferredSizeChange: (size: ClothingSize) => void
  onStyleChange: (style: StylePreference) => void
  onBack: () => void
  onContinue: () => void
}

export const ProfileStep = ({
  segment,
  gender,
  preferredSize,
  style,
  onPreferredSizeChange,
  onStyleChange,
  onBack,
  onContinue,
}: ProfileStepProps) => {
  return (
    <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex items-center justify-between gap-4">
        <div className="h-1.5 flex-1 rounded-full bg-lilac">
          <div className="h-full w-full rounded-full bg-violet" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/70">Adım 2 / 2</p>
      </div>
      <div className="mt-10 rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-atelier backdrop-blur md:p-10">
        <h1 className="text-4xl font-bold tracking-[-0.04em] text-ink">Sizi biraz daha yakından tanıyalım.</h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink/65">
          Beden tercihinize ve stilinize göre yalnızca stokta olan parçalar kombin önerilerine dahil edilir.
        </p>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Beden tercihi</p>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {CLOTHING_SIZES.map((size) => {
              const isSelected = preferredSize === size

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onPreferredSizeChange(size)}
                  aria-pressed={isSelected}
                  aria-label={`${size} bedenini seç`}
                  className={cn(
                    'rounded-2xl border py-4 text-center text-lg font-bold transition focus:outline-none focus:ring-4 focus:ring-violet/20',
                    isSelected
                      ? 'border-violet bg-violet text-white shadow-atelier'
                      : 'border-plum/15 bg-mist text-ink hover:border-violet/40',
                  )}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Stil Tercihi</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {styleOptions.map((item) => {
              const isSelected = style === item.id
              const imageSrc = getStyleImage(segment, gender, item.id)

              return (
                <button
                  key={`${segment}-${gender}-${item.id}`}
                  type="button"
                  onClick={() => onStyleChange(item.id)}
                  className={cn(
                    'group relative aspect-square w-full overflow-hidden rounded-2xl border text-left text-white shadow-card transition focus:outline-none focus:ring-4 focus:ring-violet/20',
                    isSelected ? 'border-white ring-4 ring-violet/25' : 'border-plum/15 hover:-translate-y-1',
                  )}
                  aria-pressed={isSelected}
                  aria-label={`${item.label} stilini seç`}
                >
                  <Image
                    key={imageSrc}
                    src={imageSrc}
                    alt={`${item.label} stil örneği`}
                    fill
                    sizes="(max-width: 640px) 50vw, 240px"
                    className="size-full object-cover object-center transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-plum/95 via-plum/35 to-plum/5" />
                  <span className="absolute bottom-4 left-4 flex items-center gap-2 font-bold">
                    <Shirt size={18} />
                    {item.label}
                  </span>
                  {isSelected ? <CheckCircle2 className="absolute bottom-4 right-4" size={22} /> : null}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-9 flex flex-col-reverse gap-3 sm:flex-row">
          <Button type="button" variant="ghost" className="sm:w-40" onClick={onBack}>
            Geri
          </Button>
          <Button type="button" className="flex-1" onClick={onContinue}>
            Devam Et
            <ArrowRight size={18} />
          </Button>
        </div>
        <div className="mt-5 rounded-2xl border border-violet/15 bg-white p-4 text-sm text-ink/75">
          <span className="font-bold text-plum">Asistan Notu:</span> Seçtiğiniz bedende stokta olmayan ürünler
          kombin önerilerine eklenmez.
        </div>
      </div>
    </section>
  )
}
