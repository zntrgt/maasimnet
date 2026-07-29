import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGross100kScenarioData } from './render-scenarios.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const required = [
  'index.html','assets/styles.css','assets/app.js','assets/payroll-engine.js',
  'assets/parameters-2026.js','assets/mobile-payroll-view.js','assets/calculator-actions.js',
  'assets/blog.css','assets/2027-maas-zammi-veri-ozeti.svg','assets/2027-maas-takvimi.svg',
  'blog/index.html','blog/2027-maas-zammi-beklentileri/index.html','llms.txt',
  'robots.txt','sitemap.xml','ads.txt','version.json'
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
if (!indexHtml.includes('href="/blog/"')) throw new Error('Ana navigasyonda Blog bağlantısı yok.');

const article = await readFile(join(dist,'blog','2027-maas-zammi-beklentileri','index.html'),'utf8');
const blogIndex = await readFile(join(dist,'blog','index.html'),'utf8');
const sitemap = await readFile(join(dist,'sitemap.xml'),'utf8');
for (const token of ['2027 Maaş Zammı Ne Kadar Olabilir?','%32,11','%17,76','%15','%21,47','%29,21','%23,95','%17,83','TÜİK','Piyasa Katılımcıları Anketi']) {
  if (!article.includes(token)) throw new Error(`Blog yazısında beklenen içerik yok: ${token}`);
}
for (const schema of ['"@type":"Article"','"@type":"FAQPage"','"@type":"BreadcrumbList"']) {
  if (!article.includes(schema)) throw new Error(`Blog şeması eksik: ${schema}`);
}
if (!blogIndex.includes('"@type":"CollectionPage"')) throw new Error('Blog CollectionPage şeması eksik.');
if (!article.includes('rel="canonical" href="https://maasim.net/blog/2027-maas-zammi-beklentileri/"')) throw new Error('Makale canonical etiketi hatalı.');
if (!article.includes('max-image-preview:large')) throw new Error('Geniş görsel önizleme robots direktifi yok.');
if (!article.includes('alt="Haziran 2026 yıllık TÜFE') || !article.includes('alt="13 Ağustos ve 12 Kasım')) throw new Error('Açıklayıcı görsel alt metinleri eksik.');
if (!article.includes('<figcaption>')) throw new Error('Görsel açıklamaları eksik.');
for (const domain of ['veriportali.tuik.gov.tr','tcmb.gov.tr','sbb.gov.tr']) if (!article.includes(domain)) throw new Error(`Resmî kaynak eksik: ${domain}`);
if (!sitemap.includes('https://maasim.net/blog/') || !sitemap.includes('https://maasim.net/blog/2027-maas-zammi-beklentileri/')) throw new Error('Blog URL’leri sitemap içinde yok.');

const htmlFiles=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else if(entry.name.endsWith('.html'))htmlFiles.push(path)}}
await walk(dist);
if (htmlFiles.length !== 17) throw new Error(`17 HTML sayfası bekleniyordu, ${htmlFiles.length} bulundu.`);

const scenarioHtml=await readFile(join(dist,'100000-brut-maas-hesaplama','index.html'),'utf8');
const scenario=createGross100kScenarioData();
for(const value of Object.values(scenario.replacements)) if(!scenarioHtml.includes(value)) throw new Error(`100.000 TL senaryosunda merkezi motor değeri yok: ${value}`);
if (/\{\{SCENARIO_[A-Z0-9_]+\}\}/.test(scenarioHtml)) throw new Error('Senaryo sayfasında çözümlenmemiş token kaldı.');

console.log('dist doğrulaması başarılı: hesaplayıcı, 17 HTML, blog SEO/schema, kaynaklar ve sitemap hazır.');
