import test from 'node:test';
import assert from 'node:assert/strict';
import { scanFinraRule2210, parseBrokerCheckRecord } from '../src/engines/compliance.js';

test('Compliance Engine: FINRA Rule 2210 Scanner Catches Prohibited Guarantee', () => {
  const result = scanFinraRule2210('We promise a guaranteed 15% return on your investment.');

  assert.equal(result.isCompliant, false);
  assert.equal(result.screenStatus, 'VIOLATION');
  assert.deepEqual(result.prohibitedTermsFound, ['guaranteed 15%']);
  assert.ok(result.complianceScore < 100);
});

test('Compliance Engine: Missing Disclosures Mean Not Compliant', () => {
  const result = scanFinraRule2210('Our fund returned 40% last year. Invest now.');

  assert.equal(result.isCompliant, false);
  assert.equal(result.screenStatus, 'NEEDS_REVIEW');
  assert.equal(result.missingDisclaimers.length, 3);
  assert.ok(result.complianceScore < 100);
});

test('Compliance Engine: Passing The Screen Is Not Presented As Rule 2210 Approval', () => {
  const result = scanFinraRule2210('Past performance is no guarantee of future results. Investments are subject to market risk and may lose value.');

  assert.equal(result.isCompliant, true);
  assert.equal(result.screenStatus, 'PASSED_AUTOMATED_SCREEN');
  assert.equal(result.requiresPrincipalReview, true);
  assert.doesNotMatch(result.regulatoryNotice, /passed FINRA Rule 2210/i);
});

test('Compliance Engine: Catches Guarantees At Any Percentage And Typographic Variants', () => {
  const cases = [
    ['We guarantee 12% annually.', 'guarantee 12%'],
    ['A guaranteed 7.5% yield.', 'guaranteed 7.5%'],
    ['You can’t lose.', "can't lose"],
    ['It is risk‑free.', 'risk-free'],
    ['Guaranteed income for life.', 'guaranteed income']
  ];

  for (const [text, phrase] of cases) {
    const result = scanFinraRule2210(text);
    assert.ok(result.prohibitedTermsFound.includes(phrase), `${text} -> ${JSON.stringify(result.prohibitedTermsFound)}`);
  }
});

test('Compliance Engine: Registration Lookup Is Labelled As A Fictitious Fixture', () => {
  const result = parseBrokerCheckRecord('5910482');

  assert.equal(result.found, true);
  assert.equal(result.record.name, 'Sarah J. Miller');
  assert.equal(result.record.registration, 'Series 65 (IAR)');
  assert.equal(result.record.fictitious, true);
  assert.equal(result.dataSource, 'SAMPLE_FIXTURE');
  assert.equal(result.isAuthoritative, false);
});

test('Compliance Engine: A Fixture Miss Does Not Claim A Registry Was Queried', () => {
  const result = parseBrokerCheckRecord('1234567');

  assert.equal(result.found, false);
  assert.match(result.message, /No registry was queried/);
  assert.doesNotMatch(result.message, /live endpoint/i);
});
