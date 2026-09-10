---
name: wealth-uhnw
description: Ultra-High-Net-Worth (UHNW) Family Office strategies, concentrated stock hedging, Private Equity J-Curve tracking, Multi-Generational Trust Allocation, and Philanthropic DAF planning.
catalog_ids: ["T401", "T402", "T403", "T404", "T405", "T406", "T407", "T408", "T409", "T410"]
---

# UHNW Family Office Skill Pack (`wealth-uhnw`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to advise Ultra-High-Net-Worth (\$10M+) clients and Family Offices on concentrated stock hedging, Private Equity / Real Estate J-Curve capital calls, dynastic trust allocations, and philanthropic foundation structures.

---

## Core Capabilities

### 1. Concentrated Equity Hedging Strategies (UHNW-01)
- **Zero-Cost Collar Strategy**: Combine out-of-the-money long puts (downside protection) with short call sales to lock in a price floor without cash outlay.
- **Covered Call Yield Generation**: Sell 30-delta OTM call options on core low-basis stock positions.
- **Exchange Fund Structuring**: Evaluate tax-deferred diversification of concentrated stock into a private 721 exchange partnership.

### 2. Private Equity J-Curve & IRR Tracking (UHNW-02)
- **Internal Rate of Return (IRR) & Multiple on Invested Capital (MOIC)**: Track TVPI (Total Value to Paid-In), DPI (Distributed to Paid-In), and RVPI (Residual Value to Paid-In).
- **Capital Call & Distribution Cash Flow Simulator**: Model negative J-curve cash calls in years 1–3 followed by harvesting distributions in years 4–10.

### 3. Multi-Generational Dynastic Trust Allocation (UHNW-03)
- **Generation-Skipping Transfer (GST) Tax Strategy**: Optimize asset location between Grantor Retained Annuity Trusts (GRATs), Intentionally Defective Grantor Trusts (IDGTs), and Charitable Remainder Trusts (CRTs).

---

## Baked-In CLI & JavaScript Engine Execution

```bash
# UHNW Equity Collar Strategy Builder
node bin/wealth-skills.js uhnw collar --symbol AAPL --basis 25 --shares 100000

# Private Equity J-Curve & IRR Metrics
node bin/wealth-skills.js uhnw pe-metrics --commitment 5000000 --called 3000000 --distributions 1200000 --nav 3200000
```

### Baked-In Engine Module Import
```javascript
import { calculateCollarStrategy, calculatePeMetrics } from './src/engines/uhnw.js';

// Calculate UHNW Concentrated Collar Floor & Cap
const collar = calculateCollarStrategy('AAPL', 100000, 215, 25);
console.log(collar.downsideProtectionFloor); // $193.50 (10% OTM Put)

// Calculate Private Equity TVPI & MOIC
const pe = calculatePeMetrics(5000000, 3000000, 1200000, 3200000);
console.log(pe.moic); // 1.47x TVPI
```
