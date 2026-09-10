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
