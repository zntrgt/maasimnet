import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRetirement, regimeFor, emadderRowFor, EMADDER_PROPOSAL } from '../src/retirement-engine.js';
import { KADEMELI_EMEKLILIK } from '../content/kademeli-emeklilik.js';

const base = { asOf: '2026-10-10', daysPerYear: 360 };
const run = (input) => calculateRetirement({ ...base, ...input });
const opt = (result, key) => result.options.find((item) => item.key === key);

test('dönem sınırları SGK tarihleriyle aynı', () => {
  assert.equal(regimeFor('1999-09-08'), 'eyt');
  assert.equal(regimeFor('1999-09-09'), 'transition');
  assert.equal(regimeFor('2008-04-30'), 'transition');
  assert.equal(regimeFor('2008-05-01'), 'reform');
});

test('1999-2008 kadın: 7000 gün ve 58 yaş; bağlayıcı şart yaş', () => {
  const r = run({ gender: 'K', birthDate: '1980-03-15', startDate: '2002-06-01', currentDays: 4000 });
  const full = opt(r, 'transition-full');
  assert.equal(full.requiredDays, 7000);
  assert.equal(full.age, 58);
  assert.equal(full.eligibleDate, '2038-03-15');
  assert.equal(full.binding, 'age');
  const partial = opt(r, 'transition-partial');
  assert.equal(partial.serviceDate, '2027-06-01');
  assert.equal(partial.requiredDays, 4500);
  assert.equal(r.earliest.eligibleDate, '2038-03-15');
});

test('EMADDER önerisi 2002 girişli kadın için 45 yaş ve 6550 gün uygular', () => {
  const r = run({ gender: 'K', birthDate: '1980-03-15', startDate: '2002-06-01', currentDays: 4000 });
  assert.equal(r.proposal.row.days, 6550);
  assert.equal(r.proposal.age, 45);
  assert.equal(r.proposal.binding, 'days');
  assert.ok(r.proposalGainDays > 0);
});

test('EMADDER önerisi düşük prim gününde mevcut kuraldan geç kalabilir', () => {
  const r = run({ gender: 'K', birthDate: '1978-01-01', startDate: '1999-09-09', currentDays: 3000 });
  assert.equal(r.earliest.key, 'transition-partial');
  assert.ok(r.proposalGainDays < 0);
});

test('EYT erkek: 1995 girişte 25 yıl ve 5750 gün, yaş şartı yok', () => {
  const r = run({ gender: 'E', birthDate: '1970-01-01', startDate: '1995-06-01', currentDays: 5000 });
  const full = opt(r, 'eyt-full');
  assert.equal(full.requiredDays, 5750);
  assert.equal(full.serviceDate, '2020-06-01');
  assert.equal(full.age, null);
  assert.equal(full.binding, 'days');
  assert.equal(r.proposal, null);
});

test('EYT kadın gün tablosu başlangıç bantlarını izler', () => {
  const days = (startDate) => opt(run({ gender: 'K', birthDate: '1960-01-01', startDate, currentDays: 0 }), 'eyt-full').requiredDays;
  assert.equal(days('1984-01-01'), 5000);
  assert.equal(days('1985-05-24'), 5075);
  assert.equal(days('1997-05-23'), 5900);
  assert.equal(days('1997-05-24'), 5975);
  assert.equal(days('1999-09-08'), 5975);
});

test('2008 sonrası: 7200 gün 2036 öncesi dolarsa kadın 58; kısmi gün başlangıç yılına göre', () => {
  const r = run({ gender: 'K', birthDate: '1990-05-05', startDate: '2010-01-01', currentDays: 4000 });
  assert.equal(opt(r, 'reform-full').age, 58);
  assert.equal(opt(r, 'reform-full').eligibleDate, '2048-05-05');
  assert.equal(opt(r, 'reform-partial').requiredDays, 4800);
  assert.equal(opt(r, 'reform-partial').age, 61);
});

test('2008 sonrası: 7200 gün 2041de dolan erkek 63 yaş tablosuna girer', () => {
  const r = run({ gender: 'E', birthDate: '2000-01-01', startDate: '2020-01-01', currentDays: 2000 });
  const full = opt(r, 'reform-full');
  assert.equal(full.daysDate.slice(0, 4), '2041');
  assert.equal(full.age, 63);
  assert.equal(opt(r, 'reform-partial').requiredDays, 5400);
});

test('yılda 0 gün varsayımında prim şartı dolmuyorsa tarih üretilmez', () => {
  const r = run({ gender: 'E', birthDate: '1990-01-01', startDate: '2012-01-01', currentDays: 3000, daysPerYear: 0 });
  assert.equal(opt(r, 'reform-full').eligibleDate, null);
  assert.equal(r.earliest, null);
});

test('hatalı girdiler anlaşılır hata verir', () => {
  assert.throws(() => run({ gender: 'X', birthDate: '1980-01-01', startDate: '2000-01-01', currentDays: 1 }), /Cinsiyet/);
  assert.throws(() => run({ gender: 'K', birthDate: '1990-01-01', startDate: '2000-01-01', currentDays: 1 }), /14 yıl/);
  assert.throws(() => run({ gender: 'K', birthDate: '1980-01-01', startDate: '2030-01-01', currentDays: 1 }), /bugünden sonra/);
  assert.throws(() => run({ gender: 'K', birthDate: '1980-02-30', startDate: '2000-01-01', currentDays: 1 }), /geçerli/);
});

test('EMADDER satırları kademeli emeklilik sayfasıyla birebir aynı', () => {
  assert.deepEqual(EMADDER_PROPOSAL.map(({ women, men, days }) => [women, men, days]), KADEMELI_EMEKLILIK.emadderProposal.map(({ women, men, days }) => [women, men, days]));
  assert.equal(emadderRowFor('2000-12-31').days, 6400);
  assert.equal(emadderRowFor('2008-04-30').days, 7000);
  assert.equal(emadderRowFor('2008-05-01'), null);
});

test('1981 sonrası 18 yaş öncesi girişte sigortalılık süresi 18 yaşından başlar', () => {
  const r = run({ gender: 'E', birthDate: '1974-01-01', startDate: '1989-01-01', currentDays: 4000 });
  assert.equal(r.serviceStartAdjusted, '1992-01-01');
  assert.equal(opt(r, 'eyt-full').serviceDate, '2017-01-01');
  assert.equal(opt(r, 'eyt-full').requiredDays, 5450);
});

test('1981 öncesi 18 yaş altı girişte süre gerçek giriş tarihinden sayılır', () => {
  const r = run({ gender: 'E', birthDate: '1964-01-01', startDate: '1980-01-01', currentDays: 9000 });
  assert.equal(r.serviceStartAdjusted, null);
});

test('EYT yolu 3 Mart 2023 öncesine tarih üretmez', () => {
  const r = run({ gender: 'K', birthDate: '1960-01-01', startDate: '1985-01-01', currentDays: 9000 });
  const full = opt(r, 'eyt-full');
  assert.equal(full.eligibleDate, '2023-03-03');
  assert.equal(full.binding, 'law');
  assert.equal(r.alreadyEligible, true);
});

test('14. yaş gününde başlayan sigortalılık kabul edilir', () => {
  assert.doesNotThrow(() => run({ gender: 'E', birthDate: '1990-01-01', startDate: '2004-01-01', currentDays: 4000 }));
});

const bk = (input) => calculateRetirement({ ...base, status: '4b', ...input });

test('Bağ-Kur EYT: kadın 7200, erkek 9000 gün, yaş yok, 3 Mart 2023 tabanı', () => {
  const k = bk({ gender: 'K', birthDate: '1975-01-01', startDate: '1995-01-01', currentDays: 6000 });
  assert.equal(k.options[0].requiredDays, 7200);
  assert.equal(k.options[0].age, null);
  const e = bk({ gender: 'E', birthDate: '1960-01-01', startDate: '1985-01-01', currentDays: 14000 });
  assert.equal(e.options[0].requiredDays, 9000);
  assert.equal(e.options[0].eligibleDate, '2023-03-03');
  assert.equal(e.proposal, null);
});

test('Bağ-Kur 1999–2008: 58/60 + 9000 gün veya 60/62 + 5400 gün', () => {
  const r = bk({ gender: 'E', birthDate: '1975-06-01', startDate: '2003-01-01', currentDays: 6000 });
  const full = r.options.find((o) => o.key === 'bk-transition-full');
  const partial = r.options.find((o) => o.key === 'bk-transition-partial');
  assert.equal(full.requiredDays, 9000); assert.equal(full.age, 60);
  assert.equal(partial.requiredDays, 5400); assert.equal(partial.age, 62);
  assert.equal(partial.ageDate, '2037-06-01');
});

test('Bağ-Kur 2008 sonrası: 9000 gün ve günün dolduğu yıla göre yaş', () => {
  const r = bk({ gender: 'K', birthDate: '1985-01-01', startDate: '2010-01-01', currentDays: 4000 });
  const full = r.options.find((o) => o.key === 'bk-reform-full');
  assert.equal(full.requiredDays, 9000);
  assert.equal(full.daysDate.slice(0, 4), '2040');
  assert.equal(full.age, 61);
});

test('Bağ-Kur 7200 gün önerisi senaryosu yasalaşmadı etiketiyle hesaplanır', () => {
  const r = bk({ gender: 'E', birthDate: '1975-06-01', startDate: '2003-01-01', currentDays: 6000 });
  assert.equal(r.proposal.kind, 'bagkur7200');
  assert.equal(r.proposal.requiredDays, 7200);
  assert.match(r.proposal.label, /yasalaşmadı/);
});

test('SSK varsayılandır; geçersiz tür reddedilir', () => {
  assert.equal(run({ gender: 'K', birthDate: '1980-03-15', startDate: '2002-06-01', currentDays: 4000 }).status, '4a');
  assert.throws(() => calculateRetirement({ ...base, status: '4c', gender: 'K', birthDate: '1980-03-15', startDate: '2002-06-01', currentDays: 1 }), /tür/);
});
