import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderScenarioPages } from './render-scenarios.js';
import { applyResultHierarchy } from './apply-result-hierarchy.js';
import { addBlog } from './add-blog.js';
import { addFinancialHealthBlog } from './add-financial-health-blog.js';
import { applyBlogImages } from './apply-blog-images.js';
import { compactBlogIndex } from './compact-blog-index.js';
import { applyP0Architecture } from './apply-p0-architecture.js';
import { addHomeFreshness } from './add-home-freshness.js';
import { applySharedShell } from './apply-shared-shell.js';
import { applyConsentManagement } from './apply-consent-management.js';
import { removeInternalCopy } from './remove-internal-copy.js';

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
  'calculator-actions.js','money-input.js','payroll-change-reasons.js','site-shell.css','site-shell.js'
]) await cp(join(sourceDir, file), join(assetsDir, file));

await applyResultHierarchy(distDir);
const scenarioResult = await renderScenarioPages(distDir);
await addBlog(distDir);
await addFinancialHealthBlog(distDir);
await applyBlogImages(distDir);
await compactBlogIndex(distDir);
await applyP0Architecture(distDir);
await addHomeFreshness(distDir);
await applySharedShell(distDir);
await applyConsentManagement(distDir);
await removeInternalCopy(distDir);

const version = { version: '0.7.0-consent-management', builtAt: new Date().toISOString(), calculationEngine: 'central-kurus-engine' };
await writeFile(join(distDir, 'version.json'), JSON.stringify(version, null, 2) + '\n');
console.log('dist hazır:', distDir);
console.log(`senaryo sayfaları üretildi: ${scenarioResult.renderedPages}`);
