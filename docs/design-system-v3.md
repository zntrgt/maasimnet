# Maaşım.net Design System v3

Bu doküman, UI/UX master brief'inin mevcut Maaşım.net mimarisine production-safe uyarlamasıdır.

## Mimari karar

Maaşım.net bugün statik HTML + vanilla JavaScript/CSS build hattı ile çalışıyor. Sadece tasarım sistemi kurmak için React, Tailwind ve Framer Motion eklemek; bundle, hydration ve bakım maliyeti yaratacağı için tercih edilmedi. Aynı davranışlar framework bağımlılığı olmadan uygulanıyor.

- `src/theme.css`: semantic design tokens, light/dark theme, legacy token compatibility, global typography ve WCAG-aware foreground renkleri.
- `src/theme.js`: sistem temasını okur, `maasim_theme_v1` tercihini `localStorage` üzerinde saklar ve `data-theme` uygular.
- `src/ui-primitives.css`: button, tooltip/popover, select, switch, loading, mobil sticky summary primitive'leri.
- `src/ui-primitives.js`: tooltip/popover davranışı, finansal terim yardım tetikleyicileri, hızlı maaş tutarlarının erişilebilir etiketleri ve mobil sonuç summary bar.
- `scripts/apply-shared-shell.js`: tüm üretilen HTML sayfalarına Design System v3'ü tek noktadan uygular. Tema bootstrap kodu head içinde çalışarak flash-of-wrong-theme riskini azaltır.

## Design tokens

### Core

- Brand: `#0f172a`
- Primary action: `#2563eb`
- Primary action hover: `#1d4ed8`
- Primary action active: `#1e40af`
- Page background: `#f8fafc`
- Card: `#ffffff`

### Semantics

Brief'teki renkler ham semantic token olarak korunur. Ham success/warning/error tonları beyaz zemin üzerinde her zaman 4.5:1 metin kontrastı sağlamadığı için ayrıca `*-strong` foreground tokenları vardır.

- Success: `#10b981`; foreground `#047857`; background `#ecfdf5`
- Warning: `#f59e0b`; foreground `#92400e`; background `#fffbeb`
- Danger: `#ef4444`; foreground `#b91c1c`; background `#fef2f2`
- Info: `#0284c7`; foreground `#0369a1`; background `#f0f9ff`

Dark mode için aynı semantic isimler daha açık foreground'lara ve koyu yüzeylere map edilir.

## Typography

- Body/UI: `Inter, ui-sans-serif, system-ui, ...`
- Finansal tutarlar: `JetBrains Mono, SFMono-Regular, Consolas, ...`
- Tüm finansal değerlerde `tabular-nums lining-nums` uygulanır.
- Mobil form kontrolleri minimum 16px'tir; iOS Safari focus zoom riski azaltılır.

## Accessibility

- Button, form input/select ve summary kontrollerinde minimum 44px touch target.
- `:focus-visible` için görünür 2px focus ring + offset.
- Tema düğmesi `aria-pressed`, dinamik `aria-label` ve title kullanır.
- Tooltip tetikleyicileri 44x44px hit area, `aria-expanded` ve `aria-controls` kullanır.
- Popover Escape, dış click, focus ve hover senaryolarını destekler.
- `prefers-reduced-motion: reduce` ile gereksiz animasyonlar kapatılır.

## Mikro-etkileşim

Framer Motion yerine native CSS/JS kullanılır. Böylece Framer'ın LazyMotion ile dahi gerektireceği runtime tamamen ortadan kalkar.

- Amount input focus: `scale(1.01)`
- Invalid input: 240ms horizontal shake
- Primary action press: `scale(.97)`
- Loading: CSS spinner + `aria-busy`
- Switch: spring-benzeri cubic-bezier thumb geçişi
- Tooltip/popover: opacity + translate/scale

## Maaş ekranı

Ana hesaplayıcıdaki mevcut humanized UX korunur ve Design System v3 tarafından güçlendirilir:

- Hızlı tutarlar `50.000 ₺ / 75.000 ₺ / 100.000 ₺ / 150.000 ₺` olarak normalize edilir.
- Mobilde hesaplama öncesi sticky CTA korunur.
- Hesaplama sonrasında aşağı kaydırıldığında aynı alan `Aylık ortalama netin + Aralık vergi dilimi + Detay` summary bar'a dönüşür.
- `Detay` sonucu tekrar odak noktasına getirir.
- Finansal terim etiketlerine uygun olduğunda erişilebilir bilgi popover'ı eklenir.

## Dark mode kapsamı

Tema semantic token seviyesinde sitewide uygulanır. Shared header/footer, ana maaş formu, tarihsel maaş panelleri, tazminat, işsizlik, fazla mesai, yıllık izin, asgari ücret ve ortak form kontrolleri tokenlara bağlanır. Legacy sayfalardaki sabit renkler yeni modüller dokunuldukça semantic tokenlara taşınmaya devam edebilir; v3 katmanı mevcut görünümü kırmadan ortak dark surface override'ları sağlar.

## SEO / GEO kararları

### JSON-LD

Maaşım.net'in hesaplayıcı sayfalarında mevcut statik üretim katmanı `WebApplication`/`FinanceApplication`, FAQ ve breadcrumb şemalarını sayfa bağlamında üretir. Runtime React `JsonLd.jsx` eklemek static-first mimaride gereksizdir.

`FinancialProduct` yalnız gerçek bir finansal ürün/sözleşme teklif ediliyorsa semantik olarak uygundur. Maaş hesaplayıcısını finansal ürün gibi işaretlemek yanıltıcı olacağı için sitewide eklenmez.

### robots.txt

Arama ve kullanıcı talebiyle çalışan AI retrieval botları açıktır (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Claude-User`, `Google-Extended`). Model training/bulk dataset crawler'ları ayrı tutulur ve engellenir (`GPTBot`, `ClaudeBot`, `CCBot` vb.). Böylece AI görünürlüğü ile eğitim izni birbirine karıştırılmaz.

### Sitemap

Sitemap build sırasında gerçek route envanterinden üretilir. Statik olarak beş URL'ye düşürülmez. Bu, tarihsel bordro, çalışan hakları, veri ve editoryal sayfaların discovery'sini korur.

### Google Indexing API

Google Indexing API, Google'ın resmi dokümantasyonuna göre yalnız `JobPosting` veya `VideoObject` içindeki `BroadcastEvent` sayfaları için kullanılabilir. Maaş hesaplayıcı URL'leri bu API'ye gönderilmez. Mevcut deploy hattındaki IndexNow submission korunur.

## Cloudflare

`content/_headers` mevcut asset caching, sitemap cache ve güvenlik header kurallarını korur. Yeni Design System runtime'ı HTML içine inline edildiği için tema kritik kodunda ek network round-trip oluşmaz.

## Regression contract

`tests/design-system-v3.test.js` şu sözleşmeleri kilitler:

1. Semantic tokenlar ve dark theme var.
2. Touch target + reduced motion kontratı var.
3. Theme persistence/system fallback var.
4. Tooltip ve mobile salary summary primitive'leri var.
5. React/Tailwind/Framer bağımlılığı eklenmemiş.
6. AI search retrieval açık, training botları ayrı politika ile kapalı.
