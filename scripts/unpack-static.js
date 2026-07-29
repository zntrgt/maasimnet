import { gunzipSync } from 'node:zlib';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bundleDir = join(root, 'site-bundle');
const staticDir = join(root, 'static');

const chunkFiles = (await readdir(bundleDir))
  .filter((name) => /^\d{3}\.b64$/.test(name))
  .sort();

if (chunkFiles.length === 0) {
  throw new Error('site-bundle içinde statik kaynak parçaları bulunamadı.');
}

const encodedParts = await Promise.all(
  chunkFiles.map((name) => readFile(join(bundleDir, name), 'utf8'))
);
const compressed = Buffer.from(encodedParts.join(''), 'base64');
const manifest = JSON.parse(gunzipSync(compressed).toString('utf8'));

await rm(staticDir, { recursive: true, force: true });
await mkdir(staticDir, { recursive: true });

for (const [relativePath, encodedContent] of Object.entries(manifest)) {
  const targetPath = join(staticDir, relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, Buffer.from(encodedContent, 'base64'));
}

console.log(`static hazır: ${Object.keys(manifest).length} dosya`);
