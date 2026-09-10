import test from 'node:test';
import assert from 'node:assert/strict';
import { backtestPortfolio, forwardTestSimulation } from '../src/engines/quant.js';

test('Quant Engine: Historical Backtest (60/40 Portfolio)', () => {
  const result = backtestPortfolio({ VTI: 0.6, BND: 0.4 }, 100000);

  assert.equal(result.sampleYears, 10);
  assert.ok(result.endingBalance > result.initialBalance);
  assert.ok(result.metrics.cagrPercent > 0);
  assert.ok(result.metrics.sharpeRatio > 0);
  assert.ok(result.metrics.maxDrawdownPercent >= 0);
});

test('Quant Engine: Forward Walk-Forward Simulation (Stagflation Regime)', () => {
  const result = forwardTestSimulation({ VTI: 0.6, BND: 0.4 }, 'stagflation', 5, 300);

  assert.equal(result.regime, 'stagflation');
  assert.ok(result.probabilityOfGrowthPercent >= 0);
  assert.ok(result.projections.medianPercentile50 > 0);
});
