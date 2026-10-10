import { minPensionOutlook } from './min-pension-engine.js';
import { parseTurkishMoney } from './money-input.js';

const pct = (value) => `%${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const KEYS = ['payment', 'kok', 'topup', 'effective', 'note'];

const parsePercent = (value) => {
  const raw = String(value ?? '').trim().replace('%', '').replace(',', '.');
  return raw === '' ? NaN : Number(raw);
};

export function compute({ kokText, scenario, customMonthly, floorMode, customFloor }) {
  const kokKurus = Math.round(parseTurkishMoney(kokText) * 100);
  const assumedMonthlyPct = scenario === 'custom' ? parsePercent(customMonthly) : Number(scenario ?? 0);
  if (!Number.isFinite(assumedMonthlyPct)) throw new Error('Kalan aylar için aylık enflasyon varsayımını girin.');
  const customFloorKurus = floorMode === 'custom' ? Math.round(parseTurkishMoney(customFloor) * 100) : null;
  return minPensionOutlook({ kokKurus, assumedMonthlyPct, floorMode, customFloorKurus });
}

export function noteText(r) {
  if (!r.onFloorAfter && !r.onFloorNow) return `Kök aylığınız tabanın üzerinde; zam oranının tamamı (${pct(r.raisePct)}) size yansır.`;
  if (!r.onFloorAfter) return `Zamla kök aylığınız tabanı geçiyor; artık taban desteği almazsınız ve ödemeniz kök aylığınızla belirlenir.`;
  if (r.increaseKurus <= 0) return 'Taban değişmezse ödemeniz aynı kalır: zam kök aylığınıza uygulanır ama kök aylık hâlâ tabanın altında.';
  if (Math.abs(r.effectivePct - r.raisePct) < 0.05) return `Ödemeniz taban aylıkla belirlenir. Bu senaryoda taban da zam oranında (${pct(r.raisePct)}) arttığı için artışınız zamla aynı; taban artırılmazsa ödemeniz değişmez.`;
  return `Ödemeniz taban aylıkla belirlenir. Size yansıyan artış ${pct(r.effectivePct)}; zam oranı ${pct(r.raisePct)} yalnızca kök aylığınıza uygulanır.`;
}

function setText(root, key, value) {
  const node = root.querySelector(`[data-result="${key}"]`);
  if (node) node.textContent = value;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-mp-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    const scenario = form.elements.namedItem('scenario');
    const floorMode = form.elements.namedItem('floorMode');
    const sync = () => {
      const customMonthly = root.querySelector('[data-custom-field]');
      if (customMonthly) customMonthly.hidden = scenario?.value !== 'custom';
      const customFloor = root.querySelector('[data-custom-floor]');
      if (customFloor) customFloor.hidden = floorMode?.value !== 'custom';
    };
    scenario?.addEventListener('change', sync);
    floorMode?.addEventListener('change', sync);
    sync();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = root.querySelector('[data-calculator-results]');
      const error = root.querySelector('[data-calculator-error]');
      const val = (n) => form.elements.namedItem(n)?.value;
      try {
        const r = compute({ kokText: val('kok'), scenario: val('scenario'), customMonthly: val('customMonthly'), floorMode: val('floorMode'), customFloor: val('customFloor') });
        setText(root, 'payment', tl(r.paymentKurus));
        setText(root, 'kok', `${tl(r.newKokKurus)} (${pct(r.raisePct)} zam)`);
        setText(root, 'topup', r.topUpKurus > 0 ? tl(r.topUpKurus) : 'Yok');
        setText(root, 'effective', `${r.increaseKurus >= 0 ? '+' : ''}${tl(r.increaseKurus)} (${pct(r.effectivePct)})`);
        setText(root, 'note', noteText(r));
        if (error) error.hidden = true;
        if (results) results.hidden = false;
        if (globalThis.Cookiebot?.consent?.statistics === true && typeof globalThis.gtag === 'function') globalThis.gtag('event', 'min_pension_calculator_complete', { floor_mode: val('floorMode') });
      } catch (err) {
        for (const key of KEYS) setText(root, key, '—');
        if (results) results.hidden = false;
        if (error) { error.hidden = false; error.textContent = err instanceof Error ? err.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });
  }
}
