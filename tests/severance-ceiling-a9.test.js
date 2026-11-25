import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSeverance, get2026SeveranceCeilingKurus } from '../src/termination-engine.js';
import { DATA_2026 } from '../src/data-2026.js';
test('A9 statutory ceilings switch on 1 July and reject unconfirmed years',()=>{
 for (const [date,expected] of [['2026-01-01',6494877],['2026-06-30',6494877],['2026-07-01',7372987],['2026-12-31',7372987]]) assert.equal(get2026SeveranceCeilingKurus(date),expected);
 for (const date of ['2025-12-31','2027-01-01','2026-02-30']) assert.throws(()=>get2026SeveranceCeilingKurus(date));
});
test('A9 capped and uncapped wages, one full year, no remaining exemption',()=>{
 const june=calculateSeverance({startIso:'2025-06-30',endIso:'2026-06-30',baseGrossKurus:10000000});
 const july=calculateSeverance({startIso:'2025-07-01',endIso:'2026-07-01',baseGrossKurus:10000000});
 const below=calculateSeverance({startIso:'2025-07-01',endIso:'2026-07-01',baseGrossKurus:6000000});
 assert.equal(june.duration.totalDays,365);
 assert.equal(june.grossKurus,6494877);
 assert.equal(june.ceilingPeriod,'1 Ocak–30 Haziran 2026');
 assert.equal(july.grossKurus,7372987);
 assert.equal(july.ceilingPeriod,'1 Temmuz–31 Aralık 2026');
 assert.equal(july.stampTaxKurus,55961);
 assert.equal(july.netKurus,7317026);
 assert.equal(july.ceilingApplied,true);
 assert.equal(below.grossKurus,6000000);
 assert.equal(below.ceilingApplied,false);
 assert.equal(DATA_2026.publishedData.severanceCeiling.reviewedAt,'2026-11-25');
});
