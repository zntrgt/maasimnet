import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function replaceRequired(source, searchValue, replacement, label) {
  if (!source.includes(searchValue)) {
    throw new Error(`Hesaplayıcı kullanıcı akışı düzeltilemedi: ${label}`);
  }
  return source.replace(searchValue, replacement);
}

export async function applyCalculatorFlowFixes(distDir) {
  const appPath = join(distDir, 'assets', 'app.js');
  const analyticsPath = join(distDir, 'assets', 'calculator-analytics.js');

  let app = await readFile(appPath, 'utf8');
  app = replaceRequired(
    app,
    "let monthlyExtraGrossKurus = Array(12).fill(0);\nconst openPayrollDetails = new Set();",
    "let monthlyExtraGrossKurus = Array(12).fill(0);\nlet lastGrossInputKurus = tlToKurus(100000);\nlet lastNetInputKurus = null;\nconst openPayrollDetails = new Set();",
    'modlara özel giriş durumu'
  );

  const oldSetMode = `function setMode(mode) {
  currentMode = mode;

  const grossButton = document.getElementById('btn-mode-gross');
  const netButton = document.getElementById('btn-mode-net');
  const salaryLabel = document.getElementById('salary-input-label');
  const salaryInput = document.getElementById('input-salary');

  grossButton.className = mode === 'gross'
    ? 'flex-1 py-3 text-sm font-bold rounded-xl transition-all bg-white text-slate-900'
    : 'flex-1 py-3 text-sm font-bold rounded-xl transition-all hover:bg-white/5';
  netButton.className = mode === 'net'
    ? 'flex-1 py-3 text-sm font-bold rounded-xl transition-all bg-white text-slate-900'
    : 'flex-1 py-3 text-sm font-bold rounded-xl transition-all hover:bg-white/5';

  grossButton.setAttribute('aria-pressed', String(mode === 'gross'));
  netButton.setAttribute('aria-pressed', String(mode === 'net'));

  if (mode === 'net') {
    salaryLabel.textContent = 'Hedef Aylık Net Maaş (₺)';
    salaryInput.setAttribute('aria-label', 'Her ay hedeflenen net maaş');
    salaryInput.title = 'Ocak–Aralık döneminde her ay elinize geçmesini istediğiniz net maaşı girin.';
  } else {
    salaryLabel.textContent = 'Brüt Maaş Tutarı (₺)';
    salaryInput.setAttribute('aria-label', 'Aylık brüt maaş');
    salaryInput.title = 'Aylık brüt maaş tutarını girin.';
  }

  calculate();
}`;

  const newSetMode = `function setMode(mode) {
  if (mode !== 'gross' && mode !== 'net') return;

  const grossButton = document.getElementById('btn-mode-gross');
  const netButton = document.getElementById('btn-mode-net');
  const salaryLabel = document.getElementById('salary-input-label');
  const salaryInput = document.getElementById('input-salary');
  const currentInputKurus = tlToKurus(Math.max(0, parseMoneyInput(salaryInput.value)));

  if (currentMode === 'gross') lastGrossInputKurus = currentInputKurus;
  else lastNetInputKurus = currentInputKurus;

  currentMode = mode;

  grossButton.className = mode === 'gross'
    ? 'flex-1 py-3 text-sm font-bold rounded-xl transition-all bg-white text-slate-900'
    : 'flex-1 py-3 text-sm font-bold rounded-xl transition-all hover:bg-white/5';
  netButton.className = mode === 'net'
    ? 'flex-1 py-3 text-sm font-bold rounded-xl transition-all bg-white text-slate-900'
    : 'flex-1 py-3 text-sm font-bold rounded-xl transition-all hover:bg-white/5';

  grossButton.setAttribute('aria-pressed', String(mode === 'gross'));
  netButton.setAttribute('aria-pressed', String(mode === 'net'));

  if (mode === 'net') {
    if (lastNetInputKurus === null) {
      lastNetInputKurus = payrollRowsKurus[0]?.netKurus ?? 0;
    }
    salaryLabel.textContent = 'Hedef Aylık Net Maaş (₺)';
    salaryInput.setAttribute('aria-label', 'Her ay hedeflenen net maaş');
    salaryInput.title = 'Ocak–Aralık döneminde her ay elinize geçmesini istediğiniz net maaşı girin.';
    salaryInput.value = formatInputMoney(kurusToTl(lastNetInputKurus));
    salaryInput.dataset.rawValue = String(kurusToTl(lastNetInputKurus));
  } else {
    salaryLabel.textContent = 'Brüt Maaş Tutarı (₺)';
    salaryInput.setAttribute('aria-label', 'Aylık brüt maaş');
    salaryInput.title = 'Aylık brüt maaş tutarını girin.';
    const januaryGrossKurus = monthlyBaseGrossKurus[0] ?? lastGrossInputKurus;
    lastGrossInputKurus = januaryGrossKurus;
    salaryInput.value = formatInputMoney(kurusToTl(januaryGrossKurus));
    salaryInput.dataset.rawValue = String(kurusToTl(januaryGrossKurus));
  }

  calculate();
}`;
  app = replaceRequired(app, oldSetMode, newSetMode, 'brüt/net mod geçişi');

  app = replaceRequired(
    app,
    `  if (currentMode === 'gross') {
    const valueKurus = tlToKurus(Math.max(0, rawValue));
    monthlyBaseGrossKurus = Array(12).fill(valueKurus);
    monthlyExtraGrossKurus = Array(12).fill(0);
  }
  calculate();`,
    `  const valueKurus = tlToKurus(Math.max(0, rawValue));
  if (currentMode === 'gross') {
    lastGrossInputKurus = valueKurus;
    monthlyBaseGrossKurus = Array(12).fill(valueKurus);
    monthlyExtraGrossKurus = Array(12).fill(0);
  } else {
    lastNetInputKurus = valueKurus;
  }
  calculate();`,
    'ana input durum güncellemesi'
  );

  app = replaceRequired(
    app,
    `    salaryInput.value = formatInputMoney(parsed);
    salaryInput.dataset.rawValue = String(parsed);`,
    `    lastGrossInputKurus = parsedKurus;
    salaryInput.value = formatInputMoney(parsed);
    salaryInput.dataset.rawValue = String(parsed);`,
    'Ocak brüt girişi durumu'
  );

  app = replaceRequired(
    app,
    `  monthlyBaseGrossKurus = Array(12).fill(tlToKurus(initialSalary));
  monthlyExtraGrossKurus = Array(12).fill(0);`,
    `  lastGrossInputKurus = tlToKurus(initialSalary);
  monthlyBaseGrossKurus = Array(12).fill(lastGrossInputKurus);
  monthlyExtraGrossKurus = Array(12).fill(0);`,
    'ilk brüt giriş durumu'
  );

  await writeFile(appPath, app, 'utf8');

  let analytics = await readFile(analyticsPath, 'utf8');
  analytics = replaceRequired(
    analytics,
    `
  globalThis.setTimeout(() => {
    input.value = '';
    input.dataset.rawValue = '';
    globalThis.handleMainSalaryInput?.({ currentTarget: input });
  }, 0);
`,
    '\n',
    'analitiğin kullanıcı girdisini temizlemesi'
  );
  await writeFile(analyticsPath, analytics, 'utf8');

  console.log('2026 hesaplayıcı mod durumu ve geç analitik kullanıcı akışı düzeltildi.');
}
