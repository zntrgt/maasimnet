import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function applyEmptyInitialCalculatorState(distDir) {
  const appPath = join(distDir, 'assets', 'app.js');
  let source = await readFile(appPath, 'utf8');

  const defaultState = "let monthlyBaseGrossKurus = Array(12).fill(tlToKurus(100000));";
  if (!source.includes(defaultState)) {
    throw new Error('Başlangıç brüt maaş varsayılanı bulunamadı.');
  }
  source = source.replace(
    defaultState,
    "let monthlyBaseGrossKurus = Array(12).fill(0);"
  );

  const oldInitializer = `function initializeMaasimApp() {
  const salaryInput = document.getElementById('input-salary');
  const initialSalary = formatMoneyInputElement(salaryInput) || 100000;
  monthlyBaseGrossKurus = Array(12).fill(tlToKurus(initialSalary));
  monthlyExtraGrossKurus = Array(12).fill(0);
  calculate();
}`;

  const newInitializer = `function initializeMaasimApp() {
  const salaryInput = document.getElementById('input-salary');
  salaryInput.value = '';
  salaryInput.dataset.rawValue = '';
  monthlyBaseGrossKurus = Array(12).fill(0);
  monthlyExtraGrossKurus = Array(12).fill(0);
  payrollRowsKurus = [];
  payrolls = [];
}`;

  if (!source.includes(oldInitializer)) {
    throw new Error('Hesaplayıcı başlangıç fonksiyonu beklenen yapıda bulunamadı.');
  }
  source = source.replace(oldInitializer, newInitializer);

  await writeFile(appPath, source, 'utf8');
  console.log('Hesaplayıcı ilk yüklemede boş başlangıç durumuna alındı.');
}
