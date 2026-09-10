/**
 * Wealth Onboarding Engine - Self-Contained CIP Identity & Onboarding Validator
 */

export function validateCipIdentity(applicantData) {
  const { name, ssn, dob, address, ofacStatus = 'CLEAR' } = applicantData;

  const flags = [];

  if (!ssn || ssn.replace(/[^0-9]/g, '').length !== 9) {
    flags.push('Invalid SSN length or format.');
  }

  if (ofacStatus !== 'CLEAR') {
    flags.push(`OFAC Watchlist Match Detected: ${ofacStatus}`);
  }

  const age = calculateAge(dob);
  if (age < 18) {
    flags.push('Applicant is under 18; custodial account structure required.');
  }

  const isVerified = flags.length === 0;

  return {
    applicantName: name,
    age,
    cipPassed: isVerified,
    ofacStatus,
    verificationFlags: flags
  };
}

export function checkOnboardingStatus(record) {
  const { cipPassed, w9Signed, custodialAgreementSigned, accountFunded } = record;

  const totalSteps = 4;
  let completed = 0;
  if (cipPassed) completed++;
  if (w9Signed) completed++;
  if (custodialAgreementSigned) completed++;
  if (accountFunded) completed++;

  const progressPercent = (completed / totalSteps) * 100;
  const isReadyForTrading = completed === totalSteps;

  return {
    clientId: record.clientId,
    progressPercent,
    isReadyForTrading,
    pendingSteps: [
      !cipPassed ? 'CIP Identity Verification' : null,
      !w9Signed ? 'W-9 Tax Form Signature' : null,
      !custodialAgreementSigned ? 'Custodial Account Agreement' : null,
      !accountFunded ? 'Initial Deposit / ACAT Transfer' : null
    ].filter(Boolean)
  };
}

function calculateAge(dobString) {
  if (!dobString) return 0;
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
