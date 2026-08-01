# Maaşım.net GSC + GA4 Funnel Dashboard

Bu klasör, Google Search Console sorgularını ve GA4 hesaplayıcı davranışlarını tek Looker Studio raporunda birleştirmek için kaynak tanımını içerir.

## Gerçek veri sınırı

GSC; sorgu, sayfa, tarih, cihaz, gösterim ve tıklama verisini sağlar. GA4; landing page, oturum ve event verisini sağlar. Google iki sistem arasında kullanıcı veya oturum seviyesinde ortak bir anahtar sunmaz.

Bu nedenle dashboard:

- sorgu performansını **GSC seviyesinde tam olarak** gösterir,
- hesaplama funnel'ını **GA4 landing-page seviyesinde tam olarak** gösterir,
- sorgu seçildiğinde ilgili landing page funnel'ına geçer,
- aynı landing page'in dönüşüm sayısını o sayfaya gelen her sorguya kopyalamaz,
- “sorgu başına kesin hesaplama dönüşümü” adında sahte bir metrik üretmez.

Makine tarafından doğrulanan rapor modeli `gsc-ga4-dashboard.json` dosyasındadır.

## 1. Veri kaynakları

### Google Search Console

- Bağlantı türü: **Site Impression**
- Property: `sc-domain:maasim.net`
- Tablo: URL Impression
- Boyutlar: Date, Query, Page, Device, Country
- Metrikler: Impressions, Clicks, CTR, Average Position

### Google Analytics 4

- Web stream measurement ID: `G-988BB5B64E`
- GA4 property ID: Looker Studio bağlantısı kurulurken seçilmelidir.
- Organik filtre: `Session default channel group = Organic Search`
- Ana boyutlar: Date, Landing page + query string, Device category, Event name
- Ana metrikler: Sessions, Active users, Event count, Key events

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

Exact maaş tutarı özel boyut olarak kaydedilmemelidir.

## 3. Ana funnel eventleri

1. `calculator_view`
2. `salary_input_started`
3. `salary_calculation_completed`
4. `salary_results_viewed`
5. `payroll_detail_toggle` (`detail_action = open`)
6. `calculator_csv_download`

`salary_calculation_completed` ve `salary_results_viewed` GA4 içinde key event olarak işaretlenmelidir.

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

## 5. Rapor sayfaları

### Yönetici Özeti

Scorecard'lar:

- GSC gösterim
- GSC tıklama
- GSC CTR
- Ortalama pozisyon
- Organik landing session
- Tamamlanan maaş hesaplaması
- Organik session → hesaplama tamamlama oranı

Grafikler:

- Günlük organik tıklama ve tamamlanan hesaplama
- Landing page funnel
- Cihaz kırılımı
- Tamamlanan hesaplamaya göre en iyi landing page'ler

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
- Completion rate

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

### İçerik ve AI Trafiği

Session source/medium filtreleriyle:

- `chatgpt.com`
- Perplexity
- Gemini
- Organic Search

İçerik landing page'lerinden hesaplayıcıya geçiş ve tamamlanan hesaplama sayısı izlenmelidir.

### Veri Kalitesi

- `salary_results_viewed` > `salary_calculation_completed` olmamalı.
- Exact maaş event parametresi bulunmamalı.
- `salary_range` ile birlikte `range_version` gelmeli.
- Tarih ve saat raporlaması `Europe/Istanbul` bağlamında yorumlanmalı.

## 6. Canlı bağlantı için gereken erişimler

Looker Studio raporunun canlı hale gelmesi için raporu oluşturacak Google hesabında aşağıdaki erişimler gerekir:

- Search Console `sc-domain:maasim.net` property erişimi
- İlgili GA4 property için Viewer veya üzeri erişim
- Looker Studio'da veri kaynağı oluşturma yetkisi

Repo, event sözlüğünü, birleşim seviyesini, calculated field'ları, sayfa düzenini ve veri kalite kurallarını tanımlar. Google hesap yetkilendirmesi repository veya deployment üzerinden yapılamaz; rapor sahibinin Google oturumunda bir kez tamamlanmalıdır.
