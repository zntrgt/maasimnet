import { calculateRent } from './rent-engine.js';
import { parseTurkishMoney } from './money-input.js';

const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const pct = (v) => `%${Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const KEYS = ['max', 'increase', 'cap', 'agreed'];

const pctInput = (v) => { const raw = String(v ?? '').trim().replace('%', '').replace(',', '.'); return raw === '' ? null : Number(raw); };
export function compute({ currentText, renewal, agreedText, customCapText }) {
  return calculateRent({ currentKurus: Math.round(parseTurkishMoney(currentText) * 100), renewal, agreedPct: pctInput(agreedText), customCapPct: pctInput(customCapText) });
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
    const renewalSelect = form.elements.namedItem('renewal');
    const customField = root.querySelector('[data-custom-cap]');
    renewalSelect?.addEventListener('change', () => { if (customField) customField.hidden = renewalSelect.value !== 'custom'; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = root.querySelector('[data-calculator-results]');
      const error = root.querySelector('[data-calculator-error]');
      try {
        const r = compute({ currentText: form.elements.namedItem('current')?.value, renewal: form.elements.namedItem('renewal')?.value, agreedText: form.elements.namedItem('agreed')?.value, customCapText: form.elements.namedItem('customCap')?.value });
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
