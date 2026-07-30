import { calculatePayrollYear, summarizePayroll, tlToKurus, kurusToTl } from './payroll-engine.js';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const RATE_PPM = [150000, 200000, 270000, 350000, 400000];

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
  const thresholdsTl = [
    numberValue('estimate-bracket-1'),
    numberValue('estimate-bracket-2'),
    numberValue('estimate-bracket-3'),
    numberValue('estimate-bracket-4')
  ];

  for (let i = 1; i < thresholdsTl.length; i += 1) {
    if (thresholdsTl[i] <= thresholdsTl[i - 1]) {
      throw new Error('Vergi dilimi eşikleri küçükten büyüğe sıralanmalıdır.');
    }
  }

  return {
    year: 2027,
    minimumGrossKurus: tlToKurus(numberValue('estimate-minimum-gross')),
    referenceMinimumNetKurus: 0,
    sgkCeilingKurus: tlToKurus(numberValue('estimate-sgk-ceiling')),
    stampTaxRatePpm: 7590,
    employeeRatesPpm: { sgk: 140000, unemployment: 10000, retiredSgdp: 75000 },
    employerRatesPpm: { manufacturing: 167500, other: 197500, none: 217500, unemployment: 20000, retiredSgdp: 247500 },
    disabilityDeductionKurus: { 0: 0, 1: 1200000, 2: 700000, 3: 300000 },
    incomeTaxBrackets: [
      { upToKurus: tlToKurus(thresholdsTl[0]), ratePpm: RATE_PPM[0] },
      { upToKurus: tlToKurus(thresholdsTl[1]), ratePpm: RATE_PPM[1] },
      { upToKurus: tlToKurus(thresholdsTl[2]), ratePpm: RATE_PPM[2] },
      { upToKurus: tlToKurus(thresholdsTl[3]), ratePpm: RATE_PPM[3] },
      { upToKurus: Number.POSITIVE_INFINITY, ratePpm: RATE_PPM[4] }
    ]
  };
}

function formatRates(rates) {
  return rates.map((rate) => '%' + (rate / 10000)).join(' → ') || '—';
}

function render() {
  const errorBox = document.getElementById('estimate-error');
  errorBox.hidden = true;

  try {
    const gross = numberValue('estimate-gross');
    const parameters = buildParameters();
    const rows = calculatePayrollYear({
      baseGrossKurusByMonth: Array(12).fill(tlToKurus(gross)),
      extraGrossKurusByMonth: Array(12).fill(0),
      employerScheme: 'other',
      parameters
    });
    const summary = summarizePayroll(rows);

    document.getElementById('estimate-average-net').textContent = money(kurusToTl(summary.averageNetKurus));
    document.getElementById('estimate-annual-net').textContent = money(kurusToTl(summary.annualNetKurus));
    document.getElementById('estimate-employer-cost').textContent = money(kurusToTl(summary.averageEmployerCostKurus));
    document.getElementById('estimate-effective-rate').textContent = gross > 0
      ? '%' + (((gross - kurusToTl(summary.averageNetKurus)) / gross) * 100).toFixed(2).replace('.', ',')
      : '%0,00';

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
      `Bu sonuç; ${money(numberValue('estimate-minimum-gross'))} tahmini asgari brüt ücret ve ${money(numberValue('estimate-sgk-ceiling'))} tahmini SGK tavanı kullanılarak üretildi.`;
  } catch (error) {
    errorBox.textContent = error.message || 'Tahmin hesaplanamadı.';
    errorBox.hidden = false;
  }
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
document.getElementById('estimate-reset')?.addEventListener('click', () => applyPreset('middle'));

render();
