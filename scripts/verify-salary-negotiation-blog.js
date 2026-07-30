import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const articlePath = join(process.cwd(), 'dist', 'blog', 'maas-zam-gorusmesi-nasil-yapilir', 'index.html');
const html = await readFile(articlePath, 'utf8');

assert(html.includes('<title>Maaş Görüşmesi Nasıl Yapılır? Bilimsel Zam Pazarlığı Rehberi | Maaşım.net</title>'), 'SEO title eksik veya hatalı.');
assert(html.includes('<link rel="canonical" href="https://maasim.net/blog/maas-zam-gorusmesi-nasil-yapilir/">'), 'Canonical eksik.');
assert(html.includes('max-snippet:-1'), 'GEO snippet robots yönergesi eksik.');
assert(html.includes('"@type":"Article"'), 'Article schema eksik.');
assert(html.includes('"@type":"BreadcrumbList"'), 'Breadcrumb schema eksik.');
assert(html.includes('"@type":"FAQPage"'), 'FAQ schema eksik.');
assert((html.match(/<details>/g) || []).length === 8, 'Görünür SSS sayısı sekiz olmalı.');
assert(html.includes('/maas-teklifi-karsilastirma/'), 'Maaş teklifi karşılaştırma CTA bağlantısı eksik.');
assert(html.includes('/#hesaplayici'), 'Maaş hesaplayıcı CTA bağlantısı eksik.');
assert(html.includes('NBER Working Paper'), 'NBER çalışma belgesi ayrımı görünür değil.');
assert(html.includes('X–Y bandında'), 'Soyut ücret bandı örneği eksik.');
assert(!/\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\s*(?:TL|₺)\b/i.test(html), 'Makalede sayısal ücret tutarı bulunuyor; X, Y, Z kullanılmalı.');
assert(!/180[.\s]?000|195[.\s]?000/.test(html), 'Eski örnek ücret rakamları makalede kalmış.');
assert(html.includes('31 Temmuz 2026'), 'Görünür yayın ve kaynak kontrol tarihi eksik.');
assert(html.includes('/assets/maas-zam-gorusmesi.svg'), 'Makale hero görseli eksik.');

const requiredSources = [
  'nber.org/papers/w33903',
  'onlinelibrary.wiley.com/doi/10.1111/j.1559-1816.2011.00779.x',
  'annualreviews.org/content/journals/10.1146/annurev-orgpsych-032414-111457',
  'sciencedirect.com/science/article/abs/pii/S0749597806000884'
];
for (const source of requiredSources) assert(html.includes(source), `Temel akademik kaynak eksik: ${source}`);

console.log('Maaş ve zam görüşmesi blog yazısı SEO, GEO, schema, kaynak ve soyut ücret örneği kontrollerini geçti.');
