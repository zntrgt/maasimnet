import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_METADATA } from '../content/site-metadata.js';
import { renderScenarioPages } from './render-scenarios.js';
import { applyResultHierarchy } from './apply-result-hierarchy.js';
import { applyDashboardLayout } from './apply-dashboard-layout.js';
import { applyMetricCardStandard } from './apply-metric-card-standard.js';
import { applyTaxBracketColumn } from './apply-tax-bracket-column.js';
import { renderBlog } from './render-blog.js';
import { applyBlogImages } from './apply-blog-images.js';
import { applyBlogOriginalData } from './apply-blog-original-data.js';
import { applyBlogOriginalDataSecondary } from './apply-blog-original-data-secondary.js';
import { add2027EstimateCalculator } from './add-2027-estimate-calculator.js';
import { addOfferComparison } from './add-offer-comparison.js';
import { addContactPage } from './add-contact-page.js';
import { applyP0Architecture } from './apply-p0-architecture.js';
import { addHomeFreshness } from './add-home-freshness.js';
import { addPayrollTestReport } from './add-payroll-test-report.js';
import { applySharedShell } from './apply-shared-shell.js';
import { applyConsentManagement } from './apply-consent-management.js';
import { applyGoogleTags } from './apply-google-tags.js';
import { removeInternalCopy } from './remove-internal-copy.js';
import { normalizeSitemap } from './normalize-sitemap.js';
import { applyContentDates } from './apply-content-dates.js';
import { applyLighthouseFixes } from './apply-lighthouse-fixes.js';
import { applyAccessibilityPolish } from './apply-accessibility-polish.js';
import { applyFintechUi } from './apply-fintech-ui.js';
import { mergeCriticalCss } from './merge-critical-css.js';
import { inlineHomeCss } from './inline-home-css.js';
import { fixCalculatorAnalyticsInputReset } from './fix-calculator-analytics-input-reset.js';
import { applyCalculatorFlowFixes } from './apply-calculator-flow-fixes.js';
import { applyEmptyInitialCalculatorState } from './apply-empty-initial-calculator-state.js';
import { applyMetaDescriptionQuality } from './apply-meta-description-quality.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const staticDir = join(root, 'static');
const sourceDir = join(root, 'src');
const distDir = join(root, 'dist');
const assetsDir = join(distDir, 'assets');

await rm(distDir, { recursive: true, force: true });
await cp(staticDir, distDir, { recursive: true });
await cp(join(root, 'content', 'robots.txt'), join(distDir, 'robots.txt'));
await mkdir(assetsDir, { recursive: true });

for (const file of [
  'app.js','data-2026.js','parameters-2026.js','payroll-engine.js','mobile-payroll-view.js',
  'calculator-actions.js','calculator-analytics.js','money-input.js','payroll-change-reasons.js','contact-form.js',
  'estimate-2027.js','offer-comparison.js','site-shell.css','site-shell.js'
]) await cp(join(sourceDir, file), join(assetsDir, file));

await fixCalculatorAnalyticsInputReset(distDir);
await applyCalculatorFlowFixes(distDir);
await applyEmptyInitialCalculatorState(distDir);
await applyResultHierarchy(distDir);
await applyDashboardLayout(distDir);
await applyMetricCardStandard(distDir);
await applyTaxBracketColumn(distDir);
const scenarioResult = await renderScenarioPages(distDir);
await renderBlog(distDir);
const blogImageResult = await applyBlogImages(distDir);
const originalDataResult = await applyBlogOriginalData(distDir);
const secondaryOriginalDataResult = await applyBlogOriginalDataSecondary(distDir);
await add2027EstimateCalculator(distDir);
await addOfferComparison(distDir);
await addContactPage(distDir);
await applyP0Architecture(distDir);
await addHomeFreshness(distDir);
const payrollAudit = await addPayrollTestReport(distDir);
await applyConsentManagement(distDir);
await applyGoogleTags(distDir);
await removeInternalCopy(distDir);
await applyLighthouseFixes(distDir);
await applyAccessibilityPolish(distDir);
await applyFintechUi(distDir);
await applySharedShell(distDir);
await mergeCriticalCss(distDir);
await inlineHomeCss(distDir);
await applyContentDates(distDir);
const metaDescriptionResult = await applyMetaDescriptionQuality(distDir);
const sitemapResult = await normalizeSitemap(distDir);
const proprietaryDataBlogs = originalDataResult.enhanced + secondaryOriginalDataResult.enhanced;

const version = {
  version: SITE_METADATA.releaseVersion,
  builtAt: new Date().toISOString(),
  contentModifiedAt: SITE_METADATA.releaseModifiedAt,
  payrollDataReviewedAt: SITE_METADATA.payrollDataReviewedAt,
  calculationEngine: payrollAudit.engineVersion,
  payrollAudit: `${payrollAudit.passed}/${payrollAudit.total}`,
  metaDescriptionsReviewed: metaDescriptionResult.scanned,
  proprietaryDataBlogs,
  editorialBlogImages: blogImageResult.applied
};
await writeFile(join(distDir, 'version.json'), JSON.stringify(version, null, 2) + '\n');
console.log('dist hazır:', distDir);
console.log(`senaryo sayfaları üretildi: ${scenarioResult.renderedPages}`);
console.log(`bordro sınır testleri: ${payrollAudit.passed}/${payrollAudit.total}`);
console.log(`özgün hesaplama/veri içeriği eklenen bloglar: ${proprietaryDataBlogs}`);
console.log(`konuya özel editoryal görsel uygulanan bloglar: ${blogImageResult.applied}`);
console.log(`meta description taraması: ${metaDescriptionResult.scanned} sayfa, ${metaDescriptionResult.changed} güncelleme`);
console.log(`sitemap URL sayısı: ${sitemapResult.urlCount}`);
