# Maaşım.net

Türkiye için 2026 brütten nete ve netten brüte maaş hesaplama uygulaması.

## Faz 1A

Bu branch hesaplama doğruluğunu tek bir saf JavaScript motorunda toplar.

- Para değerleri kuruş cinsinden güvenli tamsayılarla işlenir.
- 2026 parametreleri merkezi bir dosyada tutulur.
- Aylık netler kuruşa yuvarlanır ve yıllık toplam aylık sonuçlardan üretilir.
- Netten brüte hesaplama her ayın hedef netini ayrı çözer.
- Kabul benchmarkları Node.js yerleşik test koşucusuyla kilitlenir.

## Çalıştırma

```bash
npm test
```

Node.js 22 veya üzeri gerekir.
