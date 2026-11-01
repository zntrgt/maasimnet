// Emekli promosyonu verisi. Bankaların kampanya sayfaları otomatik doğrulanamadığı için haber kaynaklarından derlenir.
// Kural: her tutar en az iki güncel kaynakta aynı olmalı; kaynaklar çelişirse en yeni tarihli iki kaynağın ortak değeri
// yazılır ve çelişki `note` alanında belirtilir. Güncel bilgi bulunamayan banka listelenmez.
// İki haftada bir (ayın 1'i ve 15'i) güncellenir; PROMO_CHECKED_AT değişir.

export const PROMO_CHECKED_AT = '2026-11-01';
export const COMMIT_MONTHS = 36;

export const PROMO_SOURCES = Object.freeze({
  haberg: Object.freeze({ label: 'Haber Gazetesi', date: '2026-10-30', url: 'https://www.habergazetesi.com.tr/emekli-promosyonlari-30-ekim-hangi-banka-ne-kadar-veriyor-35-bin-tlye-varan-odemelerde-son-durum' }),
  cnn: Object.freeze({ label: 'CNN Türk', date: '2026-10-29', url: 'https://www.cnnturk.com/ekonomi/galeri/emekli-promosyon-tutari-ekim-2026-emeklilere-ne-kadar-promosyon-veriliyor-ing-yapi-kredi-akbank-ziraat-bankasi-3484411' }),
  yeniasir: Object.freeze({ label: 'Yeni Asır', date: '2026-10-29', url: 'https://www.yeniasir.com.tr/ekonomi/2026/10/29/emekli-promosyonu-2026-bankalarda-limit-degisti-en-yuksek-emekli-promosyonu-o-bankada-ziraat-halkbankasi-garanti-bankasi' }),
  yenisafak: Object.freeze({ label: 'Yeni Şafak', date: '2026-10-27', url: 'https://www.yenisafak.com/galeri/ozgun/emekli-promosyonunda-90-bin-tl-detayi-en-yuksek-emekli-promosyonunu-hangi-banka-veriyor-nakit-odeme-tutarlari-ve-ek-oduller-4867204' }),
  sabah: Object.freeze({ label: 'Sabah', date: '2026-10-26', url: 'https://www.sabah.com.tr/yasam/emekli-banka-promosyon-kampanyalari-2026-emekli-promosyonu-ne-kadar-oldu-hangi-banka-ne-kadar-veriyor-7687929' }),
  endeks24: Object.freeze({ label: 'Endeks24', date: '2026-10-25', url: 'https://www.endeks24.com/emekli-promosyonunda-banka-farki-20-bin-tl' })
});

// Dilim üst sınırları (TL, dahil değil) ve koşulsuz nakit tutarlar. bands yalnız sınırları kaynakta açıkça verilen bankalarda dolu.
const STANDARD_LIMITS = Object.freeze([10_000, 15_000, 20_000, Infinity]);
const band = (amounts) => Object.freeze(amounts.map((amount, i) => Object.freeze({ below: STANDARD_LIMITS[i], amount })));

export const PROMOS = Object.freeze([
  { key: 'ziraat', bank: 'Ziraat Bankası', site: 'https://www.ziraatbank.com.tr', min: 5_000, max: 12_000, bands: band([5_000, 8_000, 10_000, 12_000]), totalMax: null, extras: '90.000 TL’ye varan “toplam avantaj” duyuruluyor ama bunun çoğu nakit değil: faizsiz kredi, Bankkart Lira ve taksitli nakit avans.', sources: ['haberg', 'endeks24', 'sabah', 'yeniasir'] },
  { key: 'halkbank', bank: 'Halkbank', site: 'https://www.halkbank.com.tr', min: 5_000, max: 12_000, bands: band([5_000, 8_000, 10_000, 12_000]), totalMax: null, extras: '10.000 TL altındaki 5.000 TL, kaynakta ölüm aylığı alan hak sahipleri için verilmiş.', sources: ['haberg', 'endeks24'] },
  { key: 'qnb', bank: 'QNB', site: 'https://www.qnb.com.tr', min: 8_500, max: 20_000, bands: band([8_500, 13_500, 16_500, 20_000]), totalMax: null, extras: 'Eczane ve market harcamalarında yıllık 3.000 TL’ye kadar iade.', sources: ['sabah', 'yenisafak', 'haberg', 'endeks24'] },
  { key: 'albaraka', bank: 'Albaraka Türk', site: 'https://www.albaraka.com.tr', min: 8_300, max: 20_000, bands: null, totalMax: 30_000, extras: 'Ek ödül koşulları kaynaklarda ayrıntılı verilmedi.', sources: ['sabah', 'yenisafak', 'yeniasir'] },
  { key: 'akbank', bank: 'Akbank', site: 'https://www.akbank.com', min: 6_250, max: 15_000, bands: null, totalMax: null, extras: 'Akbank Mobil’den ilk kez müşteri olup maaş taşıyanlara verilen 15.000 TL’ye kadar ek ödül 16 Ekim 2026’da sona erdi; yerine gelen güncel ek ödül iki kaynakta doğrulanamadı.', note: 'Sabah (26 Ekim) ve Yeni Şafak (27 Ekim) 30.000 TL toplamı hâlâ yazıyor; Haber Gazetesi (30 Ekim) bu teklifin 16 Ekim’de bittiğini belirtiyor.', sources: ['sabah', 'yenisafak', 'haberg'] },
  { key: 'garanti', bank: 'Garanti BBVA', site: 'https://www.garantibbva.com.tr', min: 6_250, max: 15_000, bands: null, totalMax: 25_000, extras: 'Kart harcaması, Avans Hesap ve sigorta koşullarıyla ek bonus. Haberlerdeki Ekim kampanyası 31 Ekim’de sona erdi; kaynaklarda Kasım için ayrı bir son tarih verilmedi.', sources: ['sabah', 'cnn', 'haberg', 'endeks24'] },
  { key: 'isbank', bank: 'İş Bankası', site: 'https://www.isbank.com.tr', min: 6_250, max: 15_000, bands: null, totalMax: 25_000, extras: 'Otomatik fatura talimatı, kart harcaması ve yeni kasko/konut sigortasıyla ek ödül.', sources: ['sabah', 'yeniasir', 'haberg', 'endeks24'] },
  { key: 'yapikredi', bank: 'Yapı Kredi', site: 'https://www.yapikredi.com.tr', min: 6_250, max: 15_000, bands: band([6_250, 10_000, 12_500, 15_000]), totalMax: 30_000, extras: 'Fatura talimatı, kart harcaması ve dijital kanaldan müşteri olma koşullarıyla ek ödül.', sources: ['sabah', 'yenisafak', 'haberg', 'endeks24'] },
  { key: 'ing', bank: 'ING', site: 'https://www.ing.com.tr', min: 6_250, max: 15_000, bands: null, totalMax: 32_000, extras: 'Fatura talimatı, Turuncu Hesap bakiyesi, kredi kullanımı ve mobil müşteri olma koşullarıyla ek ödül.', sources: ['sabah', 'yenisafak', 'haberg', 'endeks24'] },
  { key: 'denizbank', bank: 'DenizBank', site: 'https://www.denizbank.com', min: 5_000, max: 12_000, bands: null, totalMax: 30_000, extras: 'Kredili mevduat, fatura talimatı ve kredi kartı kullanımıyla 18.000 TL’ye kadar ek. Erken ayrılmada geri alım olabilir. Kampanya 31 Aralık 2026’ya kadar.', until: '2026-12-31', sources: ['sabah', 'cnn', 'haberg', 'endeks24'] },
  { key: 'turkiyefinans', bank: 'Türkiye Finans', site: 'https://www.turkiyefinans.com.tr', min: 13_000, max: 27_000, bands: null, totalMax: 32_000, extras: 'Maaşa göre 13.000 / 18.500 / 22.000 / 27.000 TL; bir kısmı fatura talimatı, yedek hesap ve kart harcaması koşuluna bağlı. Emekli yakını getirene kişi başı 500 TL.', note: 'Kaynaklar bu tutarların ne kadarının koşulsuz olduğunu net ayırmıyor.', uncertain: true, sources: ['sabah', 'yenisafak', 'yeniasir'] },
  { key: 'sekerbank', bank: 'Şekerbank', site: 'https://www.sekerbank.com.tr', min: 5_000, max: 12_000, bands: null, totalMax: 35_000, extras: 'Fatura talimatı, kart harcaması, kredili mevduat, sigorta ve vadesiz hesap ödülleriyle ek ödeme.', sources: ['sabah', 'yeniasir', 'haberg'] },
  { key: 'kuveytturk', bank: 'Kuveyt Türk', site: 'https://www.kuveytturk.com.tr', min: 5_000, max: 12_000, bands: null, totalMax: 14_000, extras: 'Fatura talimatı ve kart harcamasıyla ek ödül.', sources: ['sabah', 'yenisafak', 'yeniasir'] },
  { key: 'vakifkatilim', bank: 'Vakıf Katılım', site: 'https://www.vakifkatilim.com.tr', min: 8_750, max: 25_000, bands: null, totalMax: null, extras: 'Kaynaklar 25.000 TL’yi üst sınır olarak veriyor; koşulsuz kısmı ayrıca belirtilmedi.', note: 'Üst tutarın koşulsuz olup olmadığı belirsiz.', uncertain: true, sources: ['sabah', 'cnn', 'yeniasir'] }
].map((p) => Object.freeze(p)));
