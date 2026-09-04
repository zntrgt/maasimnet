import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const spec = JSON.parse(await readFile(join(root, 'analytics', 'gsc-ga4-dashboard.json'), 'utf8'));
const salaryAnalyticsSource = await readFile(join(root, 'src', 'calculator-analytics.js'), 'utf8');
const terminationAnalyticsSource = await readFile(join(root, 'src', 'termination-calculators.js'), 'utf8');
const unemploymentAnalyticsSource = await readFile(join(root, 'src', 'unemployment-calculator.js'), 'utf8');
const overtimeAnalyticsSource = await readFile(join(root, 'src', 'overtime-calculator.js'), 'utf8');
const annualLeaveAnalyticsSource = await readFile(join(root, 'src', 'annual-leave-calculator.js'), 'utf8');
const minimumWageAnalyticsSource = await readFile(join(root, 'src', 'minimum-wage-calculator.js'), 'utf8');
const analyticsSources = `${salaryAnalyticsSource}\n${terminationAnalyticsSource}\n${unemploymentAnalyticsSource}\n${overtimeAnalyticsSource}\n${annualLeaveAnalyticsSource}\n${minimumWageAnalyticsSource}`;
const googleTagsSource = await readFile(join(root, 'scripts', 'apply-google-tags.js'), 'utf8');
const readme = await readFile(join(root, 'analytics', 'README.md'), 'utf8');

const failures = [];

for (const eventName of spec.ga4_events) {
  if (!analyticsSources.includes(`'${eventName}'`)) failures.push(`Dashboard event sözlüğünde bulunup analytics kodunda bulunmayan event: ${eventName}`);
}

if (spec.ga4_events.includes('termination_calculator_complete')) {
  if (!terminationAnalyticsSource.includes("'termination_calculator_complete'")) failures.push('Tazminat hesaplama completion eventi dashboard sözleşmesinde var fakat UI analytics kodunda yok.');
  if (!spec.registered_custom_dimensions?.includes('calculator_type')) failures.push('Tazminat hesaplama kırılımı için calculator_type custom dimension eksik.');
  for (const type of ['combined', 'severance', 'notice']) if (!terminationAnalyticsSource.includes(`'${type}'`)) failures.push(`Tazminat calculator_type allowlist değeri eksik: ${type}`);
}

for (const [eventName, source, guardrail] of [
  ['unemployment_calculator_complete', unemploymentAnalyticsSource, 'unemployment_calculator_complete must not contain PEK, premium-day, termination-reason, application-delay or eligibility inputs'],
  ['overtime_calculator_complete', overtimeAnalyticsSource, 'overtime_calculator_complete must not contain salary, overtime-hours, tax-base, retirement or disability inputs'],
  ['annual_leave_calculator_complete', annualLeaveAnalyticsSource, 'annual_leave_calculator_complete must not contain salary, unused-leave-days, premium-days, tax-base, retirement or disability inputs'],
  ['minimum_wage_calculator_complete', minimumWageAnalyticsSource, 'minimum_wage_calculator_complete must not contain month-count or any financial input values']
]) {
  if (!spec.ga4_events.includes(eventName)) continue;
  if (!source.includes(`'${eventName}'`)) failures.push(`${eventName} dashboard sözleşmesinde var fakat UI analytics kodunda yok.`);
  const escaped = eventName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`gtag\\(\\s*['\"]event['\"]\\s*,\\s*['\"]${escaped}['\"]\\s*\\)`).test(source)) failures.push(`${eventName} payload olmadan gönderilmeli.`);
  if (!JSON.stringify(spec).includes(guardrail)) failures.push(`${eventName} veri minimizasyonu guardrail metni eksik.`);
}

const measurementId = spec.sources.google_analytics_4.measurement_id;
if (!googleTagsSource.includes(measurementId)) failures.push(`Dashboard measurement ID ile site etiketi eşleşmiyor: ${measurementId}`);
if (spec.attribution_guardrail.prohibited_metric !== 'Exact calculation completions by search query') failures.push('Sorgu bazlı sahte dönüşüm metriği koruması eksik.');
if (!readme.includes("Query boyutu blend'in dönüşüm tarafına eklenmemelidir.")) failures.push('Landing-page grain güvenlik kuralı dashboard dokümanında bulunamadı.');

const googleAi = spec.sources.google_search_console_generative_ai;
if (!googleAi) failures.push('Google Search Console Generative AI veri kaynağı eksik.');
else {
  for (const dimension of ['date', 'page', 'country', 'device']) if (!googleAi.dimensions?.includes(dimension)) failures.push(`Google AI boyutu eksik: ${dimension}`);
  if (JSON.stringify(googleAi.metrics) !== JSON.stringify(['impressions'])) failures.push('Google AI dedicated rapor metriği yalnız impressions olarak modellenmeli.');
  for (const feature of ['AI Overviews', 'AI Mode']) if (!googleAi.features?.includes(feature)) failures.push(`Google AI feature eksik: ${feature}`);
  if (!String(googleAi.connection_mode || '').includes('do not assume API/Looker connector parity')) failures.push('Google AI connector/API destek varsayımını engelleyen guardrail eksik.');
}

const bingAi = spec.sources.bing_webmaster_tools;
if (!bingAi) failures.push('Bing Webmaster Tools AI Performance veri kaynağı eksik.');
else {
  for (const metric of ['total_citations', 'average_cited_pages', 'page_citations']) if (!bingAi.metrics?.includes(metric)) failures.push(`Bing AI metriği eksik: ${metric}`);
  if (!bingAi.dimensions?.includes('grounding_query')) failures.push('Bing grounding_query boyutu eksik.');
  if (bingAi.status !== 'public preview') failures.push('Bing AI Performance public preview statüsü kaybolmuş.');
}

const aiGuardrails = spec.ai_measurement_guardrails || {};
if (!(aiGuardrails.google?.length >= 3 && aiGuardrails.bing?.length >= 3 && aiGuardrails.referral_traffic?.length >= 2)) failures.push('AI visibility attribution guardrail seti eksik.');

for (const requiredCopy of [
  'Generative AI impressions measure visibility, not visits or conversions.',
  'Total citations measure references in supported AI answers; they are not ranking positions.',
  'GA4 AI referral sessions only represent users who clicked through to the site.'
]) if (!JSON.stringify(spec).includes(requiredCopy)) failures.push(`AI ölçüm guardrail metni eksik: ${requiredCopy}`);

for (const readmeCopy of [
  'Google Search Console — Generative AI Performance',
  'Bing Webmaster Tools — AI Performance',
  'Bu üç sinyal tek bir “AI traffic” sayısında birleştirilmemelidir.'
]) if (!readme.includes(readmeCopy)) failures.push(`AI ölçüm dokümantasyonu eksik: ${readmeCopy}`);

for (const forbidden of [
  'exact_salary','salary_amount','gross_salary_value','net_salary_value','severance_amount','notice_amount','previous_tax_base',
  'unemployment_pek','unemployment_premium_days','termination_reason','application_delay_days','eligibility_status',
  'overtime_salary','overtime_hours','overtime_tax_base','overtime_retired','overtime_disability',
  'annual_leave_salary','annual_leave_days','annual_leave_premium_days','annual_leave_tax_base',
  'minimum_wage_month_count','minimum_wage_amount'
]) if (JSON.stringify(spec).includes(`"${forbidden}"`)) failures.push(`Dashboard exact/sensitive calculator input alanı içermemeli: ${forbidden}`);

if (failures.length) throw new Error(`Growth dashboard doğrulaması başarısız:\n${failures.join('\n')}`);
console.log(`Search + AI visibility + GA4 dashboard sözleşmesi doğrulandı: ${spec.ga4_events.length} event, 2 native AI visibility kaynağı.`);
