/**
 * Wealth Onboarding Engine - Self-Contained CIP Identity & Onboarding Validator
 */

export function validateCipIdentity(applicantData) {
  // No default for ofacStatus: an absent field means the screen was never run, which is a
  // failure to verify, not a pass. Defaulting it to CLEAR asserted a sanctions check that
  // never happened. This function does not screen anything itself -- it records the result
  // of a screen the caller performed against an actual OFAC/SDN source.
  const { name, ssn, dob, address, ofacStatus } = applicantData || {};

  const flags = [];

  if (!name || !String(name).trim()) {
    flags.push('Applicant legal name missing.');
  }

  if (!ssn || ssn.replace(/[^0-9]/g, '').length !== 9) {
    flags.push('Invalid SSN length or format.');
  }

  if (!address || !String(address).trim()) {
    flags.push('Residential address missing; CIP requires a physical address of record.');
  }

  const ofacScreened = typeof ofacStatus === 'string' && ofacStatus.trim() !== '';
  if (!ofacScreened) {
    flags.push('OFAC/SDN screening result not supplied; applicant has NOT been screened.');
  } else if (ofacStatus.toUpperCase() !== 'CLEAR') {
    flags.push(`OFAC Watchlist Match Detected: ${ofacStatus}`);
  }

  const age = calculateAge(dob);
  if (age === null) {
    flags.push('Date of birth missing or unparseable; age could not be verified.');
  } else if (age < 18) {
    flags.push('Applicant is under 18; custodial account structure required.');
  }

  const isVerified = flags.length === 0;

  return {
    applicantName: name,
    age,
    cipPassed: isVerified,
    ofacScreened,
    ofacStatus: ofacScreened ? ofacStatus : 'NOT_SCREENED',
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
  if (!dobString) return null;
  const birth = new Date(dobString);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
