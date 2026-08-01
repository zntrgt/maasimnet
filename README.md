# Maaşım.net

[![Test and build](https://github.com/zntrgt/maasimnet/actions/workflows/ci.yml/badge.svg)](https://github.com/zntrgt/maasimnet/actions/workflows/ci.yml)
[![Deploy to Cloudflare](https://github.com/zntrgt/maasimnet/actions/workflows/deploy.yml/badge.svg)](https://github.com/zntrgt/maasimnet/actions/workflows/deploy.yml)

Türkiye için 2026 brütten nete ve netten brüte maaş hesaplama uygulaması.

## Mimari

- Para değerleri hesap motorunda kuruş cinsinden güvenli tamsayılarla işlenir.
- 2026 bordro parametreleri `src/parameters-2026.js` içinde tek kaynaktır.
- Brütten nete ve netten brüte işlemleri `src/payroll-engine.js` üzerinden çalışır.
- Vergi dilimi, SGK tavanı, asgari ücret, engellilik ve yuvarlama sınırları `src/payroll-audit.js` ile çalıştırılabilir biçimde denetlenir.
- Denetim sonuçları build sırasında `/test-raporu/` sayfasına dönüştürülür; başarısız sınır testi yayını durdurur.
- Sayfa yayın, güncelleme ve mevzuat kontrol tarihleri `content/site-metadata.js` üzerinden yönetilir.
- Ana arayüz `src/app.js` ile merkezi motora bağlanır.
- Mobil bordro; Ay, Brüt, Net Maaş ve Detay sütunlarından oluşur.
- Senaryo sayfalarındaki hesap sonuçları build sırasında merkezi motordan üretilir.
- Production kaynakları `site-bundle/` içinden doğrulanabilir biçimde `static/` klasörüne açılır.
- Build çıktısı yalnızca `dist/` klasöründe oluşturulur.

## Yerel geliştirme

Node.js 22 veya üzeri gerekir.

```bash
npm ci
npm run check
```

`npm run check` sırasıyla şunları çalıştırır:

1. Statik production kaynaklarını hazırlar.
2. Otomatik regresyon ve entegrasyon testlerini çalıştırır.
3. `dist/` klasörünü oluşturur.
4. HTML, hesap motoru, açık test raporu, merkezi tarihler ve senaryo sonuçlarını doğrular.
5. Yerel HTTP smoke testi çalıştırır.

Ayrı komutlar:

```bash
npm test
npm run build
npm run verify
npm run smoke
```

## Cloudflare deployment

Wrangler yalnızca `dist/` klasörünü deploy eder:

```bash
npm run check
npx wrangler deploy
```

GitHub Actions production deployment akışı etkinleştirilmiştir. `main` branch’e yapılan push sonrasında test, build, doğrulama ve smoke test başarılı olursa Cloudflare Worker deployment adımı çalışır.

Repository ayarlarında gereken değerler:

- Secret: `CLOUDFLARE_API_TOKEN`
- Secret: `CLOUDFLARE_ACCOUNT_ID`
- Variable: `CLOUDFLARE_DEPLOY_ENABLED=true`

Secret değerleri hiçbir commit, issue veya dokümana yazılmaz; yalnızca GitHub Actions encrypted secrets alanında tutulur.

## Kilit benchmark

100.000 TL sabit aylık brüt için:

- Ocak neti: 75.953,03 TL
- Aralık neti: 67.156,80 TL
- Yıllık toplam net: 833.881,63 TL
- Aylık ortalama net: 69.490,14 TL

2026 brüt asgari ücret 33.030,00 TL için 12 ayın her birinde net sonuç 28.075,50 TL ve ödenecek gelir/damga vergisi 0,00 TL olmalıdır.
