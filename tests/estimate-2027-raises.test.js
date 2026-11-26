import test from 'node:test';
import assert from 'node:assert/strict';
import {compareRaises,estimateParameters,rowsFor,raiseSalaryKurus,parseEstimateNumber} from '../src/estimate-2027.js';
import {ESTIMATE_PRESETS_2027} from '../src/data-2027.js';
import {summarizePayroll} from '../src/payroll-engine.js';
const middle=ESTIMATE_PRESETS_2027.middle;
const p=estimateParameters(middle.minimum,middle.ceiling,middle.brackets);

test('2027 gross raise comparison reuses the 2026 benchmark and the same 2027 parameters',()=>{
 const r=compareRaises({salaryTl:100000,mode:'gross',parameters:p});
 assert.equal(r.baseline.annualNetKurus,83388163);
 assert.deepEqual(r.scenarios.map(s=>s.targetKurus),[12700000,13000000,13500000]);
 for(const s of r.scenarios){
  assert.equal(s.rows.length,12);
  assert.ok(s.rows.every(row=>row.grossKurus===s.targetKurus));
  assert.deepEqual(s.summary,summarizePayroll(rowsFor(p,s.targetKurus/100,'gross')));
  assert.equal(s.netDeltaKurus,s.summary.annualNetKurus-r.baseline.annualNetKurus);
 }
 assert.ok(r.scenarios[0].summary.annualNetKurus<r.scenarios[1].summary.annualNetKurus);
 assert.ok(r.scenarios[1].summary.annualNetKurus<r.scenarios[2].summary.annualNetKurus);
});
test('fixed net means the target is held every month in both years',()=>{
 const r=compareRaises({salaryTl:50000,mode:'net',parameters:p});
 assert.ok(r.baselineRows.every(row=>Math.abs(row.netKurus-5000000)<=1));
 assert.deepEqual(r.scenarios.map(s=>s.targetKurus),[6350000,6500000,6750000]);
 for(const s of r.scenarios)assert.ok(s.rows.every(row=>Math.abs(row.netKurus-s.targetKurus)<=1));
 assert.ok(r.scenarios[1].rows[11].grossKurus>r.scenarios[1].rows[0].grossKurus);
});
test('direct and custom scenarios; rates do not mutate economic parameters',()=>{
 const r=compareRaises({salaryTl:100000,mode:'gross',parameters:p,rates:[2700,3000,3500,3250,0]});
 assert.equal(r.scenarios[3].targetKurus,13250000);
 assert.equal(r.scenarios[4].targetKurus,10000000);
 assert.equal(p.minimumGrossKurus,4293900);
 assert.equal(p.incomeTaxBrackets[0].upToKurus,24287700);
 assert.equal(raiseSalaryKurus(10001,3250),13251);
 assert.throws(()=>raiseSalaryKurus(10000,-100));
 assert.throws(()=>raiseSalaryKurus(10000,30001));
});
test('subminimum scenarios are explicitly flagged, never silently clamped',()=>{
 const r=compareRaises({salaryTl:33030,mode:'gross',parameters:p});
 assert.equal(r.baselineBelowMinimum,false);
 assert.deepEqual(r.scenarios.map(s=>s.belowMinimum),[true,false,false]);
});
test('valid Turkish amounts and malformed input guards',()=>{
 for(const [s,v] of [['100.000,50',100000.5],['100000.50',100000.5],['32,5',32.5],['32.5',32.5],['0',0]])assert.equal(parseEstimateNumber(s),v);
 for(const s of ['','-50000','abc','1.2.3','Infinity'])assert.ok(Number.isNaN(parseEstimateNumber(s)));
 assert.throws(()=>rowsFor(p,0,'gross'));
 assert.throws(()=>rowsFor(p,NaN,'gross'));
 assert.throws(()=>estimateParameters(100,99,[1,2,3,4]));
 assert.throws(()=>estimateParameters(100,900,[1,2,2,4]));
});
