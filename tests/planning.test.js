import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTaxBracketHeadroom, calculateRMD, runMonteCarloCashFlow } from '../src/engines/planning.js';

test('Planning Engine: Tax Bracket Headroom Calculation', () => {
  const result = calculateTaxBracketHeadroom(210000, 'MFJ');
  assert.equal(result.taxableIncome, 180000);
  assert.equal(result.currentBracketRate, '22.0%');
  assert.equal(result.headroomForRothConversion, 21050);
});

test('Planning Engine: RMD Calculation for Age 75', () => {
  const result = calculateRMD(75, 500000);
  assert.equal(result.rmdRequired, 20325); // 500,000 / 24.6
  assert.equal(result.monthlyDistribution, 1694);
});

test('Planning Engine: Monte Carlo Simulation', () => {
  const result = runMonteCarloCashFlow(1000000, 40000, 0.06, 0.12, 30, 500);
  assert.ok(result.successRatePercent > 70);
  assert.ok(result.medianEndingBalance > 0);
});
