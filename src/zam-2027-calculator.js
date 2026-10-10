import { emekliZam, memurZam, KNOWN_MONTHS } from './zam-2027-engine.js';
import { parseTurkishMoney } from './money-input.js';

const pct = (value) => `%${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

export function parsePercent(value) {
  const raw = String(value ?? '').trim().replace('%', '').replace(',', '.');
  if (raw === '') return NaN;
  return Number(raw);
}

export function compute(kind, { amountText, scenario, customText }) {
  const currentKurus = Math.round(parseTurkishMoney(amountText) * 100);
  const assumedMonthlyPct = scenario === 'custom' ? parsePercent(customText) : Number(scenario);
  if (!Number.isFinite(assumedMonthlyPct)) throw new Error('Kalan aylar için aylık enflasyon varsayımını girin.');
  return kind === 'memur' ? memurZam({ currentKurus, assumedMonthlyPct }) : emekliZam({ currentKurus, assumedMonthlyPct });
}

export function basisText(kind, result) {
  const known = KNOWN_MONTHS.length === 6 ? '6 ayın tamamı kesinleşti' : `${KNOWN_MONTHS.length} ay kesinleşen + ${6 - KNOWN_MONTHS.length} ay varsayım`;
  if (kind === 'memur') return `6 aylık enflasyon ${pct(result.inflationPct)} → enflasyon farkı ${pct(result.farkPct)} + toplu sözleşme %${result.collectivePct} (${known})`;
  return `6 aylık enflasyon ${pct(result.inflationPct)} (${known})`;
}

function setText(root, selector, value) {
  const node = root.querySelector(selector);
  if (node) node.textContent = value;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-zam-calculator]')) {
    const kind = root.getAttribute('data-zam-calculator');
    const form = root.querySelector('form');
    if (!form) continue;
    const scenario = form.elements.namedItem('scenario');
    const custom = root.querySelector('[data-custom-field]');
    scenario?.addEventListener('change', () => { if (custom) custom.hidden = scenario.value !== 'custom'; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = root.querySelector('[data-calculator-results]');
      const error = root.querySelector('[data-calculator-error]');
      try {
        const result = compute(kind, { amountText: form.elements.namedItem('currentAmount')?.value, scenario: scenario?.value, customText: form.elements.namedItem('customMonthly')?.value });
        setText(root, '[data-result="new"]', tl(result.newKurus));
        setText(root, '[data-result="rate"]', pct(result.raisePct));
        setText(root, '[data-result="increase"]', `+${tl(result.increaseKurus)}`);
        setText(root, '[data-result="basis"]', basisText(kind, result));
        if (error) error.hidden = true;
        if (results) results.hidden = false;
        if (globalThis.Cookiebot?.consent?.statistics === true && typeof globalThis.gtag === 'function') globalThis.gtag('event', 'zam_2027_calculator_complete', { zam_kind: kind });
      } catch (err) {
        for (const key of ['new', 'rate', 'increase', 'basis']) setText(root, `[data-result="${key}"]`, '—');
        if (results) results.hidden = false;
        if (error) { error.hidden = false; error.textContent = err instanceof Error ? err.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });
  }
}
