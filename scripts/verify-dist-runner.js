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

if (source.includes('is-degistirince-vergi-matrahi') || source.includes('100000-tl-brut-maas-2026-neti')) {
  throw new Error('Eski manuel blog slug listesi doğrulama çıktısında kaldı.');
}

await writeFile(generatedPath, source, 'utf8');
try {
  await import(`${pathToFileURL(generatedPath).href}?v=${Date.now()}`);
} finally {
  await rm(generatedPath, { force: true });
}
