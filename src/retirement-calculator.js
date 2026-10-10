import { calculateRetirement } from './retirement-engine.js';

const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const formatDate = (iso) => (iso ? dateFormatter.format(new Date(`${iso}T00:00:00Z`)) : '—');
const formatDays = (days) => Number(days).toLocaleString('tr-TR');
const BINDING = { age: 'Yaş şartı', days: 'Prim günü şartı', service: 'Sigortalılık süresi şartı', law: 'EYT yürürlük tarihi (3 Mart 2023)' };
const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function todayIso(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function remainingText(fromIso, toIso) {
  if (!toIso || toIso <= fromIso) return 'Şartlar tamamlanmış';
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0 && rest === 0) return '1 aydan az';
  return [years ? `${years} yıl` : '', rest ? `${rest} ay` : ''].filter(Boolean).join(' ');
}

function setText(root, selector, value) {
  const node = root.querySelector(selector);
  if (node) node.textContent = value;
}

export function proposalHtml(result) {
  const p = result.proposal;
  if (!p) return '';
  const earliest = result.earliest?.eligibleDate;
  const comparison = !p.eligibleDate
    ? 'Girdiğiniz yıllık prim günüyle öneri tablosundaki gün sayısı dolmuyor.'
    : result.alreadyEligible
      ? 'Bugünkü kurallara göre şartları zaten sağlıyorsunuz; öneri sizin için bir şey değiştirmez.'
      : result.proposalGainDays > 0
        ? `Öneri yasalaşırsa bugünkü kurala göre yaklaşık <strong>${esc(remainingText(p.eligibleDate, earliest))}</strong> daha erken emekli olabilirdiniz.`
        : 'Prim gününüz bu tablonun gün şartını geç doldurduğu için öneri sizi daha erken emekli etmiyor; bugünkü kural sizin için daha erken.';
  return `<small>Senaryo · Yasalaşmadı</small><h3>EMADDER önerisi yasalaşsaydı: ${esc(formatDate(p.eligibleDate))}</h3><p>${p.row.fromYear === p.row.toYear ? p.row.fromYear : `${p.row.fromYear}–${p.row.toYear}`} girişliler için önerilen şart: ${p.age} yaş ve ${formatDays(p.requiredDays)} prim günü.</p><p>${comparison}</p><p><a href="/kademeli-emeklilik/">Kademeli emeklilikte son durum →</a></p>`;
}

export function optionsRows(result) {
  return result.options.map((item) => `<tr><td>${esc(item.label)}${item.serviceYears && !item.label.includes('yıl') ? ` <small>(${item.serviceYears} yıl sigortalılık)</small>` : ''}</td><td>${formatDays(item.requiredDays)}</td><td>${esc(formatDate(item.daysDate))}</td><td>${item.age == null ? 'Yok' : item.age}</td><td><strong>${esc(formatDate(item.eligibleDate))}</strong></td></tr>`).join('');
}

function render(root, result) {
  const earliest = result.earliest;
  if (result.alreadyEligible) {
    setText(root, '[data-result="headline-label"]', 'Bugünkü kurallara göre');
    setText(root, '[data-result="headline"]', 'Emeklilik şartlarını sağlıyor görünüyorsunuz');
  } else {
    setText(root, '[data-result="headline-label"]', 'En erken emeklilik tarihi');
    setText(root, '[data-result="headline"]', earliest ? formatDate(earliest.eligibleDate) : 'Bu varsayımla hesaplanamıyor');
  }
  setText(root, '[data-result="age"]', earliest ? `${earliest.ageAtEligible} yaş` : '—');
  setText(root, '[data-result="remaining"]', earliest ? remainingText(result.asOf, earliest.eligibleDate) : '—');
  setText(root, '[data-result="binding"]', earliest ? `${BINDING[earliest.binding]} · ${earliest.label}` : 'Yıllık prim günü 0 olduğu için prim şartı dolmuyor');
  const rows = root.querySelector('[data-result="options"]');
  if (rows) rows.innerHTML = optionsRows(result);
  const proposal = root.querySelector('[data-result="proposal"]');
  if (proposal) {
    proposal.innerHTML = proposalHtml(result);
    proposal.hidden = !result.proposal;
  }
  const error = root.querySelector('[data-calculator-error]');
  if (error) error.hidden = true;
  const results = root.querySelector('[data-calculator-results]');
  if (results) results.hidden = false;
}

export function sendRetirementCalculatorEvent(regime) {
  if (globalThis.Cookiebot?.consent?.statistics !== true) return false;
  if (typeof globalThis.gtag !== 'function') return false;
  globalThis.gtag('event', 'retirement_calculator_complete', { retirement_regime: regime });
  return true;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-retirement-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = (name) => form.elements.namedItem(name)?.value ?? '';
      try {
        const result = calculateRetirement({
          gender: value('gender'),
          birthDate: value('birthDate'),
          startDate: value('startDate'),
          currentDays: value('currentDays') === '' ? NaN : Number(value('currentDays')),
          daysPerYear: value('daysPerYear') === '' ? 360 : Number(value('daysPerYear')),
          asOf: todayIso()
        });
        render(root, result);
        sendRetirementCalculatorEvent(result.regime);
        root.querySelector('[data-calculator-results]')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      } catch (error) {
        const results = root.querySelector('[data-calculator-results]');
        if (results) results.hidden = false;
        const node = root.querySelector('[data-calculator-error]');
        if (node) { node.hidden = false; node.textContent = error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });
  }
}
