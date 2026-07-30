import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const RESET_BLOCK = /\n\s*globalThis\.setTimeout\(\(\) => \{\s*input\.value = '';\s*input\.dataset\.rawValue = '';\s*globalThis\.handleMainSalaryInput\?\.\(\{ currentTarget: input \}\);\s*\}, 0\);/m;

export async function fixCalculatorAnalyticsInputReset(distDir) {
  const assetPath = join(distDir, 'assets', 'calculator-analytics.js');
  const source = await readFile(assetPath, 'utf8');

  if (!RESET_BLOCK.test(source)) {
    if (source.includes("input.value = ''")) {
      throw new Error('Hesaplayıcı analitiği input sıfırlama kodu beklenen biçimde temizlenemedi.');
    }
    return;
  }

  const fixed = source.replace(RESET_BLOCK, '');
  if (fixed.includes("input.value = ''") || fixed.includes("input.dataset.rawValue = ''")) {
    throw new Error('Hesaplayıcı analitiği kullanıcı maaş girdisini hâlâ sıfırlıyor.');
  }

  await writeFile(assetPath, fixed, 'utf8');
  console.log('Lazy hesaplayıcı analitiğinin kullanıcı maaş girdisini sıfırlaması engellendi.');
}
