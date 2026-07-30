import { readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(scriptsDir, 'verify-dist.js');
const generatedPath = join(scriptsDir, '.verify-dist.generated.js');

const replacements = new Map([
  ['blog/is-degistirince-vergi-matrahi/index.html', 'blog/is-degisikliginde-vergi-matrahi/index.html'],
  ['blog/netten-brute-maas-neden-degisir/index.html', 'blog/netten-brute-maas-neden-aylik-degisir/index.html'],
  ['blog/100000-tl-brut-maas-2026-neti/index.html', 'blog/100000-tl-brut-maas-neti-2026/index.html'],
  ['blog/kidem-tazminatina-hangi-odemeler-dahil/index.html', 'blog/kidem-tazminatina-dahil-odemeler/index.html']
]);

let source = await readFile(sourcePath, 'utf8');
for (const [oldValue, newValue] of replacements) {
  if (!source.includes(oldValue)) {
    throw new Error(`Doğrulama slug düzeltmesi uygulanamadı: ${oldValue}`);
  }
  source = source.replaceAll(oldValue, newValue);
}

await writeFile(generatedPath, source, 'utf8');
try {
  await import(`${pathToFileURL(generatedPath).href}?v=${Date.now()}`);
} finally {
  await rm(generatedPath, { force: true });
}
