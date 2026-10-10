// Emekli promosyonu verisi. Bankaların kampanya sayfaları otomatik doğrulanamadığı için haber kaynaklarından derlenir.
// Kural: her tutar en az iki güncel kaynakta aynı olmalı; kaynaklar çelişirse en yeni tarihli iki kaynağın ortak değeri
// yazılır ve çelişki `note` alanında belirtilir. Güncel bilgi bulunamayan banka listelenmez.
// İki haftada bir (ayın 1'i ve 15'i) güncellenir; PROMO_CHECKED_AT değişir.

export const PROMO_CHECKED_AT = '2026-10-10';
export const COMMIT_MONTHS = 36;

export const PROMO_SOURCES = Object.freeze({
  sabah: Object.freeze({ label: 'Sabah', date: '2026-10-10', url: 'https://haber.sabah.com.tr/galeri/emekli-promosyonlarinda-ekim-yarisi-odemeler-35-bin-tlye-ulasiyor' }),
  cnn: Object.freeze({ label: 'CNN Türk', date: '2026-10-10', url: 'https://finans.cnnturk.com/finans-haberler/galeri/emekli-promosyonu-2026-emekliye-35-bin-tlye-varan-promosyon-iste-banka-banka-liste-3477319' }),
  yenisafak: Object.freeze({ label: 'Yeni Şafak', date: '2026-10-07', url: 'https://www.yenisafak.com/galeri/ozgun/ekim-2026-emekli-promosyonu-ne-kadar-en-yuksek-promosyonu-hangi-banka-veriyor-guncel-liste-4862390' }),
  gzt: Object.freeze({ label: 'GZT', date: '2026-10-04', url: 'https://www.gzt.com/ekonomi/emekli-promosyonlari-ekim-2026-hangi-banka-ne-kadar-oduyor-halkbank-is-bankasi-yapi-kredi-akbank-garanti-ing-4266629' })
});

// Dilim üst sınırları (TL, dahil değil) ve koşulsuz nakit tutarlar. bands yalnız sınırları kaynakta açıkça verilen bankalarda dolu.
const STANDARD_LIMITS = Object.freeze([10_000, 15_000, 20_000, Infinity]);
const band = (amounts) => Object.freeze(amounts.map((amount, i) => Object.freeze({ below: STANDARD_LIMITS[i], amount })));

export const PROMOS = Object.freeze([
  { key: 'ziraat', bank: 'Ziraat Bankası', site: 'https://www.ziraatbank.com.tr', min: 5_000, max: 12_000, bands: band([5_000, 8_000, 10_000, 12_000]), totalMax: null, extras: '90.000 TL’ye varan “toplam avantaj” duyuruluyor ama bunun çoğu nakit değil: faizsiz kredi, Bankkart Lira ve taksitli nakit avans.', sources: ['sabah', 'cnn', 'yenisafak'] },
  { key: 'halkbank', bank: 'Halkbank', site: 'https://www.halkbank.com.tr', min: 8_000, max: 12_000, bands: Object.freeze([{ below: 15_000, amount: 8_000 }, { below: 20_000, amount: 10_000 }, { below: Infinity, amount: 12_000 }]), minBandFrom: 10_000, totalMax: null, extras: '10.000 TL altı aylık için tutar kaynaklarda verilmedi.', sources: ['yenisafak', 'gzt'] },
  { key: 'qnb', bank: 'QNB', site: 'https://www.qnb.com.tr', min: 8_500, max: 20_000, bands: band([8_500, 13_500, 16_500, 20_000]), totalMax: null, extras: 'Eczane ve market harcamalarında yıllık 3.000 TL’ye kadar iade.', sources: ['sabah', 'cnn', 'yenisafak'] },
  { key: 'albaraka', bank: 'Albaraka Türk', site: 'https://www.albaraka.com.tr', min: 8_300, max: 20_000, bands: null, totalMax: 30_000, extras: 'Ek ödül koşulları kaynaklarda ayrıntılı verilmedi.', sources: ['sabah', 'cnn'] },
  { key: 'akbank', bank: 'Akbank', site: 'https://www.akbank.com', min: 6_250, max: 15_000, bands: null, totalMax: 30_000, extras: 'Akbank Mobil üzerinden ilk kez müşteri olup maaş taşıyana 15.000 TL’ye kadar ek. Son başvuru 16 Ekim 2026.', note: 'Yeni Şafak (7 Ekim) ek ödülü chip-para olarak ayrıntılandırıyor.', until: '2026-10-16', sources: ['sabah', 'cnn'] },
  { key: 'garanti', bank: 'Garanti BBVA', site: 'https://www.garantibbva.com.tr', min: 6_250, max: 15_000, bands: null, totalMax: 25_000, extras: 'Kart harcaması, Avans Hesap ve sigorta koşullarıyla ek bonus. Kampanya 1–31 Ekim 2026.', until: '2026-10-31', sources: ['sabah', 'cnn', 'yenisafak'] },
  { key: 'isbank', bank: 'İş Bankası', site: 'https://www.isbank.com.tr', min: 6_250, max: 15_000, bands: null, totalMax: 25_000, extras: 'Otomatik fatura talimatı, kart harcaması ve yeni kasko/konut sigortasıyla ek ödül.', note: 'Daha eski haberlerde (4–7 Ekim) toplam 35.000 TL’ye kadar yazıyor; en yeni iki kaynak 25.000 TL diyor.', sources: ['sabah', 'cnn'] },
  { key: 'yapikredi', bank: 'Yapı Kredi', site: 'https://www.yapikredi.com.tr', min: 6_250, max: 15_000, bands: band([6_250, 10_000, 12_500, 15_000]), totalMax: 30_000, extras: 'Fatura talimatı, kart harcaması ve dijital kanaldan müşteri olma koşullarıyla ek ödül.', sources: ['sabah', 'cnn', 'yenisafak'] },
  { key: 'ing', bank: 'ING', site: 'https://www.ing.com.tr', min: 6_250, max: 15_000, bands: null, totalMax: 32_000, extras: 'Fatura talimatı, Turuncu Hesap bakiyesi, kredi kullanımı ve mobil müşteri olma koşullarıyla ek ödül.', sources: ['sabah', 'cnn', 'yenisafak'] },
  { key: 'denizbank', bank: 'DenizBank', site: 'https://www.denizbank.com', min: 5_000, max: 12_000, bands: null, totalMax: 30_000, extras: 'Kredili mevduat, fatura talimatı ve kredi kartı kullanımıyla 18.000 TL’ye kadar ek. Erken ayrılmada geri alım olabilir.', sources: ['sabah', 'cnn', 'yenisafak'] },
  { key: 'turkiyefinans', bank: 'Türkiye Finans', site: 'https://www.turkiyefinans.com.tr', min: 13_000, max: 27_000, bands: null, totalMax: 32_000, extras: 'Maaşa göre 13.000 / 18.500 / 22.000 / 27.000 TL; bir kısmı fatura talimatı, yedek hesap ve kart harcaması koşuluna bağlı. Emekli yakını getirene kişi başı 500 TL.', note: 'Kaynaklar bu tutarların ne kadarının koşulsuz olduğunu net ayırmıyor.', uncertain: true, sources: ['sabah', 'cnn'] },
  { key: 'sekerbank', bank: 'Şekerbank', site: 'https://www.sekerbank.com.tr', min: 5_000, max: 12_000, bands: null, totalMax: 35_000, extras: 'Fatura talimatı, kart harcaması, kredili mevduat, sigorta ve vadesiz hesap ödülleriyle ek ödeme.', sources: ['sabah', 'cnn'] },
  { key: 'kuveytturk', bank: 'Kuveyt Türk', site: 'https://www.kuveytturk.com.tr', min: 5_000, max: 12_000, bands: null, totalMax: 14_000, extras: 'Fatura talimatı ve kart harcamasıyla ek ödül.', sources: ['sabah', 'cnn', 'gzt'] },
  { key: 'vakifkatilim', bank: 'Vakıf Katılım', site: 'https://www.vakifkatilim.com.tr', min: 8_750, max: 25_000, bands: null, totalMax: null, extras: 'Kaynaklar 25.000 TL’yi üst sınır olarak veriyor; koşulsuz kısmı ayrıca belirtilmedi.', note: 'Üst tutarın koşulsuz olup olmadığı belirsiz.', uncertain: true, sources: ['sabah', 'cnn'] }
].map((p) => Object.freeze(p)));
