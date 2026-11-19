import { calculateRetirement } from './retirement-engine.js';

const form = document.querySelector('#emadder-scenario-form');
const result = document.querySelector('#emadder-scenario-result');
const value = (id) => document.querySelector(id).value;
const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeZone: 'UTC' });
const numberFormat = new Intl.NumberFormat('tr-TR');

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function resultCard(title, option, currentDays, hypothetical = false) {
  const card = element('div', hypothetical ? 'ke-result-card ke-result-card--proposal' : 'ke-result-card', '');
  const date = option.eligibleDate
    ? dateFormat.format(new Date(option.eligibleDate))
    : 'Tarih hesaplanamadı';
  const requirements = [
    `${option.age} yaş`,
    `${numberFormat.format(option.requiredDays)} prim günü`
  ];
  if (option.serviceYears) requirements.push(`${option.serviceYears} yıl sigortalılık`);

  card.append(
    element('h4', 'ke-result-label', title),
    element('p', 'ke-result-date', date),
    element('p', 'ke-result-detail', requirements.join(' · ')),
    element('p', 'ke-result-detail', `Eksik prim: ${numberFormat.format(Math.max(0, option.requiredDays - currentDays))} gün`)
  );
  if (hypothetical) card.append(element('p', 'ke-result-note', 'Varsayımsal · EMADDER önerisi yasalaşmadı.'));
  if (!option.eligibleDate) card.append(element('p', 'ke-result-note', 'Girilen prim ödeme planıyla şartlar tamamlanamıyor.'));
  return card;
}

form.querySelector('button').disabled = false;

form.addEventListener('input', () => {
  result.textContent = '';
  result.hidden = true;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  try {
    const today = new Date();
    const asOf = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
      .toISOString().slice(0, 10);
    const currentDays = Number(value('#scenario-days'));
    const { proposal, earliest, options } = calculateRetirement({
      status: '4a',
      gender: value('#scenario-gender'),
      birthDate: value('#scenario-birth'),
      startDate: value('#scenario-start'),
      currentDays,
      daysPerYear: Number(value('#scenario-rate')),
      asOf
    });

    if (!proposal) throw new Error('Bu sigorta başlangıcı için EMADDER senaryosu hesaplanamıyor.');
    // For equal dates (or two unreachable routes), show the route requiring fewer paid days.
    const current = options.filter((option) => option.eligibleDate === (earliest?.eligibleDate ?? null))
      .reduce((lower, option) => option.requiredDays < lower.requiredDays ? option : lower);
    const cards = element('div', 'ke-result-grid', '');
    cards.append(
      resultCard('Yürürlükteki 4/A şartları', current, currentDays),
      resultCard('EMADDER önerisi uygulanırsa', proposal, currentDays, true)
    );
    result.replaceChildren(
      element('h3', 'ke-result-heading', 'Emeklilik tarihi karşılaştırması'),
      cards
    );
  } catch (error) {
    result.textContent = error.message;
  }
  result.hidden = false;
});
