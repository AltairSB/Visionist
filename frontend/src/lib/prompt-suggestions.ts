export const promptSuggestions = [
  'Hafta sonu brunch şıklığı',
  'Ofis için profesyonel & rahat',
  'Sürdürülebilir markalarla yaz kombini',
  'Konser için dinamik stil',
  'İş görüşmesi için güven veren kombin',
  'Seyahat için hafif ve katmanlı görünüm',
  'Okul çıkışı için rahat ama şık parçalar',
  'Kışlık katmanlarla sıcak tutan kombin',
  'Minimalist gardıropla haftalık plan',
  'Akşam daveti için zarif siluet',
  'Spor salonu sonrası günlük şıklık',
  'Vintage dokularla modern karışım',
  'Renk bloklarıyla enerjik görünüm',
  'Bebek shower için pastel tonlar',
  'Plaj sonrası şehir gezisi stili',
  'Yağmurlu gün için pratik kombin',
  'Capsule wardrobe ile 5 parça 3 kombin',
  'İndirim avı: bütçe dostu hafta sonu',
  'Sürdürülebilir kumaşlarla ofis stili',
  'Gece dışarı çıkış için parlak aksesuar',
] as const

export const pickRandomPromptSuggestions = (count = 4): string[] => {
  const pool = [...promptSuggestions]
  const selected: string[] = []

  while (selected.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length)
    const [item] = pool.splice(index, 1)
    if (item) {
      selected.push(item)
    }
  }

  return selected
}
