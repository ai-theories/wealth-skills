import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCollarStrategy, calculatePeMetrics } from '../src/engines/uhnw.js';

test('UHNW Engine: Concentrated Stock Zero-Cost Collar Strategy', () => {
  const result = calculateCollarStrategy('AAPL', 100000, 200, 25);

  assert.equal(result.symbol, 'AAPL');
  assert.equal(result.collarParameters.putStrikeFloor, 180); // 10% OTM
  assert.equal(result.collarParameters.callStrikeCap, 230); // 15% OTM
  assert.equal(result.zeroCostStructure, true);
});

test('UHNW Engine: Private Equity MOIC / TVPI Metrics', () => {
  const result = calculatePeMetrics(5000000, 3000000, 1200000, 3200000);

  assert.equal(result.metrics.tvpiMoic, '1.47x');
  assert.equal(result.metrics.dpi, '0.4x');
  assert.equal(result.unfundedCommitment, 2000000);
});
