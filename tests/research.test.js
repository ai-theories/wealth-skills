import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCompanyTearSheet, parseEdgarFilingSummary } from '../src/engines/research.js';

test('Research Engine: Stock Tear Sheet Generation', () => {
  const fin = { marketCap: 3e12, price: 200, eps: 8, revenue: 3e11, netIncome: 8e10, freeCashFlow: 8e10, dividends: 1.5, sector: 'Tech' };
  const result = generateCompanyTearSheet('AAPL', fin);

  assert.equal(result.ticker, 'AAPL');
  assert.equal(result.valuationMetrics.peRatio, 25);
  assert.equal(result.valuationMetrics.freeCashFlowConversionPercent, 100);
});

test('Research Engine: EDGAR Filing Parser', () => {
  const text = "Item 1A Risk Factors: We face supply chain disruptions and cybersecurity risks.";
  const result = parseEdgarFilingSummary('0000320193', '10-K', text);

  assert.equal(result.cik, '0000320193');
  assert.ok(result.item1ARiskSummary.includes('supply chain'));
});
