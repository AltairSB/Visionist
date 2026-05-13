import { BadgePercent, Search, ShoppingCart, Sparkles, TrendingDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { RecommendationResponse } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

type ResultPanelProps = {
  recommendation: RecommendationResponse
  onCheaperRequest: () => void
}

export const ResultPanel = ({ recommendation, onCheaperRequest }: ResultPanelProps) => {
  return (
    <aside className="space-y-5">
      <section className="rounded-[2rem] bg-plum p-7 text-white shadow-card">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-lilac">
          <Sparkles size={18} />
          AI Gerekçesi
        </p>
        <p className="mt-4 leading-7 text-white/75">{recommendation.summary}</p>
        <div className="mt-5 space-y-3 text-sm text-white/72">
          {recommendation.items.map((item) => (
            <p key={item.id}>
              <span className="font-bold text-white">{item.product.name}:</span> {item.reason}
            </p>
          ))}
        </div>
      </section>
      <section className="rounded-[2rem] border border-plum/10 bg-white/82 p-6 shadow-card backdrop-blur">
        <div className="flex items-center justify-between text-sm text-ink/65">
          <span>Liste Fiyatı</span>
          <span className="line-through">{formatCurrency(recommendation.list_total)}</span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-plum">Toplam Fiyat</p>
            <p className="mt-1 text-4xl font-bold tracking-[-0.04em] text-ink">
              {formatCurrency(recommendation.sale_total)}
            </p>
          </div>
          <span className="rounded-full bg-mint/10 px-3 py-1 text-sm font-bold text-mint">
            -{Math.round((recommendation.savings / recommendation.list_total) * 100)}%
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-lilac p-4 font-bold text-plum">
          <span className="flex items-center gap-2">
            <BadgePercent size={18} />
            Tasarruf Miktarı
          </span>
          <span>{formatCurrency(recommendation.savings)}</span>
        </div>
        <div className="mt-5 grid gap-3">
          <Button type="button">
            <ShoppingCart size={18} />
            Sepete Ekle
          </Button>
          <Button type="button" variant="ghost" onClick={onCheaperRequest}>
            <Search size={18} />
            Daha Ucuzunu Bul
          </Button>
        </div>
      </section>
      <section className="flex gap-4 rounded-[2rem] border border-violet/15 bg-lilac p-5 text-plum shadow-card">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-plum text-white">
          <TrendingDown size={22} />
        </span>
        <p className="text-sm leading-6">
          <span className="block font-bold uppercase tracking-[0.18em]">Piyasa Analizi</span>
          {recommendation.market_note}
        </p>
      </section>
    </aside>
  )
}
