import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const workerSource = await readFile(new URL('../src/worker.js', import.meta.url), 'utf8');

test('Wrangler production config uses a Worker entry point and static assets binding', () => {
  assert.equal(config.name, 'maasim-net');
  assert.equal(config.main, 'src/worker.js');
  assert.equal(config.assets.directory, './dist');
  assert.equal(config.assets.binding, 'ASSETS');
  assert.match(workerSource, /env\.ASSETS\.fetch\(request\)/);
});
