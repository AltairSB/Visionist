import type { UserProfile } from '@/lib/types'

export const defaultProfile: UserProfile = {
  segment: 'adult',
  gender: 'female',
  height: 178,
  weight: 72,
  style: 'classic',
}

export const normalizeProfile = (profile: Partial<UserProfile>): UserProfile => ({
  ...defaultProfile,
  ...profile,
  gender: profile.gender === 'male' ? 'male' : 'female',
})
