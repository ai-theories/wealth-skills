import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePortfolioRebalance, scanTaxLossHarvesting, monitorPortfolioDrift, analyzePortfolioFactors, calculatePortfolioVar } from '../src/engines/portfolio.js';

test('Portfolio Engine: Rebalance Calculation', () => {
  const current = { equity: 68, bond: 22 };
  const target = { equity: 60, bond: 30 };
  const result = calculatePortfolioRebalance(current, target, 1000000);

  assert.equal(result.rebalancePlan.length, 2);
  const equityPlan = result.rebalancePlan.find(p => p.category === 'equity');
  assert.equal(equityPlan.action, 'SELL');
  assert.equal(equityPlan.tradeAmount, 80000);
});

test('Portfolio Engine: Portfolio Drift Monitor Breaches Threshold', () => {
  const current = { equity: 68, bond: 22 }; // 8% drift > 5% band
  const target = { equity: 60, bond: 30 };
  const result = monitorPortfolioDrift(current, target, 1000000, 5.0);

  assert.equal(result.isRebalanceTriggered, true);
  assert.equal(result.breachedCategories.length, 2);
  assert.ok(result.urgencyScore >= 50);
});

test('Portfolio Engine: Factor Exposure Analysis', () => {
  const holdings = [{ symbol: 'VTI', weightPct: 60 }, { symbol: 'BND', weightPct: 40 }];
  const result = analyzePortfolioFactors(holdings);

  assert.equal(result.assetClassBreakdown.equityPct, 60);
  assert.equal(result.assetClassBreakdown.fixedIncomePct, 40);
  assert.equal(result.fixedIncomeFactors.durationYears, 6.2);
});

test('Portfolio Engine: Value at Risk (VaR) Calculation', () => {
  const result = calculatePortfolioVar(1000000, 0.14, 0.95, 1);

  assert.equal(result.confidenceLevelPercent, 95);
  assert.ok(result.valueAtRiskDollar > 0);
  assert.ok(result.conditionalVaR_ExpectedShortfallDollar > result.valueAtRiskDollar);
});

test('Portfolio Engine: Tax Loss Harvesting Scanner', () => {
  const lots = [
    { id: 'L1', symbol: 'IWM', quantity: 100, purchasePrice: 220, currentPrice: 150, purchaseDate: '2026-01-10' }
  ];
  const result = scanTaxLossHarvesting(lots, 1000);

  assert.equal(result.opportunities.length, 1);
  assert.equal(result.opportunities[0].unrealizedLoss, -7000);
  assert.equal(result.opportunities[0].recommendedReplacement, 'VB');
});
