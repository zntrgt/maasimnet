import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const scripts = new Set(Object.keys(packageJson.scripts || {}));
const workflowDir = join('.github', 'workflows');
const files = (await readdir(workflowDir)).filter((name) => /\.ya?ml$/i.test(name));
const failures = [];

for (const file of files) {
  const source = await readFile(join(workflowDir, file), 'utf8');
  for (const match of source.matchAll(/npm\s+run\s+([a-zA-Z0-9:_-]+)/g)) {
    const script = match[1];
    if (!scripts.has(script)) failures.push(`${file}: npm run ${script}`);
  }
}

const deploySource = await readFile(join(workflowDir, 'deploy.yml'), 'utf8');
if (!/workflow_run:[\s\S]*?branches:\s*\[\s*main\s*\]/m.test(deploySource)) {
  failures.push('deploy.yml: workflow_run yalnız main branch için tetiklenmeli');
}
if (!/github\.event\.workflow_run\.head_branch\s*==\s*['"]main['"]/.test(deploySource)) {
  failures.push('deploy.yml: deploy job main branch guardrailini korumalı');
}

if (failures.length) {
  throw new Error(`Workflow doğrulaması başarısız:\n- ${failures.join('\n- ')}`);
}

console.log(`workflow npm script referansları ve production deploy branch koruması doğrulandı: ${files.length} workflow`);
