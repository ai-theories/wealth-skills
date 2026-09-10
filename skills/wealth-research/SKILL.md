---
name: wealth-research
description: Market intelligence, public equity research, SEC EDGAR filing analysis, earnings review/preview, and macroeconomic series analysis.
catalog_ids: ["T034", "T035", "T036", "T037", "T038", "T039", "T040", "T041", "T052", "T053", "T054", "T055", "T056", "T057", "T058", "T059", "T060", "T061", "T092", "T093"]
---

# Wealth Research & Market Intelligence (`wealth-research`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to synthesize public equity research, review SEC EDGAR filings (10-K, 10-Q, 8-K), generate company tear sheets, and analyze macroeconomic time series (FRED) with **baked-in, zero-dependency Node.js execution logic**.

---

## When to Activate

Trigger this skill when the user asks to:
- Conduct an equity research analysis or company tear sheet on a public company.
- Parse SEC filings (10-K, 10-Q) for revenue drivers, risk factors, or footnotes.
- Summarize earnings announcements or quarterly earnings call transcripts.
- Pull macro data trends (interest rates, CPI inflation, yield curve spread).

---

## Baked-In CLI & JavaScript Engine Execution

```bash
# Generate Stock Tear Sheet via CLI
node bin/wealth-skills.js research tear-sheet --ticker AAPL
```

### Baked-in Engine Module Import
```javascript
import { generateCompanyTearSheet, parseEdgarFilingSummary } from './src/engines/research.js';

const tearSheet = generateCompanyTearSheet('AAPL', {
  marketCap: 3.25e12, price: 215, eps: 7.3, revenue: 3.8e11, netIncome: 1e11, freeCashFlow: 1.08e11, dividends: 1.18
});
```

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)):
- **Claude**: Render tear sheets inside Artifact cards with GitHub Alerts (`> [!NOTE]`).
- **OpenAI Codex & Canvas**: Format financial ratios using GFM tables.
- **Antigravity / Gemini**: Include structured `audit_metadata` footer.
