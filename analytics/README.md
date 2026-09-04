# Maaşım.net Search + AI Visibility + GA4 Funnel Dashboard

Bu klasör, Google Search Console, Google Search Console Generative AI Performance, Bing Webmaster Tools AI Performance ve GA4 davranış verilerini tek ölçüm çerçevesinde takip etmek için kaynak tanımını içerir.

Makine tarafından doğrulanan rapor modeli `gsc-ga4-dashboard.json` dosyasındadır.

## Gerçek veri sınırı

Klasik Google Search Console; sorgu, sayfa, tarih, cihaz, gösterim, tıklama, CTR ve pozisyon verisini sağlar. GA4; landing page, oturum ve event verisini sağlar. Google iki sistem arasında kullanıcı veya oturum seviyesinde ortak bir anahtar sunmaz.

Bu nedenle dashboard:

- sorgu performansını **GSC seviyesinde tam olarak** gösterir,
- hesaplama funnel'ını **GA4 landing-page seviyesinde tam olarak** gösterir,
- sorgu seçildiğinde ilgili landing page funnel'ına geçer,
- aynı landing page'in dönüşüm sayısını o sayfaya gelen her sorguya kopyalamaz,
- “sorgu başına kesin hesaplama dönüşümü” adında sahte bir metrik üretmez.

Google Generative AI Performance ve Bing AI Performance ise ayrı görünürlük kaynaklarıdır. Bunların impression/citation verileri GA4 oturum veya dönüşümlerine kullanıcı düzeyinde bağlanmaz.

## 1. Veri kaynakları

### Google Search Console — klasik arama

- Bağlantı türü: **Site Impression**
- Property: `sc-domain:maasim.net`
- Tablo: URL Impression
- Boyutlar: Date, Query, Page, Device, Country
- Metrikler: Impressions, Clicks, CTR, Average Position

### Google Search Console — Generative AI Performance

Google’ın Search Console içindeki özel Generative AI Performance raporu aşağıdaki görünürlüğü izler:

- AI Overviews
- AI Mode

Raporun doğrulanmış alanları:

- Impressions
- Page
- Country
- Device
- Date

Google, bu görünürlüğün 31 Ağustos 2026 itibarıyla dünya genelinde kullanıma açıldığını belirtiyor. Düşük hacimli property'lerde veri görünmemesi mümkündür.

Bu rapor **AI tıklaması veya AI dönüşümü raporu değildir**. Dedicated raporda gösterilmeyen click/session metrikleri türetilmemelidir.

Resmî dokümantasyon: `https://support.google.com/webmasters/answer/16984139`

Bağlantı kuralı: Search Console native raporu veya export edilmiş rapor verisi kullanılabilir. API ya da Looker Studio connector'ında aynı alanların desteklendiği ayrıca doğrulanmadan otomatik entegrasyon varsayılmamalıdır.

### Google Analytics 4

- Web stream measurement ID: `G-988BB5B64E`
- GA4 property ID: Looker Studio bağlantısı kurulurken seçilmelidir.
- Organik filtre: `Session default channel group = Organic Search`
- Ana boyutlar: Date, Landing page + query string, Session source / medium, Device category, Event name
- Ana metrikler: Sessions, Active users, Event count, Key events

### Bing Webmaster Tools — AI Performance

Bing AI Performance public preview aşağıdaki AI yüzeylerindeki citation görünürlüğünü ölçer:

- Microsoft Copilot
- Bing AI-generated summaries
- select partner integrations

Ana metrik ve boyutlar:

- Total citations
- Average cited pages
- Page-level citations
- Grounding queries
- Date
- Page

`Total citations` kaynak gösterim sayısıdır; ranking değildir. `Grounding queries` tam arama talebi datası değil, AI retrieval sürecinde kullanılan ifadelerin örneklemidir.

Resmî dokümantasyon: `https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview`

## 2. GA4 özel boyutları

Aşağıdaki event parametreleri GA4 Admin → Data display → Custom definitions alanında event-scoped custom dimension olarak kaydedilmelidir:

| Görünen ad | Event parameter |
|---|---|
| Hesaplama yönü | `calculation_direction` |
| Hesaplayıcı modu | `calculator_mode` |
| Senaryo türü | `scenario_type` |
| Maaş aralığı | `salary_range` |
| Aralık sürümü | `range_version` |
| Maaş değişikliği sayısı | `salary_change_count` |
| Maaş değişikliği var | `has_salary_change` |
| İşveren değişikliği var | `has_employer_change` |
| Başlangıç ayı | `start_month` |
| Sonuç vergi dilimi | `result_tax_bracket` |
| Efektif kesinti aralığı | `effective_deduction_range` |
| Ay numarası | `month_number` |
| Değişiklik türü | `override_type` |
| Detay aksiyonu | `detail_action` |
| Giriş yöntemi | `input_method` |
| Tazminat hesaplayıcı türü | `calculator_type` |

`calculator_type` yalnız `combined`, `severance` veya `notice` değerlerinden birini almalıdır. Exact maaş, kıdem, ihbar veya kümülatif vergi matrahı tutarı özel boyut olarak kaydedilmemelidir.

## 3. Ana funnel eventleri

Maaş hesaplama funnel'ı:

1. `calculator_view`
2. `salary_input_started`
3. `salary_calculation_completed`
4. `salary_results_viewed`
5. `payroll_detail_toggle` (`detail_action = open`)
6. `calculator_csv_download`

Tazminat hesaplayıcıları için ana sonuç eventi:

- `termination_calculator_complete` (`calculator_type = combined | severance | notice`)

`salary_calculation_completed`, `salary_results_viewed` ve `termination_calculator_complete` GA4 içinde key event olarak işaretlenmelidir.

Tazminat eventi yalnız Cookiebot istatistik izni verildiğinde gönderilir ve finansal giriş değerlerini içermez.

## 4. Normalize edilmiş landing page alanları

GSC calculated field:

```text
REGEXP_REPLACE(Page, '^https?://[^/]+', '')
```

GA4 calculated field:

```text
REGEXP_REPLACE(Landing page + query string, '\\?.*$', '')
```

Birleştirme anahtarı:

```text
CONCAT(Date, '|', normalized_landing_page_path)
```

Blend yalnızca `Date + normalized landing page path` seviyesinde kullanılmalıdır. Query boyutu blend'in dönüşüm tarafına eklenmemelidir.

Google Generative AI report ve Bing AI Performance verileri, desteklenen ortak grain doğrulanmadıkça bu blend'e eklenmemelidir.

## 5. AI görünürlüğü için üç ayrı sinyal

### A. Google Generative AI visibility

Kaynak: Search Console Generative AI Performance.

Ana KPI:

- Generative AI impressions
- AI görünürlüğü alan sayfa sayısı
- Sayfa bazında impression trendi
- Ülke ve cihaz kırılımı

Bu metrikler **görünürlük** ölçer.

### B. Bing AI citation visibility

Kaynak: Bing Webmaster Tools AI Performance.

Ana KPI:

- Total citations
- Average cited pages
- En çok cite edilen URL'ler
- Grounding query örnekleri
- Citation trendi

Bu metrikler **kaynak gösterilme** ölçer.

### C. GA4 AI referral traffic

Session source/medium filtreleriyle:

- `chatgpt.com`
- Perplexity
- Gemini
- diğer doğrulanmış AI referral kaynakları

Bu metrikler yalnız **siteye gerçekten tıklayıp gelen oturumları** ölçer. Citation veya AI impression'ın tamamını temsil etmez.

Bu üç sinyal tek bir “AI traffic” sayısında birleştirilmemelidir.

## 6. Rapor sayfaları

### Yönetici Özeti

Scorecard'lar:

- GSC gösterim
- GSC tıklama
- GSC CTR
- Ortalama pozisyon
- Google Generative AI impressions
- Bing total citations
- Organik landing session
- Tamamlanan maaş hesaplaması
- Tamamlanan tazminat hesaplaması
- Organik session → hesaplama tamamlama oranı

### Sorgu ve Landing Page

Sol tablo:

- Query
- Landing page
- Impressions
- Clicks
- CTR
- Average position

Sağ tablo:

- Landing page
- Organic sessions
- `salary_input_started`
- `salary_calculation_completed`
- `termination_calculator_complete`
- İlgili landing page için completion rate

Query tablosundan yapılan seçim landing page tablosunu sayfa yolu üzerinden filtrelemelidir.

### Hesaplayıcı Funnel

Kırılımlar:

- `calculation_direction`
- `salary_range`
- `scenario_type`
- device category
- landing page

Oranlar:

```text
Input start rate = salary_input_started / organic landing sessions
Completion rate = salary_calculation_completed / salary_input_started
Results view rate = salary_results_viewed / salary_calculation_completed
CSV download rate = calculator_csv_download / salary_results_viewed
```

### Tazminat Hesaplayıcıları

Bu sayfa üç tazminat aracını ayrı bir ürün ailesi olarak izler:

- `/tazminat-hesaplama/`
- `/kidem-tazminati-hesaplama/`
- `/ihbar-tazminati-hesaplama/`

Ana KPI'lar:

- termination landing sessions
- `termination_calculator_complete`
- organic termination completions
- organic termination session → completion rate

Kırılımlar:

- `calculator_type`
- device category
- landing page
- session default channel group

Bu raporda maaş, kıdem/ihbar tutarı, tarih veya kümülatif vergi matrahı gibi finansal girişler boyut ya da metrik olarak kullanılmamalıdır.

### AI Search Görünürlüğü

Ayrı kartlar ve tablolar:

- Google Generative AI impressions
- Google AI görünür sayfalar
- Bing total citations
- Bing average cited pages
- Bing cited page listesi
- Bing grounding query örnekleri
- GA4 AI referral sessions
- AI referral → tamamlanan hesaplama

Google/Bing native visibility ile GA4 referral data yan yana gösterilebilir fakat tek attributed conversion metriğinde birleştirilmez.

### İçerik Performansı

İçerikleri konu kümesi bazında karşılaştır:

- 2026 Maaş, Vergi ve Bordro
- Kariyer, Zam ve Ücret Kararları
- Yan Haklar ve Çalışan Finansal Sağlığı

Her küme için:

- organik landing session
- hesaplayıcıya geçiş
- Google Generative AI impressions
- Bing citations
- AI referral sessions

### Veri Kalitesi

- `salary_results_viewed` > `salary_calculation_completed` olmamalı.
- Exact maaş event parametresi bulunmamalı.
- `salary_range` ile birlikte `range_version` gelmeli.
- `termination_calculator_complete` yalnız allowlist `calculator_type` taşımalı ve finansal giriş değeri taşımamalı.
- Tarih ve saat raporlaması `Europe/Istanbul` bağlamında yorumlanmalı.
- Google Generative AI impressions click/session diye etiketlenmemeli.
- Bing citations ranking diye etiketlenmemeli.
- AI referral sessions toplam AI görünürlüğü gibi sunulmamalı.

## 7. Canlı bağlantı için gereken erişimler

Looker Studio ve native AI raporlarının canlı hale gelmesi için raporu yönetecek Google/Microsoft hesaplarında aşağıdaki erişimler gerekir:

- Search Console `sc-domain:maasim.net` property erişimi
- İlgili GA4 property için Viewer veya üzeri erişim
- Bing Webmaster Tools `maasim.net` property erişimi
- Looker Studio'da veri kaynağı oluşturma yetkisi

Repo, event sözlüğünü, birleşim seviyesini, AI görünürlük guardrail'lerini, calculated field'ları, sayfa düzenini ve veri kalite kurallarını tanımlar. Hesap yetkilendirmesi repository veya deployment üzerinden yapılamaz; rapor sahibinin oturumunda tamamlanmalıdır.
