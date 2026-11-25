import {test} from 'node:test';
import assert from 'node:assert/strict';
import {forecastTaxBrackets,currentTaxRate} from '../src/tax-bracket-engine.js';
test('100k reference: 85k matrah, March and May transitions',()=>{
 const r=forecastTaxBrackets({grossKurus:10000000});
 assert.equal(r.monthlyBaseKurus,8500000);
 assert.equal(r.next.month,3);
 assert.deepEqual(r.rows[2].rates,[150000,200000]);
 assert.deepEqual(r.rows[4].rates,[200000,270000]);
 assert.equal(r.rows[2].calculatedTaxKurus,1600000);
 assert.equal(r.rows[0].calculatedTaxKurus,1275000);
 assert.deepEqual(r.transitions.map(t=>t.month),[3,5,null,null]);
});
test('prior cumulative base is before selected month; exact boundary does not cross',()=>{
 const r=forecastTaxBrackets({grossKurus:10000000,priorBaseKurus:10500000,startMonth:6});
 assert.equal(r.rows[0].cumulativeKurus,19000000);
 assert.deepEqual(r.rows[0].rates,[150000]);
 assert.equal(r.next.month,7);
 assert.equal(currentTaxRate(19000000),150000);
 assert.equal(currentTaxRate(19000001),200000);
 assert.equal(forecastTaxBrackets({grossKurus:10000000,priorBaseKurus:19000000,startMonth:6}).next.month,6);
});
test('SGK cap, end of year, already crossed, invalid January carry',()=>{
 assert.equal(forecastTaxBrackets({grossKurus:40000000}).monthlyBaseKurus,35540950);
 assert.equal(forecastTaxBrackets({grossKurus:10000000,startMonth:12}).next.month,null);
 assert.equal(forecastTaxBrackets({grossKurus:10000000,priorBaseKurus:530000001,startMonth:6}).next,null);
 assert.throws(()=>forecastTaxBrackets({grossKurus:10000000,priorBaseKurus:1,startMonth:1}));
 assert.throws(()=>forecastTaxBrackets({grossKurus:10000000,startMonth:13}));
});
