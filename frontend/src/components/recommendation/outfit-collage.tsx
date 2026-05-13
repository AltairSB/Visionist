import Image from 'next/image'

import type { RecommendationResponse } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

type OutfitCollageProps = {
  recommendation: RecommendationResponse
}

export const OutfitCollage = ({ recommendation }: OutfitCollageProps) => {
  const items = recommendation.items

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <article
          key={item.id}
          className={index === 0 ? 'group relative min-h-80 overflow-hidden rounded-3xl bg-plum shadow-card sm:row-span-2' : 'group relative min-h-56 overflow-hidden rounded-3xl bg-plum shadow-card'}
        >
          <Image
            src={item.product.image_url}
            alt={item.product.name}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lilac">
              {item.product.article_type}
            </p>
            <h3 className="mt-1 text-lg font-bold">{item.product.name}</h3>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(item.product.sale_price)}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
