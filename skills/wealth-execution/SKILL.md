---
name: wealth-execution
description: Pre-trade compliance verification, trade order formatting, brokerage API payloads, and custodian servicing protocols.
catalog_ids: ["T042", "T043", "T044", "T045", "T046", "T047", "T048", "T049", "T050", "T051"]
---

# Wealth Execution & Custody (`wealth-execution`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to format pre-trade compliance checks, construct trade order payloads for custodian APIs (Schwab, Fidelity, Pershing, Alpaca, Interactive Brokers), and verify execution rules with **baked-in, zero-dependency Node.js execution logic**.

---

## ⚠️ MANDATORY SAFETY & COMPLIANCE GUARDRAIL

> [!CAUTION]
> All trade order construction and brokerage API interactions are strictly classified as **`requires_human_approval: true`**. Agents must NEVER submit live orders without explicit approval and signature by a licensed advisor.

---

## Baked-In CLI & JavaScript Engine Execution

```bash
# Validate Pre-Trade Compliance & Buying Power
node bin/wealth-skills.js execution validate

# Generate Alpaca / IBKR Trade Payload
node bin/wealth-skills.js execution payload
```

### Baked-in Engine Module Import
```javascript
import { validatePreTradeCompliance, buildTradePayload } from './src/engines/execution.js';

const balance = { settledCash: 25000 };
const order = { symbol: 'VTI', action: 'BUY', quantity: 50, price: 275 };

const validation = validatePreTradeCompliance(balance, order);
const payload = buildTradePayload('Alpaca', 'ACC-123', order);
```

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)):
- **Claude**: Highlight approval status with GitHub Alerts (`> [!CAUTION]`).
- **Cursor & VS Code**: Output JSON payload diffs.
- **Codex & Antigravity**: Attach `requires_human_approval: true` in audit metadata.
