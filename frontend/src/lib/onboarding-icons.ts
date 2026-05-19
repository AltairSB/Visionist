import type { Gender, Segment } from '@/lib/types'

/** Adım 1 kart logoları — dosyalar: frontend/public/icons/ */
export const segmentIconSrc: Partial<Record<Segment, string>> = {
  young: '/icons/young.png',
  adult: '/icons/adult.png',
}

export const genderIconSrc: Record<Gender, string> = {
  female: '/icons/woman.png',
  male: '/icons/man.png',
}
