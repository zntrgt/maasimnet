import { calculateRent } from './rent-engine.js';
import { parseTurkishMoney } from './money-input.js';

const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const pct = (v) => `%${Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const KEYS = ['max', 'increase', 'cap', 'agreed'];

export function compute({ currentText, renewal, agreedText }) {
  const agreedRaw = String(agreedText ?? '').trim().replace('%', '').replace(',', '.');
  return calculateRent({ currentKurus: Math.round(parseTurkishMoney(currentText) * 100), renewal, agreedPct: agreedRaw === '' ? null : Number(agreedRaw) });
}

export function agreedText(result) {
  if (!result.agreed) return 'Girilmedi';
  if (result.agreed.exceedsCap) return `${pct(result.agreed.pct)} tavanı aşıyor: yasal sınırın ${tl(result.agreed.excessKurus)} üzerinde`;
  return `${pct(result.agreed.pct)} tavanın içinde: yeni kira ${tl(result.agreed.agreedKurus)}`;
}

function setText(root, key, value) {
  const node = root.querySelector(`[data-result="${key}"]`);
  if (node) node.textContent = value;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-rent-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = root.querySelector('[data-calculator-results]');
      const error = root.querySelector('[data-calculator-error]');
      try {
        const r = compute({ currentText: form.elements.namedItem('current')?.value, renewal: form.elements.namedItem('renewal')?.value, agreedText: form.elements.namedItem('agreed')?.value });
        setText(root, 'max', tl(r.maxKurus));
        setText(root, 'increase', `+${tl(r.maxIncreaseKurus)}`);
        setText(root, 'cap', `${pct(r.cap.pct)} (${r.cap.label})`);
        setText(root, 'agreed', agreedText(r));
        if (error) error.hidden = true;
        if (results) results.hidden = false;
        if (globalThis.Cookiebot?.consent?.statistics === true && typeof globalThis.gtag === 'function') globalThis.gtag('event', 'rent_calculator_complete');
      } catch (err) {
        for (const key of KEYS) setText(root, key, '—');
        if (results) results.hidden = false;
        if (error) { error.hidden = false; error.textContent = err instanceof Error ? err.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });
  }
}
