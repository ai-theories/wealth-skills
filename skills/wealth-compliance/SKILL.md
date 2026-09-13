---
name: wealth-compliance
description: Automated screen of advisory communications for promissory language and missing standard disclosures, plus guidance for registration research and supervisory review. The bundled registration lookup is a fictitious sample fixture, not FINRA BrokerCheck or SEC IAPD.
catalog_ids: ["T071", "T072", "T073", "T074", "T075", "T076", "T077", "T078", "T079", "T080", "T081"]
---

# Wealth Compliance & Supervision (`wealth-compliance`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to pre-screen client communications before principal review, and to guide registration research and supervisory workflows toward the authoritative sources.

---

## ⚠️ Registration Lookups Are Sample Data

> [!WARNING]
> `compliance lookup`, `parseBrokerCheckRecord` and the `finra-sec-lookup` MCP server answer only from two **fictitious** records. They are not connected to BrokerCheck or IAPD, and a hit or a miss says nothing about a real person or firm. For any real registration or disclosure question, send the user to https://brokercheck.finra.org or https://adviserinfo.sec.gov.

---

## Engine-Backed Capabilities

| Capability | Engine function | CLI |
|---|---|---|
| Promissory-language and missing-disclosure screen (`VIOLATION`, `NEEDS_REVIEW` or `PASSED_AUTOMATED_SCREEN`) | `scanFinraRule2210` | `compliance scan` |
| Registration lookup against the sample fixture (demo only) | `parseBrokerCheckRecord` | `compliance lookup` |

## Guidance Only (No Engine Support)

- Real BrokerCheck and IAPD research
- Communication surveillance and archiving (Smarsh, Global Relay)
- Supervisory logging and FINRA Rule 3110 review workflows
- SEC Marketing Rule performance-presentation review

## Limits to State With Every Result

- The screen is pattern matching. It does not understand negation, judge whether a communication is fair and balanced, or review performance presentations.
- Passing the screen is not approval. Retail communications still need review by a registered principal.

---

## CLI & Module Usage

```bash
node bin/wealth-skills.js compliance scan --text "We offer a guaranteed 15% return with past performance."
node bin/wealth-skills.js compliance lookup --crd 5910482
```

```javascript
import { scanFinraRule2210 } from './src/engines/compliance.js';

const scanResult = scanFinraRule2210('We offer a guaranteed 15% return');
console.log(scanResult.screenStatus); // 'VIOLATION'
```

---

## Conversational Use

Every CLI and MCP result carries two fields for the conversation itself:

- **`needsInput`** - questions to put to the user before the answer is usable. Ask them as written instead of assuming a value; the engines fail closed precisely so this question gets asked.
- **`suggestedNextSteps`** - what is worth doing next, each with a reason. Offer them rather than acting: anything with client impact still needs approval.

An error can carry `needsInput` too, so a refusal to guess becomes a question rather than a dead end. `node bin/wealth-skills.js capabilities` lists every tool with its required inputs and typical phrasings.

Typical requests this pack answers:
- "Is this email compliant?"
- "Can we send this to clients?"
- "Look up this CRD."

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)) and include the `auditMetadata` block returned by the tool:
- **Claude**: Highlight regulatory violations with GitHub Alerts (`> [!WARNING]`).
- **OpenAI Codex & Canvas**: Format screening results and missing disclosures as tables.
