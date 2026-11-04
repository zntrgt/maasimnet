import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

function contactRequest(origin) {
  return new Request('https://maasim.net/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: '{}'
  });
}

test('contact endpoint rejects opaque "null" origin with 403 instead of throwing', async () => {
  const response = await worker.fetch(contactRequest('null'), {});
  assert.equal(response.status, 403);
});

test('contact endpoint rejects foreign origin with 403', async () => {
  const response = await worker.fetch(contactRequest('https://example.com'), {});
  assert.equal(response.status, 403);
});

test('contact endpoint lets same-origin requests reach validation', async () => {
  const response = await worker.fetch(contactRequest('https://maasim.net'), {});
  assert.equal(response.status, 400);
});
