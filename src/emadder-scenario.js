import { calculateRetirement } from './retirement-engine.js';

const form = document.querySelector('#emadder-scenario-form');
const result = document.querySelector('#emadder-scenario-result');
const value = (id) => document.querySelector(id).value;
const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeZone: 'UTC' });
const numberFormat = new Intl.NumberFormat('tr-TR');

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
    const { proposal } = calculateRetirement({
      status: '4a',
      gender: value('#scenario-gender'),
      birthDate: value('#scenario-birth'),
      startDate: value('#scenario-start'),
      currentDays,
      daysPerYear: Number(value('#scenario-rate')),
      asOf
    });

    if (!proposal) throw new Error('Bu sigorta başlangıcı için EMADDER senaryosu hesaplanamıyor.');
    const remainingDays = Math.max(0, proposal.requiredDays - currentDays);
    const requirements = `Önerilen şart: ${proposal.age} yaş ve ${numberFormat.format(proposal.requiredDays)} prim günü. Kalan prim: ${numberFormat.format(remainingDays)} gün.`;
    const estimate = proposal.eligibleDate
      ? `Varsayımsal sonuç: Yaş ve prim şartları ${dateFormat.format(new Date(proposal.eligibleDate))} tarihinde tamamlanır.`
      : 'Gelecekte prim ödenmeyeceği varsayımıyla prim şartı tamamlanmıyor.';
    result.textContent = `${estimate} ${requirements} EMADDER önerisi yasalaşmadı.`;
  } catch (error) {
    result.textContent = error.message;
  }
  result.hidden = false;
});
