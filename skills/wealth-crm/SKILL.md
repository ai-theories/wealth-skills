---
name: wealth-crm
description: Advisor CRM workflows, client meeting preparation, meeting transcript parsing, relationship intelligence, and action item routing.
catalog_ids: ["T008", "T009", "T010", "T011", "T012", "T013", "T014", "T091"]
---

# Wealth CRM & Meeting Intelligence (`wealth-crm`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to execute advisor meeting preparation, transcribe and summarize client review meetings, format CRM updates for Salesforce Financial Services Cloud (FSC) and Wealthbox, and track client relationship workflows with **baked-in, zero-dependency Node.js execution logic**.

---

## When to Activate

Trigger this skill when the user asks to:
- Prepare a pre-meeting briefing pack for an upcoming client review.
- Parse a client meeting transcript or notes and extract key decision points, life events, and follow-up action items.
- Structure JSON/REST payloads for Salesforce FSC, Wealthbox, or Practifi CRM task updates.

---

## Baked-In CLI & JavaScript Engine Execution

```bash
# Parse meeting transcript & extract decision matrix
node bin/wealth-skills.js crm parse-transcript --text "Client agreed to rebalance into bonds. Advisor will send proposal next week."

# Format output for specific AI platform UI (Claude / Codex / Cursor / Antigravity)
node bin/wealth-skills.js ui render --platform claude --data '{"title":"Meeting Notes","summary":"Rebalance approved"}'
```

### Baked-In Engine Module Import
```javascript
import { parseMeetingTranscript, buildCrmPayload } from './src/engines/crm.js';

const transcript = "Client agreed to rebalance. Advisor will send proposal next week.";
const parsed = parseMeetingTranscript(transcript);
const crmPayload = buildCrmPayload('Salesforce_FSC', 'HH-9812', '2026-09-09', parsed.actionItems);
```

---

## Output Standard

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)):
1. **Claude**: Use Artifact cards, GitHub Alerts (`> [!NOTE]`), and GFM tables.
2. **OpenAI Codex & Canvas**: Output structured JSON payloads and standard Markdown tables.
3. **Cursor & VS Code**: Output code diffs for CRM payload updates.
