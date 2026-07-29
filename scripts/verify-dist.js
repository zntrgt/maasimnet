import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGross100kScenarioData } from './render-scenarios.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const required = [
  'index.html','assets/styles.css','assets/app.js','assets/payroll-engine.js',
  'assets/data-2026.js','assets/parameters-2026.js','assets/mobile-payroll-view.js','assets/calculator-actions.js',
  'assets/blog.css','assets/p0-content.css','assets/2027-maas-zammi-veri-ozeti.svg','assets/2027-maas-takvimi.svg',
  'assets/is-yerinde-finansal-saglik.svg',
  'blog/index.html','blog/2027-maas-zammi-beklentileri/index.html','blog/is-yerinde-finansal-saglik/index.html','sss/index.html','sozluk/index.html',
  'veriler/2026/index.html','veriler/2026-asgari-ucret/index.html','veriler/2026-gelir-vergisi-dilimleri/index.html',
  'veriler/2026-sgk-tavani/index.html','veriler/2026-kidem-tazminati-tavani/index.html','veriler/2026-yemek-yardimi-istisnasi/index.html',
  'sgk/sgk-tavani/index.html','indexability-report.json','llms.txt','robots.txt','sitemap.xml','ads.txt','version.json'
];
for (const path of required) await access(join(dist, path));

const indexHtml = await readFile(join(dist, 'index.html'), 'utf8');
const stylesCss = await readFile(join(dist, 'assets/styles.css'), 'utf8');
const appJs = await readFile(join(dist, 'assets/app.js'), 'utf8');
if (!indexHtml.includes('<script type="module" src="/assets/app.js"></script>')) throw new Error('index.html merkezi app modülünü yüklemiyor.');
if (indexHtml.includes('function runPayroll(') || indexHtml.includes('const PARAMS =')) throw new Error('Eski inline hesap motoru index içinde kaldı.');

const calculatorStart = indexHtml.indexOf('<section class="calculator-layout');
const resultsColumn = indexHtml.indexOf('<div class="calculator-results-column">', calculatorStart);
const representativeGross = indexHtml.indexOf('id="representative-gross"', resultsColumn);
const resultHierarchy = indexHtml.indexOf('class="result-hierarchy"', resultsColumn);
const payrollShell = indexHtml.indexOf('id="payroll-results-shell"', resultsColumn);
const quickNav = indexHtml.indexOf('<!-- Quick Nav -->', payrollShell);
if (calculatorStart < 0 || resultsColumn < calculatorStart || representativeGross < resultsColumn || resultHierarchy < representativeGross || payrollShell < resultHierarchy || quickNav < payrollShell) throw new Error('Hesap sonucu kolonu doğru sırada üretilmedi.');
if (!stylesCss.includes('.calculator-results-column') || !stylesCss.includes('.calculator-results-column > #payroll-results-shell')) throw new Error('Bordro geniş sonuç kolonu stilleri eksik.');
if (!appJs.includes('netGrossTableExpanded = false;')) throw new Error('Netten brüte dağılımı varsayılan kapalı değil.');

for (const type of ['Organization','WebSite','WebApplication','WebPage','BreadcrumbList','FAQPage','Dataset']) {
  if (!indexHtml.includes(`"@type":"${type}"`)) throw new Error(`Ana sayfa schema graph eksik: ${type}`);
}
const homeFaqSection = indexHtml.match(/<section class="mb-24" id="sss">[\s\S]*?<\/section>/)?.[0] || '';
if ((homeFaqSection.match(/<details/g) || []).length !== 6) throw new Error('Ana sayfada tam 6 görünür SSS olmalı.');
const homeScenarioSection = indexHtml.match(/<section class="mb-24" id="senaryolar">[\s\S]*?<\/section>/)?.[0] || '';
if ((homeScenarioSection.match(/<a class="block bg-white/g) || []).length !== 6) throw new Error('Ana sayfada tam 6 senaryo olmalı.');
if (!indexHtml.includes('href="/sss/"') || !indexHtml.includes('href="/sozluk/"') || !indexHtml.includes('href="/veriler/2026/"')) throw new Error('Ana sayfa yeni içerik merkezlerine bağlanmıyor.');
if (indexHtml.includes('id="glossary-container"')) throw new Error('Tam sözlük ana sayfada kalmış.');

const article = await readFile(join(dist,'blog','2027-maas-zammi-beklentileri','index.html'),'utf8');
const financialHealthArticle = await readFile(join(dist,'blog','is-yerinde-finansal-saglik','index.html'),'utf8');
const blogIndex = await readFile(join(dist,'blog','index.html'),'utf8');
const sitemap = await readFile(join(dist,'sitemap.xml'),'utf8');
for (const token of ['2027 Maaş Zammı Ne Kadar Olabilir?','%32,11','%17,76','%15','%21,47','%29,21','%23,95','%17,83','TÜİK','Piyasa Katılımcıları Anketi']) if (!article.includes(token)) throw new Error(`Blog yazısında beklenen içerik yok: ${token}`);
for (const schema of ['"@type":"Article"','"@type":"FAQPage"','"@type":"BreadcrumbList"']) if (!article.includes(schema)) throw new Error(`Blog şeması eksik: ${schema}`);
for (const token of ['İş Yerinde Finansal Sağlık','%32,11','%20','79.272 TL','396.360 TL','9.909 TL','gizli borç danışmanlığı']) if (!financialHealthArticle.includes(token)) throw new Error(`Finansal sağlık yazısında beklenen içerik yok: ${token}`);
for (const schema of ['"@type":"Article"','"@type":"FAQPage"','"@type":"BreadcrumbList"']) if (!financialHealthArticle.includes(schema)) throw new Error(`Finansal sağlık şeması eksik: ${schema}`);
if (!blogIndex.includes('href="/blog/is-yerinde-finansal-saglik/"')) throw new Error('Finansal sağlık yazısı blog merkezinde listelenmiyor.');
if (!blogIndex.includes('"@type":"CollectionPage"')) throw new Error('Blog CollectionPage şeması eksik.');

const sss = await readFile(join(dist,'sss','index.html'),'utf8');
if ((sss.match(/<details/g) || []).length !== 25) throw new Error('/sss/ sayfasında 25 soru bulunmuyor.');
if (sss.includes('"@type":"FAQPage"')) throw new Error('/sss/ sayfasında 25 soruluk FAQPage schema basılmamalı.');
const glossary = await readFile(join(dist,'sozluk','index.html'),'utf8');
if (!glossary.includes('Maaş ve Bordro Terimleri Sözlüğü') || !glossary.includes('<dl class="glossary">')) throw new Error('Sözlük ayrı URL’de doğru üretilmedi.');

for (const path of ['/blog/is-yerinde-finansal-saglik/','/veriler/2026/','/veriler/2026-asgari-ucret/','/veriler/2026-gelir-vergisi-dilimleri/','/veriler/2026-sgk-tavani/','/veriler/2026-kidem-tazminati-tavani/','/veriler/2026-yemek-yardimi-istisnasi/','/sgk/sgk-tavani/','/sss/','/sozluk/']) {
  if (!sitemap.includes(`<loc>https://maasim.net${path}</loc>`)) throw new Error(`Yeni URL sitemap içinde yok: ${path}`);
}
const sgkPage = await readFile(join(dist,'veriler','2026-sgk-tavani','index.html'),'utf8');
if (!sgkPage.includes('297.270,00 TL') || !sgkPage.includes('5510 sayılı') || !sgkPage.includes('"@type":"Dataset"')) throw new Error('SGK veri sayfası değer, dayanak veya Dataset schema eksik.');
const mealPage = await readFile(join(dist,'veriler','2026-yemek-yardimi-istisnasi','index.html'),'utf8');
if (!mealPage.includes('300,00 TL') || !mealPage.includes('158,00 TL')) throw new Error('Yemek yardımı GV/SGK ayrımı eksik.');
const severancePage = await readFile(join(dist,'veriler','2026-kidem-tazminati-tavani','index.html'),'utf8');
if (!severancePage.includes('64.948,77 TL') || !severancePage.includes('73.729,87 TL')) throw new Error('Kıdem tazminatı iki dönem değeri eksik.');

const indexability = JSON.parse(await readFile(join(dist,'indexability-report.json'),'utf8'));
if (indexability.scenarios.length !== 8) throw new Error('Sekiz senaryo için indexability raporu bekleniyordu.');
for (const row of indexability.scenarios) {
  if (!row.selfCanonical || !row.indexable || !row.inSitemap || !row.linkedFromHub) throw new Error(`Senaryo indexability kontrolü başarısız: ${row.url}`);
}

const htmlFiles=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else if(entry.name.endsWith('.html'))htmlFiles.push(path)}}
await walk(dist);
if (htmlFiles.length !== 27) throw new Error(`27 HTML sayfası bekleniyordu, ${htmlFiles.length} bulundu.`);
for (const path of htmlFiles) {
  const html = await readFile(path,'utf8');
  if (!html.includes('Güncellik') && !html.includes('site-freshness') && !html.includes('class="freshness"')) throw new Error(`Güncellik bloğu eksik: ${path}`);
}

const scenarioHtml=await readFile(join(dist,'100000-brut-maas-hesaplama','index.html'),'utf8');
const scenario=createGross100kScenarioData();
for(const value of Object.values(scenario.replacements)) if(!scenarioHtml.includes(value)) throw new Error(`100.000 TL senaryosunda merkezi motor değeri yok: ${value}`);
if (/\{\{SCENARIO_[A-Z0-9_]+\}\}/.test(scenarioHtml)) throw new Error('Senaryo sayfasında çözümlenmemiş token kaldı.');

console.log('dist doğrulaması başarılı: 27 HTML, iki kaynaklı blog yazısı, sade ana sayfa, tek veri kaynağı, veri merkezi, schema graph, güncellik ve indexability hazır.');
