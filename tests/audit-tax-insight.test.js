import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/humanized-ux.js', import.meta.url), 'utf8');
const functions = ['readPayrollRows', 'updateTaxInsight'].map(name => source.match(new RegExp(`function ${name}\\(\\) \\{[\\s\\S]*?\\n\\}`))[0]).join('\n');
function runScenario(months) {
  const nodes = Object.fromEntries(['.human-tax-insight','[data-human-tax-title]','[data-human-tax-copy]','[data-human-tax-rate]'].map(s => [s, {textContent:'',hidden:true}]));
  const context = vm.createContext({
    hasUsableHomeResult: () => true,
    parseCurrency: value => Number(value),
    formatTry: value => String(value),
    qs: (selector, row) => selector === '.tax-bracket-badge' ? {textContent:row.badge} : nodes[selector],
    qsa: () => months.map(([month, net, badge]) => ({badge, children:Array.from({length:8},(_,i)=>({tagName:'TD',textContent:i===0?month:i===4?String(net):''}))}))
  });
  vm.runInContext(functions+'\nupdateTaxInsight();', context);
  return nodes;
}
test('mixed-rate March is identified before full-rate April',()=>{
  const n=runScenario([['Ocak',75953.03,'%15'],['Şubat',75953.03,'%15'],['Mart',72703.03,'%15 → %20'],['Nisan',71703.03,'%20']]);
  assert.match(n['[data-human-tax-title]'].textContent,/Mart/);
  assert.equal(n['[data-human-tax-rate]'].textContent,'%15 → %20');
  assert.match(n['[data-human-tax-copy]'].textContent,/3250/);
});
test('first-month crossing is not omitted',()=>{
  const n=runScenario([['Ocak',200000,'%15 → %20'],['Şubat',190000,'%20 → %27']]);
  assert.match(n['[data-human-tax-title]'].textContent,/Ocak/);
  assert.equal(n['.human-tax-insight'].hidden,false);
});
test('no rate crossing keeps insight hidden',()=>{
  const n=runScenario([['Ocak',30000,'%15'],['Şubat',30000,'%15']]);
  assert.equal(n['.human-tax-insight'].hidden,true);
});
