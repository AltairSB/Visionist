# 1. Ürün Gereksinim Dokümanı (PRD)

## 1.1. Ürün Vizyonu

E-ticaret siteleri için, kullanıcıların kişisel özelliklerine (Boy, kilo, stil) ve segmentlerine (Çocuk, Genç, Yetişkin) göre mevcut stoktan en uygun ve ekonomik kombinleri sunan, görsel destekli bir yapay zeka asistanı.

## 1.2. Hedef Kitle ve Segmentasyon

Kullanıcılar sisteme giriş yaparken yaşlarını rakam yerine şu segmentlerle tanımlar:

- Çocuk: gender sütunundaki "Boys" ve "Girls" verileriyle eşleşir.
- Genç & Yetişkin: gender sütunundaki "Men" ve "Women" verileriyle eşleşir (Stil tercihine göre "Genç" veya "Yetişkin" ayrımı AI tarafından yapılır).

## 1.3. Ana Özellikler

- Multi-Step Onboarding: Kullanıcının fiziksel verilerini (Boy/Kilo) ve segmentini alan akıcı form.
- Multimodal Girdi:
  - Metin: "Yazlık, uygun fiyatlı bir akşam yemeği kombini."
  - Görsel: Kullanıcının elindeki bir parçanın fotoğrafını yükleyip "Buna ne uyar?" demesi.
- Ekonomi Odaklılık: (Veri setine eklenecek olan) price ve discount_price sütunları kullanılarak, Gemini'ın en yüksek indirim oranına sahip parçaları önceliklendirmesi.
- Smart Collage (MVP Çıktısı): Önerilen ürünlerin id değerleri üzerinden çekilen görsellerin (örn: images/{id}.jpg) frontend tarafında şık bir grid/kolaj yapısında sunulması.

# 2. Teknik Mimari ve Veri Modeli

## 2.1. Veri Şeması (styles.csv tabanlı)

Sistem, sağladığın CSV yapısını genişleterek şu şekilde kullanacaktır:

| Sütun Adı | Tip | Açıklama |
|---|---|---|
| id | Integer | Ürün benzersiz anahtarı ve görsel adı (id.jpg). |
| gender | String | Men, Women, Boys, Girls (Segmentasyon için). |
| masterCategory | String | Apparel, Footwear, Accessories vb. |
| subCategory | String | Topwear, Bottomwear vb. (Kombin mantığı için). |
| articleType | String | Tshirts, Jeans, Watches vb. |
| baseColour | String | Renk uyumu analizi için. |
| usage | String | Casual, Smart Casual, Ethnic vb. |
| price | Float | (Eklenecek) Ürünün liste fiyatı. |
| sale_price | Float | (Eklenecek) İndirimli fiyat (Ekonomi asistanı ana metriği). |

## 2.2. Teknoloji Yığını (Sıfır Maliyet Odaklı)

- Framework: Next.js 14+ (App Router).
- Hosting: Vercel (Hızlı ve ücretsiz).
- AI Engine: Google AI SDK (Gemini 1.5 Flash).
  - Avantaj: Ücretsiz katmanda 1M+ context window (Tüm ürün kataloğunu veya büyük bir kısmını prompt içine sığdırabiliriz).
- Database: Supabase (Ücretsiz PostgreSQL katmanı) veya CSV'yi JSON'a çevirip public/ klasöründe tutma (MVP için en hızlısı).
- UI: Tailwind CSS + Shadcn UI (Profesyonel görünüm için).

# 3. Kullanıcı Akış Şeması

1. Giriş: Kullanıcı segmentini seçer (Çocuk/Genç/Yetişkin).
2. Fiziksel Profil: Boy, Kilo ve Stil (Spor, Klasik vb.) bilgileri LocalStorage'a kaydedilir.
3. İstek (Prompt/Görsel): Kullanıcı ihtiyacını belirtir.
4. AI İşleme (Gemini):
   - Sistem, CSV'den filtrelenmiş (ilgili segmentteki) ürünleri alır.
   - Kullanıcının yüklediği bir görsel varsa Gemini Vision ile tanımlar (Örn: "Mavi Kot Ceket").
   - Gemini, stil kurallarına ve fiyata göre 3-4 parçalık bir kombin seçer.
5. Sonuç: Seçilen ürünlerin görselleri (id üzerinden) kolajlanır ve satın alma linkleriyle gösterilir.

# 4. Teknik Uygulama Notları (Geliştirici Notu)

## 4.1. Gemini System Prompt Stratejisi

AI'ya verilecek talimat şu şekilde olmalıdır:

```text
"Sen bir moda ve ekonomi uzmanısın. Kullanıcı profili: [USER_DATA]. Sana sunduğum ürün listesinden, birbiriyle renk ve tarz olarak uyumlu, toplam fiyatı en düşük tutacak 3 parçayı seç. Sadece JSON formatında 'id' ve 'reason' (neden seçildi) alanlarını döndür."