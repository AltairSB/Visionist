import type { ClothingSize, UserProfile } from '@/lib/types'

const VALID_SIZES: ClothingSize[] = ['S', 'M', 'L', 'XL']

export const defaultProfile: UserProfile = {
  segment: 'adult',
  gender: 'female',
  preferred_size: 'M',
  style: 'classic',
}

const resolvePreferredSize = (value: unknown): ClothingSize => {
  if (typeof value === 'string' && VALID_SIZES.includes(value as ClothingSize)) {
    return value as ClothingSize
  }

  return 'M'
}

export const normalizeProfile = (profile: Partial<UserProfile> & { height?: number; weight?: number }): UserProfile => ({
  ...defaultProfile,
  ...profile,
  gender: profile.gender === 'male' ? 'male' : 'female',
  preferred_size: resolvePreferredSize(profile.preferred_size),
})
