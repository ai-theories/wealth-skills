---
name: wealth-planning
description: US Wealth Management financial planning, retirement cash flow, tax-loss scenario modeling, household budgeting, and estate document parsing.
catalog_ids: ["T001", "T002", "T003", "T004", "T005", "T006", "T007", "T082", "T083", "T084", "T085", "T086", "T087", "T088", "T089", "T090"]
---

# Wealth Planning Skill Pack (`wealth-planning`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to execute financial planning, retirement income projections, tax-lot opportunity analysis, and estate document summaries with **baked-in, zero-dependency Node.js execution logic**.

---

## When to Activate

Trigger this skill when the user asks to:
- Build or evaluate a household financial plan or retirement income strategy.
- Parse a 1040 tax return to identify tax-planning opportunities (Roth conversion headroom).
- Calculate Required Minimum Distributions (RMDs) for retirement accounts.
- Run Monte Carlo simulations for retirement success probability.

---

## Baked-In CLI & JavaScript Engine Execution

Agents can run local calculations directly via the CLI or import the baked-in engine:

```bash
# Execute Tax Bracket Headroom via CLI
node bin/wealth-skills.js planning tax-headroom --agi 210000 --status MFJ

# Execute Monte Carlo Simulation via CLI
node bin/wealth-skills.js planning monte-carlo --assets 1250000 --spend 50000

# Execute RMD Calculation via CLI
node bin/wealth-skills.js planning rmd --age 75 --balance 500000
```

### Baked-in Engine Module Import
```javascript
import { calculateTaxBracketHeadroom, runMonteCarloCashFlow, calculateRMD } from './src/engines/planning.js';

// Calculate Roth conversion headroom under 22% bracket
const taxResult = calculateTaxBracketHeadroom(210000, 'MFJ');
console.log(taxResult.headroomForRothConversion); // 21050
```

---

## Output Standard

Every response MUST include:
1. **Household Summary & Projection Metrics**.
2. **Actionable Tax / RMD / Planning Headroom**.
3. **Audit Trail Header** detailing methodology and parameters.
