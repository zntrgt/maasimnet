import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_2026 } from '../src/data-2026.js';
import { PAYROLL_PARAMETERS_2026 } from '../src/parameters-2026.js';
import { SITE_METADATA } from '../content/site-metadata.js';
import { readFile } from 'node:fs/promises';

const transform = await readFile(new URL('../scripts/apply-p0-architecture.js', import.meta.url), 'utf8');
const build = await readFile(new URL('../scripts/build.js', import.meta.url), 'utf8');

test('hesap motoru 2026 değerlerini tek DATA_2026 kaynağından alır', () => {
  assert.equal(PAYROLL_PARAMETERS_2026.minimumGrossKurus, DATA_2026.payroll.minimumGrossKurus);
  assert.equal(PAYROLL_PARAMETERS_2026.sgkCeilingKurus, DATA_2026.publishedData.sgkCeiling.monthlyKurus);
  assert.equal(PAYROLL_PARAMETERS_2026.incomeTaxBrackets, DATA_2026.payroll.incomeTaxBrackets);
});

test('resmî 2026 temel değerleri veri merkezinde sabittir', () => {
  assert.equal(DATA_2026.publishedData.minimumWage.grossKurus, 3_303_000);
  assert.equal(DATA_2026.publishedData.minimumWage.netKurus, 2_807_550);
  assert.equal(DATA_2026.publishedData.sgkCeiling.monthlyKurus, 29_727_000);
  assert.equal(DATA_2026.publishedData.sgkCeiling.multiplier, 9);
  assert.equal(DATA_2026.publishedData.severanceCeiling.firstHalfKurus, 6_494_877);
  assert.equal(DATA_2026.publishedData.severanceCeiling.secondHalfKurus, 7_372_987);
  assert.equal(DATA_2026.publishedData.mealAllowance.incomeTaxDailyKurus, 30_000);
  assert.equal(DATA_2026.publishedData.mealAllowance.sgkDailyKurus, 15_800);
});

test('P0 dönüşümü uzman profili veya reviewer iddiası üretmez', () => {
  assert.doesNotMatch(transform, /ProfilePage|reviewedBy|uzmanlar\//i);
});

test('P0 dönüşümü ana sayfayı 6 SSS ve 6 senaryoyla sınırlar', () => {
  assert.match(transform, /details\.slice\(0, 6\)/);
  assert.match(transform, /scenarioCards\.slice\(0, 6\)/);
  assert.match(transform, /25 soruluk FAQPage schema eklenmez/);
});

test('build DATA_2026 ve P0 mimarisini production paketine dahil eder', () => {
  assert.match(build, /'data-2026\.js'/);
  assert.match(build, /applyP0Architecture\(distDir\)/);
  assert.match(build, /version:\s*SITE_METADATA\.releaseVersion/);
  assert.match(SITE_METADATA.releaseVersion, /^\d+\.\d+\.\d+-[a-z0-9-]+$/);
});
