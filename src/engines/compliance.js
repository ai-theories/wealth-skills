/**
 * Wealth Compliance Engine - Self-Contained FINRA Rule 2210 Keyword Screen & Sample Registration Fixture
 */

// Promissory language. Patterns rather than fixed strings, so "guaranteed 12%" is caught as well
// as "guaranteed 15%". Flagged text always needs human review: the screen does not understand
// negation, so "we never promise risk-free returns" is flagged too, which is the safe direction.
const PROHIBITED_PATTERNS = [
  /\bguarantee(?:d|s)?\s+(?:a\s+|an\s+)?\d+(?:\.\d+)?\s*%/g,
  /\bguarantee(?:d|s)?\s+(?:a\s+|an\s+)?(?:return|returns|income|profit|profits|yield|gain|gains)\b/g,
  /\brisk-?\s?free\b/g,
  /\bno\s+risk\b/g,
  /\b100\s*%\s*safe\b/g,
  /\b(?:can't|cannot|can\s+not|won't|will\s+not)\s+lose\b/g
];

const REQUIRED_DISCLOSURES = [
  {
    disclosure: 'past performance is no guarantee',
    pattern: /\bpast performance (?:is no guarantee|is not (?:a |an )?(?:guarantee|indication)|does not guarantee)/
  },
  {
    disclosure: 'subject to market risk',
    pattern: /\bsubject to (?:market )?risks?\b/
  },
  {
    disclosure: 'may lose value',
    pattern: /\b(?:may|could|can) lose value\b|\bloss of principal\b/
  }
];

// Curly quotes and typographic dashes (as pasted from Word or Outlook) otherwise slip past the
// patterns, so text is normalised before matching.
function normalizeText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[‘’‛′]/g, "'")
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ');
}

export function scanFinraRule2210(communicationText) {
  const text = normalizeText(communicationText);

  const foundProhibitedTerms = [];
  for (const pattern of PROHIBITED_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const phrase = match[0].trim();
      if (!foundProhibitedTerms.includes(phrase)) foundProhibitedTerms.push(phrase);
    }
  }

  const missingRequiredDisclaimers = REQUIRED_DISCLOSURES
    .filter(({ pattern }) => !pattern.test(text))
    .map(({ disclosure }) => disclosure);

  // Missing disclosures now affect the verdict. Before, a communication with none of them was
  // reported as compliant with a score of 100.
  let screenStatus = 'PASSED_AUTOMATED_SCREEN';
  if (foundProhibitedTerms.length > 0) screenStatus = 'VIOLATION';
  else if (missingRequiredDisclaimers.length > 0) screenStatus = 'NEEDS_REVIEW';

  const isCompliant = screenStatus === 'PASSED_AUTOMATED_SCREEN';

  let regulatoryNotice;
  if (screenStatus === 'VIOLATION') {
    regulatoryNotice = `Prohibited promissory language detected (${foundProhibitedTerms.join(', ')}). Revise before use.`;
  } else if (screenStatus === 'NEEDS_REVIEW') {
    regulatoryNotice = `No prohibited terms detected, but standard disclosures are missing (${missingRequiredDisclaimers.join('; ')}). Add them or document why they do not apply.`;
  } else {
    regulatoryNotice = 'Passed the automated keyword screen. This is not a Rule 2210 principal approval; retail communications still require review by a registered principal.';
  }

  return {
    isCompliant,
    screenStatus,
    prohibitedTermsFound: foundProhibitedTerms,
    missingDisclaimers: missingRequiredDisclaimers,
    // Heuristic triage score for sorting a review queue; not a regulatory measure.
    complianceScore: Math.max(0, 100 - foundProhibitedTerms.length * 35 - missingRequiredDisclaimers.length * 10),
    requiresPrincipalReview: true,
    screenLimitations: 'Keyword and pattern matching only: no negation handling, no fair-and-balanced assessment, no performance-presentation review.',
    regulatoryNotice
  };
}

// Two FICTITIOUS records for demos and tests. This is not BrokerCheck or IAPD data: a hit says
// nothing about a real person or firm, and a miss says nothing about whether a real CRD exists.
const SAMPLE_REGISTRATION_FIXTURE = {
  '5910482': {
    crd: '5910482',
    name: 'Sarah J. Miller',
    type: 'Individual',
    registration: 'Series 65 (IAR)',
    firm: 'Apex Wealth Management LLC',
    firmCrd: '104921',
    disclosuresCount: 0,
    status: 'ACTIVE',
    fictitious: true
  },
  '104921': {
    crd: '104921',
    name: 'Apex Wealth Management LLC',
    type: 'Firm',
    registration: 'SEC Registered Investment Adviser (RIA)',
    secNumber: '801-98210',
    mainOffice: 'New York, NY',
    disclosuresCount: 0,
    status: 'APPROVED',
    fictitious: true
  }
};

const VERIFY_AT = ['https://brokercheck.finra.org', 'https://adviserinfo.sec.gov'];

export function parseBrokerCheckRecord(crdNumber) {
  const crd = String(crdNumber ?? '').trim();
  const record = SAMPLE_REGISTRATION_FIXTURE[crd];

  const base = {
    crdNumber: crd,
    dataSource: 'SAMPLE_FIXTURE',
    isAuthoritative: false,
    verifyAt: VERIFY_AT
  };

  if (record) {
    return {
      ...base,
      found: true,
      record: { ...record },
      message: 'Fictitious sample record for demonstration only. Do not use it to answer any real registration or disclosure question.'
    };
  }

  return {
    ...base,
    found: false,
    message: `CRD ${crd} is not in the bundled two-record sample fixture. No registry was queried, so this says nothing about whether the individual or firm is registered or has disclosures. Verify at ${VERIFY_AT.join(' or ')}.`
  };
}
