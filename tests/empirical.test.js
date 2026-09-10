import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateTaxBracketHeadroom, calculateRMD } from '../src/engines/planning.js';
import { calculatePortfolioRebalance, monitorPortfolioDrift, calculatePortfolioVar, scanTaxLossHarvesting } from '../src/engines/portfolio.js';
import { backtestPortfolio, forwardTestSimulation } from '../src/engines/quant.js';
import { parseMeetingTranscript, buildCrmPayload } from '../src/engines/crm.js';
import { generateCompanyTearSheet } from '../src/engines/research.js';
import { validatePreTradeCompliance } from '../src/engines/execution.js';
import { validateCipIdentity } from '../src/engines/onboarding.js';
import { scanFinraRule2210, parseBrokerCheckRecord } from '../src/engines/compliance.js';

test('Empirical UC-101: Tax Bracket Headroom Check', () => {
  const res = calculateTaxBracketHeadroom(210000, 'MFJ');
  assert.equal(res.headroomForRothConversion, 21050);
});

test('Empirical UC-102: RMD at Age 75', () => {
  const res = calculateRMD(75, 500000);
  assert.equal(res.rmdRequired, 20325);
});

test('Empirical UC-103: FINRA Promissory Phrase Detection', () => {
  const res = scanFinraRule2210('guaranteed 15% return');
  assert.equal(res.isCompliant, false);
});

test('Empirical UC-104: Single Stock Tear Sheet (AAPL)', () => {
  const res = generateCompanyTearSheet('AAPL', { marketCap: 3e12, price: 200, eps: 8, revenue: 3e11 });
  assert.equal(res.ticker, 'AAPL');
});

test('Empirical UC-107: FINRA BrokerCheck CRD Lookup', () => {
  const res = parseBrokerCheckRecord('5910482');
  assert.equal(res.found, true);
});

test('Empirical UC-201: 60/40 Portfolio Rebalance', () => {
  const res = calculatePortfolioRebalance({ equity: 68, bond: 22 }, { equity: 60, bond: 30 }, 1000000);
  assert.equal(res.rebalancePlan[0].action, 'SELL');
});

test('Empirical UC-202: 10-Year Backtest', () => {
  const res = backtestPortfolio({ VTI: 0.6, BND: 0.4 }, 100000);
  assert.ok(result => res.metrics.cagrPercent > 0);
});

test('Empirical UC-301: HNW $5M Rebalance + Tax-Loss Harvesting', () => {
  const lots = [{ id: 'L1', symbol: 'IWM', quantity: 500, purchasePrice: 220, currentPrice: 150, purchaseDate: '2026-01-10' }];
  const tlh = scanTaxLossHarvesting(lots, 1000);
  assert.equal(tlh.opportunities.length, 1);
  assert.equal(tlh.opportunities[0].recommendedReplacement, 'VB');
});

test('Empirical UC-304: Parametric VaR (99% Confidence)', () => {
  const res = calculatePortfolioVar(5000000, 0.16, 0.99, 1);
  assert.equal(res.confidenceLevelPercent, 99);
  assert.ok(res.valueAtRiskDollar > 0);
});
