import { calculateBorrowing } from './borrowing-engine.js';
import { parseTurkishMoney } from './money-input.js';

const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const REGIME = { eyt: 'EYT kapsamı (8 Eylül 1999 ve öncesi)', transition: '1999–2008 kuralları', reform: '2008 sonrası kurallar' };
const KEYS = ['total', 'daily', 'days', 'shift'];
const fmtDate = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

export function compute(v) {
  const pekText = String(v.pek ?? '').trim();
  const intOrNull = (x) => (String(x ?? '').trim() === '' ? NaN : Number(x));
  return calculateBorrowing({
    type: v.type,
    days: v.type === 'dogum' ? undefined : intOrNull(v.days),
    daysPerChild: v.type === 'dogum' ? Array.from({ length: Number(v.children || 1) }, (_, i) => intOrNull(v.childDays?.[i])) : null,
    dailyPekKurus: pekText === '' ? null : Math.round(parseTurkishMoney(pekText) * 100),
    beforeFirstInsurance: Boolean(v.before),
    firstInsuranceDate: v.before ? (v.first || null) : null
  });
}

export function shiftText(r) {
  if (r.type === 'dogum') return 'Değişmez (doğum, ilk girişten sonra olmalı)';
  if (!r.startShift) return 'Değişmez; borçlanılan günler prim gününüze eklenir';
  const s = r.startShift;
  const change = s.fromRegime !== s.toRegime ? ` — ${REGIME[s.fromRegime]} yerine ${REGIME[s.toRegime]}` : '';
  return `${fmtDate(s.from)} → ${fmtDate(s.to)}${change}`;
}

function setText(root, key, value) {
  const node = root.querySelector(`[data-result="${key}"]`);
  if (node) node.textContent = value;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-borrow-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    const type = form.elements.namedItem('type');
    const before = form.elements.namedItem('before');
    const sync = () => {
      const childCount = Number(form.elements.namedItem('children')?.value || 1);
      for (const node of root.querySelectorAll('[data-only]')) {
        const child = Number(node.getAttribute('data-child') || 0);
        node.hidden = node.getAttribute('data-only') !== type.value || (child > 0 && child > childCount);
      }
      const first = root.querySelector('[data-first]');
      if (first) first.hidden = type.value !== 'askerlik' || !before.checked;
    };
    type.addEventListener('change', sync);
    form.elements.namedItem('children')?.addEventListener('change', sync);
    before.addEventListener('change', sync);
    sync();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = root.querySelector('[data-calculator-results]');
      const error = root.querySelector('[data-calculator-error]');
      const val = (n) => form.elements.namedItem(n)?.value;
      try {
        if (type.value === 'askerlik' && before.checked && !val('first')) throw new Error('İlk sigorta giriş tarihini girin.');
        const r = compute({ type: type.value, days: val('days'), childDays: [val('child1'), val('child2'), val('child3')], children: val('children'), pek: val('pek'), before: before.checked, first: val('first') });
        setText(root, 'total', tl(r.totalKurus));
        setText(root, 'daily', `${tl(r.dailyKurus)} (%${r.ratePct})`);
        setText(root, 'days', `${r.totalDays.toLocaleString('tr-TR')} gün`);
        setText(root, 'shift', shiftText(r));
        if (error) error.hidden = true;
        if (results) results.hidden = false;
        if (globalThis.Cookiebot?.consent?.statistics === true && typeof globalThis.gtag === 'function') globalThis.gtag('event', 'borrowing_calculator_complete', { borrowing_type: r.type });
      } catch (err) {
        for (const key of KEYS) setText(root, key, '—');
        if (results) results.hidden = false;
        if (error) { error.hidden = false; error.textContent = err instanceof Error ? err.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });
  }
}
