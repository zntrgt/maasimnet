import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyWage,DAILY_WAGE_2026 as D} from '../src/daily-wage-engine.js';
test('A12 official 2026 minimum wage, daily and hourly',()=>{
 assert.equal(D.days,30);assert.equal(D.hours,225);
 assert.deepEqual(dailyWage(D.grossKurus),{kind:'gross',monthlyKurus:3303000,dailyKurus:110100,hourlyKurus:14680});
 assert.deepEqual(dailyWage(D.netKurus,'net'),{kind:'net',monthlyKurus:2807550,dailyKurus:93585,hourlyKurus:12478});
});
test('A12 same-kind conversion with separate kuruş rounding',()=>{
 assert.equal(dailyWage(6000000).dailyKurus,200000);
 assert.equal(dailyWage(6000000).hourlyKurus,26667);
 assert.equal(dailyWage(5000000,'net').dailyKurus,166667);
 assert.equal(dailyWage(5000000,'net').hourlyKurus,22222);
});
test('A12 rejects invalid amounts and wage type',()=>{
 for(const v of [0,-1,1.1,NaN,Infinity,1000000001])assert.throws(()=>dailyWage(v));
 assert.throws(()=>dailyWage(100000,'other'));
});
