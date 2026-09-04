import { parseTurkishMoney, formatMoneyInputElement } from './money-input.js';
import {
  buildHistoricalHalfYearValues,
  calculateHistoricalPayrollYear,
  historicalPayrollSummary,
  solveHistoricalGrossForNet
} from './historical-payroll-engine.js';
import { getHistoricalPayrollData, getHistoricalPeriod } from './historical-payroll-data.js';

const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatKurus(value) { return money.format(value / 100); }
function toKurus(input) { return Math.round(parseTurkishMoney(input.value) * 100); }
function rateLabel(rates = []) { return rates.length ? rates.map((rate) => `%${integer.format(rate / 10_000)}`).join(' → ') : '—'; }

function init(root) {
  const year = Number(root.dataset.historicalYear);
  const data = getHistoricalPayrollData(year);
  const form = root.querySelector('form');
  const firstInput = root.querySelector('[name="first_amount"]');
  const secondInput = root.querySelector('[name="second_amount"]');
  const modeInputs = [...root.querySelectorAll('[name="direction"]')];
  const agiSelect = root.querySelector('[name="agi_option"]');
  const results = root.querySelector('[data-historical-results]');
  const error = root.querySelector('[data-historical-error]');
  const tbody = root.querySelector('[data-historical-table]');
  const copyButton = root.querySelector('[data-copy-historical]');
  const amountLabel = root.querySelector('[data-amount-label]');
  const secondHelper = root.querySelector('[data-second-helper]');
  let lastResult = null;

  for (const input of [firstInput, secondInput]) input?.addEventListener('input', () => formatMoneyInputElement(input));

  function direction() { return modeInputs.find((item) => item.checked)?.value || 'gross_to_net'; }
  function syncLabels() {
    const grossToNet = direction() === 'gross_to_net';
    amountLabel.textContent = grossToNet ? 'Aylık brüt ücret' : 'Hedef aylık net ücret';
    firstInput.placeholder = grossToNet ? 'Örn. 50.000,00' : 'Örn. 35.000,00';
    secondInput.placeholder = 'Boş bırakırsanız ilk tutar kullanılır';
    secondHelper.textContent = 'Temmuz–Aralık için maaş değiştiyse girin. Boş bırakırsanız yıl boyunca ilk tutar kullanılır.';
  }
  modeInputs.forEach((input) => input.addEventListener('change', syncLabels));
  syncLabels();

  function renderRows(rows) {
    tbody.innerHTML = rows.map((row) => `<tr>
      <th scope="row">${monthNames[row.month]}</th>
      <td>${formatKurus(row.grossKurus)}</td>
      <td>${formatKurus(row.employeeSgkKurus + row.employeeUnemploymentKurus)}</td>
      <td>${formatKurus(row.payableIncomeTaxKurus)}</td>
      <td>${formatKurus(row.payableStampTaxKurus)}</td>
      <td>${rateLabel(row.incomeTaxRatesPpm)}</td>
      <td><strong>${formatKurus(row.netKurus)}</strong></td>
    </tr>`).join('');
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    results.hidden = true;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.hidden = true;
    const firstKurus = toKurus(firstInput);
    const secondKurus = toKurus(secondInput) || firstKurus;
    if (firstKurus <= 0 || secondKurus <= 0) return showError('Hesaplama için pozitif bir ücret tutarı girin.');

    const values = buildHistoricalHalfYearValues(firstKurus, secondKurus);
    const agiOptionId = data.agiEnabled ? (agiSelect?.value || 'single') : 'single';
    let rows;
    let grossValues;
    if (direction() === 'gross_to_net') {
      grossValues = values;
      rows = calculateHistoricalPayrollYear({ year, grossKurusByMonth: grossValues, agiOptionId });
    } else {
      const solved = solveHistoricalGrossForNet({ year, targetNetKurusByMonth: values, agiOptionId });
      grossValues = solved.grossKurusByMonth;
      rows = solved.rows;
    }

    const summary = historicalPayrollSummary(rows);
    const belowMinimumMonths = rows.filter((row) => row.grossKurus < row.minimumGrossKurus).map((row) => monthNames[row.month]);
    root.querySelector('[data-primary-label]').textContent = direction() === 'gross_to_net' ? 'Aylık ortalama net' : 'Aylık ortalama brüt';
    root.querySelector('[data-primary-value]').textContent = formatKurus(direction() === 'gross_to_net' ? summary.averageNetKurus : summary.averageGrossKurus);
    root.querySelector('[data-result="annual-gross"]').textContent = formatKurus(summary.annualGrossKurus);
    root.querySelector('[data-result="annual-net"]').textContent = formatKurus(summary.annualNetKurus);
    root.querySelector('[data-result="annual-tax"]').textContent = formatKurus(summary.annualTaxKurus);
    root.querySelector('[data-result="annual-premium"]').textContent = formatKurus(summary.annualEmployeePremiumKurus);
    root.querySelector('[data-result="minimum-warning"]').textContent = belowMinimumMonths.length
      ? `Dikkat: ${belowMinimumMonths.join(', ')} aylarında hesaplanan brüt tutar o dönemin tam zamanlı asgari ücretinin altında.`
      : `${year} tam zamanlı asgari ücret tabanı açısından ay bazında uyarı yok.`;
    renderRows(rows);
    results.hidden = false;
    lastResult = { year, rows, summary, direction: direction(), belowMinimumMonths, grossValues };
  });

  copyButton?.addEventListener('click', async () => {
    if (!lastResult) return;
    const { summary, direction: activeDirection } = lastResult;
    const text = `${year} Maaş Hesaplama · ${activeDirection === 'gross_to_net' ? 'Brütten nete' : 'Netten brüte'}\nYıllık brüt: ${formatKurus(summary.annualGrossKurus)}\nYıllık net: ${formatKurus(summary.annualNetKurus)}\nYıllık vergi: ${formatKurus(summary.annualTaxKurus)}\nÇalışan SGK + işsizlik primi: ${formatKurus(summary.annualEmployeePremiumKurus)}\nmaasim.net/${year}-maas-hesaplama/`;
    try {
      await navigator.clipboard.writeText(text);
      const old = copyButton.textContent;
      copyButton.textContent = 'Kopyalandı ✓';
      setTimeout(() => { copyButton.textContent = old; }, 1600);
    } catch {
      copyButton.textContent = 'Kopyalanamadı';
    }
  });

  const january = getHistoricalPeriod(year, 0);
  root.querySelector('[data-official-minimum]').textContent = `${formatKurus(january.minimumGrossKurus)} brüt · ${formatKurus(january.referenceMinimumNetKurus)} net`;
  const july = getHistoricalPeriod(year, 6);
  const julyBox = root.querySelector('[data-official-minimum-july]');
  if (julyBox) {
    if (july.minimumGrossKurus !== january.minimumGrossKurus) {
      julyBox.hidden = false;
      const julyValue = julyBox.querySelector('strong');
      if (julyValue) julyValue.textContent = `${formatKurus(july.minimumGrossKurus)} brüt · ${formatKurus(july.referenceMinimumNetKurus)} net`;
    } else julyBox.hidden = true;
  }
}

document.querySelectorAll('[data-historical-payroll-calculator]').forEach(init);
