---
name: wealth-onboarding
description: Client Identification Program field checks and onboarding milestone tracking. Records the result of an OFAC screen performed elsewhere; does not itself screen sanctions lists, verify identity documents, aggregate accounts or manage e-signatures.
catalog_ids: ["T062", "T063", "T064", "T065", "T066", "T067", "T068", "T069", "T070"]
---

# Wealth Onboarding & Identity (`wealth-onboarding`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to check that a new-account application carries the Client Identification Program elements, record the outcome of an OFAC screen run in a proper screening system, and track onboarding milestones.

---

## Engine-Backed Capabilities

| Capability | Engine function | CLI |
|---|---|---|
| CIP field checks (legal name, SSN format, residential address, verifiable date of birth) and recording the OFAC screen result | `validateCipIdentity` | `onboarding validate-cip` |
| Onboarding milestone tracking (CIP, W-9, custodial agreement, funding) | `checkOnboardingStatus` | library only |

## Guidance Only (No Engine Support)

- OFAC / SDN screening itself
- Documentary and non-documentary identity verification (Alloy, Socure, Trulioo)
- KYC document parsing
- Account aggregation (Plaid, Yodlee) and e-signature workflows (DocuSign)

## Limits to State With Every Result

- `ofacStatus` must come from an actual sanctions screen. If it is missing, CIP fails with `NOT_SCREENED`; never fill it in to make the check pass.
- The SSN check validates format only, not issuance or ownership.
- A passing result means the required fields are present and well-formed, not that the applicant's identity is verified.

---

## CLI & Module Usage

```bash
node bin/wealth-skills.js onboarding validate-cip --applicant '{"name":"Jane Doe","ssn":"123-45-6789","dob":"1990-05-15","address":"456 Elm St","ofacStatus":"CLEAR"}'
```

```javascript
import { validateCipIdentity, checkOnboardingStatus } from './src/engines/onboarding.js';

const applicant = { name: 'Jane Doe', ssn: '123-45-6789', dob: '1990-05-15', address: '456 Elm St', ofacStatus: 'CLEAR' };
const validation = validateCipIdentity(applicant);
const status = checkOnboardingStatus({ clientId: 'C1', cipPassed: validation.cipPassed, w9Signed: true, custodialAgreementSigned: false, accountFunded: false });
```

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)) and include the `auditMetadata` block returned by the tool:
- **Claude**: Use GitHub Alerts (`> [!NOTE]`) for onboarding milestones.
- **OpenAI Codex & Canvas**: Format KYC status tables using GFM markdown.
