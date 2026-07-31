import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function replaceRequired(source, searchValue, replacement, label) {
  if (!source.includes(searchValue)) {
    throw new Error(`Hesaplayıcı boş başlangıç durumu uygulanamadı: ${label}`);
  }
  return source.replace(searchValue, replacement);
}

export async function applyEmptyInitialCalculatorState(distDir) {
  const appPath = join(distDir, 'assets', 'app.js');
  let source = await readFile(appPath, 'utf8');

  source = replaceRequired(
    source,
    "let monthlyBaseGrossKurus = Array(12).fill(tlToKurus(100000));",
    "let monthlyBaseGrossKurus = Array(12).fill(0);",
    'varsayılan brüt maaş'
  );

  source = replaceRequired(
    source,
    "let lastGrossInputKurus = tlToKurus(100000);",
    "let lastGrossInputKurus = 0;",
    'son brüt giriş varsayılanı'
  );

  const initializerAfterFlowFixes = `function initializeMaasimApp() {
  const salaryInput = document.getElementById('input-salary');
  const initialSalary = formatMoneyInputElement(salaryInput) || 100000;
  lastGrossInputKurus = tlToKurus(initialSalary);
  monthlyBaseGrossKurus = Array(12).fill(lastGrossInputKurus);
  monthlyExtraGrossKurus = Array(12).fill(0);
  calculate();
}`;

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

  source = replaceRequired(
    source,
    initializerAfterFlowFixes,
    emptyInitializer,
    'flow düzeltmeleri sonrası başlangıç fonksiyonu'
  );

  await writeFile(appPath, source, 'utf8');
  console.log('Hesaplayıcı ilk yüklemede boş başlangıç durumuna alındı.');
}
