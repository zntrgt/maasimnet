# Mobile viewport width fix

2026-09-04 tarihli iPhone/Safari ekran görüntüsünde hesaplama sonucu üretildikten sonra form ve sonuç kartının görsel viewport'un yalnız bir bölümünü kullanıp sağda boş alan bırakması gözlendi.

Bu düzeltme mobil hesaplama zincirini doğrudan görsel viewport genişliğine kilitler:

- `main`: `100vw` + full-bleed merkezleme + safe-area padding
- calculator/form/result parent zinciri: `width:100%`, `max-width:100%`, `min-width:0`, `box-sizing:border-box`
- 12 aylık mikro grafik: `repeat(12,minmax(0,1fr))` ve kendi alanında clip
- geniş bordro tabloları: sayfa genişliğini büyütmek yerine kendi wrapper'ında yatay scroll
- sonuç kartı ve tüm doğrudan çocukları: overflow-safe

Regression kontrolü `verify-mobile-calculator-ux.js` içinde viewport ve overflow kontratlarını zorunlu kılar.
