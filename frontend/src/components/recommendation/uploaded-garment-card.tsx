import Image from 'next/image'

import { cn } from '@/lib/utils'

type UploadedGarmentCardProps = {
  imageUrl: string
  variant?: 'modal' | 'wardrobe'
  className?: string
}

export const UploadedGarmentCard = ({
  imageUrl,
  variant = 'modal',
  className,
}: UploadedGarmentCardProps) => {
  const isWardrobe = variant === 'wardrobe'

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-card',
        isWardrobe
          ? 'h-64 border border-white/12 bg-white/10 sm:h-72'
          : 'h-64 bg-plum sm:h-84',
        className,
      )}
    >
      <Image
        src={imageUrl}
        alt="Yüklediğin parça"
        fill
        unoptimized
        sizes="(max-width: 1024px) 50vw, 22vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-plum/95 via-plum/25 to-transparent" />
      <span className="absolute left-3 top-3 z-10 rounded-full bg-violet px-3 py-1 text-xs font-bold text-white">
        Senin parçan
      </span>
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 text-white">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-lilac">
          Yüklenen parça
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight">
          Fotoğrafından eşleştirildi
        </p>
      </div>
    </article>
  )
}
