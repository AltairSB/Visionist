import { OutfitCollage } from '@/components/recommendation/outfit-collage'
import { ResultPanel } from '@/components/recommendation/result-panel'
import type { RecommendationResponse } from '@/lib/types'

type RecommendationResultsProps = {
  recommendation: RecommendationResponse
  onCheaperRequest: () => void
}

export const RecommendationResults = ({
  recommendation,
  onCheaperRequest,
}: RecommendationResultsProps) => {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 pt-5 sm:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet">
          {recommendation.source === 'gemini' ? 'Gemini seçimi' : 'Kural tabanlı öneri'}
        </p>
        <h2 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">
          Senin İçin Seçtiğimiz Ekonomik Kombin
        </h2>
        <p className="mt-3 max-w-3xl text-lg text-ink/65">
          Yapay zeka asistanımız, stil tercihlerine uygun en yüksek tasarruflu parçaları bir araya getirdi.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
        <OutfitCollage recommendation={recommendation} />
        <ResultPanel recommendation={recommendation} onCheaperRequest={onCheaperRequest} />
      </div>
    </section>
  )
}
