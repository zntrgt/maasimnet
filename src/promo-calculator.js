import { comparePromos, refundEstimate } from './promo-engine.js';
import { parseTurkishMoney } from './money-input.js';
import { PROMO_SOURCES } from './promo-data.js';

const tl = (value) => `${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL`;
const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function amountText(row) {
  if (row.amount == null) return 'Bu dilim için tutar açıklanmadı';
  if (row.exact) return tl(row.amount);
  return row.uncertain ? `En fazla ${tl(row.amount)} (bir kısmı koşullu olabilir)` : `En fazla ${tl(row.amount)} (dilim sınırları açıklanmadı)`;
}

export function rowsHtml(rows) {
  return rows.map((r) => `<tr><td><a href="${esc(r.site)}" rel="noopener noreferrer nofollow">${esc(r.bank)}</a></td><td><strong>${esc(amountText(r))}</strong></td><td>${r.totalMax ? tl(r.totalMax) : '—'}</td><td>${r.sources.map((k) => esc(PROMO_SOURCES[k].label)).join(', ')}</td></tr>`).join('');
}

function setText(root, key, value) {
  const node = root.querySelector(`[data-result="${key}"]`);
  if (node) node.textContent = value;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-promo-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = root.querySelector('[data-calculator-results]');
      const error = root.querySelector('[data-calculator-error]');
      const table = root.querySelector('[data-result="table"]');
      const val = (n) => form.elements.namedItem(n)?.value ?? '';
      try {
        const rows = comparePromos(parseTurkishMoney(val('pension')));
        if (table) table.innerHTML = rowsHtml(rows);
        const best = rows.find((r) => r.exact);
        setText(root, 'best', best ? `${best.bank}: ${tl(best.amount)}` : '—');
        const stayed = val('stayed').trim();
        if (stayed !== '') {
          const promo = val('received').trim() === '' ? (best?.amount ?? NaN) : parseTurkishMoney(val('received'));
          const r = refundEstimate({ promoTl: promo, monthsStayed: Number(stayed) });
          setText(root, 'refund', r.remainingMonths === 0 ? 'İade yok (taahhüt dolmuş)' : `${tl(r.refundTl)} (${r.remainingMonths} ay kaldı)`);
        } else setText(root, 'refund', 'Ay girilmedi');
        if (error) error.hidden = true;
        if (results) results.hidden = false;
        if (globalThis.Cookiebot?.consent?.statistics === true && typeof globalThis.gtag === 'function') globalThis.gtag('event', 'promo_compare_complete');
      } catch (err) {
        if (table) table.innerHTML = '';
        for (const key of ['best', 'refund']) setText(root, key, '—');
        if (results) results.hidden = false;
        if (error) { error.hidden = false; error.textContent = err instanceof Error ? err.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });
  }
}
