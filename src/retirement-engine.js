// SSK (5510 4/a) ve Bağ-Kur (4/b) yaşlılık aylığı şartları. 4/b kaynağı: SGK "4/b Kendi Adına ve Hesabına
// Bağımsız Çalışanlar" sayfası.
// SSK (5510 4/a) yaşlılık aylığı şartları. Kaynak: SGK "4/a Hizmet Akdi ile Çalışanlar"
// sayfasındaki tablolar ve 7438 sayılı Kanun (EYT, 3 Mart 2023). Son kontrol: RULES_CHECKED_AT.
// Bağ-Kur (4/b), kamu (4/c), borçlanma, yıpranma ve malullük kapsam dışıdır.

export const RULES_CHECKED_AT = '2026-10-10';
export const EYT_LAST_START = '1999-09-08';
export const REFORM_FIRST_START = '2008-05-01';
// 01.04.1981 ve sonrası 18 yaşından önce sigortalı olanlarda sigortalılık süresi 18 yaşın dolduğu tarihten başlar
// (506 m.60/G, 5510 m.38; SGK Genelgesi 2018/38). Prim günleri ve kural grubu gerçek giriş tarihine göre kalır.
export const UNDER_18_RULE_FROM = '1981-04-01';
// EYT ile yaş şartsız emeklilik 3 Mart 2023'ten itibaren talep edilebilir (7438 s. Kanun, geriye ödeme yok).
export const EYT_EFFECTIVE = '2023-03-03';

// 08.09.1999 ve öncesi: kadın 20, erkek 25 yıl sigortalılık + başlangıç tarihine göre prim günü.
// Her satır: [bu tarihe kadar (dahil) başlayanlar, gerekli prim günü]
const EYT_DAYS = Object.freeze({
  K: [['1985-05-23', 5000], ['1986-05-23', 5075], ['1987-05-23', 5150], ['1988-05-23', 5225], ['1989-05-23', 5300], ['1990-05-23', 5375], ['1991-05-23', 5450], ['1992-05-23', 5525], ['1993-05-23', 5600], ['1994-05-23', 5675], ['1995-05-23', 5750], ['1996-05-23', 5825], ['1997-05-23', 5900], ['1999-09-08', 5975]],
  E: [['1980-11-23', 5000], ['1982-05-23', 5075], ['1983-11-23', 5150], ['1985-05-23', 5225], ['1986-11-23', 5300], ['1988-05-23', 5375], ['1989-11-23', 5450], ['1991-05-23', 5525], ['1992-11-23', 5600], ['1994-05-23', 5675], ['1995-11-23', 5750], ['1997-05-23', 5825], ['1998-11-23', 5900], ['1999-09-08', 5975]]
});
const EYT_YEARS = Object.freeze({ K: 20, E: 25 });

// 08.09.1999 öncesi 15 yıl + 3600 gün seçeneğinde yaş, bu iki şartın tamamlandığı tarihe göre.
const EYT_PARTIAL_AGE = Object.freeze({
  K: [['2002-05-23', 50], ['2005-05-23', 52], ['2008-05-23', 54], ['2011-05-23', 56], ['9999-12-31', 58]],
  E: [['2002-05-23', 55], ['2005-05-23', 56], ['2008-05-23', 57], ['2011-05-23', 58], ['2014-05-23', 59], ['9999-12-31', 60]]
});

// 01.05.2008 sonrası: yaş, prim günü şartının tamamlandığı yıla göre (Tablo A: 7200 gün, Tablo B: kısmi).
const REFORM_FULL_AGE = Object.freeze({
  K: [[2035, 58], [2037, 59], [2039, 60], [2041, 61], [2043, 62], [2045, 63], [2047, 64], [9999, 65]],
  E: [[2035, 60], [2037, 61], [2039, 62], [2041, 63], [2043, 64], [9999, 65]]
});
const REFORM_PARTIAL_AGE = Object.freeze({
  K: [[2035, 61], [2037, 62], [2039, 63], [2041, 64], [9999, 65]],
  E: [[2035, 63], [2037, 64], [9999, 65]]
});
// Kısmi emeklilikte prim günü, sigortalılık başlangıç yılına göre (Tablo C).
const REFORM_PARTIAL_DAYS = Object.freeze([[2008, 4600], [2009, 4700], [2010, 4800], [2011, 4900], [2012, 5000], [2013, 5100], [2014, 5200], [2015, 5300], [9999, 5400]]);

// EMADDER kademeli emeklilik önerisi (yasalaşmadı). content/kademeli-emeklilik.js ile aynı satırlar.
export const EMADDER_PROPOSAL = Object.freeze([
  { fromYear: 1999, toYear: 2000, women: 43, men: 45, days: 6400 },
  { fromYear: 2001, toYear: 2001, women: 44, men: 46, days: 6475 },
  { fromYear: 2002, toYear: 2002, women: 45, men: 47, days: 6550 },
  { fromYear: 2003, toYear: 2003, women: 46, men: 48, days: 6625 },
  { fromYear: 2004, toYear: 2004, women: 47, men: 49, days: 6700 },
  { fromYear: 2005, toYear: 2005, women: 48, men: 50, days: 6775 },
  { fromYear: 2006, toYear: 2006, women: 49, men: 51, days: 6850 },
  { fromYear: 2007, toYear: 2007, women: 50, men: 52, days: 6925 },
  { fromYear: 2008, toYear: 2008, women: 51, men: 53, days: 7000 }
]);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function parse(iso, name) {
  if (typeof iso !== 'string' || !ISO.test(iso)) throw new Error(`${name} geçerli bir tarih olmalı (YYYY-AA-GG).`);
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) throw new Error(`${name} geçerli bir tarih olmalı.`);
  return date;
}
const iso = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
function addYears(date, years) {
  const next = new Date(date.getTime());
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}
const maxDate = (...dates) => dates.reduce((a, b) => (a.getTime() >= b.getTime() ? a : b));
const lookupByDate = (rows, date) => rows.find(([upTo]) => iso(date) <= upTo)[1];
const lookupByYear = (rows, year) => rows.find(([upTo]) => year <= upTo)[1];

export function regimeFor(startIso) {
  if (startIso <= EYT_LAST_START) return 'eyt';
  if (startIso < REFORM_FIRST_START) return 'transition';
  return 'reform';
}

// Bugünkü gün sayısından hedef güne, yılda `daysPerYear` prim günü varsayımıyla ulaşılan takvim tarihi.
// Hedef gün zaten aşılmışsa, tarih bilinmediği için girişten bugüne eşit dağılım varsayımıyla tahmin edilir.
export function dateForDays({ asOf, start, currentDays, targetDays, daysPerYear }) {
  if (currentDays >= targetDays) {
    if (!start || currentDays === 0) return asOf;
    return addDays(start, Math.floor(((asOf.getTime() - start.getTime()) / DAY_MS) * (targetDays / currentDays)));
  }
  if (daysPerYear <= 0) return null;
  return addDays(asOf, Math.ceil(((targetDays - currentDays) * 365.25) / daysPerYear));
}

function option({ key, label, requiredDays, serviceYears, age, start, serviceStart = start, birth, daysDate, ageFrom, notBefore = null }) {
  const serviceDate = serviceYears ? addYears(serviceStart, serviceYears) : null;
  const ageValue = typeof age === 'function' ? (daysDate ? age(maxDate(daysDate, serviceDate || daysDate)) : null) : age;
  const ageDate = ageValue == null ? null : addYears(birth, ageValue);
  const parts = [daysDate, serviceDate, ageDate].filter(Boolean);
  let eligible = daysDate === null ? null : maxDate(...parts);
  let legalStart = false;
  if (eligible && notBefore && eligible.getTime() < notBefore.getTime()) { eligible = notBefore; legalStart = true; }
  let binding = null;
  if (eligible) {
    if (legalStart) binding = 'law';
    else if (ageDate && eligible.getTime() === ageDate.getTime()) binding = 'age';
    else if (serviceDate && eligible.getTime() === serviceDate.getTime()) binding = 'service';
    else binding = 'days';
  }
  return {
    key, label, requiredDays, serviceYears: serviceYears || null, age: ageValue ?? null, ageRule: ageFrom || null,
    daysDate: daysDate && iso(daysDate), serviceDate: serviceDate && iso(serviceDate), ageDate: ageDate && iso(ageDate),
    eligibleDate: eligible && iso(eligible),
    ageAtEligible: eligible ? ageOn(birth, eligible) : null,
    binding
  };
}

export function ageOn(birth, date) {
  let years = date.getUTCFullYear() - birth.getUTCFullYear();
  const before = date.getUTCMonth() < birth.getUTCMonth() || (date.getUTCMonth() === birth.getUTCMonth() && date.getUTCDate() < birth.getUTCDate());
  if (before) years -= 1;
  return years;
}

export function emadderRowFor(startIso) {
  if (regimeFor(startIso) !== 'transition') return null;
  const year = Number(startIso.slice(0, 4));
  return EMADDER_PROPOSAL.find((row) => year >= row.fromYear && year <= row.toYear) || null;
}

export function calculateRetirement(input) {
  const gender = input.gender;
  if (gender !== 'K' && gender !== 'E') throw new Error('Cinsiyet seçin.');
  const birth = parse(input.birthDate, 'Doğum tarihi');
  const start = parse(input.startDate, 'İlk sigorta giriş tarihi');
  const asOf = parse(input.asOf, 'Hesap tarihi');
  const currentDays = Number(input.currentDays);
  const daysPerYear = Number(input.daysPerYear ?? 360);
  if (!Number.isFinite(currentDays) || currentDays < 0 || currentDays > 20_000) throw new Error('Prim gün sayısı 0 ile 20.000 arasında olmalı.');
  if (!Number.isFinite(daysPerYear) || daysPerYear < 0 || daysPerYear > 360) throw new Error('Yıllık prim günü 0 ile 360 arasında olmalı.');
  if (start.getTime() < addYears(birth, 14).getTime()) throw new Error('İlk sigorta giriş tarihi doğum tarihinden en az 14 yıl sonra olmalı.');
  if (start.getTime() > asOf.getTime()) throw new Error('İlk sigorta giriş tarihi bugünden sonra olamaz.');

  const status = input.status ?? '4a';
  if (status !== '4a' && status !== '4b') throw new Error('Sigortalılık türünü seçin.');
  const regime = regimeFor(iso(start));
  const eighteen = addYears(birth, 18);
  const serviceStart = iso(start) >= UNDER_18_RULE_FROM && start.getTime() < eighteen.getTime() ? eighteen : start;
  const when = (targetDays) => dateForDays({ asOf, start, currentDays, targetDays, daysPerYear });
  const options = [];

  if (status === '4b') {
    const fullAge = gender === 'K' ? 58 : 60;
    if (regime === 'eyt') {
      const days = BAGKUR.eytDays[gender];
      options.push(option({ key: 'bk-eyt-full', label: `EYT: ${days.toLocaleString('tr-TR')} gün (${gender === 'K' ? 20 : 25} tam yıl), yaş şartı yok`, requiredDays: days, age: null, start, birth, daysDate: when(days), notBefore: parse(EYT_EFFECTIVE, 'EYT') }));
    } else if (regime === 'transition') {
      options.push(option({ key: 'bk-transition-full', label: '9.000 gün (25 tam yıl)', requiredDays: BAGKUR.fullDays, age: fullAge, start, birth, daysDate: when(BAGKUR.fullDays) }));
      options.push(option({ key: 'bk-transition-partial', label: '5.400 gün (15 tam yıl)', requiredDays: BAGKUR.partialDays, age: BAGKUR.transitionPartialAge[gender], start, birth, daysDate: when(BAGKUR.partialDays) }));
    } else {
      const fd = when(BAGKUR.fullDays);
      options.push(option({ key: 'bk-reform-full', label: '9.000 gün', requiredDays: BAGKUR.fullDays, age: fd ? lookupByYear(REFORM_FULL_AGE[gender], fd.getUTCFullYear()) : null, ageFrom: 'days', start, birth, daysDate: fd }));
      const pd = when(BAGKUR.partialDays);
      options.push(option({ key: 'bk-reform-partial', label: '5.400 gün (yaştan)', requiredDays: BAGKUR.partialDays, age: pd ? lookupByYear(REFORM_PARTIAL_AGE[gender], pd.getUTCFullYear()) : null, ageFrom: 'days', start, birth, daysDate: pd }));
    }
  } else if (regime === 'eyt') {
    const days = lookupByDate(EYT_DAYS[gender], start);
    options.push(option({ key: 'eyt-full', label: 'EYT: yaş şartı olmadan', requiredDays: days, serviceYears: EYT_YEARS[gender], age: null, start, serviceStart, birth, daysDate: when(days), notBefore: parse(EYT_EFFECTIVE, 'EYT') }));
    options.push(option({ key: 'eyt-partial', label: '15 yıl ve 3.600 gün (yaş şartlı)', requiredDays: 3600, serviceYears: 15, age: (conditionDate) => lookupByDate(EYT_PARTIAL_AGE[gender], conditionDate), ageFrom: 'conditions', start, serviceStart, birth, daysDate: when(3600) }));
  } else if (regime === 'transition') {
    const age = gender === 'K' ? 58 : 60;
    options.push(option({ key: 'transition-full', label: '7.000 gün', requiredDays: 7000, age, start, birth, daysDate: when(7000) }));
    options.push(option({ key: 'transition-partial', label: '25 yıl ve 4.500 gün', requiredDays: 4500, serviceYears: 25, age, start, serviceStart, birth, daysDate: when(4500) }));
  } else {
    const fullDaysDate = when(7200);
    options.push(option({ key: 'reform-full', label: '7.200 gün', requiredDays: 7200, age: fullDaysDate ? lookupByYear(REFORM_FULL_AGE[gender], fullDaysDate.getUTCFullYear()) : null, ageFrom: 'days', start, birth, daysDate: fullDaysDate }));
    const partialDays = lookupByYear(REFORM_PARTIAL_DAYS, start.getUTCFullYear());
    const partialDaysDate = when(partialDays);
    options.push(option({ key: 'reform-partial', label: `${partialDays.toLocaleString('tr-TR')} gün (yaştan)`, requiredDays: partialDays, age: partialDaysDate ? lookupByYear(REFORM_PARTIAL_AGE[gender], partialDaysDate.getUTCFullYear()) : null, ageFrom: 'days', start, birth, daysDate: partialDaysDate }));
  }

  const reachable = options.filter((item) => item.eligibleDate).sort((a, b) => a.eligibleDate.localeCompare(b.eligibleDate));
  const earliest = reachable[0] || null;

  let proposal = null;
  const row = status === '4a' ? emadderRowFor(iso(start)) : null;
  if (row) {
    const age = gender === 'K' ? row.women : row.men;
    const proposalOption = option({ key: 'emadder', label: 'EMADDER önerisi (yasalaşmadı)', requiredDays: row.days, age, start, birth, daysDate: when(row.days) });
    proposal = { ...proposalOption, kind: 'emadder', row };
  } else if (status === '4b' && regime === 'reform') {
    // TBMM'deki öneri 5510 m.28'deki 9.000 günü değiştiriyor; yalnız 1 Mayıs 2008 sonrası girişlileri kapsar.
    const pd = when(BAGKUR.proposalDays);
    const age = pd ? lookupByYear(REFORM_FULL_AGE[gender], pd.getUTCFullYear()) : null;
    proposal = { ...option({ key: 'bagkur-7200', label: 'Bağ-Kur 7.200 gün önerisi (yasalaşmadı)', requiredDays: BAGKUR.proposalDays, age, ageFrom: 'days', start, birth, daysDate: pd }), kind: 'bagkur7200', row: null };
  }

  return {
    regime,
    status,
    serviceStartAdjusted: serviceStart !== start ? iso(serviceStart) : null,
    rulesCheckedAt: RULES_CHECKED_AT,
    asOf: iso(asOf),
    currentDays,
    daysPerYear,
    options,
    earliest,
    alreadyEligible: Boolean(earliest && earliest.eligibleDate <= iso(asOf)),
    proposal,
    proposalGainDays: proposal?.eligibleDate && earliest ? Math.round((parse(earliest.eligibleDate, 'x') - parse(proposal.eligibleDate, 'x')) / DAY_MS) : null
  };
}

// Bağ-Kur (4/b): EYT grubunda tam yıl prim (kadın 20 = 7200 gün, erkek 25 = 9000 gün), yaş yok (3 Mart 2023 sonrası).
// 1999–2008: 58/60 yaş + 9000 gün veya 60/62 yaş + 5400 gün. 2008 sonrası: 9000 gün + REFORM_FULL_AGE,
// 5400 gün + REFORM_PARTIAL_AGE. Önerilen (yasalaşmamış) 7200 gün eşitlemesi senaryo olarak hesaplanır.
export const BAGKUR = Object.freeze({ eytDays: Object.freeze({ K: 7200, E: 9000 }), fullDays: 9000, partialDays: 5400, transitionPartialAge: Object.freeze({ K: 60, E: 62 }), proposalDays: 7200 });

export const RULE_TABLES = Object.freeze({ EYT_DAYS, EYT_YEARS, EYT_PARTIAL_AGE, REFORM_FULL_AGE, REFORM_PARTIAL_AGE, REFORM_PARTIAL_DAYS });
