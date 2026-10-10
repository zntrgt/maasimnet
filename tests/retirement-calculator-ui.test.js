import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRetirement } from '../src/retirement-engine.js';
import { optionsRows, remainingText, proposalHtml } from '../src/retirement-calculator.js';

test('geçmişte dolan seçenekler tarih yerine "Tamamlanmış" gösterir', () => {
  const r = calculateRetirement({ gender: 'E', birthDate: '1960-01-01', startDate: '1978-01-01', currentDays: 9000, daysPerYear: 360, asOf: '2026-10-10' });
  const html = optionsRows(r);
  assert.match(html, /Tamamlanmış/);
  assert.doesNotMatch(html, /2023/);
});

test('kalan süre yıl ve ay olarak yazılır', () => {
  assert.equal(remainingText('2026-10-10', '2038-03-15'), '11 yıl 5 ay');
  assert.equal(remainingText('2026-10-10', '2026-10-01'), 'Şartlar tamamlanmış');
});

test('öneri kartı yasalaşmadı etiketini taşır', () => {
  const r = calculateRetirement({ gender: 'K', birthDate: '1980-03-15', startDate: '2002-06-01', currentDays: 4000, daysPerYear: 360, asOf: '2026-10-10' });
  assert.match(proposalHtml(r), /Yasalaşmadı/);
  assert.match(proposalHtml(r), /daha erken/);
});

test('öneri tarihi aynıysa yaş şartının belirleyici olduğu yazılır', () => {
  const r = calculateRetirement({ status: '4b', gender: 'E', birthDate: '1980-06-01', startDate: '2009-01-01', currentDays: 6000, daysPerYear: 360, asOf: '2026-10-10' });
  assert.equal(r.proposalGainDays, 0);
  assert.match(proposalHtml(r), /yaş şartı belirleyici/);
  assert.match(proposalHtml(r), /7\.200 gün/);
});
