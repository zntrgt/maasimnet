import {test} from 'node:test';
import assert from 'node:assert/strict';
import { employerCost } from '../src/employer-cost-engine.js';
test('100000 TL standard and SGDP employer benchmark',()=>{
 for (const [scheme,cost] of [['other',12175000],['manufacturing',11875000],['none',12375000],['retired',12475000]]) {
  const r=employerCost(10000000,scheme);
  assert.equal(r.employerCostKurus,cost);
  assert.equal(r.annualEmployerCostKurus,cost*12);
 }
 assert.equal(employerCost(10000000,'other').netKurus,7595303);
 assert.equal(employerCost(10000000,'retired').employerUnemploymentKurus,0);
});
test('PEK ceiling and input bounds',()=>{
 const a=employerCost(29727000,'none'),b=employerCost(40000000,'none');
 assert.equal(b.sgkBaseKurus,29727000);
 assert.equal(a.employerSgkOrSgdpKurus,b.employerSgkOrSgdpKurus);
 assert.equal(b.employerCostKurus-b.grossKurus,a.employerCostKurus-a.grossKurus);
 assert.throws(()=>employerCost(3302999));
 assert.throws(()=>employerCost(10000000,'bad'));
});
