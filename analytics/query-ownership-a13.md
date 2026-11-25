# A13 — Arama niyeti sahipliği ve Search Console kontrolü

25 Kasım 2026. Kaynak kodu ve mevcut sayfa içeriklerinin incelemesi. **Gerçek Search Console sorgu × sayfa performansı bu incelemede mevcut değildir.** Bu nedenle hiçbir URL için trafik kaybı veya fiilî cannibalization kanıtlanmış sayılmaz.

## Karar

- Arama niyeti haritası: `content/query-ownership.js`. Bir sayfa birden fazla farklı niyeti destekleyebilir. Bir sorguya bir öncelikli hedef atanması diğer sayfaların o sorguda görünmesinin yasaklanması değildir.
- Vergi tarifesi rehberi: başlık ve açıklama tarifeye, kümülatif matraha ve örneklere odaklanır; kişisel geçiş ayı için araç linki verir.
- Emeklilik hesaplayıcısı: yürürlükteki kurallarla hesaplama ana işlevdir; güncel teklif numaraları için sürekli güncellenen kademeli emeklilik dosyasına yönlendirir. Mevcut EMADDER senaryosu korunur.
- 100.000 TL senaryosu: sayısal aylık/yıllık net tablosu. İlgili blog: teklif değerlendirme. Ayrı niyet, ayrı self-canonical.
- 2027 maaş aracı tahmindir; veri sayfası resmî parametrelerin açıklanma durumunu taşır.
- 2020–2025 araçları ayrı yıl niyeti taşır. Mevcut birleştirmeler ve yönlendirmeler korunur.
- Bu PR yeni URL, 301, noindex veya canonical değişikliği yapmaz.

## Gerçek performans kontrolü

1. Search Console, domain property sc-domain:maasim.net, Arama sonuçları, Web, son 28 tam gün ve önceki 28 tam gün. Ülke ve cihaz filtrelerini aynı tut. Düşük hacim varsa 90 gün ayrıca kontrol edilir.
2. Sorgu ve sayfa birlikte alınmalı. Arayüzde her öncelikli sorguyu filtreleyip Sayfalar sekmesini dışa aktar veya Search Analytics API ile dimensions=["query","page"] ve search type web kullan. Sayfa ve sorgu için ayrı toplam dosyalar join edilmez. Tarih aralığı ve dışa aktarma zamanı kaydedilir.
3. Aynı sorguda birden fazla kanonik URL görülürse her birinin gösterim, tıklama, CTR ve ortalama pozisyonunu karşılaştır. Hedef dışı URL'nin gösterim/tıklama payını, zaman içinde URL değişimini ve arama niyetini incele. Çoklu URL tek başına sorun kanıtı değildir. Eşikler yalnız inceleme önceliğidir; örneğin 100+ toplam gösterim ve ikinci URL'nin en az %20 gösterim payı.
4. Hedef dışı sayfa baskınsa önce arama niyeti, title, H1, içerik ve iç bağlantıları kontrol et. Aynı niyeti gerçekten tekrarlayan içerik varsa performans ve link değerini doğruladıktan sonra birleştirme değerlendir. Farklı niyetli sayfaları yönlendirme.
5. Değişiklik sonrası aynı filtrelerle 28 tam günlük karşılaştırma; hacim, mevsimsellik ve indeksleme gecikmesini not et. Anonimleştirilen sorgular ve API satır sınırları nedeniyle toplamlar eksik olabilir.

Google kaynakları:
- https://support.google.com/webmasters/answer/7576553
- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls

CI doğrulaması: `npm run verify:query-ownership` (önce build). Bu kontrol yalnızca teknik hedefleri ve içerik ayrımını doğrular, gerçek GSC performansını ölçmez.
