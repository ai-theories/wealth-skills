import test from 'node:test';
import assert from 'node:assert/strict';
import { scanFinraRule2210, parseBrokerCheckRecord } from '../src/engines/compliance.js';

test('Compliance Engine: FINRA Rule 2210 Scanner Catches Prohibited Guarantee', () => {
  const badText = "We promise a guaranteed 15% return on your investment.";
  const result = scanFinraRule2210(badText);

  assert.equal(result.isCompliant, false);
  assert.equal(result.prohibitedTermsFound.length, 1);
  assert.equal(result.prohibitedTermsFound[0], 'guaranteed 15%');
  assert.ok(result.complianceScore < 100);
});

test('Compliance Engine: BrokerCheck CRD Lookup', () => {
  const result = parseBrokerCheckRecord('5910482');

  assert.equal(result.found, true);
  assert.equal(result.record.name, 'Sarah J. Miller');
  assert.equal(result.record.registration, 'Series 65 (IAR)');
});
