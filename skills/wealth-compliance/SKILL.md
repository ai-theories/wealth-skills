---
name: wealth-compliance
description: FINRA BrokerCheck & SEC IAPD registration research, communication surveillance analysis, supervisory logging, and regulatory disclosure checks.
catalog_ids: ["T071", "T072", "T073", "T074", "T075", "T076", "T077", "T078", "T079", "T080", "T081"]
---

# Wealth Compliance & Supervision (`wealth-compliance`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to lookup broker/advisor registration records on FINRA BrokerCheck and SEC IAPD, flag communication surveillance risk terms (Smarsh / Global Relay), and verify regulatory compliance with **baked-in, zero-dependency Node.js execution logic**.

---

## Baked-In CLI & JavaScript Engine Execution

```bash
# Scan Advisory Communication for FINRA Rule 2210 Prohibited Phrases
node bin/wealth-skills.js compliance scan --text "We offer a guaranteed 15% return with past performance."

# Lookup Broker / Adviser CRD Number
node bin/wealth-skills.js compliance lookup --crd 5910482
```

### Baked-in Engine Module Import
```javascript
import { scanFinraRule2210, parseBrokerCheckRecord } from './src/engines/compliance.js';

const scanResult = scanFinraRule2210("We offer a guaranteed 15% return");
const crdResult = parseBrokerCheckRecord('5910482');
```

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)):
- **Claude**: Highlight regulatory violations with GitHub Alerts (`> [!WARNING]`).
- **OpenAI Codex & Canvas**: Format registration tables and audit scoring metrics.
