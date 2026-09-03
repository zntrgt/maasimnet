import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const app = await readFile(join(process.cwd(), 'dist', 'assets', 'app.js'), 'utf8');
const analytics = await readFile(join(process.cwd(), 'dist', 'assets', 'calculator-analytics.js'), 'utf8');

for (const token of [
  'let lastGrossInputKurus',
  'let lastNetInputKurus',
  "if (mode !== 'gross' && mode !== 'net') return",
  "if (currentMode === 'gross') lastGrossInputKurus = currentInputKurus",
  'lastNetInputKurus = payrollRowsKurus[0]?.netKurus ?? 0',
  'const januaryGrossKurus = monthlyBaseGrossKurus[0] ?? lastGrossInputKurus',
  'lastNetInputKurus = valueKurus'
]) assert(app.includes(token), `2026 brüt/net kullanıcı akışı düzeltmesi eksik: ${token}`);

assert(app.includes('let monthlyBaseGrossKurus = Array(12).fill(0);'), 'Hesaplayıcı başlangıç brüt dizisi boş değil.');
assert(app.includes('let lastGrossInputKurus = 0;'), 'Hesaplayıcı başlangıç brüt state değeri boş değil.');

const initializerStart = app.indexOf('function initializeMaasimApp()');
const initializerEnd = app.indexOf('\n\nObject.assign(window,', initializerStart);
assert(initializerStart >= 0 && initializerEnd > initializerStart, 'Hesaplayıcı başlangıç fonksiyonu bulunamadı.');
const initializer = app.slice(initializerStart, initializerEnd);
assert(initializer.includes("salaryInput.value = ''"), 'İlk yüklemede maaş inputu boşaltılmıyor.');
assert(initializer.includes('payrollRowsKurus = []'), 'İlk yüklemede sonuç state’i boşaltılmıyor.');
assert(!/\bcalculate\s*\(/.test(initializer), 'İlk yüklemede otomatik maaş hesaplaması çalışıyor.');
assert(!/100000/.test(initializer), 'İlk yüklemede 100.000 TL örnek maaş hâlâ başlangıç fonksiyonunda var.');

assert(!analytics.includes("input.value = ''"), 'Lazy analitik modülü kullanıcı maaş girdisini temizliyor.');
assert(!analytics.includes("input.dataset.rawValue = ''"), 'Lazy analitik modülü kullanıcı raw maaş değerini temizliyor.');
assert(analytics.includes('initializeCalculatorAnalytics'), 'Hesaplayıcı analitik başlangıcı eksik.');

console.log('2026 mod geçişi, boş başlangıç ve lazy analitik regresyon kontrolleri başarılı.');
