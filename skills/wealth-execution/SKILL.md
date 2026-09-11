---
name: wealth-execution
description: Pre-trade validation (buying power, oversell, short-term gain) and order payload construction for Alpaca, Interactive Brokers and FIX 4.4, for human-approved execution. Builds payloads only - never submits orders or connects to a custodian.
catalog_ids: ["T042", "T043", "T044", "T045", "T046", "T047", "T048", "T049", "T050", "T051"]
---

# Wealth Execution & Custody (`wealth-execution`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to validate proposed orders and build order payloads locally for a licensed advisor to review and submit through their own systems.

---

## ⚠️ MANDATORY SAFETY & COMPLIANCE GUARDRAIL

> [!CAUTION]
> All trade order construction is classified as **`requires_human_approval: true`**. Nothing in this pack submits an order. Agents must NEVER submit live orders without explicit approval and signature by a licensed advisor.

---

## Engine-Backed Capabilities

| Capability | Engine function | CLI |
|---|---|---|
| Pre-trade checks: buying power, oversell against the held position, short-term gain warning | `validatePreTradeCompliance` | `execution validate` |
| Alpaca and Interactive Brokers REST order payloads | `buildTradePayload` | `execution payload` |
| FIX 4.4 New Order Single (35=D) with BodyLength and CheckSum | `buildFixOrderPayload` | `execution fix-payload` |

## Guidance Only (No Engine Support)

- Schwab, Fidelity and Pershing custodian workflows (there are no custodian connectors)
- Order submission, routing and best execution
- Block allocations, corporate actions and ACAT transfers

## Limits to State With Every Result

- Checks fail closed: a buy needs a reference price and settled cash, and a sell needs the held position. Missing data is an error, not a pass.
- Interactive Brokers routes on the contract ID. Resolve the `conid` with `GET /iserver/secdef/search?symbol=<ticker>` and pass it explicitly; the builder refuses to guess.
- FIX `MsgSeqNum` must come from the live FIX session; the generator's counter is a placeholder.

---

## CLI & Module Usage

```bash
node bin/wealth-skills.js execution validate --order '{"symbol":"VTI","action":"BUY","quantity":50,"price":275}' --settled-cash 25000
node bin/wealth-skills.js execution validate --order '{"symbol":"VTI","action":"SELL","quantity":40,"price":275}' --positions '{"VTI":100}'
node bin/wealth-skills.js execution payload --broker Alpaca --account ACC-123 --order '{"symbol":"VTI","action":"BUY","quantity":50,"price":275}'
node bin/wealth-skills.js execution payload --broker IBKR --account "$IBKR_ACCOUNT" --conid "$VTI_CONID" --order '{"symbol":"VTI","action":"BUY","quantity":50,"price":275}'
node bin/wealth-skills.js execution fix-payload --custodian Pershing_NetX360 --symbol VTI --side BUY --qty 500 --price 275.50
```

```javascript
import { validatePreTradeCompliance, buildTradePayload } from './src/engines/execution.js';

const order = { symbol: 'VTI', action: 'BUY', quantity: 50, price: 275 };
const validation = validatePreTradeCompliance({ settledCash: 25000 }, order);
const payload = buildTradePayload('Alpaca', 'ACC-123', order);
```

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)):
- **Claude**: Highlight approval status with GitHub Alerts (`> [!CAUTION]`).
- **Cursor & VS Code**: Output JSON payload diffs.
- **Codex & Antigravity**: Include the `auditMetadata` block, with `requires_human_approval: true`.
