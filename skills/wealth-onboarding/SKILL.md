---
name: wealth-onboarding
description: Client KYC document parsing, identity verification rules (CIP/AML), account aggregation workflows, and e-signature intake validation.
catalog_ids: ["T062", "T063", "T064", "T065", "T066", "T067", "T068", "T069", "T070"]
---

# Wealth Onboarding & Identity (`wealth-onboarding`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to execute Client Identification Program (CIP) checks, parse KYC onboarding forms, validate Plaid/Yodlee account link status, and track Docusign e-signature workflows with **baked-in, zero-dependency Node.js execution logic**.

---

## Baked-In CLI & JavaScript Engine Execution

```bash
# Validate CIP Identity Verification
node bin/wealth-skills.js onboarding validate-cip
```

### Baked-in Engine Module Import
```javascript
import { validateCipIdentity, checkOnboardingStatus } from './src/engines/onboarding.js';

const applicant = { name: 'Arthur Pendelton', ssn: '123-45-6789', dob: '1985-04-12', address: '123 Main St', ofacStatus: 'CLEAR' };
const validation = validateCipIdentity(applicant);
```

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)):
- **Claude**: Use GitHub Alerts (`> [!NOTE]`) for onboarding milestones.
- **OpenAI Codex & Canvas**: Format KYC status tables using GFM markdown.
