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

Google’ın Search Console içindeki özel Generative AI Performance raporu AI Overviews ve AI Mode görünürlüğünü izler. Doğrulanmış alanlar Impressions, Page, Country, Device ve Date'tir. Dedicated raporda gösterilmeyen click/session metrikleri türetilmemelidir.

Resmî dokümantasyon: `https://support.google.com/webmasters/answer/16984139`

Bağlantı kuralı: Search Console native raporu veya export edilmiş rapor verisi kullanılabilir. API ya da Looker Studio connector'ında aynı alanların desteklendiği ayrıca doğrulanmadan otomatik entegrasyon varsayılmamalıdır.

### Google Analytics 4

- Web stream measurement ID: `G-988BB5B64E`
- GA4 property ID: Looker Studio bağlantısı kurulurken seçilmelidir.
- Organik filtre: `Session default channel group = Organic Search`
- Ana boyutlar: Date, Landing page + query string, Session source / medium, Device category, Event name
- Ana metrikler: Sessions, Active users, Event count, Key events

### Bing Webmaster Tools — AI Performance

Bing AI Performance public preview Microsoft Copilot, Bing AI-generated summaries ve desteklenen partner yüzeylerindeki citation görünürlüğünü ölçer. Ana metrikler Total citations, Average cited pages ve Page-level citations; boyutlar Date, Page ve Grounding queries'dir.

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

`calculator_type` yalnız `combined`, `severance` veya `notice` değerlerinden birini almalıdır. Exact maaş, kıdem, ihbar, PEK, mesai saati, kullanılmayan izin günü, asgari ücret dönem seçimi veya kümülatif vergi matrahı özel boyut olarak kaydedilmemelidir.

## 3. Ana funnel eventleri

Maaş hesaplama funnel'ı:

1. `calculator_view`
2. `salary_input_started`
3. `salary_calculation_completed`
4. `salary_results_viewed`
5. `payroll_detail_toggle` (`detail_action = open`)
6. `calculator_csv_download`

Diğer hesaplayıcıların ana sonuç eventleri:

- `termination_calculator_complete` (`calculator_type = combined | severance | notice`)
- `unemployment_calculator_complete`
- `overtime_calculator_complete`
- `annual_leave_calculator_complete`
- `minimum_wage_calculator_complete`

`salary_calculation_completed`, `salary_results_viewed`, `termination_calculator_complete`, `unemployment_calculator_complete`, `overtime_calculator_complete`, `annual_leave_calculator_complete` ve `minimum_wage_calculator_complete` GA4 içinde key event olarak işaretlenmelidir.

Bu completion eventlerinin tümü yalnız Cookiebot istatistik izni verildiğinde gönderilir. Tazminat eventindeki allowlist `calculator_type` dışında yeni çalışan-hakları eventleri **payload göndermez**. Maaş, PEK, prim günü, fesih nedeni, mesai saati, kullanılmayan izin günü, kümülatif vergi matrahı, emeklilik/engellilik bilgisi, ay sayısı veya hesap sonucu GA4 parametresi olarak gönderilmemelidir.

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

Kaynak: Search Console Generative AI Performance. Ana KPI'lar Generative AI impressions, görünür sayfa sayısı, sayfa bazında trend ve ülke/cihaz kırılımıdır. Bu metrikler **görünürlük** ölçer.

### B. Bing AI citation visibility

Kaynak: Bing Webmaster Tools AI Performance. Ana KPI'lar Total citations, Average cited pages, cite edilen URL'ler ve Grounding query örnekleridir. Citation ranking değildir.

### C. GA4 AI referral traffic

Session source/medium filtreleriyle `chatgpt.com`, Perplexity, Gemini ve diğer doğrulanmış AI referral kaynakları izlenebilir. Bunlar yalnız **siteye gerçekten tıklayıp gelen oturumları** ölçer.

Bu üç sinyal tek bir “AI traffic” sayısında birleştirilmemelidir.

## 6. Rapor sayfaları

### Yönetici Özeti

GSC gösterim/tıklama/CTR/pozisyon, Google AI impressions, Bing citations, organik landing session ve her hesaplayıcı ailesinin tamamlanan hesaplama sayıları birlikte izlenir.

### Sorgu ve Landing Page

Sol tablo GSC Query → Landing page → Impressions/Clicks/CTR/Position gösterir. Sağ tablo landing page düzeyinde organik sessions ve hesaplayıcı completion eventlerini gösterir. Query seçimi yalnız ilgili landing page'i filtreler; sayfa dönüşüm sayısı her sorguya kopyalanmaz.

### Hesaplayıcı Funnel

Ana maaş funnel'ı `calculator_view → salary_input_started → salary_calculation_completed → salary_results_viewed` olarak izlenir. CSV ve detay etkileşimleri ikincil eventlerdir.

### Tazminat Hesaplayıcıları

`/tazminat-hesaplama/`, `/kidem-tazminati-hesaplama/`, `/ihbar-tazminati-hesaplama/` landing session, completion ve `calculator_type` kırılımıyla izlenir. Finansal giriş değerleri rapora taşınmaz.

### İşsizlik Maaşı Hesaplayıcı

`/issizlik-maasi-hesaplama/` için landing sessions, `unemployment_calculator_complete`, organik completion rate, device ve channel kırılımı izlenir. PEK, prim günü, fesih nedeni, başvuru gecikmesi veya eligibility girdileri event parametresi değildir.

### Fazla Mesai Hesaplayıcı

`/fazla-mesai-hesaplama/` için landing sessions, `overtime_calculator_complete`, organik completion rate, device ve channel kırılımı izlenir. Maaş, mesai saati, vergi matrahı, emeklilik veya engellilik girdileri event parametresi değildir.

### Yıllık İzin Ücreti Hesaplayıcı

`/yillik-izin-ucreti-hesaplama/` için landing sessions, `annual_leave_calculator_complete`, organik completion rate, device ve channel kırılımı izlenir. Son brüt ücret, kullanılmayan izin günü, fesih ayı prim günü, vergi matrahı, emeklilik veya engellilik girdileri gönderilmez.

### Asgari Ücret Hesaplayıcı

`/asgari-ucret-hesaplama/` için landing sessions, `minimum_wage_calculator_complete`, organik completion rate, device ve channel kırılımı izlenir. Dönem seçimi veya herhangi bir finansal değer event parametresi olarak gönderilmez.

### AI Search Görünürlüğü

Google Generative AI impressions, Bing citations ve GA4 AI referral sessions yan yana gösterilebilir fakat tek attributed conversion metriğinde birleştirilmez.

### İçerik Performansı

Konu kümesi bazında organik landing session, hesaplayıcıya geçiş, Google Generative AI impressions, Bing citations ve AI referral sessions izlenir.

### Veri Kalitesi

- `salary_results_viewed` > `salary_calculation_completed` olmamalı.
- Exact maaş event parametresi bulunmamalı.
- `salary_range` ile birlikte `range_version` gelmeli.
- `termination_calculator_complete` yalnız allowlist `calculator_type` taşımalı ve finansal giriş değeri taşımamalı.
- İşsizlik, fazla mesai, yıllık izin ve asgari ücret completion eventleri form/finansal payload taşımamalı.
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
