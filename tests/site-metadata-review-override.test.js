import test from 'node:test';
import assert from 'node:assert/strict';
import { getPageMetadata, SITE_METADATA } from '../content/site-metadata.js';

test('sayfa bazlı reviewedAt override merkezi tarihe yansır', () => {
  assert.equal(getPageMetadata('/blog/2027-maas-zammi-beklentileri/').reviewedAt, '2026-10-10');
  assert.equal(getPageMetadata('/blog/2026-sgk-tavani/').reviewedAt, SITE_METADATA.blogReviewedAt);
});
