import {
  calculatePayrollYear,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus,
  kurusToTl
} from './payroll-engine.js';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const STORAGE_KEY = 'maasim-offer-comparison-v1';

const parseMoney = (value) => Math.max(0, Number(String(value || '').replace(/\./g, '').replace(',', '.')) || 0);
const money = (kurus) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurusToTl(kurus)) + ' ₺';

function getValue(id) {
  return document.getElementById(id)?.value || '';
}

function readPackage(prefix) {
  return {
    mode: getValue(`${prefix}-mode`),
    salaryTl: parseMoney(getValue(`${prefix}-salary`)),
    extraTl: parseMoney(getValue(`${prefix}-extra`)),
    benefitTl: parseMoney(getValue(`${prefix}-benefit`))
  };
}

function grossesFor(mode, monthlyValueTl) {
  if (mode === 'net') {
    return solveMonthlyGrossForFixedNet({ targetNetKurus: tlToKurus(monthlyValueTl), employerScheme: 'other' });
  }
  return Array(12).fill(tlToKurus(monthlyValueTl));
}

function firstBracketMonth(rows, ratePpm) {
  const row = rows.find((item) => item.incomeTaxRatesPpm.includes(ratePpm));
  return row ? MONTHS[row.month] : 'Yıl içinde girilmiyor';
}

function calculateScenario({ currentPackage, offerPackage = null, startMonth = 0 }) {
  const currentGrosses = grossesFor(currentPackage.mode, currentPackage.salaryTl);
  const offerGrosses = offerPackage ? grossesFor(offerPackage.mode, offerPackage.salaryTl) : currentGrosses;
  const baseGrossKurusByMonth = currentGrosses.map((gross, month) => month < startMonth ? gross : offerGrosses[month]);
  const extraGrossKurusByMonth = Array.from({ length: 12 }, (_, month) => {
    const extraTl = month < startMonth || !offerPackage ? currentPackage.extraTl : offerPackage.extraTl;
    return tlToKurus(extraTl);
  });
  const annualBenefitsKurus = Array.from({ length: 12 }, (_, month) => {
    const benefitTl = month < startMonth || !offerPackage ? currentPackage.benefitTl : offerPackage.benefitTl;
    return tlToKurus(benefitTl);
  }).reduce((sum, value) => sum + value, 0);

  const rows = calculatePayrollYear({ baseGrossKurusByMonth, extraGrossKurusByMonth, employerScheme: 'other' });
  const summary = summarizePayroll(rows);

  return {
    rows,
    summary,
    annualBenefitsKurus,
    totalPackageKurus: summary.annualNetKurus + annualBenefitsKurus,
    first27Month: firstBracketMonth(rows, 270000),
    first35Month: firstBracketMonth(rows, 350000)
  };
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function signedMoney(valueKurus) {
  const sign = valueKurus > 0 ? '+' : '';
  return sign + money(valueKurus);
}

function render() {
  const startMonth = Number(getValue('offer-start-month') || 0);
  const currentPackage = readPackage('current');
  const offerPackage = readPackage('offer');
  const current = calculateScenario({ currentPackage });
  const offer = calculateScenario({ currentPackage, offerPackage, startMonth });

  const annualNetDiff = offer.summary.annualNetKurus - current.summary.annualNetKurus;
  const averageNetDiff = offer.summary.averageNetKurus - current.summary.averageNetKurus;
  const packageDiff = offer.totalPackageKurus - current.totalPackageKurus;
  const employerCostDiff = offer.summary.annualEmployerCostKurus - current.summary.annualEmployerCostKurus;

  setText('compare-annual-net-diff', signedMoney(annualNetDiff));
  setText('compare-average-net-diff', signedMoney(averageNetDiff));
  setText('compare-package-diff', signedMoney(packageDiff));
  setText('compare-employer-cost-diff', signedMoney(employerCostDiff));
  setText('current-annual-net', money(current.summary.annualNetKurus));
  setText('offer-annual-net', money(offer.summary.annualNetKurus));
  setText('current-average-net', money(current.summary.averageNetKurus));
  setText('offer-average-net', money(offer.summary.averageNetKurus));
  setText('current-first-27', current.first27Month);
  setText('offer-first-27', offer.first27Month);
  setText('current-first-35', current.first35Month);
  setText('offer-first-35', offer.first35Month);

  const verdict = annualNetDiff > 0
    ? `Yeni teklif yıllık net gelirde ${money(annualNetDiff)} avantaj sağlıyor.`
    : annualNetDiff < 0
      ? `Yeni teklif yıllık net gelirde ${money(Math.abs(annualNetDiff))} daha düşük kalıyor.`
      : 'İki senaryonun yıllık net geliri aynı.';
  setText('comparison-verdict', verdict);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentMode: getValue('current-mode'), currentSalary: getValue('current-salary'), currentExtra: getValue('current-extra'), currentBenefit: getValue('current-benefit'),
    offerMode: getValue('offer-mode'), offerSalary: getValue('offer-salary'), offerExtra: getValue('offer-extra'), offerBenefit: getValue('offer-benefit'),
    offerStartMonth: getValue('offer-start-month')
  }));
}

function restore() {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!state) return;
    const mapping = {
      'current-mode': state.currentMode, 'current-salary': state.currentSalary, 'current-extra': state.currentExtra, 'current-benefit': state.currentBenefit,
      'offer-mode': state.offerMode, 'offer-salary': state.offerSalary, 'offer-extra': state.offerExtra, 'offer-benefit': state.offerBenefit,
      'offer-start-month': state.offerStartMonth
    };
    Object.entries(mapping).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value !== undefined && value !== null) element.value = value;
    });
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function reset() {
  localStorage.removeItem(STORAGE_KEY);
  document.getElementById('comparison-form')?.reset();
  render();
}

restore();
document.querySelectorAll('[data-compare-input]').forEach((element) => element.addEventListener('input', render));
document.getElementById('comparison-reset')?.addEventListener('click', reset);
render();
