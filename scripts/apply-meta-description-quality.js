import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const MIN_LENGTH = 105;
const TARGET_MAX = 158;

const normalize = (value = '') => String(value)
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

const escapeAttribute = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

async function htmlFiles(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(full);
  }
  return output;
}

function routeFromFile(distDir, file, html) {
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1];
  if (canonical) {
    try { return new URL(canonical).pathname; } catch { /* fall through */ }
  }
  const rel = relative(distDir, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel.replace(/\.html$/, '/')}`;
}

function existingDescription(html) {
  const tag = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)
    || html.match(/<meta\b[^>]*content=["'][^"']*["'][^>]*name=["']description["'][^>]*>/i);
  return normalize(tag?.[0].match(/content=["']([^"']*)["']/i)?.[1] || '');
}

function h1Text(html) {
  const raw = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
  return normalize(raw.replace(/<[^>]+>/g, ' '));
}

function robotsNoindex(html) {
  const tag = html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0] || '';
  const content = tag.match(/content=["']([^"']*)["']/i)?.[1] || '';
  return /\bnoindex\b/i.test(content);
}

function trimAtWord(value, max = TARGET_MAX) {
  const text = normalize(value);
  if (text.length <= max) return text;
  const sliced = text.slice(0, max + 1);
  const boundary = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, boundary > 110 ? boundary : max).replace(/[,:;\-\s]+$/, '')}.`;
}

function routeSpecificDescription(route, h1, current) {
  const fixed = new Map([
    ['/', '2026 brütten nete ve netten brüte maaşınızı; vergi dilimleri, SGK, asgari ücret istisnası ve yıllık bordro etkileriyle Maaşım.net’te hesaplayın.'],
    ['/2027-maas-hesaplama/', '2027 maaşınızı resmi olmayan tahmin senaryolarıyla brütten nete ve netten brüte hesaplayın; vergi, SGK ve asgari ücret varsayımlarını kendiniz değiştirin.'],
    ['/maas-teklifi-karsilastirma/', 'Mevcut maaşınızla yeni iş teklifini yıllık net gelir, prim, yan haklar, işveren maliyeti ve vergi dilimi etkileriyle Maaşım.net’te karşılaştırın.'],
    ['/blog/', 'Maaş, vergi, SGK, yan haklar, iş teklifleri ve çalışma hayatı hakkında güncel, kaynaklı rehberleri ve Maaşım.net hesaplamalarını keşfedin.'],
    ['/sss/', 'Brüt-net maaş, gelir vergisi dilimleri, SGK, işveren maliyeti ve bordro hesaplamalarıyla ilgili sık sorulan soruların güncel yanıtlarını inceleyin.'],
    ['/sozluk/', 'Maaş, bordro, gelir vergisi, SGK ve çalışan yan haklarıyla ilgili temel kavramların güncel ve anlaşılır açıklamalarını Maaşım.net sözlüğünde inceleyin.'],
    ['/metodoloji/', 'Maaşım.net hesap motorunun kullandığı 2026 verilerini, vergi ve SGK varsayımlarını, formülleri, yuvarlama yöntemini ve doğrulama yaklaşımını inceleyin.']
  ]);
  if (fixed.has(route)) return trimAtWord(fixed.get(route));

  if (/^\/blog\//.test(route)) {
    const suffix = ' Güncel kaynaklar, örnekler ve Maaşım.net hesaplama araçlarıyla konunun maaş ve çalışma hayatına etkisini inceleyin.';
    return trimAtWord(`${current.replace(/[.!?]+$/, '')}.${suffix}`);
  }
  if (/2026.*veri|\/veriler\/?$/.test(route)) {
    return trimAtWord(`${h1 || '2026 maaş verileri'} için kullanılan güncel ücret, vergi ve SGK parametrelerini; kaynak ve son kontrol tarihleriyle Maaşım.net’te inceleyin.`);
  }
  if (/senaryo/.test(route)) {
    return trimAtWord(`${h1 || 'Maaş senaryosu'} için 2026 vergi ve SGK parametreleriyle aylık ve yıllık net maaş etkilerini karşılaştırın; bordro değişimini ayrıntılı inceleyin.`);
  }
  if (/iletisim/.test(route)) {
    return trimAtWord('Maaşım.net ile iletişime geçin; maaş hesaplama, bordro verileri, içerik düzeltmeleri ve site geri bildirimleriyle ilgili mesajınızı güvenli biçimde iletin.');
  }
  if (/gizlilik|privacy/.test(route)) {
    return trimAtWord('Maaşım.net gizlilik yaklaşımını, kişisel verilerin hangi amaçlarla işlendiğini, saklama ve güvenlik ilkelerini ve kullanıcı haklarını bu sayfada inceleyin.');
  }
  if (/cerez|cookie/.test(route)) {
    return trimAtWord('Maaşım.net çerez politikasını, zorunlu ve isteğe bağlı çerez kategorilerini, ölçüm amaçlarını ve çerez tercihlerinizi nasıl değiştireceğinizi inceleyin.');
  }

  const lead = current || `${h1 || 'Bu sayfa'} hakkında güncel bilgi`;
  return trimAtWord(`${lead.replace(/[.!?]+$/, '')}. Maaş, vergi, SGK ve bordro ayrıntılarını güncel kaynaklar ve Maaşım.net hesaplama yaklaşımıyla birlikte değerlendirin.`);
}

function setDescription(html, description) {
  const encoded = escapeAttribute(description);
  const pattern = /<meta\b[^>]*name=["']description["'][^>]*>/i;
  if (pattern.test(html)) {
    return html.replace(pattern, (tag) => {
      if (/content=["'][^"']*["']/i.test(tag)) {
        return tag.replace(/content=["'][^"']*["']/i, `content="${encoded}"`);
      }
      return tag.replace(/\s*\/?>(\s*)$/, ` content="${encoded}">$1`);
    });
  }
  return html.replace(/<head\b[^>]*>/i, (head) => `${head}\n  <meta name="description" content="${encoded}">`);
}

export async function applyMetaDescriptionQuality(distDir) {
  const files = await htmlFiles(distDir);
  const entries = [];
  let changed = 0;

  for (const file of files) {
    let html = await readFile(file, 'utf8');
    if (robotsNoindex(html)) continue;
    const route = routeFromFile(distDir, file, html);
    const h1 = h1Text(html);
    const current = existingDescription(html);
    let description = current;

    if (description.length < MIN_LENGTH || description.length > TARGET_MAX) {
      description = routeSpecificDescription(route, h1, description);
    }
    description = trimAtWord(description);

    if (description !== current) {
      html = setDescription(html, description);
      await writeFile(file, html, 'utf8');
      changed += 1;
    }
    entries.push({ file, route, h1, description });
  }

  const groups = new Map();
  for (const entry of entries) {
    const key = normalize(entry.description).toLocaleLowerCase('tr-TR');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  for (const duplicates of groups.values()) {
    if (duplicates.length < 2) continue;
    for (const entry of duplicates.slice(1)) {
      const html = await readFile(entry.file, 'utf8');
      const unique = trimAtWord(`${entry.h1 || entry.route}: ${entry.description}`);
      await writeFile(entry.file, setDescription(html, unique), 'utf8');
      entry.description = unique;
      changed += 1;
    }
  }

  console.log(`Meta description kalite geçişi tamamlandı: ${entries.length} indexlenebilir HTML tarandı, ${changed} açıklama güncellendi.`);
  return { scanned: entries.length, changed };
}
