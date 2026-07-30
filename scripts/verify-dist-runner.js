import { readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { blogPosts, blogOutputPath, validateBlogManifest } from '../content/blog-manifest.js';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(scriptsDir, 'verify-dist.js');
const generatedPath = join(scriptsDir, '.verify-dist.generated.js');

validateBlogManifest();

const pathsFor = (generator) => blogPosts
  .filter((post) => post.generator === generator)
  .map((post) => `  '${blogOutputPath(post)}'`)
  .join(',\n');

let source = await readFile(sourcePath, 'utf8');
source = source.replace(
  /const coreBlogPaths = \[[\s\S]*?\n\];/,
  `const coreBlogPaths = [\n${pathsFor('core')}\n];`
);
source = source.replace(
  /const benefitsBlogPaths = \[[\s\S]*?\n\];/,
  `const benefitsBlogPaths = [\n${pathsFor('benefits')}\n];`
);

const oldLayoutVerification = `const calculatorStart = indexHtml.indexOf('<section class="calculator-layout');
const resultsColumn = indexHtml.indexOf('<div class="calculator-results-column">', calculatorStart);
const representativeGross = indexHtml.indexOf('id="representative-gross"', resultsColumn);
const resultHierarchy = indexHtml.indexOf('class="result-hierarchy"', resultsColumn);
const payrollShell = indexHtml.indexOf('id="payroll-results-shell"', resultsColumn);
const quickNav = indexHtml.indexOf('<!-- Quick Nav -->', payrollShell);
if (calculatorStart < 0 || resultsColumn < calculatorStart || representativeGross < resultsColumn || resultHierarchy < representativeGross || payrollShell < resultHierarchy || quickNav < payrollShell) throw new Error('Hesap sonucu kolonu doğru sırada üretilmedi.');
if (!stylesCss.includes('.calculator-results-column') || !stylesCss.includes('.calculator-results-column > #payroll-results-shell')) throw new Error('Bordro geniş sonuç kolonu stilleri eksik.');`;

const newLayoutVerification = `const calculatorStart = indexHtml.indexOf('<section class="calculator-layout');
const resultsColumn = indexHtml.indexOf('<div class="calculator-results-column">', calculatorStart);
const representativeGross = indexHtml.indexOf('id="representative-gross"', resultsColumn);
const resultHierarchy = indexHtml.indexOf('class="result-hierarchy"', resultsColumn);
const calculatorBoundary = indexHtml.indexOf('<!-- Calculator Layout End -->', resultHierarchy);
const fullWidthTable = indexHtml.indexOf('class="calculator-table-full"', calculatorBoundary);
const payrollShell = indexHtml.indexOf('id="payroll-results-shell"', fullWidthTable);
if (calculatorStart < 0 || resultsColumn < calculatorStart || representativeGross < resultsColumn || resultHierarchy < representativeGross || calculatorBoundary < resultHierarchy || fullWidthTable < calculatorBoundary || payrollShell < fullWidthTable) throw new Error('Hesaplayıcı dashboard marker sırası hatalı.');
if (!stylesCss.includes('.calculator-results-column') || !stylesCss.includes('.calculator-table-full') || !stylesCss.includes('width: min(100%, 1280px)')) throw new Error('Bağımsız tam genişlik bordro tablosu stilleri eksik.');`;

if (!source.includes(oldLayoutVerification)) {
  throw new Error('Eski hesaplayıcı layout doğrulama bloğu bulunamadı.');
}
source = source.replace(oldLayoutVerification, newLayoutVerification);

if (source.includes('is-degistirince-vergi-matrahi') || source.includes('100000-tl-brut-maas-2026-neti')) {
  throw new Error('Eski manuel blog slug listesi doğrulama çıktısında kaldı.');
}

await writeFile(generatedPath, source, 'utf8');
try {
  await import(`${pathToFileURL(generatedPath).href}?v=${Date.now()}`);
} finally {
  await rm(generatedPath, { force: true });
}
