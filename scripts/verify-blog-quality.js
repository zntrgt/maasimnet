import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogOutputPath } from '../content/blog-manifest.js';

const dist = join(process.cwd(), 'dist');
const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
const count = (html, pattern) => (html.match(pattern) || []).length;
const failures = [];

for (const post of indexableBlogPosts) {
  const file = join(dist, blogOutputPath(post));
  const html = await readFile(file, 'utf8');
  const text = strip(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  const checks = [
    [words >= 700, `kelime sayısı düşük (${words}/700)`],
    [/<section class="answer">/i.test(html), 'doğrudan cevap bölümü yok'],
    [count(html, /<h2\b/gi) >= 5, `H2 sayısı yetersiz (${count(html, /<h2\b/gi)}/5)`],
    [count(html, /<table\b/gi) >= 1, 'karar/karşılaştırma tablosu yok'],
    [count(html, /<details\b/gi) >= 5, `SSS sayısı yetersiz (${count(html, /<details\b/gi)}/5)`],
    [count(html, /<a\s+href="\/blog\//gi) >= 3, `bağlamsal iç link yetersiz (${count(html, /<a\s+href="\/blog\//gi)}/3)`],
    [count(html, /<li><a\s+href="https?:\/\//gi) >= 3, `dış kaynak yetersiz (${count(html, /<li><a\s+href="https?:\/\//gi)}/3)`],
    [html.includes('editorial-review'), 'editoryal güven bloğu yok'],
    [html.includes('application/ld+json'), 'JSON-LD yok'],
    [html.includes('"@type":"Article"'), 'Article schema yok'],
    [html.includes('"@type":"BreadcrumbList"'), 'BreadcrumbList schema yok'],
    [html.includes('"@type":"FAQPage"'), 'FAQPage schema yok'],
    [/<link rel="canonical"/i.test(html), 'canonical yok'],
    [/<meta name="description"/i.test(html), 'meta description yok']
  ];
  for (const [ok, message] of checks) if (!ok) failures.push(`${post.slug}: ${message}`);
}

if (failures.length) {
  console.error('Blog kalite kapısı başarısız:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log(`Blog kalite kapısı başarılı: ${indexableBlogPosts.length} içerik SEO/GEO standardını geçti.`);
