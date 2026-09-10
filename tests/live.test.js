import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchLiveEdgarCompanyFacts, fetchLiveFredSeries } from '../src/engines/live.js';

test('Live Engine: SEC EDGAR Hybrid Fetch / Fallback', async () => {
  const result = await fetchLiveEdgarCompanyFacts('0000320193');
  assert.ok(result.cik.includes('320193'));
  assert.ok(result.source.includes('EDGAR'));
});

test('Live Engine: FRED Macro Series Fetch / Fallback', async () => {
  const result = await fetchLiveFredSeries('GS10');
  assert.equal(result.seriesId, 'GS10');
  assert.ok(result.latestValue > 0);
});
