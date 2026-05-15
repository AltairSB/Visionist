import type {
  PreferenceMode,
  Product,
  RecommendationResponse,
  RecommendedItem,
  UserProfile,
} from '@/lib/types'
import { getCatalogGender } from '@/lib/style-images'

const catalog: Product[] = [
  {
    id: 101,
    name: 'Pamuklu Gömlek',
    gender: 'Women',
    master_category: 'Apparel',
    sub_category: 'Topwear',
    article_type: 'Shirt',
    base_colour: 'White',
    usage: 'Formal',
    price: 899,
    sale_price: 549,
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 102,
    name: 'İpek Bluz',
    gender: 'Women',
    master_category: 'Apparel',
    sub_category: 'Topwear',
    article_type: 'Shirt',
    base_colour: 'Beige',
    usage: 'Evening',
    price: 1299,
    sale_price: 799,
    image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 201,
    name: 'Slim Fit Pantolon',
    gender: 'Women',
    master_category: 'Apparel',
    sub_category: 'Bottomwear',
    article_type: 'Trousers',
    base_colour: 'Navy',
    usage: 'Formal',
    price: 1099,
    sale_price: 699,
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 202,
    name: 'Yüksek Bel Pantolon',
    gender: 'Women',
    master_category: 'Apparel',
    sub_category: 'Bottomwear',
    article_type: 'Trousers',
    base_colour: 'Black',
    usage: 'Casual',
    price: 999,
    sale_price: 649,
    image_url: 'https://images.unsplash.com/photo-1624378515194-6fc5b0f2f769?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 301,
    name: 'Deri Sneaker',
    gender: 'Women',
    master_category: 'Footwear',
    sub_category: 'Shoes',
    article_type: 'Sneakers',
    base_colour: 'White',
    usage: 'Casual',
    price: 1599,
    sale_price: 999,
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd1?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 302,
    name: 'Topuklu Ayakkabı',
    gender: 'Women',
    master_category: 'Footwear',
    sub_category: 'Shoes',
    article_type: 'Heels',
    base_colour: 'Black',
    usage: 'Evening',
    price: 1399,
    sale_price: 899,
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd1?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 401,
    name: 'Oversize Blazer',
    gender: 'Women',
    master_category: 'Apparel',
    sub_category: 'Topwear',
    article_type: 'Blazer',
    base_colour: 'Navy',
    usage: 'Formal',
    price: 1899,
    sale_price: 1199,
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 402,
    name: 'Hafif Trençkot',
    gender: 'Women',
    master_category: 'Apparel',
    sub_category: 'Topwear',
    article_type: 'Blazer',
    base_colour: 'Beige',
    usage: 'Casual',
    price: 2199,
    sale_price: 1399,
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 501,
    name: 'Oxford Gömlek',
    gender: 'Men',
    master_category: 'Apparel',
    sub_category: 'Topwear',
    article_type: 'Shirt',
    base_colour: 'Blue',
    usage: 'Formal',
    price: 799,
    sale_price: 499,
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 502,
    name: 'Keten Gömlek',
    gender: 'Men',
    master_category: 'Apparel',
    sub_category: 'Topwear',
    article_type: 'Shirt',
    base_colour: 'White',
    usage: 'Casual',
    price: 899,
    sale_price: 599,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 601,
    name: 'Chino Pantolon',
    gender: 'Men',
    master_category: 'Apparel',
    sub_category: 'Bottomwear',
    article_type: 'Trousers',
    base_colour: 'Khaki',
    usage: 'Casual',
    price: 999,
    sale_price: 649,
    image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 701,
    name: 'Beyaz Sneaker',
    gender: 'Men',
    master_category: 'Footwear',
    sub_category: 'Shoes',
    article_type: 'Sneakers',
    base_colour: 'White',
    usage: 'Casual',
    price: 1299,
    sale_price: 849,
    image_url: 'https://images.unsplash.com/photo-1606107557192-0a6c3d6f1c1f?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
  {
    id: 801,
    name: 'Yün Blazer',
    gender: 'Men',
    master_category: 'Apparel',
    sub_category: 'Topwear',
    article_type: 'Blazer',
    base_colour: 'Charcoal',
    usage: 'Formal',
    price: 2499,
    sale_price: 1599,
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
    product_url: '#',
  },
]

const outfitSlots = ['Shirt', 'Trousers', 'Sneakers', 'Blazer'] as const

const filterByProfile = (profile: UserProfile) => {
  const gender = getCatalogGender(profile.segment, profile.gender)
  const pool = catalog.filter((product) => product.gender === gender)

  if (pool.length > 0) {
    return pool
  }

  const fallbackGender = profile.gender === 'female' ? 'Women' : 'Men'
  return catalog.filter((product) => product.gender === fallbackGender)
}

const pickProductForSlot = (
  pool: Product[],
  articleType: string,
  excludeIds: number[],
  preference: PreferenceMode,
) => {
  const candidates = pool
    .filter((product) => product.article_type === articleType && !excludeIds.includes(product.id))
    .sort((a, b) => {
      if (preference === 'cheaper') {
        return a.sale_price - b.sale_price
      }
      return b.sale_price - a.sale_price
    })

  return candidates[0] ?? pool.find((product) => product.article_type === articleType)
}

const buildItems = (
  profile: UserProfile,
  prompt: string,
  preference: PreferenceMode,
  replaceItemId?: number,
  replaceRequest?: string,
  currentItems?: RecommendedItem[],
): RecommendedItem[] => {
  const pool = filterByProfile(profile)
  const usedIds: number[] = []

  if (currentItems && replaceItemId) {
    return currentItems.map((item) => {
      if (item.id !== replaceItemId) {
        usedIds.push(item.product.id)
        return item
      }

      const alternative = pickProductForSlot(
        pool,
        item.product.article_type,
        [...usedIds, item.product.id],
        preference,
      )

      if (!alternative) {
        return item
      }

      usedIds.push(alternative.id)

      return {
        id: item.id,
        reason: replaceRequest
          ? `"${replaceRequest}" isteğine göre ${alternative.name} ile güncellendi.`
          : `${alternative.name} kombinle daha uyumlu görünüyor.`,
        product: alternative,
      }
    })
  }

  return outfitSlots.map((slot, index) => {
    const product =
      pickProductForSlot(pool, slot, usedIds, preference) ??
      pool.find((entry) => !usedIds.includes(entry.id))

    if (!product) {
      return {
        id: index + 1,
        reason: `${prompt} isteğine uygun parça seçimi.`,
        product: catalog[0],
      }
    }

    usedIds.push(product.id)

    return {
      id: index + 1,
      reason: `${prompt} isteğine uygun ${product.article_type.toLowerCase()} seçimi.`,
      product,
    }
  })
}

const totalsFromItems = (items: RecommendedItem[]) => {
  const listTotal = items.reduce((sum, item) => sum + item.product.price, 0)
  const saleTotal = items.reduce((sum, item) => sum + item.product.sale_price, 0)

  return {
    list_total: listTotal,
    sale_total: saleTotal,
    savings: listTotal - saleTotal,
  }
}

export const getMockRecommendation = (
  profile: UserProfile,
  prompt: string,
  preference: PreferenceMode = 'balanced',
  options?: {
    replaceItemId?: number
    replaceRequest?: string
    currentItems?: RecommendedItem[]
  },
): RecommendationResponse => {
  const items = buildItems(
    profile,
    prompt,
    preference,
    options?.replaceItemId,
    options?.replaceRequest,
    options?.currentItems,
  )
  const totals = totalsFromItems(items)

  return {
    items,
    summary: `"${prompt}" isteğine göre ${profile.style} stilinde, bütçe dostu bir kombin oluşturuldu.`,
    ...totals,
    market_note: 'Demo modunda çalışıyorsunuz. Backend bağlandığında gerçek katalog ve Gemini önerileri kullanılacak.',
    source: 'fallback',
  }
}
