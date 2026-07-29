# Search Console senaryo URL denetimi

Bu kontrol production deploy sonrasında Google Search Console üzerinden manuel yapılır. Build sırasında `dist/indexability-report.json` dosyası teknik ön koşulları doğrular; Google-selected canonical ve tarama/index durumları yalnız URL Inspection ile görülebilir.

## Kontrol edilecek URL'ler

- `/100000-brut-maas-hesaplama/`
- `/temmuz-zam-senaryosu/`
- `/prim-ikramiye-maas-hesaplama/`
- `/isveren-maliyeti-hesaplama/`
- `/emekli-calisan-maas-hesaplama/`
- `/is-degisikligi-vergi-matrahi/`
- `/asgari-ucret-isveren-maliyeti/`
- `/vergi-dilimi-hesaplama/`

## Her URL için

1. URL Inspection ile canlı URL testi yap.
2. User-declared canonical ile Google-selected canonical değerlerini karşılaştır.
3. Durumu kaydet: Indexed, Discovered – currently not indexed veya Crawled – currently not indexed.
4. Son tarama tarihini kaydet.
5. Sitemap kaynağının `https://maasim.net/sitemap.xml` olduğunu doğrula.
6. Ana sayfa veya `/senaryolar/` üzerinden iç bağlantının görüldüğünü doğrula.
7. Gerekirse Request indexing kullan.

## Kod tarafından otomatik doğrulananlar

- Self-referencing canonical
- `noindex` bulunmaması
- Sitemap inclusion
- Senaryo hub iç bağlantısı
- Ana sayfa seçili senaryo iç bağlantısı

Otomatik sonuç: `https://maasim.net/indexability-report.json`
