import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const staticDir = join(root, 'static');
const sourceDir = join(root, 'src');
const distDir = join(root, 'dist');
const assetsDir = join(distDir, 'assets');

await rm(distDir, { recursive: true, force: true });
await cp(staticDir, distDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });

for (const file of [
  'app.js',
  'parameters-2026.js',
  'payroll-engine.js',
  'mobile-payroll-view.js',
  'calculator-actions.js'
]) {
  await cp(join(sourceDir, file), join(assetsDir, file));
}

const version = {
  version: '0.2.0-phase1a',
  builtAt: new Date().toISOString(),
  calculationEngine: 'central-kurus-engine'
};
await writeFile(join(distDir, 'version.json'), JSON.stringify(version, null, 2) + '\n');

console.log('dist hazır:', distDir);
