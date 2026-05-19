import type { CatalogGender, Gender, Segment, StylePreference } from '@/lib/types'

const styleExtensions: Record<StylePreference, 'png' | 'jpg'> = {
  classic: 'png',
  sport: 'png',
  daily: 'png',
  chic: 'jpg',
  vintage: 'jpg',
  minimal: 'jpg',
}

const getStyleImageExtension = (
  segment: Segment,
  gender: Gender,
  style: StylePreference,
): 'png' | 'jpg' => {
  if (style === 'vintage' && segment === 'adult' && gender === 'male') {
    return 'png'
  }

  return styleExtensions[style]
}

export const getStyleImage = (
  segment: Segment,
  gender: Gender,
  style: StylePreference,
): string => {
  const extension = getStyleImageExtension(segment, gender, style)
  return `/style-images/${segment}/${gender}/${style}.${extension}`
}

export const getGenderLabels = (segment: Segment) => {
  if (segment === 'child') {
    return [
      { id: 'female' as const, label: 'Kız' },
      { id: 'male' as const, label: 'Erkek' },
    ]
  }

  return [
    { id: 'female' as const, label: 'Kadın' },
    { id: 'male' as const, label: 'Erkek' },
  ]
}

export const getGenderCards = (segment: Segment) => {
  if (segment === 'child') {
    return [
      {
        id: 'female' as const,
        title: 'Kız',
        description: 'Kız çocuklar için rahat ve şık kombin önerileri.',
      },
      {
        id: 'male' as const,
        title: 'Erkek',
        description: 'Erkek çocuklar için dayanıklı ve hareketli parçalar.',
      },
    ]
  }

  if (segment === 'young') {
    return [
      {
        id: 'female' as const,
        title: 'Kadın',
        description: 'Genç kadınlar için trend ve bütçe dostu stiller.',
      },
      {
        id: 'male' as const,
        title: 'Erkek',
        description: 'Genç erkekler için dinamik ve güncel kombinler.',
      },
    ]
  }

  return [
    {
      id: 'female' as const,
      title: 'Kadın',
      description: 'Kadın koleksiyonlarından size özel kombinler.',
    },
    {
      id: 'male' as const,
      title: 'Erkek',
      description: 'Erkek koleksiyonlarından profesyonel öneriler.',
    },
  ]
}

export const getCatalogGender = (segment: Segment, gender: Gender): CatalogGender => {
  if (segment === 'child') {
    return gender === 'female' ? 'Girls' : 'Boys'
  }

  return gender === 'female' ? 'Women' : 'Men'
}
