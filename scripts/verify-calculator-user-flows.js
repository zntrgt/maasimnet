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

assert(!analytics.includes("input.value = ''"), 'Lazy analitik modülü kullanıcı maaş girdisini temizliyor.');
assert(!analytics.includes("input.dataset.rawValue = ''"), 'Lazy analitik modülü kullanıcı raw maaş değerini temizliyor.');
assert(analytics.includes('initializeCalculatorAnalytics'), 'Hesaplayıcı analitik başlangıcı eksik.');

console.log('2026 mod geçişi ve lazy analitik kullanıcı girdisi regresyon kontrolleri başarılı.');
