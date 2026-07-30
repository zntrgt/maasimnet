import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const scripts = new Set(Object.keys(packageJson.scripts || {}));
const workflowDir = join('.github', 'workflows');
const files = (await readdir(workflowDir)).filter((name) => /\.ya?ml$/i.test(name));
const missing = [];

for (const file of files) {
  const source = await readFile(join(workflowDir, file), 'utf8');
  for (const match of source.matchAll(/npm\s+run\s+([a-zA-Z0-9:_-]+)/g)) {
    const script = match[1];
    if (!scripts.has(script)) missing.push(`${file}: npm run ${script}`);
  }
}

if (missing.length) {
  throw new Error(`Workflow dosyalarında package.json içinde tanımsız npm scriptleri var:\n- ${missing.join('\n- ')}`);
}

console.log(`workflow npm script referansları doğrulandı: ${files.length} workflow`);
