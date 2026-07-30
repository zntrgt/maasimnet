import {
  calculatePayrollYear,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus,
  kurusToTl
} from './payroll-engine.js';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const RATE_PPM = [150000, 200000, 270000, 350000, 400000];
let currentMode = 'gross';

const money = (value) => new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(value) + ' ₺';

const numberValue = (id) => {
  const element = document.getElementById(id);
  const normalized = String(element?.value || '').replace(/\./g, '').replace(',', '.');
  return Math.max(0, Number(normalized) || 0);
};

function buildParameters() {
  const thresholdsTl = [1, 2, 3, 4].map((index) => numberValue(`estimate-bracket-${index}`));
  for (let index = 1; index < thresholdsTl.length; index += 1) {
    if (thresholdsTl[index] <= thresholdsTl[index - 1]) {
      throw new Error('Vergi dilimi eşikleri küçükten büyüğe sıralanmalıdır.');
    }
  }

  const minimumGrossKurus = tlToKurus(numberValue('estimate-minimum-gross'));
  const sgkCeilingKurus = tlToKurus(numberValue('estimate-sgk-ceiling'));
  if (minimumGrossKurus <= 0 || sgkCeilingKurus < minimumGrossKurus) {
    throw new Error('Tahmini SGK tavanı, tahmini brüt asgari ücretten düşük olamaz.');
  }

  return {
    year: 2027,
    minimumGrossKurus,
    referenceMinimumNetKurus: 0,
    sgkCeilingKurus,
    stampTaxRatePpm: 7590,
    employeeRatesPpm: { sgk: 140000, unemployment: 10000, retiredSgdp: 75000 },
    employerRatesPpm: { manufacturing: 167500, other: 197500, none: 217500, unemployment: 20000, retiredSgdp: 247500 },
    disabilityDeductionKurus: { 0: 0, 1: 1200000, 2: 700000, 3: 300000 },
    incomeTaxBrackets: thresholdsTl.map((threshold, index) => ({
      upToKurus: tlToKurus(threshold),
      ratePpm: RATE_PPM[index]
    })).concat({ upToKurus: Number.POSITIVE_INFINITY, ratePpm: RATE_PPM[4] })
  };
}

const formatRates = (rates) => rates.map((rate) => '%' + (rate / 10000)).join(' → ') || '—';

function rowsFor(parameters, salaryTl) {
  if (currentMode === 'net') {
    const grossByMonth = solveMonthlyGrossForFixedNet({
      targetNetKurus: tlToKurus(salaryTl),
      employerScheme: 'other',
      parameters
    });
    return calculatePayrollYear({
      baseGrossKurusByMonth: grossByMonth,
      extraGrossKurusByMonth: Array(12).fill(0),
      employerScheme: 'other',
      parameters
    });
  }

  return calculatePayrollYear({
    baseGrossKurusByMonth: Array(12).fill(tlToKurus(salaryTl)),
    extraGrossKurusByMonth: Array(12).fill(0),
    employerScheme: 'other',
    parameters
  });
}

function render() {
  const errorBox = document.getElementById('estimate-error');
  errorBox.hidden = true;

  try {
    const salary = numberValue('estimate-salary');
    const parameters = buildParameters();
    const rows = rowsFor(parameters, salary);
    const summary = summarizePayroll(rows);
    const averageNet = kurusToTl(summary.averageNetKurus);
    const averageGross = kurusToTl(summary.averageGrossKurus);

    document.getElementById('estimate-primary-label').textContent = currentMode === 'net'
      ? 'Tahmini aylık ortalama brüt'
      : 'Tahmini aylık ortalama net';
    document.getElementById('estimate-primary-value').textContent = money(currentMode === 'net' ? averageGross : averageNet);
    document.getElementById('estimate-metric-one-label').textContent = currentMode === 'net'
      ? 'Tahmini yıllık toplam brüt'
      : 'Tahmini yıllık toplam net';
    document.getElementById('estimate-metric-one').textContent = money(kurusToTl(
      currentMode === 'net' ? summary.annualGrossKurus : summary.annualNetKurus
    ));
    document.getElementById('estimate-employer-cost').textContent = money(kurusToTl(summary.averageEmployerCostKurus));
    document.getElementById('estimate-effective-rate').textContent = averageGross > 0
      ? '%' + (((averageGross - averageNet) / averageGross) * 100).toFixed(2).replace('.', ',')
      : '%0,00';
    document.getElementById('estimate-table-title').textContent = currentMode === 'net'
      ? '2027 netten brüte aylık tahmini maaş akışı'
      : '2027 brütten nete aylık tahmini maaş akışı';

    document.getElementById('estimate-table-body').innerHTML = rows.map((row) => `
      <tr>
        <th scope="row">${MONTHS[row.month]}</th>
        <td>${money(kurusToTl(row.grossKurus))}</td>
        <td>${money(kurusToTl(row.incomeTaxBaseKurus))}</td>
        <td>${formatRates(row.incomeTaxRatesPpm)}</td>
        <td>${money(kurusToTl(row.payableIncomeTaxKurus))}</td>
        <td>${money(kurusToTl(row.netKurus))}</td>
      </tr>`).join('');

    document.getElementById('estimate-assumption-summary').textContent =
      `${currentMode === 'net' ? money(salary) + ' hedef net' : money(salary) + ' brüt'}; ${money(numberValue('estimate-minimum-gross'))} tahmini asgari brüt ve ${money(numberValue('estimate-sgk-ceiling'))} tahmini SGK tavanıyla hesaplandı.`;
  } catch (error) {
    errorBox.textContent = error.message || 'Tahmin hesaplanamadı.';
    errorBox.hidden = false;
  }
}

function setMode(mode) {
  currentMode = mode;
  const isNet = mode === 'net';
  document.getElementById('estimate-mode-gross').setAttribute('aria-pressed', String(!isNet));
  document.getElementById('estimate-mode-net').setAttribute('aria-pressed', String(isNet));
  document.getElementById('estimate-salary-label').textContent = isNet
    ? 'Hedef tahmini aylık net maaş'
    : 'Tahmini aylık brüt maaş';
  document.getElementById('estimate-salary-note').textContent = isNet
    ? 'Her ay hedeflenen net'
    : 'Kişisel girdin';
  const salaryInput = document.getElementById('estimate-salary');
  salaryInput.value = isNet ? '100000' : '150000';
  render();
}

function applyPreset(name) {
  const presets = {
    cautious: { minimum: 39636, ceiling: 356724, brackets: [228000, 480000, 1800000, 6360000] },
    middle: { minimum: 42939, ceiling: 386451, brackets: [247000, 520000, 1950000, 6890000] },
    high: { minimum: 46242, ceiling: 416178, brackets: [266000, 560000, 2100000, 7420000] }
  };
  const preset = presets[name];
  if (!preset) return;
  document.getElementById('estimate-minimum-gross').value = preset.minimum;
  document.getElementById('estimate-sgk-ceiling').value = preset.ceiling;
  preset.brackets.forEach((value, index) => {
    document.getElementById(`estimate-bracket-${index + 1}`).value = value;
  });
  document.querySelectorAll('[data-estimate-preset]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.estimatePreset === name));
  });
  render();
}

document.querySelectorAll('[data-estimate-input]').forEach((input) => input.addEventListener('input', render));
document.querySelectorAll('[data-estimate-preset]').forEach((button) => {
  button.addEventListener('click', () => applyPreset(button.dataset.estimatePreset));
});
document.querySelectorAll('[data-estimate-preset-link]').forEach((button) => {
  button.addEventListener('click', () => {
    applyPreset(button.dataset.estimatePresetLink);
    document.querySelector('.estimate-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
document.getElementById('estimate-mode-gross')?.addEventListener('click', () => setMode('gross'));
document.getElementById('estimate-mode-net')?.addEventListener('click', () => setMode('net'));
document.getElementById('estimate-reset')?.addEventListener('click', () => applyPreset('middle'));

render();
