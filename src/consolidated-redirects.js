// Aynı arama niyetini hedefleyen ince veri sayfaları, konunun en kapsamlı sayfasına
// birleştirildi. Search Console (Ekim 2026): bu URL'lerin hiçbiri taranmamıştı; aynı
// konuda 2–3 sayfa olması Google'ın hangisini göstereceğini belirsizleştiriyordu.
// Anahtar: eski yol, değer: kanonik yol. Worker 301 döndürür.
import { RETIRED_GUIDE_REDIRECTS } from './retired-guide-redirects.js';

export const CONSOLIDATED_REDIRECTS = Object.freeze({
  '/veriler/2026-asgari-ucret/': '/asgari-ucret-hesaplama/',
  '/veriler/2026-gelir-vergisi-dilimleri/': '/blog/2026-maas-vergi-dilimleri/',
  '/veriler/2026-sgk-tavani/': '/blog/2026-sgk-tavani/',
  '/sgk/sgk-tavani/': '/blog/2026-sgk-tavani/',
  '/veriler/2026-kidem-tazminati-tavani/': '/kidem-tazminati-hesaplama/',
  '/veriler/2026-yemek-yardimi-istisnasi/': '/blog/2026-yemek-karti-istisnasi/'
});

export function consolidatedRedirectFor(pathname) {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return CONSOLIDATED_REDIRECTS[normalized] || RETIRED_GUIDE_REDIRECTS[normalized] || null;
}
