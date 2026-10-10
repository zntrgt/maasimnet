import { calculateRetiredWorker } from './retired-worker-engine.js';
import { parseTurkishMoney } from './money-input.js';

const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const RESULT_KEYS = ['primary', 'sgdp', 'annual-net', 'advantage', 'employer'];

export function compute({ mode, amountText }) {
  return calculateRetiredWorker({ mode, amountKurus: Math.round(parseTurkishMoney(amountText) * 100) });
}

export function rowsHtml(result) {
  return result.rows.map((row, i) => `<tr><th scope="row">${MONTHS[i]}</th><td>${tl(row.grossKurus)}</td><td>${tl(row.employeeSgdpKurus)}</td><td>${tl(row.payableIncomeTaxKurus)}</td><td>${tl(row.payableStampTaxKurus)}</td><td><b>${tl(row.netKurus)}</b></td></tr>`).join('');
}

function setText(root, key, value) {
  const node = root.querySelector(`[data-result="${key}"]`);
  if (node) node.textContent = value;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-rw-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    const mode = form.elements.namedItem('mode');
    const label = root.querySelector('[data-amount-label]');
    mode?.addEventListener('change', () => { if (label) label.textContent = mode.value === 'net' ? 'Hedef aylık net ücret (TL)' : 'Aylık brüt ücret (TL)'; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = root.querySelector('[data-calculator-results]');
      const error = root.querySelector('[data-calculator-error]');
      const rows = root.querySelector('[data-result="rows"]');
      try {
        const result = compute({ mode: mode?.value, amountText: form.elements.namedItem('amount')?.value });
        if (result.mode === 'net') {
          setText(root, 'primary-label', 'Gereken yıllık ortalama aylık brüt');
          setText(root, 'primary', tl(result.summary.averageGrossKurus));
        } else {
          setText(root, 'primary-label', 'Yıllık ortalama aylık net');
          setText(root, 'primary', tl(result.summary.averageNetKurus));
        }
        setText(root, 'sgdp', tl(result.rows[0].employeeSgdpKurus));
        setText(root, 'annual-net', tl(result.summary.annualNetKurus));
        setText(root, 'advantage', `${result.annualNetAdvantageKurus >= 0 ? '+' : ''}${tl(result.annualNetAdvantageKurus)}`);
        setText(root, 'employer', tl(result.summary.averageEmployerCostKurus));
        if (rows) rows.innerHTML = rowsHtml(result);
        if (error) error.hidden = true;
        if (results) results.hidden = false;
        if (globalThis.Cookiebot?.consent?.statistics === true && typeof globalThis.gtag === 'function') globalThis.gtag('event', 'retired_worker_calculator_complete', { calc_mode: result.mode });
      } catch (err) {
        for (const key of RESULT_KEYS) setText(root, key, '—');
        if (rows) rows.innerHTML = '';
        if (results) results.hidden = false;
        if (error) { error.hidden = false; error.textContent = err instanceof Error ? err.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });
  }
}
