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

if (!readme.includes("Query boyutu blend'in dönüşüm tarafına eklenmemelidir.")) {
  failures.push('Landing-page grain güvenlik kuralı dashboard dokümanında bulunamadı.');
}

const googleAi = spec.sources.google_search_console_generative_ai;
if (!googleAi) {
  failures.push('Google Search Console Generative AI veri kaynağı eksik.');
} else {
  for (const dimension of ['date', 'page', 'country', 'device']) {
    if (!googleAi.dimensions?.includes(dimension)) failures.push(`Google AI boyutu eksik: ${dimension}`);
  }
  if (JSON.stringify(googleAi.metrics) !== JSON.stringify(['impressions'])) {
    failures.push('Google AI dedicated rapor metriği yalnız impressions olarak modellenmeli.');
  }
  for (const feature of ['AI Overviews', 'AI Mode']) {
    if (!googleAi.features?.includes(feature)) failures.push(`Google AI feature eksik: ${feature}`);
  }
  if (!String(googleAi.connection_mode || '').includes('do not assume API/Looker connector parity')) {
    failures.push('Google AI connector/API destek varsayımını engelleyen guardrail eksik.');
  }
}

const bingAi = spec.sources.bing_webmaster_tools;
if (!bingAi) {
  failures.push('Bing Webmaster Tools AI Performance veri kaynağı eksik.');
} else {
  for (const metric of ['total_citations', 'average_cited_pages', 'page_citations']) {
    if (!bingAi.metrics?.includes(metric)) failures.push(`Bing AI metriği eksik: ${metric}`);
  }
  if (!bingAi.dimensions?.includes('grounding_query')) failures.push('Bing grounding_query boyutu eksik.');
  if (bingAi.status !== 'public preview') failures.push('Bing AI Performance public preview statüsü kaybolmuş.');
}

const aiGuardrails = spec.ai_measurement_guardrails || {};
if (!(aiGuardrails.google?.length >= 3 && aiGuardrails.bing?.length >= 3 && aiGuardrails.referral_traffic?.length >= 2)) {
  failures.push('AI visibility attribution guardrail seti eksik.');
}

for (const requiredCopy of [
  'Generative AI impressions measure visibility, not visits or conversions.',
  'Total citations measure references in supported AI answers; they are not ranking positions.',
  'GA4 AI referral sessions only represent users who clicked through to the site.'
]) {
  if (!JSON.stringify(spec).includes(requiredCopy)) failures.push(`AI ölçüm guardrail metni eksik: ${requiredCopy}`);
}

for (const readmeCopy of [
  'Google Search Console — Generative AI Performance',
  'Bing Webmaster Tools — AI Performance',
  'Bu üç sinyal tek bir “AI traffic” sayısında birleştirilmemelidir.'
]) {
  if (!readme.includes(readmeCopy)) failures.push(`AI ölçüm dokümantasyonu eksik: ${readmeCopy}`);
}

for (const forbidden of ['exact_salary', 'salary_amount', 'gross_salary_value', 'net_salary_value']) {
  if (JSON.stringify(spec).includes(forbidden)) failures.push(`Dashboard exact maaş alanı içermemeli: ${forbidden}`);
}

if (failures.length) throw new Error(`Growth dashboard doğrulaması başarısız:\n${failures.join('\n')}`);
console.log(`Search + AI visibility + GA4 dashboard sözleşmesi doğrulandı: ${spec.ga4_events.length} event, 2 native AI visibility kaynağı.`);
