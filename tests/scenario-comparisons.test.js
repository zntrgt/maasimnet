import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScenarioComparisons,scenarioHubBlock,raiseBlock} from '../scripts/apply-scenario-comparisons.js';
const data=buildScenarioComparisons();
test('A15 comparisons are twelve-month payroll totals and preserve reference case',()=>{
 assert.equal(data.rows.length,9);
 for(const s of data.rows){
  assert.equal(s.rows.length,12);
  assert.equal(s.summary.annualNetKurus,s.rows.reduce((sum,r)=>sum+r.netKurus,0));
  assert.equal(s.summary.annualEmployerCostKurus,s.rows.reduce((sum,r)=>sum+r.employerCostKurus,0));
 }
 assert.equal(data.baselineSummary.annualNetKurus,83388163);
 assert.equal(data.baselineSummary.averageNetKurus,6949014);
 const fixed=data.rows[5];
 assert.ok(fixed.rows.every(r=>Math.abs(r.netKurus-5000000)<=1));
 assert.ok(fixed.rows[11].grossKurus>fixed.rows[0].grossKurus);
});
test('A15 July raise preserves prior months and uses cumulative tax base',()=>{
 assert.deepEqual(data.raised.slice(0,6),data.standard.slice(0,6));
 assert.ok(data.raised.slice(6).every(r=>r.grossKurus===15000000));
 assert.ok(data.raised[6].cumulativeTaxBaseKurus>data.raised[6].incomeTaxBaseKurus);
 assert.ok(data.raiseSummary.annualNetKurus>data.baselineSummary.annualNetKurus);
 assert.equal(data.bonus.paymentDelta,3064550);
});
test('A15 static tables contain every scenario and every month',()=>{
 assert.equal((scenarioHubBlock(data).match(/<th scope="row">/g)||[]).length,9);
 assert.equal((raiseBlock(data).match(/<th scope="row">/g)||[]).length,12);
 assert.ok(scenarioHubBlock(data).includes('833.881,63 TL'));
 assert.ok(scenarioHubBlock(data).includes('piyasa verisi değil'));
});
