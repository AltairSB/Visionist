import { Baby, Rocket, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Segment } from '@/lib/types'

const segments = [
  {
    id: 'child',
    title: 'Çocuk',
    description: 'Dayanıklı, rahat ve ekonomik çocuk kombinleri.',
    icon: Baby,
  },
  {
    id: 'young',
    title: 'Genç',
    description: 'Trendleri yakalayan dinamik ve bütçe dostu öneriler.',
    icon: Rocket,
  },
  {
    id: 'adult',
    title: 'Yetişkin',
    description: 'Profesyonel, şık ve uzun ömürlü yatırım parçaları.',
    icon: Sparkles,
  },
] as const

type SegmentStepProps = {
  selectedSegment: Segment
  onSelectSegment: (segment: Segment) => void
}

export const SegmentStep = ({ selectedSegment, onSelectSegment }: SegmentStepProps) => {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-violet">Adım 1 / 3</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">
          Sizin için en uygun kombini bulalım.
        </h1>
        <p className="mt-4 text-base leading-7 text-ink/65 sm:text-lg">
          Kimin için stil önerileri ve tasarruf fırsatları arıyorsunuz? Size özel bir asistanlık deneyimi için kategori seçin.
        </p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {segments.map((segment) => {
          const Icon = segment.icon
          const isSelected = selectedSegment === segment.id

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
              <span
                className={cn(
                  'inline-flex size-16 items-center justify-center rounded-full',
                  isSelected ? 'bg-white/15 text-white' : 'bg-lilac text-plum',
                )}
              >
                <Icon size={30} />
              </span>
              <h2 className="mt-7 text-2xl font-bold">{segment.title}</h2>
              <p className={cn('mt-3 leading-6', isSelected ? 'text-white/78' : 'text-ink/62')}>
                {segment.description}
              </p>
            </button>
          )
        })}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-plum/10 bg-white/80 p-6 shadow-card backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-plum">Yapay Zeka Destekli Stil</p>
          <p className="mt-2 text-ink/70">
            Seçtiğiniz segmente göre katalogdaki ürünleri sizin için eleyip kombin mantığıyla sıralar.
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
