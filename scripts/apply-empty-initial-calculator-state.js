import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function replaceStateDefault(source, legacyValue, emptyValue, label) {
  if (source.includes(emptyValue)) return source;
  if (!source.includes(legacyValue)) {
    throw new Error(`Hesaplayıcı boş başlangıç durumu uygulanamadı: ${label}`);
  }
  return source.replace(legacyValue, emptyValue);
}

export async function applyEmptyInitialCalculatorState(distDir) {
  const appPath = join(distDir, 'assets', 'app.js');
  let source = await readFile(appPath, 'utf8');

  source = replaceStateDefault(
    source,
    'let monthlyBaseGrossKurus = Array(12).fill(tlToKurus(100000));',
    'let monthlyBaseGrossKurus = Array(12).fill(0);',
    'varsayılan brüt maaş'
  );

  source = replaceStateDefault(
    source,
    'let lastGrossInputKurus = tlToKurus(100000);',
    'let lastGrossInputKurus = 0;',
    'son brüt giriş varsayılanı'
  );

  const emptyInitializer = `function initializeMaasimApp() {
  const salaryInput = document.getElementById('input-salary');
  salaryInput.value = '';
  salaryInput.dataset.rawValue = '';
  lastGrossInputKurus = 0;
  lastNetInputKurus = null;
  monthlyBaseGrossKurus = Array(12).fill(0);
  monthlyExtraGrossKurus = Array(12).fill(0);
  payrollRowsKurus = [];
  payrolls = [];
}`;

  const initializerPattern = /function initializeMaasimApp\(\) \{[\s\S]*?\n\}\n\nObject\.assign\(window,/;
  if (!initializerPattern.test(source)) {
    throw new Error('Hesaplayıcı boş başlangıç durumu uygulanamadı: başlangıç fonksiyonu bulunamadı.');
  }

  source = source.replace(initializerPattern, `${emptyInitializer}\n\nObject.assign(window,`);

  const initializerStart = source.indexOf('function initializeMaasimApp()');
  const initializerEnd = source.indexOf('\n\nObject.assign(window,', initializerStart);
  const initializer = source.slice(initializerStart, initializerEnd);
  for (const required of [
    "salaryInput.value = ''",
    'lastGrossInputKurus = 0',
    'monthlyBaseGrossKurus = Array(12).fill(0)',
    'payrollRowsKurus = []'
  ]) {
    if (!initializer.includes(required)) {
      throw new Error(`Hesaplayıcı boş başlangıç doğrulaması başarısız: ${required}`);
    }
  }
  if (/\bcalculate\s*\(/.test(initializer) || /100000/.test(initializer)) {
    throw new Error('Hesaplayıcı ilk yüklemede hâlâ otomatik hesaplama veya örnek maaş içeriyor.');
  }

  await writeFile(appPath, source, 'utf8');
  console.log('Hesaplayıcı ilk yüklemede boş başlangıç durumuna alındı.');
}
