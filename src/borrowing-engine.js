// Hizmet borçlanması (5510 m.41). 7566 sayılı Kanun (RG 19.12.2025) ile 1 Ocak 2026'dan itibaren
// askerlik ve diğer borçlanmalarda oran %45; doğum borçlanması %32 olarak kaldı.
// Günlük tutar = seçilen günlük prime esas kazanç × oran; kazanç günlük alt sınır (brüt asgari ücret/30)
// ile üst sınır (SGK tavanı/30) arasında olmalı.
import { DATA_2026 } from './data-2026.js';

export const BORROWING_CHECKED_AT = '2026-10-10';
export const RATES_PPM = Object.freeze({ askerlik: 450_000, dogum: 320_000 });
export const DAILY_FLOOR_KURUS = Math.round(DATA_2026.payroll.minimumGrossKurus / 30);
export const DAILY_CEILING_KURUS = Math.round(DATA_2026.payroll.sgkCeilingKurus / 30);
export const DOGUM_MAX_DAYS_PER_CHILD = 720;
export const DOGUM_MAX_CHILDREN = 3;
export const ASKERLIK_MAX_DAYS = 1080;
// SGK hizmet süresini yıl = 360, ay = 30 gün sayarak çevirir (ör. 540 gün = 1 yıl 6 ay).
export function sgkDuration(days) {
  return { years: Math.floor(days / 360), months: Math.floor((days % 360) / 30), days: days % 30 };
}
export function shiftBackSgk(iso, totalDays) {
  const { years, months, days } = sgkDuration(totalDays);
  const [y, m, d] = iso.split('-').map(Number);
  let year = y - years;
  let month = m - 1 - months;
  while (month < 0) { month += 12; year -= 1; }
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const date = new Date(Date.UTC(year, month, Math.min(d, lastDay)));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

const perDay = (pekKurus, ratePpm) => Math.round((pekKurus * ratePpm) / 1_000_000);

export function dailyBounds(type) {
  const rate = RATES_PPM[type];
  if (!rate) throw new Error('Borçlanma türünü seçin.');
  return { ratePct: rate / 10_000, minKurus: perDay(DAILY_FLOOR_KURUS, rate), maxKurus: perDay(DAILY_CEILING_KURUS, rate) };
}

function isoDate(iso, name) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`${name} geçerli bir tarih olmalı.`);
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) throw new Error(`${name} geçerli bir tarih olmalı.`);
  return d;
}

export function calculateBorrowing({ type, days, children = 1, daysPerChild = null, dailyPekKurus = null, firstInsuranceDate = null, beforeFirstInsurance = false }) {
  const rate = RATES_PPM[type];
  if (!rate) throw new Error('Borçlanma türünü seçin.');
  let totalDays;
  if (type === 'dogum') {
    // Her doğum için borçlanılabilir gün ayrı: ödenmiş prim günleri, sonraki doğum veya çocuğun vefatı süreyi kısaltabilir.
    const list = Array.isArray(daysPerChild) ? daysPerChild.map(Number) : Array(Number(children)).fill(Number(days ?? DOGUM_MAX_DAYS_PER_CHILD));
    if (list.length < 1 || list.length > DOGUM_MAX_CHILDREN) throw new Error('Çocuk sayısı 1 ile 3 arasında olmalı.');
    list.forEach((d, i) => { if (!Number.isInteger(d) || d < 1 || d > DOGUM_MAX_DAYS_PER_CHILD) throw new Error(`${i + 1}. doğum için gün 1 ile 720 arasında olmalı.`); });
    totalDays = list.reduce((s, d) => s + d, 0);
  } else {
    const d = Number(days);
    if (!Number.isInteger(d) || d < 1 || d > ASKERLIK_MAX_DAYS) throw new Error('Askerlik süresi 1 ile 1.080 gün arasında olmalı.');
    totalDays = d;
  }
  const pek = dailyPekKurus === null || dailyPekKurus === '' ? DAILY_FLOOR_KURUS : Math.round(Number(dailyPekKurus));
  if (!Number.isFinite(pek) || pek < DAILY_FLOOR_KURUS || pek > DAILY_CEILING_KURUS) throw new Error('Günlük kazanç, günlük alt ve üst sınır arasında olmalı.');
  const bounds = dailyBounds(type);
  const dailyKurus = perDay(pek, rate);
  const result = {
    type, ratePct: rate / 10_000, totalDays, dailyPekKurus: pek, dailyKurus,
    totalKurus: dailyKurus * totalDays,
    minTotalKurus: bounds.minKurus * totalDays,
    maxTotalKurus: bounds.maxKurus * totalDays,
    startShift: null
  };
  if (type === 'askerlik' && beforeFirstInsurance && firstInsuranceDate) {
    const first = isoDate(firstInsuranceDate, 'İlk sigorta giriş tarihi');
    void first;
    const newStart = shiftBackSgk(firstInsuranceDate, totalDays);
    const regime = (iso) => (iso <= '1999-09-08' ? 'eyt' : iso < '2008-05-01' ? 'transition' : 'reform');
    result.startShift = { from: firstInsuranceDate, to: newStart, fromRegime: regime(firstInsuranceDate), toRegime: regime(newStart) };
  }
  return result;
}
