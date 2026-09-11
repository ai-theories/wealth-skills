import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCipIdentity, checkOnboardingStatus } from '../src/engines/onboarding.js';

test('Onboarding Engine: CIP Identity Check Pass', () => {
  const applicant = { name: 'Jane Doe', ssn: '123-45-6789', dob: '1990-05-15', address: '456 Elm St', ofacStatus: 'CLEAR' };
  const result = validateCipIdentity(applicant);

  assert.equal(result.cipPassed, true);
  assert.equal(result.verificationFlags.length, 0);
});

test('Onboarding Engine: Status Progress Tracker', () => {
  const record = { clientId: 'C1', cipPassed: true, w9Signed: true, custodialAgreementSigned: false, accountFunded: false };
  const result = checkOnboardingStatus(record);

  assert.equal(result.progressPercent, 50);
  assert.equal(result.isReadyForTrading, false);
  assert.equal(result.pendingSteps.length, 2);
});

test('Onboarding Engine: CIP Fails When OFAC Screening Was Never Run', () => {
  const applicant = { name: 'Jane Doe', ssn: '123-45-6789', dob: '1990-05-15', address: '456 Elm St' };
  const result = validateCipIdentity(applicant);

  assert.equal(result.cipPassed, false);
  assert.equal(result.ofacScreened, false);
  assert.equal(result.ofacStatus, 'NOT_SCREENED');
  assert.ok(result.verificationFlags.some(f => f.includes('NOT been screened')));
});

test('Onboarding Engine: CIP Fails On An Unverifiable Date Of Birth', () => {
  const applicant = { name: 'Jane Doe', ssn: '123-45-6789', dob: 'not-a-date', address: '456 Elm St', ofacStatus: 'CLEAR' };
  const result = validateCipIdentity(applicant);

  assert.equal(result.cipPassed, false);
  assert.equal(result.age, null);
});

test('Onboarding Engine: CIP Fails On An OFAC Hit And On A Missing Address', () => {
  const hit = validateCipIdentity({ name: 'Jane Doe', ssn: '123-45-6789', dob: '1990-05-15', address: '456 Elm St', ofacStatus: 'SDN_MATCH' });
  assert.equal(hit.cipPassed, false);
  assert.ok(hit.verificationFlags.some(f => f.includes('OFAC Watchlist Match')));

  const noAddress = validateCipIdentity({ name: 'Jane Doe', ssn: '123-45-6789', dob: '1990-05-15', ofacStatus: 'CLEAR' });
  assert.equal(noAddress.cipPassed, false);
});
