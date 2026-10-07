import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const years = [2020, 2021, 2022, 2023, 2024, 2025];
const env = { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } };

for (const year of years) {
  test(`/brutten-nete-${year} redirects permanently to the canonical payroll page`, async () => {
    for (const origin of ['https://maasim.net', 'http://www.maasim.net']) {
      for (const pathname of [`/brutten-nete-${year}`, `/brutten-nete-${year}/`]) {
        const response = await worker.fetch(new Request(`${origin}${pathname}`), env);
        assert.equal(response.status, 301);
        assert.equal(response.headers.get('location'), `https://maasim.net/${year}-maas-hesaplama/`);
      }
    }
  });
}

for (const pathname of ['/brutten-nete-2026/', '/2025-maas-hesaplama/', '/blog/brutten-nete-2022/']) {
  test(`${pathname} is not redirected by the legacy gross-to-net rule`, async () => {
    const response = await worker.fetch(new Request(`https://maasim.net${pathname}`), env);
    assert.notEqual(response.status, 301);
  });
}
