import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNetSalarySeverance, calculateSalaryMonth } from '../src/net-salary-severance-engine.js';
import { calculatePayrollYear } from '../src/payroll-engine.js';

const dates={startIso:'2025-07-01',endIso:'2026-07-01'};
test('A10 inverts January 100k payroll and applies second half ceiling',()=>{
 const r=calculateNetSalarySeverance({...dates,targetNetKurus:7595303,salaryMonth:1,priorBaseKurus:0});
 assert.ok(Math.abs(r.salary.grossKurus-10000000)<=2);
 assert.equal(r.salary.netKurus,7595303);
 assert.equal(r.severance.grossKurus,7372987);
 assert.equal(r.severance.netKurus,7317026);
});
test('A10 actual previous tax base agrees with original monthly payroll engine',()=>{
 const rows=calculatePayrollYear({baseGrossKurusByMonth:Array(12).fill(5000000)});
 const expected=rows[5],prior=rows[4].cumulativeTaxBaseKurus;
 assert.equal(calculateSalaryMonth(5000000,6,prior).netKurus,expected.netKurus);
 const r=calculateNetSalarySeverance({...dates,targetNetKurus:expected.netKurus,salaryMonth:6,priorBaseKurus:prior,mealKurus:100000,transportKurus:50000,annualRegularBenefitsKurus:1200000});
 assert.ok(Math.abs(r.salary.grossKurus-5000000)<=2);
 assert.equal(r.estimatedPriorBase,false);
 assert.equal(r.severance.dressedGrossKurus,r.salary.grossKurus+250000);
 assert.equal(r.severance.basisKurus,r.severance.dressedGrossKurus);
});
test('A10 explicitly models unknown matrah, rejects unsupported dates and below-minimum net',()=>{
 const expected=calculateSalaryMonth(7500000,6,null);
 const r=calculateNetSalarySeverance({...dates,targetNetKurus:expected.netKurus,salaryMonth:6});
 assert.equal(r.estimatedPriorBase,true);
 assert.ok(Math.abs(r.salary.grossKurus-7500000)<=2);
 assert.throws(()=>calculateNetSalarySeverance({...dates,targetNetKurus:100000,salaryMonth:1}));
 assert.throws(()=>calculateNetSalarySeverance({...dates,targetNetKurus:5000000,salaryMonth:8}));
 assert.throws(()=>calculateNetSalarySeverance({...dates,endIso:'2027-01-01',targetNetKurus:5000000,salaryMonth:1}));
});
