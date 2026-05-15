import type { CatalogGender, Gender, Segment, StylePreference } from '@/lib/types'

const image = (photoId: string) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=700&q=80`

export const styleImageMap: Record<
  Segment,
  Record<Gender, Record<StylePreference, string>>
> = {
  child: {
    female: {
      classic: image('1503454537847-601fc48a0ffc'),
      sport: image('1503919545927-22705917d128'),
      daily: image('1519457425579-021970808388'),
      chic: image('1524504388940-b1c1722653e1'),
      vintage: image('1515488042361-ee00e0ddd4b4'),
      minimal: image('1503341450422-420a4d6b8b8a'),
    },
    male: {
      classic: image('1602083977629-45910cb52e70'),
      sport: image('1503454537847-601fc48a0ffc'),
      daily: image('1516627145497-ae6968895b74'),
      chic: image('1474979266404-7eaacbcd87c5'),
      vintage: image('1503341450422-420a4d6b8b8a'),
      minimal: image('1503919545927-22705917d128'),
    },
  },
  young: {
    female: {
      classic: image('1496747611176-843222e1e57c'),
      sport: image('1515886657613-9f3515b0c78f'),
      daily: image('1529139574466-a303027c1d8b'),
      chic: image('1539109136881-3be0616acf4b'),
      vintage: image('1469334031218-e382a71b716b'),
      minimal: image('1485968573230-296655a94a2e'),
    },
    male: {
      classic: image('1617137968427-859a6e3408bf'),
      sport: image('1552374196-1ab2a075693f'),
      daily: image('1507003211169-0a1dd7228f2d'),
      chic: image('1507676180812-ee9519fe6c0b'),
      vintage: image('1500043357865-c6b882ee6b8b'),
      minimal: image('1500648767791-00dcc994a43e'),
    },
  },
  adult: {
    female: {
      classic: image('1496747611176-843222e1e57c'),
      sport: image('1515886657613-9f3515b0c78f'),
      daily: image('1529139574466-a303027c1d8b'),
      chic: image('1539109136881-3be0616acf4b'),
      vintage: image('1469334031218-e382a71b716b'),
      minimal: image('1485968573230-296655a94a2e'),
    },
    male: {
      classic: image('1617137968427-859a6e3408bf'),
      sport: image('1552374196-1ab2a075693f'),
      daily: image('1507003211169-0a1dd7228f2d'),
      chic: image('1507676180812-ee9519fe6c0b'),
      vintage: image('1500043357865-c6b882ee6b8b'),
      minimal: image('1500648767791-00dcc994a43e'),
    },
  },
}

export const getStyleImage = (
  segment: Segment,
  gender: Gender,
  style: StylePreference,
): string => styleImageMap[segment][gender][style]

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
