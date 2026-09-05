import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function replaceRequired(source, pattern, replacement, label) {
  if (typeof pattern === 'string') {
    if (!source.includes(pattern)) throw new Error(`Ana hesaplama state düzeltmesi uygulanamadı: ${label}`);
    return source.replace(pattern, replacement);
  }
  if (!pattern.test(source)) throw new Error(`Ana hesaplama state düzeltmesi uygulanamadı: ${label}`);
  return source.replace(pattern, replacement);
}

function patchApp(source) {
  let app = source;

  const helperAnchor = `function formatCurrency(value) {`;
  const helper = `function setCommittedResultState(committed) {
  const valid = Boolean(committed);
  document.body.dataset.calculationCommitted = String(valid);
  const hero = document.querySelector('.metric-hero');
  const empty = hero?.querySelector('.human-empty-state');
  hero?.classList.toggle('is-human-empty', !valid);
  hero?.classList.toggle('has-human-result', valid);
  if (empty) {
    empty.hidden = valid;
    empty.setAttribute('aria-hidden', String(valid));
  }
  document.body.classList.toggle('human-has-result', valid);
  document.dispatchEvent(new CustomEvent('maasim:calculation-state', {
    detail: { committed: valid }
  }));
}

`;
  app = replaceRequired(app, helperAnchor, `${helper}${helperAnchor}`, 'app-owned result helper');

  app = replaceRequired(
    app,
    `function setMode(mode) {\n  if (mode !== 'gross' && mode !== 'net') return;`,
    `function setMode(mode) {\n  if (mode !== 'gross' && mode !== 'net') return;\n  setCommittedResultState(false);`,
    'mod değişiminde sonuç reseti'
  );

  app = replaceRequired(
    app,
    `function handleMainSalaryInput(event) {\n  const salaryInput = event?.currentTarget || document.getElementById('input-salary');`,
    `function handleMainSalaryInput(event) {\n  setCommittedResultState(false);\n  const salaryInput = event?.currentTarget || document.getElementById('input-salary');`,
    'ana maaş girişinde sonuç reseti'
  );

  const calculateAndShowPattern = /function calculateAndShowPayroll\(\) \{[\s\S]*?\n\}/;
  app = replaceRequired(app, calculateAndShowPattern, `function calculateAndShowPayroll() {
  const salaryInput = document.getElementById('input-salary');
  const salaryValue = Math.max(0, parseMoneyInput(salaryInput?.value || ''));
  if (!(salaryValue > 0)) {
    setCommittedResultState(false);
    salaryInput?.focus({ preventScroll: true });
    return false;
  }

  runCalculationAndFocusPayroll({
    calculate,
    payrollElement: document.getElementById('payroll-results-shell'),
    viewportWidth: window.innerWidth,
    mobileBreakpoint: 768
  });

  setCommittedResultState(true);
  return true;
}`,
    'CTA sonrası kesin sonuç state'
  );

  app = replaceRequired(
    app,
    /function initializeMaasimApp\(\) \{\n/,
    `function initializeMaasimApp() {\n  setCommittedResultState(false);\n`,
    'ilk yükleme sonuç state reseti'
  );

  for (const token of [
    'function setCommittedResultState(committed)',
    "document.body.dataset.calculationCommitted = String(valid)",
    "hero?.classList.toggle('has-human-result', valid)",
    'setCommittedResultState(true);'
  ]) {
    if (!app.includes(token)) throw new Error(`App-owned state doğrulaması eksik: ${token}`);
  }

  return app;
}

function patchHumanizedRuntime(source) {
  let js = source;

  js = replaceRequired(
    js,
    /function hasUsableHomeResult\(\) \{[\s\S]*?\n\}/,
    `function hasUsableHomeResult() {
  const inputValue = currentSalaryValue();
  const netValue = parseCurrency(qs('#stat-avg-net')?.textContent);
  const committed = document.body.dataset.calculationCommitted === 'true';
  return committed && inputValue > 0 && netValue > 0;
}`,
    'humanized state tek kaynağa bağlama'
  );

  const initAnchor = `  const input = qs('#input-salary');`;
  js = replaceRequired(
    js,
    initAnchor,
    `  document.addEventListener('maasim:calculation-state', refreshHomeState);\n\n${initAnchor}`,
    'humanized app-state event listener'
  );

  return js;
}

function patchFintechRuntime(source) {
  let js = source;
  js = js
    .replace("addFormSectionHeading(modeToggle, '01', 'Temel Bilgiler', 'Maaş yönünü ve aylık tutarı belirleyin.');",
      "addFormSectionHeading(modeToggle, '01', 'Maaşını gir', 'Brütten nete veya netten brüte tek dokunuşla geçebilirsin.');")
    .replace("addFormSectionHeading(exceptionBlock, '02', 'İstisnalar & Muafiyetler', 'Yalnız size uyan seçenekleri açın.');",
      "addFormSectionHeading(exceptionBlock, '02', 'Çalışma durumun', 'Yalnız sana uyan seçeneği değiştir.');")
    .replace("summary.innerHTML = '<span>İleri Seviye Ayarlar</span><small>İşveren maliyeti ve SGK teşviki</small><b aria-hidden=\"true\">+</b>';",
      "summary.innerHTML = '<span>Diğer bordro ayarları</span><small>İşveren maliyeti ve SGK teşviki</small><b aria-hidden=\"true\">+</b>';")
    .replace("if (primaryButton) primaryButton.textContent = 'Hesabı Detaylandır';",
      "if (primaryButton) primaryButton.textContent = 'Net maaşımı gör';")
    .replace("csvButton.textContent = 'Detaylı Bordro CSV';", "csvButton.textContent = 'CSV indir';");

  for (const forbidden of ['Hesabı Detaylandır', 'Temel Bilgiler', 'İstisnalar & Muafiyetler']) {
    if (js.includes(forbidden)) throw new Error(`Eski fintech metni kaldı: ${forbidden}`);
  }
  return js;
}

export async function applyHomeResultState(distDir) {
  const appPath = join(distDir, 'assets', 'app.js');
  const humanizedPath = join(distDir, 'assets', 'humanized-ux.js');
  const fintechPath = join(distDir, 'assets', 'fintech-ui.js');

  await writeFile(appPath, patchApp(await readFile(appPath, 'utf8')), 'utf8');
  await writeFile(humanizedPath, patchHumanizedRuntime(await readFile(humanizedPath, 'utf8')), 'utf8');
  await writeFile(fintechPath, patchFintechRuntime(await readFile(fintechPath, 'utf8')), 'utf8');

  console.log('Ana hesaplama sonucu artık app-owned state ile açılıyor; humanized katman yalnız bu state’i tüketiyor.');
}
