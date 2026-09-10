/**
 * Wealth Compliance Engine - Self-Contained FINRA Rule 2210 & BrokerCheck Scanner
 */

const PROHIBITED_GUARANTEE_TERMS = [
  'guaranteed return',
  'risk-free',
  'no risk',
  'guaranteed 10%',
  'guaranteed 15%',
  '100% safe',
  'can\'t lose'
];

const REQUIRED_DISCLAIMER_TERMS = [
  'past performance is no guarantee',
  'subject to market risk',
  'may lose value'
];

export function scanFinraRule2210(communicationText) {
  const lower = communicationText.toLowerCase();

  const foundProhibitedTerms = PROHIBITED_GUARANTEE_TERMS.filter(term => lower.includes(term));
  const missingRequiredDisclaimers = REQUIRED_DISCLAIMER_TERMS.filter(term => !lower.includes(term));

  const isCompliant = foundProhibitedTerms.length === 0;

  return {
    isCompliant,
    prohibitedTermsFound: foundProhibitedTerms,
    missingDisclaimers: missingRequiredDisclaimers,
    complianceScore: isCompliant ? 100 : Math.max(0, 100 - foundProhibitedTerms.length * 35),
    regulatoryNotice: isCompliant 
      ? 'Communication passed FINRA Rule 2210 prohibited term check.'
      : `CRITICAL COMPLIANCE VIOLATION: Communication contains prohibited promissory statements (${foundProhibitedTerms.join(', ')}).`
  };
}

export function parseBrokerCheckRecord(crdNumber) {
  const MOCK_BROKER_DATABASE = {
    '5910482': {
      crd: '5910482',
      name: 'Sarah J. Miller',
      registration: 'Series 65 (IAR)',
      firm: 'Apex Wealth Management LLC',
      disclosuresCount: 0,
      status: 'ACTIVE'
    },
    '104921': {
      crd: '104921',
      name: 'Apex Wealth Management LLC',
      registration: 'SEC Registered Investment Adviser (RIA)',
      secNumber: '801-98210',
      disclosuresCount: 0,
      status: 'APPROVED'
    }
  };

  const record = MOCK_BROKER_DATABASE[String(crdNumber)];

  if (record) {
    return {
      crdNumber: String(crdNumber),
      found: true,
      record
    };
  }

  return {
    crdNumber: String(crdNumber),
    found: false,
    message: `No local CRD record found for ${crdNumber}.`
  };
}
