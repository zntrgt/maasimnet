import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateTemporaryBenefit,BENEFIT_2026} from '../src/temporary-benefit-engine.js';
const base={kind:'sickness',priorDays:360,priorPekKurus:39636000,reportDays:10,treatment:'outpatient',activeInsurance:true,authorizedReport:true,noWork:true,ordinaryWagesOnly:true};
const calc=(input={})=>calculateTemporaryBenefit({...base,...input});
test('A11 2026 daily PEK and sickness waiting days',()=>{
 assert.equal(BENEFIT_2026.dailyMinimumKurus,110100);
 assert.equal(calc().payableDays,8);
 assert.equal(calc().dailyPaymentKurus,73400);
 assert.equal(calc().totalKurus,587200);
 assert.equal(calc({treatment:'inpatient'}).totalKurus,440400);
 assert.equal(calc({reportDays:1}).totalKurus,0);
 assert.equal(calc({reportDays:2}).totalKurus,0);
 assert.equal(calc({reportDays:3}).totalKurus,73400);
});
test('A11 accident and occupational disease pay from first day',()=>{
 for(const kind of ['accident','occupational']){
  const r=calc({kind,priorDays:30,priorPekKurus:3303000});
  assert.equal(r.payableDays,10);
  assert.equal(r.totalKurus,734000);
 }
});
test('A11 90 and 180 day thresholds and daily base cap',()=>{
 assert.equal(calc({priorDays:89,priorPekKurus:26700000}).status,'ineligible');
 const a=calc({priorDays:90,priorPekKurus:27000000});
 assert.equal(a.status,'calculated');
 assert.equal(a.capKurus,220200);
 assert.equal(a.dailyBaseKurus,220200);
 assert.equal(a.totalKurus,1174400);
 assert.equal(calc({priorDays:179,priorPekKurus:53700000}).capApplied,true);
 const b=calc({priorDays:180,priorPekKurus:54000000});
 assert.equal(b.capApplied,false);
 assert.equal(b.dailyBaseKurus,300000);
 assert.equal(b.totalKurus,1600000);
});
test('A11 unsupported cases and eligibility checks',()=>{
 assert.equal(calc({authorizedReport:false}).status,'ineligible');
 assert.equal(calc({activeInsurance:false}).totalKurus,0);
 assert.equal(calc({noWork:false}).status,'ineligible');
 assert.throws(()=>calc({kind:'accident',priorDays:0,priorPekKurus:0}));
 assert.throws(()=>calc({ordinaryWagesOnly:false}));
 assert.throws(()=>calc({reportDays:0}));
 assert.throws(()=>calc({priorDays:361}));
});
