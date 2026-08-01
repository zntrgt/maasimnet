import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGross100kScenarioData,
  replaceScenarioTokens
} from '../scripts/render-scenarios.js';

test('100.000 TL brüt senaryo verileri merkezi motordan benchmark değerlerini üretir', () => {
  const scenario = createGross100kScenarioData();

  assert.deepEqual(scenario.values, {
    januaryNetKurus: 7_595_303,
    decemberNetKurus: 6_715_680,
    averageNetKurus: 6_949_014,
    annualNetKurus: 83_388_163,
    employerOtherKurus: 12_175_000,
    employerManufacturingKurus: 11_875_000,
    employerNoDiscountKurus: 12_375_000
  });

  assert.equal(scenario.replacements['{{SCENARIO_100K_JAN_NET}}'], '75.953,03 TL');
  assert.equal(scenario.replacements['{{SCENARIO_100K_ANNUAL_NET}}'], '833.881,63 TL');
});

test('senaryo şablonundaki tüm hesap tokenları build sırasında çözülür', () => {
  const scenario = createGross100kScenarioData();
  const template = [
    '{{SCENARIO_100K_JAN_NET}}',
    '{{SCENARIO_100K_AVG_NET}}',
    '{{SCENARIO_100K_EMPLOYER_OTHER}}'
  ].join('|');

  const rendered = replaceScenarioTokens(template, scenario.replacements);
  assert.equal(rendered, '75.953,03 TL|69.490,14 TL|121.750,00 TL');
  assert.doesNotMatch(rendered, /\{\{SCENARIO_/);
});
