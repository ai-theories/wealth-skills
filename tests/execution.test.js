import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePreTradeCompliance, buildTradePayload } from '../src/engines/execution.js';

test('Execution Engine: Pre-Trade Compliance Validation', () => {
  const balance = { settledCash: 10000 };
  const order = { symbol: 'VTI', action: 'BUY', quantity: 100, price: 200 }; // 20,000 > 10,000
  const result = validatePreTradeCompliance(balance, order);

  assert.equal(result.passed, false);
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].includes('Insufficient buying power'));
});

test('Execution Engine: Alpaca Payload Generation', () => {
  const order = { symbol: 'VTI', action: 'BUY', quantity: 10, price: 270, orderType: 'LIMIT', tif: 'DAY' };
  const result = buildTradePayload('Alpaca', 'ACC-1', order);

  assert.equal(result.broker, 'Alpaca_API');
  assert.equal(result.payload.symbol, 'VTI');
  assert.equal(result.payload.side, 'buy');
  assert.equal(result.requiresHumanApproval, true);
});
