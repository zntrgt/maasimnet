# Maaşım.net SEO Keyword Ownership — Eylül 2026

Bu doküman, aynı arama niyetinin birden fazla URL tarafından hedeflenmesini önlemek ve yeni hesaplayıcı yatırım sırasını belirlemek için kullanılır.

## Veri notu

Bu önceliklendirme **kesin aylık arama hacmi değildir**. GSC sorgu verisi ve Google Keyword Planner erişimi olmadan hacim rakamı yazılmaz. Tier sırası; güncel Türkiye SERP yapısı, sorgunun işlem niyeti, dedicated calculator sonuçlarının yoğunluğu, Maaşım.net ürün uyumu ve mevcut içerik kapsaması temel alınarak hazırlanmıştır.

GSC verisi geldikten sonra her satıra 28 günlük impressions, clicks, CTR, average position ve landing page eklenerek sıra yeniden değerlendirilmelidir.

## Tier A — mevcut sitede sahiplenilecek ana sorgular

| Query cluster | Primary owner URL | Secondary wording | Kural |
|---|---|---|---|
| maaş hesaplama 2026 | `/` | maaş hesaplama, net maaş hesaplama | Ana sayfa sahiplenir. Ayrı generic maaş URL'si açılmaz. |
| brütten nete maaş hesaplama | `/` | brüt net maaş, brüt maaş neti | Ana sayfa sahiplenir. |
| netten brüte maaş hesaplama | `/` | net brüt maaş, net maaştan brüt | Ana sayfa sahiplenir. |
| maaş zam hesaplama | `/maas-zam-hesaplama/` | yüzde zam hesaplama maaş, maaşım yüzde kaç arttı, zamlı maaş | Eski maaş, yeni maaş ve zam oranı arasındaki üç yönlü matematiksel değişim niyetinin tek owner'ı. Bordro/net-brüt niyetini sahiplenmez. |
| asgari ücret hesaplama 2026 | `/asgari-ucret-hesaplama/` | net asgari ücret, brüt asgari ücret, günlük asgari ücret | Çalışan tarafındaki resmî brüt/net ve kesinti niyetini sahiplenir. İşveren maliyeti ayrı URL'de kalır. |
| kıdem tazminatı hesaplama 2026 | `/kidem-tazminati-hesaplama/` | kıdem hesaplama, kıdem tazminatı ne kadar | Kıdem aracı primary owner. Kombine sayfa bu sorguyu title/H1'da tekrar hedeflemez. |
| ihbar tazminatı hesaplama 2026 | `/ihbar-tazminati-hesaplama/` | ihbar hesaplama, ihbar süresi hesaplama | İhbar aracı primary owner. |
| tazminat hesaplama | `/tazminat-hesaplama/` | kıdem ihbar hesaplama, toplam tazminat | Kombine sayfa primary owner. |
| işsizlik maaşı hesaplama 2026 | `/issizlik-maasi-hesaplama/` | işsizlik ödeneği hesaplama, kaç ay işsizlik maaşı alırım | İşsizlik aracı primary owner; kıdem/tazminat sayfaları yalnız bağlamsal destek verir. |
| fazla mesai hesaplama 2026 | `/fazla-mesai-hesaplama/` | mesai ücreti hesaplama, saatlik fazla mesai ücreti | Fazla mesai aracı primary owner; maaş/vergi sayfaları yalnız bağlamsal destek verir. |
| yıllık izin ücreti hesaplama 2026 | `/yillik-izin-ucreti-hesaplama/` | kullanılmayan izin parası hesaplama, yıllık izin hesaplama | Kullanılmayan izin ücretinin primary owner'ı. Genel yıllık izin rehberi niyetini aşırı genişletmez. |
| işveren maliyeti hesaplama | `/isveren-maliyeti-hesaplama/` | maaşın işverene maliyeti | Bu URL primary owner; ana sayfa yalnız contextual destek verir. |
| vergi dilimi hesaplama 2026 | `/vergi-dilimi-hesaplama/` | gelir vergisi dilimi hesaplama | Bu URL primary owner. |
| asgari ücret işveren maliyeti 2026 | `/asgari-ucret-isveren-maliyeti/` | asgari ücretin işverene maliyeti | İşveren niyetinin tek primary owner'ı; `/asgari-ucret-hesaplama/` çalışan maliyetini hedeflemez. |
| emekli çalışan maaş hesaplama | `/emekli-calisan-maas-hesaplama/` | SGDP maaş hesaplama | Bu URL primary owner. |
| 2027 maaş hesaplama | `/2027-maas-hesaplama/` | 2027 brütten nete tahmin | Tahmin niteliği açıkça korunur; 2026 ana sayfayla karıştırılmaz. |

## Tier B — tamamlandı

İşsizlik maaşı, fazla mesai, yıllık izin ücreti, asgari ücret ve maaş zam hesaplama kümelerinin tamamı gerçek hesap motorlarıyla yayına alınmıştır. Bundan sonraki yeni hesaplayıcı sırası GSC verisiyle yeniden belirlenecektir; thin placeholder sayfa açılmaz.

## Tier C — long-tail genişleme

- resmi tatil mesai ücreti hesaplama
- hafta tatili ücreti hesaplama
- saatlik ücret hesaplama
- günlük maaş hesaplama
- eksik gün maaş hesaplama
- part time maaş hesaplama
- SGK prim hesaplama
- kümülatif vergi matrahı hesaplama
- yıllık net gelir hesaplama

## İç link mimarisi

### Global

- Header: `Hesaplama Araçları` → `/hesaplama-araclari/`
- Header: `İşveren Maliyeti` → `/isveren-maliyeti-hesaplama/`
- Header: `Kıdem & İhbar` → `/tazminat-hesaplama/`
- Footer: hesaplama hub'ı ve çalışan hakları/tazminat araçları korunur.

### Ana sayfa

Ana maaş hesaplayıcısına zarar vermeden, içerik akışında görünür bir `Diğer hesaplama araçları` modülü bulunur. En yüksek destek verilen URL'ler:

- `/maas-zam-hesaplama/`
- `/asgari-ucret-hesaplama/`
- `/tazminat-hesaplama/`
- `/kidem-tazminati-hesaplama/`
- `/ihbar-tazminati-hesaplama/`
- `/issizlik-maasi-hesaplama/`
- `/fazla-mesai-hesaplama/`
- `/yillik-izin-ucreti-hesaplama/`
- `/isveren-maliyeti-hesaplama/`
- `/vergi-dilimi-hesaplama/`

### Konu sayfaları

`/veriler/2026/`, `/hesaplama-metodolojisi/`, `/sss/`, `/sozluk/`, `/senaryolar/` sayfaları maaş + maaş zam + asgari ücret + tazminat + işsizlik + fazla mesai + yıllık izin araçlarına bağlamsal link verir.

`/blog/kidem-tazminatina-dahil-odemeler/` kıdem, ihbar, kombine tazminat ve kullanılmayan izin ücreti araçlarına link verir.

### Maaş zam cluster

- `maaş zam hesaplama`, `yüzde zam hesaplama maaş`, `maaşım yüzde kaç arttı`, `zamlı maaş` sorgularının tek primary owner'ı `/maas-zam-hesaplama/` olur.
- Sayfa yalnız matematiksel yüzde değişimi çözer; `brütten nete`, `netten brüte`, vergi veya SGK hesabı ana maaş hesaplayıcısına bırakılır.
- Net maaş ve brüt maaş için aynı yüzde formülü kullanılır ancak kullanıcı iki aynı tür tutarı karşılaştırmalıdır.
- Ana sayfa, hesaplama hub'ı ve metodoloji/SSS/sözlük/veri sayfaları bağlamsal link verir.

### Tazminat cluster

- Kıdem → İhbar → Kombine sayfalar karşılıklı linklenir.
- Her sayfanın title/H1 ve ana açıklaması kendi primary query'sini sahiplenir.
- `tazminat hesaplama` generic sorgusu kombine sayfaya, `kıdem tazminatı hesaplama` kıdem sayfasına, `ihbar tazminatı hesaplama` ihbar sayfasına gider.
- Kullanılmayan izin ücreti ayrı bir ücret alacağı olduğu için `/yillik-izin-ucreti-hesaplama/` ayrı query owner olarak korunur.

### İşsizlik cluster

- `işsizlik maaşı hesaplama 2026`, `işsizlik ödeneği hesaplama`, `kaç ay işsizlik maaşı alırım` sorgularının tek primary owner'ı `/issizlik-maasi-hesaplama/` olur.
- Ana sayfa ve hesaplama hub'ı doğrudan link verir.
- Tazminat sayfaları işten ayrılma bağlamında yalnız ikincil bağlantı sağlar; title/H1 seviyesinde işsizlik sorgusunu hedeflemez.

### Fazla mesai cluster

- `fazla mesai hesaplama 2026`, `mesai ücreti hesaplama`, `saatlik fazla mesai ücreti` sorgularının tek primary owner'ı `/fazla-mesai-hesaplama/` olur.
- Ana sayfa, hesaplama hub'ı ve metodoloji/SSS/sözlük/veri sayfaları doğrudan link verir.
- `resmi tatil mesai` ve `hafta tatili ücreti` daha farklı hukuki hesap türleri olduğu için bu sayfada primary keyword olarak sahiplenilmez; Tier C'de ayrı değerlendirilecektir.

### Yıllık izin cluster

- `yıllık izin ücreti hesaplama 2026`, `kullanılmayan izin parası hesaplama` ve ücret odaklı `yıllık izin hesaplama` sorgularının primary owner'ı `/yillik-izin-ucreti-hesaplama/` olur.
- Sayfa hak edilmiş geçmiş toplamı uydurmaz; kullanıcının izin kaydındaki kullanılmayan gün sayısını esas alır.
- Kıdem/tazminat cluster'ından işten ayrılma bağlamında link alır ama tazminat keywordlerini H1/title seviyesinde hedeflemez.

### Asgari ücret cluster

- `asgari ücret hesaplama 2026`, `net asgari ücret`, `brüt asgari ücret`, `günlük asgari ücret` → `/asgari-ucret-hesaplama/`.
- `asgari ücret işveren maliyeti`, `asgari ücretin işverene maliyeti` → `/asgari-ucret-isveren-maliyeti/`.
- Ana maaş hesaplayıcısı asgari ücret üzerindeki genel brüt/net maaşları sahiplenmeye devam eder; asgari ücret URL'si generic `maaş hesaplama` sorgusunu hedeflemez.

## GSC sonrası karar kuralları

28 günlük sorgu verisi geldiğinde:

- Impressions yüksek, position 4–15, CTR düşük → title/meta/intro ve rich result iyileştir.
- Impressions yüksek, position 15–40 → içerik derinliği + internal link + özgün hesap örneği artır.
- İki URL aynı query'de impressions alıyorsa → query ownership/cannibalization kontrolü yap.
- Calculator landing page organik session yüksek ama completion düşükse → SEO değil UX/form friksiyonu öncelik olur.
- Yeni calculator yatırımı, impressions proxy + SERP rekabeti + ürün motoru doğruluğu üçlüsüyle seçilir.
