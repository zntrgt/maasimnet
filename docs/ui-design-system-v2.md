# Maaşım.net Enterprise Fintech UI System v2

Bu doküman Maaşım.net’in ana hesaplama deneyimi, ortak navigasyonu ve finansal sonuç bileşenleri için tek tasarım sistemidir. Hedef; yüksek veri yoğunluğunu korurken ürünün ilk bakışta güven veren, ölçülü ve kurumsal bir fintech/SaaS ürünü gibi davranmasıdır.

## Tasarım ilkeleri

1. **Fintech precision** — rakam, formül, kapsam ve veri tarihi görsel olarak belirsiz bırakılmaz.
2. **Enterprise minimalism** — dekorasyon değil işlev hiyerarşisi öne çıkar. Çizgi ve gölge sayısı azaltılır.
3. **Progressive disclosure** — temel hesap için gerekli olmayan seçenekler varsayılan olarak kapalıdır.
4. **Numbers first** — net maaş, toplam maliyet, vergi dilimi ve diğer kritik finansal değerler etiketlerinden daha güçlü görünür.
5. **Trust by evidence** — güncellik, resmi kaynak, tarayıcıda hesaplama ve metodoloji görünür güven sinyalleridir.
6. **Mobile continuity** — form ile sonuç arasındaki mesafe mobilde sticky özet ile kapatılır.

## Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Maaşım.net     Araçlar  İşveren Maliyeti  Kıdem & İhbar  2026 Verileri  SSS │
│                                                               [Maaş Hesapla]│
├──────────────────────────────────────────────────────────────────────────────┤
│  2026 · GÜNCEL MEVZUAT · KURUŞ BAZLI HESAP                                 │
│  2026 Brütten Nete Maaş Hesaplama                                           │
│  Net maaşı, vergi dilimini ve işveren maliyetini tek ekranda görün.          │
│                                                                              │
│  ✓ 2026 SGK & GİB   ✓ Kuruş bazlı motor   ✓ Hesaplama tarayıcıda            │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ TEMEL BİLGİLER                │ AYLIK ORTALAMA NET                           │
│ [Brütten Nete][Netten Brüte]  │  74.860,32 ₺                                 │
│ Brüt Maaş                     │  yıl ortalaması / ilk ay bağlamı             │
│ [ 100.000,00 ₺          × ]   │                                              │
│                               │  Vergi dilimi geçişi                         │
│ İSTİSNALAR & MUAFİYETLER      │  Oca ▂  Şub ▂  Mar ▂ ... Ara ▆               │
│ Emekli / SGDP        [toggle] │  %15      %20         %27                    │
│ Engellilik indirimi [select]  │                                              │
│                               │ [Kopyala] [PDF/Yazdır] [E-posta]             │
│ ▸ İleri Seviye Ayarlar        ├──────────────────────────────────────────────┤
│                               │ Detaylı maaş özeti                           │
│ [Ayrıntılı Sonuçları Gör]     │ 4 kolonlu ikincil finansal kartlar           │
└───────────────────────────────┴──────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ 12 AYLIK BORDRO                                                              │
│ Ay | Brüt | Net | Kesinti | Maliyet | Vergi Dilimi | Detay                  │
│ Net kolonunda mikro bar / vergi değişim bağlamı                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Mobile wireframe

```text
┌──────────────────────────┐
│ Maaşım.net           ☰   │
├──────────────────────────┤
│ 2026 · GÜNCEL MEVZUAT    │
│ Brütten Nete Maaş        │
│ Hesaplama                │
│ kısa değer önerisi       │
│ ✓ SGK ✓ GİB ✓ Tarayıcıda│
├──────────────────────────┤
│ TEMEL BİLGİLER           │
│ [Brüt][Net]              │
│ [ 100.000,00 ₺      × ]  │
│                          │
│ İSTİSNALAR & MUAFİYETLER │
│ ...                      │
│ ▸ İleri Seviye           │
├──────────────────────────┤
│ AYLIK ORT. NET           │
│ 74.860,32 ₺              │
│ vergi geçiş mikro grafiği│
│ [Kopyala][PDF][E-posta]  │
├──────────────────────────┤
│ Bordro kartları / detay  │
└──────────────────────────┘
│ Ort. Net 74.860 ₺ [Sonuç]│  ← sticky bottom summary
└──────────────────────────┘
```

## Renk sistemi

| Token | Değer | Kullanım |
|---|---:|---|
| `--ink-950` | `#07111f` | ana koyu panel / yüksek kontrast |
| `--ink-900` | `#0b1728` | başlık / ana metin |
| `--ink-700` | `#334155` | ikincil metin |
| `--ink-500` | `#64748b` | açıklama / etiket |
| `--surface-0` | `#ffffff` | ana yüzey |
| `--surface-50` | `#f7f9fc` | sayfa zemini |
| `--surface-100` | `#eef2f6` | ikincil yüzey |
| `--line` | `#dfe5ec` | sınırlar |
| `--emerald-500` | `#12b76a` | ana CTA / pozitif finansal vurgu |
| `--emerald-600` | `#079455` | hover / koyu vurgu |
| `--emerald-100` | `#dff8eb` | soft accent |
| `--danger-600` | `#d92d20` | kesinti / hata |

Renk tek başına anlam taşımamalıdır. Vergi dilimi, hata ve durumlar metin/etiket ile birlikte gösterilir.

## Tipografi

- Font stack: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Sayısal alanlar: `font-variant-numeric: tabular-nums lining-nums`
- Hero H1: `clamp(2.6rem, 5.5vw, 5.25rem)`, 0.96–1.02 line-height
- Result hero: `clamp(3rem, 6vw, 5.75rem)`
- H2: `clamp(1.65rem, 2.8vw, 2.4rem)`
- Body: 15–18 px
- Meta / label: 11–13 px, sadece kısa label’larda uppercase kullanılabilir.

## Spacing ve radius

- Ana spacing ölçeği: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
- Form control yüksekliği: minimum 48 px
- Primary CTA: minimum 52 px
- Kart radius: 18–24 px
- Büyük koyu sonuç paneli: 28–32 px
- Mobil yatay padding: 16 px minimum

## Form bileşenleri

### Input
- Default: beyaz veya koyu panel içinde yüksek kontrast yüzey.
- Hover: border koyulaşır.
- Focus: 3 px emerald focus ring; browser focus tamamen kaldırılmaz.
- Disabled: opacity düşer, cursor değişir, kontrast korunur.
- Money input: tabular number, büyük font, sağda temizleme aksiyonu.

### Toggle
- Etiket solda, kontrol sağda.
- `aria-checked` / native checkbox durumu korunur.
- Renk dışında konum değişimiyle de state belli olur.

### Accordion
- Advanced alanlar varsayılan kapalı.
- Summary kısa ve eylem odaklı: `İleri Seviye Ayarlar`.
- İçeriğin net maaşı mı yalnız işveren maliyetini mi etkilediği açıklanır.

## Button states

### Primary
- Default: emerald 500 / koyu metin veya beyaz metin kontrast testine göre.
- Hover: emerald 600 + hafif translateY(-1px).
- Active: translate sıfırlanır.
- Focus-visible: 3 px focus ring.
- Disabled: `opacity: .45`, shadow kaldırılır, pointer engellenir.

### Secondary
- Beyaz veya transparan yüzey + 1 px line.
- Hover’da koyu metin ve daha belirgin border.

### Ghost
- Sonuç panelindeki `Kopyala / PDF / E-posta` gibi düşük hiyerarşili aksiyonlar.

## Sonuç bileşenleri

### Metric Hero
- Koyu yüzey.
- Küçük label + çok büyük finansal rakam + tek cümle bağlam.
- Alt bölümde vergi dilimi geçişi / mikro chart.
- Aksiyonlar aynı panelde fakat rakamdan düşük görsel ağırlıkta.

### Tax transition chart
- 12 ay = 12 kolon.
- Bar yüksekliği aylık net tutarı göreli gösterir.
- Alt veya tooltip metni o ay uygulanan vergi oranını gösterir.
- Ekran okuyucu için chart yanında metinsel özet tutulur.

### Metric cards
- Aynı yükseklik ve padding.
- Label / value / note üçlü hiyerarşi.
- Value taşarsa wrap; kart genişliğini bozmaz.

### Payroll table
- Desktop: geniş satır aralığı, sticky başlık, net kolon güçlü vurgu.
- Mobil: satırları kartlaştırılmış görünüm; yatay tablo zorunlu değil.
- Aylık net değişimi mikro bar ile desteklenebilir.

## Güven bileşenleri

Ana hesaplayıcı yakınında üç kısa sinyal:

- `2026 mevzuat verileri kontrol edildi`
- `Kuruş bazlı deterministik hesap motoru`
- `Hesaplama tarayıcıda yapılır`

Kaynak ve metodoloji bağlantıları sonuçtan kopuk bir footer detayı değil, kullanıcı kararının yakınında görünür olmalıdır.

## Mikro etkileşimler

- Kopyalama: `Kopyalandı` toast, 2.2 saniye.
- Input değişimi: sonuç value transition; layout shift yaratmaz.
- Accordion: native details semantiği korunur.
- Mobile sticky bar: sonuç değiştikçe değer güncellenir; `Sonuç` butonu result hero’ya scroll eder.
- `prefers-reduced-motion` aktifse animasyonlar kapatılır.

## Export / paylaşım

- CSV mevcut detay export’u olarak korunur.
- `Kopyala`: finansal özet metnini clipboard’a alır.
- `PDF / Yazdır`: browser print akışını sonuç odaklı print stylesheet ile açar; kullanıcı PDF olarak kaydedebilir.
- `E-posta`: tutarları kullanıcının istemcisine `mailto:` taslağı olarak aktarır; otomatik sunucu gönderimi yapılmaz.

## Sitewide component policy

Ana sayfa bu sistemin referansıdır. Kıdem, ihbar, işsizlik, fazla mesai, yıllık izin ve asgari ücret hesaplayıcıları ortak token’ları, 48 px kontrol yüksekliğini, focus state’leri, kart radius’unu, koyu sonuç yüzeyi yaklaşımını ve ortak header/footer’ı kullanır. Hesap motorlarının HTML yapısı farklı olabilir; design token ve etkileşim standardı farklılaşamaz.

## Erişilebilirlik

- Minimum hedef alan: 44×44 px.
- Focus-visible her interaktif öğede görünür.
- Kontrast WCAG AA hedefler.
- `aria-live` finansal sonuç alanlarında korunur.
- Tooltip’ler yalnız hover’a bağlı olmaz; klavye ile açılabilir.
- Sticky mobil bar içerik üstünü kapatmaması için body bottom padding ekler.
