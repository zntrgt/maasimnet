import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRetiredWorker, SGDP_EMPLOYEE_RATE_PCT, SGDP_EMPLOYER_RATE_PCT } from '../src/retired-worker-engine.js';

test('SGDP oranları çalışan %7,5, işveren %24,75', () => {
  assert.equal(SGDP_EMPLOYEE_RATE_PCT, 7.5);
  assert.equal(SGDP_EMPLOYER_RATE_PCT, 24.75);
});

test('brütten nete: SGDP %7,5 kesilir, işsizlik primi yoktur', () => {
  const r = calculateRetiredWorker({ mode: 'gross', amountKurus: 5_000_000 });
  const jan = r.rows[0];
  assert.equal(jan.employeeSgdpKurus, 375_000);
  assert.equal(jan.employeeSgkKurus, 0);
  assert.equal(jan.employeeUnemploymentKurus, 0);
  assert.ok(r.annualNetAdvantageKurus > 0, 'emekli çalışan aynı brütle daha yüksek net alır');
  assert.ok(r.annualEmployerCostDifferenceKurus > 0, 'işveren SGDP maliyeti normal çalışandan yüksek');
});

test('netten brüte: her ay hedef net 1 kuruş toleransla tutar', () => {
  const r = calculateRetiredWorker({ mode: 'net', amountKurus: 4_000_000 });
  for (const row of r.rows) assert.ok(Math.abs(row.netKurus - 4_000_000) <= 1, `ay ${row.month}`);
});

test('hatalı girdi reddedilir', () => {
  assert.throws(() => calculateRetiredWorker({ mode: 'gross', amountKurus: 0 }), /tutar/);
  assert.throws(() => calculateRetiredWorker({ mode: 'x', amountKurus: 100 }), /yön/);
});
