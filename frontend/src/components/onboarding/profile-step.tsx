'use client'

import { ArrowRight, CheckCircle2, Dumbbell, Ruler, Shirt } from 'lucide-react'
import Image from 'next/image'

import { getStyleImage } from '@/lib/style-images'
import type { Gender, Segment, StylePreference } from '@/lib/types'
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
  height: number
  weight: number
  style: StylePreference
  onHeightChange: (height: number) => void
  onWeightChange: (weight: number) => void
  onStyleChange: (style: StylePreference) => void
  onBack: () => void
  onContinue: () => void
}

export const ProfileStep = ({
  segment,
  gender,
  height,
  weight,
  style,
  onHeightChange,
  onWeightChange,
  onStyleChange,
  onBack,
  onContinue,
}: ProfileStepProps) => {
  const hasValidProfile = height > 0 && weight > 0

  return (
    <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex items-center justify-between gap-4">
        <div className="h-1.5 flex-1 rounded-full bg-lilac">
          <div className="h-full w-full rounded-full bg-violet" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/70">Adım 2 / 2</p>
      </div>
      <div className="mt-10 rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-atelier backdrop-blur md:p-10">
        <h1 className="text-4xl font-bold tracking-[-0.04em] text-ink">
          Sizi biraz daha yakından tanıyalım.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink/65">
          Asistanınızın bedeninize ve stilinize daha uygun parçaları önceliklendirmesi için birkaç bilgiye ihtiyacımız var.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Boy (cm)</span>
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-plum/15 bg-mist px-4 py-3 transition focus-within:border-violet focus-within:ring-4 focus-within:ring-violet/10">
              <Ruler className="text-plum" size={18} />
              <input
                type="number"
                value={height || ''}
                onChange={(event) => onHeightChange(Number(event.target.value))}
                placeholder="Örn: 180"
                className="w-full bg-transparent text-ink outline-none placeholder:text-ink/35"
              />
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Kilo (kg)</span>
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-plum/15 bg-mist px-4 py-3 transition focus-within:border-violet focus-within:ring-4 focus-within:ring-violet/10">
              <Dumbbell className="text-plum" size={18} />
              <input
                type="number"
                value={weight || ''}
                onChange={(event) => onWeightChange(Number(event.target.value))}
                placeholder="Örn: 75"
                className="w-full bg-transparent text-ink outline-none placeholder:text-ink/35"
              />
            </span>
          </label>
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
                    'relative min-h-40 overflow-hidden rounded-2xl border text-left text-white shadow-card transition focus:outline-none focus:ring-4 focus:ring-violet/20',
                    isSelected ? 'border-white ring-4 ring-violet/25' : 'border-plum/15 hover:-translate-y-1',
                  )}
                  aria-pressed={isSelected}
                >
                  <Image
                    key={imageSrc}
                    src={imageSrc}
                    alt={`${item.label} stil örneği`}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-plum via-plum/45 to-transparent" />
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
          <Button type="button" className="flex-1" onClick={onContinue} disabled={!hasValidProfile}>
            Devam Et
            <ArrowRight size={18} />
          </Button>
        </div>
        <div className="mt-5 rounded-2xl border border-violet/15 bg-white p-4 text-sm text-ink/75">
          <span className="font-bold text-plum">Asistan Notu:</span> Vücut ölçülerinize göre mağaza indirimlerinde daha iyi beden uyumuna sahip ürünleri önceliklendiririz.
        </div>
      </div>
    </section>
  )
}
