'use client'

import type { ReactNode } from 'react'

import { ArrowRight, Baby } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { genderIconSrc, segmentIconSrc } from '@/lib/onboarding-icons'
import { getGenderCards } from '@/lib/style-images'
import type { Gender, Segment } from '@/lib/types'
import { cn } from '@/lib/utils'

const segments = [
  {
    id: 'child',
    title: 'Çocuk',
    description: 'Dayanıklı, rahat ve ekonomik çocuk kombinleri.',
  },
  {
    id: 'young',
    title: 'Genç',
    description: 'Trendleri yakalayan dinamik ve bütçe dostu öneriler.',
  },
  {
    id: 'adult',
    title: 'Yetişkin',
    description: 'Profesyonel, şık ve uzun ömürlü yatırım parçaları.',
  },
] as const

type CardIconProps = {
  imageSrc?: string
  alt: string
  isSelected: boolean
  fallback?: ReactNode
}

const CardIcon = ({ imageSrc, alt, isSelected, fallback }: CardIconProps) => (
  <span
    className={cn(
      'inline-flex size-16 items-center justify-center overflow-hidden rounded-full',
      isSelected ? 'bg-white/15' : 'bg-lilac',
    )}
  >
    {imageSrc ? (
      <Image
        src={imageSrc}
        alt={alt}
        width={40}
        height={40}
        className="object-contain"
      />
    ) : (
      fallback
    )}
  </span>
)

type SegmentStepProps = {
  selectedGender: Gender
  selectedSegment: Segment
  onSelectGender: (gender: Gender) => void
  onSelectSegment: (segment: Segment) => void
  onContinue: () => void
}

export const SegmentStep = ({
  selectedGender,
  selectedSegment,
  onSelectGender,
  onSelectSegment,
  onContinue,
}: SegmentStepProps) => {
  const genderCards = getGenderCards(selectedSegment)
  const canContinue = Boolean(selectedGender && selectedSegment)

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-violet">Adım 1 / 2</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">
          Sizin için en uygun kombini bulalım.
        </h1>
        <p className="mt-4 text-base leading-7 text-ink/65 sm:text-lg">
          Cinsiyet ve yaş grubunu seçin; stil önerileri ve görseller buna göre kişiselleştirilsin.
        </p>
      </div>

      <div className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink">Cinsiyet</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {genderCards.map((option) => {
            const isSelected = selectedGender === option.id

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectGender(option.id)}
                aria-pressed={isSelected}
                className={cn(
                  'group rounded-3xl border p-8 text-left transition duration-300 focus:outline-none focus:ring-4 focus:ring-violet/20',
                  isSelected
                    ? 'border-plum bg-plum text-white shadow-atelier'
                    : 'border-white/80 bg-white/82 text-ink shadow-card hover:-translate-y-1 hover:border-violet/25 hover:bg-white',
                )}
              >
                <CardIcon
                  imageSrc={genderIconSrc[option.id]}
                  alt={option.title}
                  isSelected={isSelected}
                />
                <h2 className="mt-7 text-2xl font-bold">{option.title}</h2>
                <p className={cn('mt-3 leading-6', isSelected ? 'text-white/78' : 'text-ink/62')}>
                  {option.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink">Yaş Grubu</p>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {segments.map((segment) => {
            const isSelected = selectedSegment === segment.id
            const imageSrc = segmentIconSrc[segment.id]

            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => onSelectSegment(segment.id)}
                className={cn(
                  'group rounded-3xl border p-8 text-left transition duration-300 focus:outline-none focus:ring-4 focus:ring-violet/20',
                  isSelected
                    ? 'border-plum bg-plum text-white shadow-atelier'
                    : 'border-white/80 bg-white/82 text-ink shadow-card hover:-translate-y-1 hover:border-violet/25 hover:bg-white',
                )}
                aria-pressed={isSelected}
              >
                <CardIcon
                  imageSrc={imageSrc}
                  alt={segment.title}
                  isSelected={isSelected}
                  fallback={
                    <Baby
                      size={30}
                      className={isSelected ? 'text-white' : 'text-plum'}
                      aria-hidden
                    />
                  }
                />
                <h2 className="mt-7 text-2xl font-bold">{segment.title}</h2>
                <p className={cn('mt-3 leading-6', isSelected ? 'text-white/78' : 'text-ink/62')}>
                  {segment.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Button type="button" className="min-w-48" onClick={onContinue} disabled={!canContinue}>
          Devam Et
          <ArrowRight size={18} />
        </Button>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-plum/10 bg-white/80 p-6 shadow-card backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-plum">Yapay Zeka Destekli Stil</p>
          <p className="mt-2 text-ink/70">
            Seçtiğiniz cinsiyet ve segmente göre katalogdaki ürünleri eleyip kombin mantığıyla sıralar.
          </p>
        </div>
        <div className="rounded-2xl border border-plum/10 bg-gradient-to-br from-plum to-violet p-6 text-white shadow-card">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-lilac">Maksimum Tasarruf</p>
          <p className="mt-2 text-white/75">
            Sadece şıklığı değil, aynı zamanda bütçenizi koruyan indirimli parçaları öne çıkarır.
          </p>
        </div>
      </div>
    </section>
  )
}
