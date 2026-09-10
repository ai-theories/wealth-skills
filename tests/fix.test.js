import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFixOrderPayload, parseFixMessage } from '../src/engines/fix.js';

test('FIX Engine: Tag 35=D New Order Single Payload Generation', () => {
  const result = buildFixOrderPayload({
    account: 'U9821045',
    symbol: 'VTI',
    side: 'BUY',
    quantity: 500,
    price: 275.50,
    targetCustodian: 'Pershing_NetX360'
  });

  assert.equal(result.protocol, 'FIX.4.4');
  assert.equal(result.symbol, 'VTI');
  assert.equal(result.quantity, 500);
  assert.ok(result.fixMessageRaw.includes('35=D'));
  assert.ok(result.fixMessageRaw.includes('55=VTI'));
  assert.ok(result.fixMessageRaw.includes('10='));
});

test('FIX Engine: Parse Raw FIX Message', () => {
  const fixStr = "8=FIX.4.4\x019=98\x0135=D\x011=U9821045\x0155=AAPL\x0154=1\x0138=100\x0144=215.00\x0110=184\x01";
  const parsed = parseFixMessage(fixStr);

  assert.equal(parsed.symbol, 'AAPL');
  assert.equal(parsed.side, 'BUY');
  assert.equal(parsed.quantity, 100);
  assert.equal(parsed.price, 215.00);
});
