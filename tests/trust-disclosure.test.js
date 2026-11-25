import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTrustStrip } from '../scripts/apply-humanized-ux.js';
import { DATA_2026 } from '../src/data-2026.js';
import { runPayrollAudit } from '../src/payroll-audit.js';
test('A16 evidence links and counts derive from actual audit and data',()=>{
 const html=renderTrustStrip(),audit=runPayrollAudit();
 assert.equal((html.match(/<article class="enterprise-trust-item">/g)||[]).length,3);
 assert.ok(html.includes('datetime="'+DATA_2026.checkedAt+'"'));
 assert.ok(html.includes(audit.passed+'/'+audit.total+' bordro sınır testi geçti'));
 assert.ok(html.includes('href="/test-raporu/"'));
 assert.ok(html.includes('href="/veriler/2026/"'));
 assert.ok(html.includes('href="/gizlilik/"'));
 assert.match(html,/İstatistik izniyle ücret aralığı/);
 assert.doesNotMatch(html,/verilerin asla paylaşılmaz|%100 doğru|uzman onaylı/i);
});
