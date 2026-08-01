import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const spec = JSON.parse(await readFile(join(root, 'analytics', 'gsc-ga4-dashboard.json'), 'utf8'));
const analyticsSource = await readFile(join(root, 'src', 'calculator-analytics.js'), 'utf8');
const googleTagsSource = await readFile(join(root, 'scripts', 'apply-google-tags.js'), 'utf8');
const readme = await readFile(join(root, 'analytics', 'README.md'), 'utf8');

const failures = [];

for (const eventName of spec.ga4_events) {
  if (!analyticsSource.includes(`'${eventName}'`)) {
    failures.push(`Dashboard event sözlüğünde bulunup analytics kodunda bulunmayan event: ${eventName}`);
  }
}

const measurementId = spec.sources.google_analytics_4.measurement_id;
if (!googleTagsSource.includes(measurementId)) {
  failures.push(`Dashboard measurement ID ile site etiketi eşleşmiyor: ${measurementId}`);
}

if (spec.attribution_guardrail.prohibited_metric !== 'Exact calculation completions by search query') {
  failures.push('Sorgu bazlı sahte dönüşüm metriği koruması eksik.');
}

if (!readme.includes('Query boyutu blend\'in dönüşüm tarafına eklenmemelidir.')) {
  failures.push('Landing-page grain güvenlik kuralı dashboard dokümanında bulunamadı.');
}

for (const forbidden of ['exact_salary', 'salary_amount', 'gross_salary_value', 'net_salary_value']) {
  if (JSON.stringify(spec).includes(forbidden)) failures.push(`Dashboard exact maaş alanı içermemeli: ${forbidden}`);
}

if (failures.length) throw new Error(`Growth dashboard doğrulaması başarısız:\n${failures.join('\n')}`);
console.log(`GSC + GA4 dashboard sözleşmesi doğrulandı: ${spec.ga4_events.length} event`);
