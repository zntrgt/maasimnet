import {
  calculatePayrollYear,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus,
  kurusToTl
} from './payroll-engine.js';
import { renderMobilePayrollRows } from './mobile-payroll-view.js';
import { runCalculationAndFocusPayroll } from './calculator-actions.js';
import {
  formatMoneyInputElement as applyMoneyInputFormat,
  formatTurkishMoney,
  parseTurkishMoney
} from './money-input.js';
import { getPayrollChangeReasons } from './payroll-change-reasons.js';

const MONTHS = Object.freeze([
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]);

let currentMode = 'gross';
let payrollRowsKurus = [];
let payrolls = [];
let monthlyBaseGrossKurus = Array(12).fill(tlToKurus(100000));
let monthlyExtraGrossKurus = Array(12).fill(0);
const openPayrollDetails = new Set();

function formatCurrency(value) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + ' ₺';
}

function formatKurus(valueKurus) {
  return formatCurrency(kurusToTl(valueKurus));
}

function formatInputMoney(value) {
  return formatTurkishMoney(value);
}

function parseMoneyInput(value) {
  return parseTurkishMoney(value);
}

function formatMoneyInputElement(input) {
  return applyMoneyInputFormat(input);
}

function renderPayrollChangeReason(reason, columnCount) {
  if (!reason) return '';

  return `<tr class="payroll-change-reason-row payroll-change-reason-row--${reason.type}">
    <td colspan="${columnCount}">
      <span class="payroll-change-reason"><span aria-hidden="true">ⓘ</span>${reason.text}</span>
    </td>
  </tr>`;
}

function mapEngineRowToUi(row) {
  return Object.freeze({
    month: row.month,
    baseGross: kurusToTl(row.baseGrossKurus),
    extraGross: kurusToTl(row.extraGrossKurus),
    gross: kurusToTl(row.grossKurus),
    sgkBase: kurusToTl(row.sgkBaseKurus),
    incomeTaxBase: kurusToTl(row.incomeTaxBaseKurus),
    cumulativeTaxBase: kurusToTl(row.cumulativeTaxBaseKurus),
    workerSgk: kurusToTl(row.employeeSgkKurus),
    workerUnemployment: kurusToTl(row.employeeUnemploymentKurus),
    workerSgdp: kurusToTl(row.employeeSgdpKurus),
    grossIncomeTax: kurusToTl(row.calculatedIncomeTaxKurus),
    minimumWageIncomeTaxExemption: kurusToTl(row.minimumWageIncomeTaxExemptionKurus),
    payableIncomeTax: kurusToTl(row.payableIncomeTaxKurus),
    grossStampTax: kurusToTl(row.calculatedStampTaxKurus),
    minimumWageStampExemption: kurusToTl(row.minimumWageStampTaxExemptionKurus),
    payableStampTax: kurusToTl(row.payableStampTaxKurus),
    totalDeductions: kurusToTl(row.totalEmployeeDeductionsKurus),
    net: kurusToTl(row.netKurus),
    employerSgk: kurusToTl(row.employerSgkOrSgdpKurus),
    employerUnemployment: kurusToTl(row.employerUnemploymentKurus),
    cost: kurusToTl(row.employerCostKurus)
  });
}

function getCalculatorOptions() {
  return {
    retired: document.getElementById('check-retired').checked,
    disabilityDegree: Number(document.getElementById('select-disability').value),
    employerScheme: document.getElementById('select-employer-scheme').value
  };
}

function setMode(mode) {
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
}

function handleMainSalaryInput(event) {
  const salaryInput = event?.currentTarget || document.getElementById('input-salary');
  const rawValue = formatMoneyInputElement(salaryInput);
  if (currentMode === 'gross') {
    const valueKurus = tlToKurus(Math.max(0, rawValue));
    monthlyBaseGrossKurus = Array(12).fill(valueKurus);
    monthlyExtraGrossKurus = Array(12).fill(0);
  }
  calculate();
}

function updateBaseGrossFromMonth(monthIndex, rawValue) {
  if (currentMode !== 'gross') return;
  const parsed = parseMoneyInput(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) return;

  const parsedKurus = tlToKurus(parsed);
  for (let index = monthIndex; index < 12; index += 1) {
    monthlyBaseGrossKurus[index] = parsedKurus;
  }

  if (monthIndex === 0) {
    const salaryInput = document.getElementById('input-salary');
    salaryInput.value = formatInputMoney(parsed);
    salaryInput.dataset.rawValue = String(parsed);
  }
  calculate();
}

function updateExtraGrossForMonth(monthIndex, rawValue) {
  if (currentMode !== 'gross') return;
  const parsed = parseMoneyInput(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) return;
  monthlyExtraGrossKurus[monthIndex] = tlToKurus(parsed);
  calculate();
}

function handleTableInputKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.currentTarget.blur();
  }
}

function togglePayrollDetail(monthIndex) {
  if (openPayrollDetails.has(monthIndex)) openPayrollDetails.delete(monthIndex);
  else openPayrollDetails.add(monthIndex);
  updateUI();
}

function renderPayrollDetail(row) {
  const detailPair = (label, value, valueClass = 'text-slate-900') => `
    <div class="detail-pair">
      <span class="text-[11px] leading-4 text-slate-500">${label}</span>
      <strong class="text-[11px] leading-4 text-right ${valueClass}">${value}</strong>
    </div>`;

  return `
    <div class="detail-grid">
      <section class="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 class="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700">Çalışan Kesintileri</h4>
        ${detailPair('Çalışan SGK', formatCurrency(row.workerSgk))}
        ${detailPair('Çalışan İşsizlik Primi', formatCurrency(row.workerUnemployment))}
        ${detailPair('Çalışan SGDP', formatCurrency(row.workerSgdp))}
        ${detailPair('Toplam Çalışan Kesintisi', formatCurrency(row.totalDeductions), 'text-red-600')}
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 class="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700">Vergi Detayı</h4>
        ${detailPair('G.V. Matrah', formatCurrency(row.incomeTaxBase))}
        ${detailPair('Küm. G.V. Matrah', formatCurrency(row.cumulativeTaxBase))}
        ${detailPair('Hesaplanan Gelir Vergisi', formatCurrency(row.grossIncomeTax))}
        ${detailPair('A.Ü. G.V. İstisnası', '-' + formatCurrency(row.minimumWageIncomeTaxExemption), 'text-teal-600')}
        ${detailPair('Ödenecek Gelir Vergisi', formatCurrency(row.payableIncomeTax))}
        ${detailPair('Hesaplanan Damga Vergisi', formatCurrency(row.grossStampTax))}
        ${detailPair('A.Ü. D.V. İstisnası', '-' + formatCurrency(row.minimumWageStampExemption), 'text-teal-600')}
        ${detailPair('Ödenecek Damga Vergisi', formatCurrency(row.payableStampTax))}
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 class="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700">İşveren Tarafı</h4>
        ${detailPair('İşveren SGK / SGDP', formatCurrency(row.employerSgk))}
        ${detailPair('İşveren İşsizlik Primi', formatCurrency(row.employerUnemployment))}
        ${detailPair('Toplam İşveren Maliyeti', formatCurrency(row.cost), 'text-slate-950')}
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 class="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-700">Matrah Bilgileri</h4>
        ${detailPair('Toplam Brüt', formatCurrency(row.gross))}
        ${detailPair('SGK / SGDP Matrahı', formatCurrency(row.sgkBase))}
        ${detailPair('Net Maaş', formatCurrency(row.net), 'text-teal-700')}
      </section>
    </div>`;
}

function calculate() {
  const salaryValue = Math.max(
    0,
    parseMoneyInput(document.getElementById('input-salary').value)
  );
  const options = getCalculatorOptions();

  let baseGrossKurusByMonth;
  let extraGrossKurusByMonth;

  if (currentMode === 'gross') {
    baseGrossKurusByMonth = [...monthlyBaseGrossKurus];
    extraGrossKurusByMonth = [...monthlyExtraGrossKurus];
  } else {
    baseGrossKurusByMonth = solveMonthlyGrossForFixedNet({
      targetNetKurus: tlToKurus(salaryValue),
      ...options
    });
    extraGrossKurusByMonth = Array(12).fill(0);
  }

  payrollRowsKurus = calculatePayrollYear({
    baseGrossKurusByMonth,
    extraGrossKurusByMonth,
    ...options
  });
  payrolls = payrollRowsKurus.map(mapEngineRowToUi);
  updateUI();
}

function renderDesktopPayrollRows(changeReasons) {
  return payrolls.map((row) => {
    const monthName = MONTHS[row.month];
    const isOpen = openPayrollDetails.has(row.month);
    const disabledAttribute = currentMode === 'net' ? 'disabled' : '';
    const changeReason = changeReasons.get(row.month);
    const baseInputClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-right font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';
    const extraInputClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-right font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

    return `<tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td class="px-3 py-4 font-black sticky-col">${monthName}</td>
      <td class="px-3 py-3">
        <input type="text" inputmode="decimal" data-money-input="true" data-raw-value="${row.baseGross}" value="${formatInputMoney(row.baseGross)}" ${disabledAttribute}
          oninput="formatMoneyInputElement(this)"
          onkeydown="handleTableInputKeydown(event)"
          onchange="updateBaseGrossFromMonth(${row.month}, this.value)"
          aria-label="${monthName} temel brüt maaş"
          title="Bu değer ${monthName} ayı ve sonraki aylara uygulanır"
          class="${baseInputClass}">
      </td>
      <td class="px-3 py-3">
        <input type="text" inputmode="decimal" data-money-input="true" data-raw-value="${row.extraGross}" value="${row.extraGross ? formatInputMoney(row.extraGross) : ''}" placeholder="0" ${disabledAttribute}
          oninput="formatMoneyInputElement(this)"
          onkeydown="handleTableInputKeydown(event)"
          onchange="updateExtraGrossForMonth(${row.month}, this.value)"
          aria-label="${monthName} ek brüt ödeme"
          title="Yalnızca ${monthName} ayına uygulanır"
          class="${extraInputClass}">
      </td>
      <td class="px-3 py-4 font-bold text-slate-800">${formatCurrency(row.gross)}</td>
      <td class="px-3 py-4 font-black text-teal-700 bg-teal-50/70">${formatCurrency(row.net)}</td>
      <td class="px-3 py-4 font-semibold text-red-500">${formatCurrency(row.totalDeductions)}</td>
      <td class="px-3 py-4 font-bold text-slate-900">${formatCurrency(row.cost)}</td>
      <td class="px-2 py-4 text-center">
        <button type="button" onclick="togglePayrollDetail(${row.month})"
          aria-expanded="${isOpen}" aria-controls="payroll-detail-${row.month}"
          class="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700">
          ${isOpen ? 'Kapat' : 'Detay'} <span aria-hidden="true">${isOpen ? '↑' : '↓'}</span>
        </button>
      </td>
    </tr>
    ${renderPayrollChangeReason(changeReason, 8)}
    <tr id="payroll-detail-${row.month}" ${isOpen ? '' : 'hidden'}>
      <td colspan="8" class="bg-slate-50 p-4">${renderPayrollDetail(row)}</td>
    </tr>`;
  }).join('');
}

function updateUI() {
  if (payrollRowsKurus.length === 0) return;

  const summary = summarizePayroll(payrollRowsKurus);
  const changeReasons = getPayrollChangeReasons(payrollRowsKurus);
  const averageNet = kurusToTl(summary.averageNetKurus);
  const annualNet = kurusToTl(summary.annualNetKurus);
  const averageGross = kurusToTl(summary.averageGrossKurus);
  const annualGross = kurusToTl(summary.annualGrossKurus);
  const averageEmployerCost = kurusToTl(summary.averageEmployerCostKurus);
  const annualEmployerCost = kurusToTl(summary.annualEmployerCostKurus);
  const highestNet = kurusToTl(summary.highestNetRow.netKurus);
  const lowestNet = kurusToTl(summary.lowestNetRow.netKurus);
  const netDifference = kurusToTl(summary.netDifferenceKurus);
  const effectiveDeductionRate = averageGross > 0
    ? ((averageGross - averageNet) / averageGross) * 100
    : 0;

  document.getElementById('stat-avg-net').innerText = formatCurrency(averageNet);
  document.getElementById('stat-high-net').innerText = `${MONTHS[summary.highestNetRow.month]}: ${formatCurrency(highestNet)}`;
  document.getElementById('stat-low-net').innerText = `${MONTHS[summary.lowestNetRow.month]}: ${formatCurrency(lowestNet)}`;
  document.getElementById('stat-net-diff').innerText = formatCurrency(netDifference);
  document.getElementById('stat-total-net').innerText = formatCurrency(annualNet);
  document.getElementById('stat-avg-gross').innerText = formatCurrency(averageGross);
  document.getElementById('stat-total-gross').innerText = formatCurrency(annualGross);
  document.getElementById('stat-avg-cost').innerText = formatCurrency(averageEmployerCost);
  document.getElementById('stat-tax-rate').innerText = effectiveDeductionRate.toFixed(1) + '%';

  document.getElementById('detail-avg-net').textContent = `${formatCurrency(annualNet)} ÷ 12 = ${formatCurrency(averageNet)}`;
  document.getElementById('detail-high-net').textContent = `En yüksek: ${MONTHS[summary.highestNetRow.month]} · ${formatCurrency(highestNet)}`;
  document.getElementById('detail-low-net').textContent = `En düşük: ${MONTHS[summary.lowestNetRow.month]} · ${formatCurrency(lowestNet)}`;
  document.getElementById('detail-net-diff').textContent = `${formatCurrency(highestNet)} − ${formatCurrency(lowestNet)} = ${formatCurrency(netDifference)}`;
  document.getElementById('detail-total-net').textContent = `12 aylık net toplamı = ${formatCurrency(annualNet)}`;
  document.getElementById('detail-avg-gross').textContent = `${formatCurrency(annualGross)} ÷ 12 = ${formatCurrency(averageGross)}`;
  document.getElementById('detail-total-gross').textContent = `12 aylık brüt toplamı = ${formatCurrency(annualGross)}`;
  document.getElementById('detail-avg-cost').textContent = `${formatCurrency(annualEmployerCost)} ÷ 12 = ${formatCurrency(averageEmployerCost)}`;
  document.getElementById('detail-tax-rate').textContent = `(${formatCurrency(averageGross)} − ${formatCurrency(averageNet)}) ÷ ${formatCurrency(averageGross)} × 100 = ${effectiveDeductionRate.toFixed(1)}%`;

  document.getElementById('payroll-body').innerHTML = renderDesktopPayrollRows(changeReasons);
  document.getElementById('payroll-mobile').innerHTML = renderMobilePayrollRows({
    payrolls,
    months: MONTHS,
    currentMode,
    openDetails: openPayrollDetails,
    formatCurrency,
    formatInputMoney,
    renderPayrollDetail,
    changeReasons,
    renderPayrollChangeReason
  });
}

function calculateAndShowPayroll() {
  runCalculationAndFocusPayroll({
    calculate,
    payrollElement: document.getElementById('payroll-results-shell'),
    viewportWidth: window.innerWidth,
    mobileBreakpoint: 768
  });
}

function downloadCSV() {
  const header = [
    'Ay', 'Temel Brüt', 'Ek Brüt', 'Toplam Brüt', 'SGK Matrahı',
    'GV Matrahı', 'Kümülatif GV Matrahı', 'Çalışan SGK', 'İşsizlik',
    'SGDP', 'Hesaplanan GV', 'AÜ GV İstisnası', 'Ödenecek GV',
    'Hesaplanan DV', 'AÜ DV İstisnası', 'Ödenecek DV',
    'Toplam Kesinti', 'Net Maaş', 'İşveren SGK',
    'İşveren İşsizlik', 'İşveren Maliyeti'
  ];

  const rows = payrolls.map((row) => [
    MONTHS[row.month], row.baseGross, row.extraGross, row.gross, row.sgkBase,
    row.incomeTaxBase, row.cumulativeTaxBase, row.workerSgk,
    row.workerUnemployment, row.workerSgdp, row.grossIncomeTax,
    row.minimumWageIncomeTaxExemption, row.payableIncomeTax,
    row.grossStampTax, row.minimumWageStampExemption, row.payableStampTax,
    row.totalDeductions, row.net, row.employerSgk,
    row.employerUnemployment, row.cost
  ]);

  const csv = '\uFEFF' + [header, ...rows]
    .map((row) => row.join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.hidden = true;
  link.href = url;
  link.download = '2026_maas_bordro.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function initializeMaasimApp() {
  const salaryInput = document.getElementById('input-salary');
  const initialSalary = formatMoneyInputElement(salaryInput) || 100000;
  monthlyBaseGrossKurus = Array(12).fill(tlToKurus(initialSalary));
  monthlyExtraGrossKurus = Array(12).fill(0);
  calculate();
}

Object.assign(window, {
  setMode,
  calculate,
  handleMainSalaryInput,
  formatMoneyInputElement,
  updateBaseGrossFromMonth,
  updateExtraGrossForMonth,
  handleTableInputKeydown,
  togglePayrollDetail,
  calculateAndShowPayroll,
  downloadCSV
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMaasimApp, { once: true });
} else {
  initializeMaasimApp();
}
