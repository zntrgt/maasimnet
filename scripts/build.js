import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderScenarioPages } from './render-scenarios.js';
import { applyResultHierarchy } from './apply-result-hierarchy.js';
import { applyDashboardLayout } from './apply-dashboard-layout.js';
import { applyMetricCardStandard } from './apply-metric-card-standard.js';
import { applyTaxBracketColumn } from './apply-tax-bracket-column.js';
import { renderBlog } from './render-blog.js';
import { add2027EstimateCalculator } from './add-2027-estimate-calculator.js';
import { addContactPage } from './add-contact-page.js';
import { applyP0Architecture } from './apply-p0-architecture.js';
import { addHomeFreshness } from './add-home-freshness.js';
import { applySharedShell } from './apply-shared-shell.js';
import { applyConsentManagement } from './apply-consent-management.js';
import { applyGoogleTags } from './apply-google-tags.js';
import { removeInternalCopy } from './remove-internal-copy.js';
import { normalizeSitemap } from './normalize-sitemap.js';
import { applyLighthouseFixes } from './apply-lighthouse-fixes.js';
import { applyAccessibilityPolish } from './apply-accessibility-polish.js';
import { applyFintechUi } from './apply-fintech-ui.js';
import { mergeCriticalCss } from './merge-critical-css.js';
import { inlineHomeCss } from './inline-home-css.js';
import { fixCalculatorAnalyticsInputReset } from './fix-calculator-analytics-input-reset.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const staticDir = join(root, 'static');
const sourceDir = join(root, 'src');
const distDir = join(root, 'dist');
const assetsDir = join(distDir, 'assets');

await rm(distDir, { recursive: true, force: true });
await cp(staticDir, distDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });

for (const file of [
  'app.js','data-2026.js','parameters-2026.js','payroll-engine.js','mobile-payroll-view.js',
  'calculator-actions.js','calculator-analytics.js','money-input.js','payroll-change-reasons.js','contact-form.js',
  'estimate-2027.js','site-shell.css','site-shell.js'
]) await cp(join(sourceDir, file), join(assetsDir, file));

// Lazy analitik modülü kullanıcı ilk etkileşimi sırasında yüklenir. Kaynak modüldeki
// eski başlangıç temizliği, kullanıcının girdiği maaşı silmemesi için dist çıktısından kaldırılır.
await fixCalculatorAnalyticsInputReset(distDir);

await applyResultHierarchy(distDir);
await applyDashboardLayout(distDir);
await applyMetricCardStandard(distDir);
await applyTaxBracketColumn(distDir);
const scenarioResult = await renderScenarioPages(distDir);
await renderBlog(distDir);
await add2027EstimateCalculator(distDir);
await addContactPage(distDir);
await applyP0Architecture(distDir);
await addHomeFreshness(distDir);
await applyConsentManagement(distDir);
await applyGoogleTags(distDir);
await removeInternalCopy(distDir);
await applyLighthouseFixes(distDir);
await applyAccessibilityPolish(distDir);
await applyFintechUi(distDir);

// Ortak header/footer en son uygulanır. Böylece çerez politikası veya diğer
// sonraki adımların yeniden yazdığı HTML sayfalarında shell kaybolmaz.
await applySharedShell(distDir);
await mergeCriticalCss(distDir);

// Ana sayfanın son styles.css çıktısı küçültülerek HTML içine alınır. Böylece
// ilk render için ayrı ve render-blocking bir CSS isteği gerekmez.
await inlineHomeCss(distDir);
const sitemapResult = await normalizeSitemap(distDir);

const version = { version: '1.4.0-calculator-user-flow-qa', builtAt: new Date().toISOString(), calculationEngine: 'central-kurus-engine' };
await writeFile(join(distDir, 'version.json'), JSON.stringify(version, null, 2) + '\n');
console.log('dist hazır:', distDir);
console.log(`senaryo sayfaları üretildi: ${scenarioResult.renderedPages}`);
console.log(`sitemap URL sayısı: ${sitemapResult.urlCount}`);
