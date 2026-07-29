# Maaşım.net

Türkiye için 2026 brütten nete ve netten brüte maaş hesaplama uygulaması.

## Mimari

- Para değerleri hesap motorunda kuruş cinsinden güvenli tamsayılarla işlenir.
- 2026 bordro parametreleri `src/parameters-2026.js` içinde tek kaynaktır.
- Brütten nete ve netten brüte işlemleri `src/payroll-engine.js` üzerinden çalışır.
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
4. HTML, hesap motoru ve senaryo sonuçlarını doğrular.
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

GitHub Actions deployment akışı güvenlik amacıyla varsayılan olarak kapalıdır. Otomatik production deployment için repository ayarlarında aşağıdakiler tanımlanmalıdır:

- Secret: `CLOUDFLARE_API_TOKEN`
- Secret: `CLOUDFLARE_ACCOUNT_ID`
- Variable: `CLOUDFLARE_DEPLOY_ENABLED=true`

Bu değerler tanımlanana kadar push işlemleri yalnızca test ve production artifact üretir; canlı siteyi değiştirmez.

## Kilit benchmark

100.000 TL sabit aylık brüt için:

- Ocak neti: 75.953,02 TL
- Aralık neti: 67.156,80 TL
- Yıllık toplam net: 833.881,57 TL
- Aylık ortalama net: 69.490,13 TL
