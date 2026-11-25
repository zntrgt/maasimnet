import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPageMetadata, formatSiteDateTr, STANDARD_FRESHNESS_PATHS, GEO_CONTENT_ROUTES } from '../content/site-metadata.js';
import { GEO_ANSWERS, salaryExamples } from './add-geo-answers.js';
import { runPayrollAudit } from '../src/payroll-audit.js';

async function walkHtml(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function pagePath(html, file, distDir) {
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (canonical) return new URL(canonical[1], 'https://maasim.net').pathname;

  const relativePath = relative(distDir, file).split(sep).join('/');
  if (relativePath === 'index.html') return '/';
  if (relativePath.endsWith('/index.html')) return `/${relativePath.slice(0, -'index.html'.length)}`;
  return `/${relativePath}`;
}

function hasType(node, names) {
  const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
  return types.some((type) => names.includes(type));
}

function validateStructuredDates(node, metadata, page, failures) {
  if (Array.isArray(node)) {
    node.forEach((item) => validateStructuredDates(item, metadata, page, failures));
    return;
  }
  if (!node || typeof node !== 'object') return;

  const contentTypes = ['WebPage', 'CollectionPage', 'Article', 'BlogPosting', 'TechArticle', 'Report', 'Dataset', 'WebApplication'];
  if (hasType(node, contentTypes) || Object.hasOwn(node, 'dateModified')) {
    const expected = hasType(node, ['Dataset']) && metadata.reviewedAt
      ? metadata.reviewedAt
      : metadata.modifiedAt;
    if (node.dateModified !== expected) failures.push(`${page}: JSON-LD dateModified ${node.dateModified} yerine ${expected} olmalı.`);
  }

  if (STANDARD_FRESHNESS_PATHS.includes(page) && hasType(node, ['WebPage','CollectionPage','Article','BlogPosting','TechArticle','Report']) && node.datePublished !== metadata.publishedAt) failures.push(`${page}: JSON-LD datePublished merkezi yayın tarihiyle uyuşmuyor.`);

  if (metadata.reviewedAt && (hasType(node, ['Article', 'BlogPosting', 'TechArticle', 'Report']) || Object.hasOwn(node, 'lastReviewed'))) {
    if (node.lastReviewed !== metadata.reviewedAt) failures.push(`${page}: JSON-LD lastReviewed ${node.lastReviewed} yerine ${metadata.reviewedAt} olmalı.`);
  }

  Object.values(node).forEach((value) => validateStructuredDates(value, metadata, page, failures));
}

export async function verifyContentDates(distDir) {
  const failures = [];
  const files = await walkHtml(distDir);

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const path = pagePath(html, file, distDir);
    const metadata = getPageMetadata(path);

    if (!html.includes(`data-page-modified="${metadata.modifiedAt}"`)) {
      failures.push(`${path}: data-page-modified eksik veya yanlış.`);
    }
    if (!html.includes(`<meta name="last-modified" content="${metadata.modifiedAt}">`)) {
      failures.push(`${path}: last-modified meta etiketi eksik veya yanlış.`);
    }
    if (!html.includes(`<meta property="article:modified_time" content="${metadata.modifiedAt}">`)) {
      failures.push(`${path}: article:modified_time eksik veya yanlış.`);
    }

    if (STANDARD_FRESHNESS_PATHS.includes(path)) {
      const block = html.match(/<(aside|div)\b[^>]*data-standard-freshness="v1"[^>]*>[\s\S]*?<\/\1>/i)?.[0] || '';
      if (!block) failures.push(`${path}: görünür güncellik alanı eksik.`);
      for (const value of [metadata.publishedAt, metadata.modifiedAt, metadata.reviewedAt].filter(Boolean)) {
        if (!html.includes(`<time datetime="${value}">${formatSiteDateTr(value)}</time>`)) failures.push(`${path}: görünür tarih ${value} eksik.`);
      }
    }
    for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        validateStructuredDates(JSON.parse(match[1].trim()), metadata, path, failures);
      } catch (error) {
        failures.push(`${path}: JSON-LD okunamadı: ${error.message}`);
      }
    }
  }

  const expectedRoutes = GEO_ANSWERS.map(a=>a.path).sort();
  if (JSON.stringify(expectedRoutes)!==JSON.stringify([...GEO_CONTENT_ROUTES].sort())) failures.push('GEO rota listesi ile içerik tarihleri uyumsuz.');
  for (const a of GEO_ANSWERS) {
    const html = await readFile(join(distDir,a.path.replace(/^\\/+|\\/+$/g,''),'index.html'),'utf8');
    const answers=[...html.matchAll(/<p\\b[^>]*data-geo-answer="v1"[^>]*>[\\s\\S]*?<\\/p>/gi)];
    if(answers.length!==1) failures.push(a.path+': tek görünür GEO cevabı bulunmalı.');
    const prefix=html.slice(html.search(/<main\\b/i),answers[0]?.index??0).replace(/<[^>]+>/g,' ').trim().split(/\\s+/).filter(Boolean);
    if(prefix.length>=100) failures.push(a.path+': cevap ilk 100 kelime içinde değil.');
    if(answers[0]&&!/\\d/.test(answers[0][0])) failures.push(a.path+': sayısal cevap eksik.');
    for(const [source] of a.sources) if(!answers[0]?.[0].includes(source.replace(/&/g,'&amp;'))) failures.push(a.path+': cevap kaynağı eksik: '+source);
  }
  const home=await readFile(join(distDir,'index.html'),'utf8');
  const exampleTable=home.match(/<section\\b[^>]*id="2026-brut-net-ornekleri"[^>]*>[\\s\\S]*?<\\/section>/i)?.[0]||'';
  const examples=salaryExamples();
  if(examples.length!==5||examples[3].januaryKurus!==7595303||examples[3].decemberKurus!==6715680||examples[3].averageKurus!==6949014||examples[3].annualKurus!==83388163) failures.push('A6 100.000 TL referans bordro vakası uyuşmuyor.');
  if(!exampleTable||[...exampleTable.matchAll(/<tr>/g)].length!==6) failures.push('A6 5 örnek satırlı statik tablo eksik.');
  for(const row of examples) for(const key of ['grossKurus','januaryKurus','decemberKurus','averageKurus']) {
    const value=(row[key]/100).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL';
    if(!exampleTable.includes(value)) failures.push('A6 örnek tablosunda tutar eksik: '+value);
  }
  const audit = runPayrollAudit();
  const reportPath = join(distDir, 'test-raporu', 'index.html');
  await access(reportPath);
  const report = await readFile(reportPath, 'utf8');
  if (!report.includes('Tümü geçti') || !report.includes(`${audit.passed}/${audit.total}`)) {
    failures.push('/test-raporu/: başarılı test özeti bulunamadı.');
  }

  const sitemap = await readFile(join(distDir, 'sitemap.xml'), 'utf8');
  if (!sitemap.includes('<loc>https://maasim.net/test-raporu/</loc>')) {
    failures.push('/test-raporu/: sitemap kaydı bulunamadı.');
  }
  for (const match of sitemap.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/gi)) {
    const url = new URL(match[1]);
    const expected = getPageMetadata(url.pathname).modifiedAt;
    if (match[2] !== expected) failures.push(`${url.pathname}: sitemap lastmod ${match[2]} yerine ${expected} olmalı.`);
  }

  if (failures.length) throw new Error(`Merkezi tarih doğrulaması başarısız:\n${failures.join('\n')}`);
  console.log(`merkezi içerik tarihleri doğrulandı: ${files.length} HTML`);
  return true;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  const root = dirname(dirname(currentFile));
  await verifyContentDates(join(root, 'dist'));
}
