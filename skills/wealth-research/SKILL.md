---
name: wealth-research
description: Valuation ratios from supplied fundamentals, keyword risk-factor summaries of filing text, and live FRED and SEC EDGAR fetches, plus guidance for earnings and market research that the engines do not perform.
catalog_ids: ["T034", "T035", "T036", "T037", "T038", "T039", "T040", "T041", "T052", "T053", "T054", "T055", "T056", "T057", "T058", "T059", "T060", "T061", "T092", "T093"]
---

# Wealth Research & Market Intelligence (`wealth-research`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to compute valuation ratios, summarize risk-factor language in filings, pull the latest FRED observations and SEC EDGAR company facts, and structure broader equity research.

---

## When to Activate

Trigger this skill when the user asks to:
- Build a company tear sheet or valuation summary.
- Summarize risk factors in a 10-K or 10-Q.
- Look up the latest value of a FRED series or a company's EDGAR facts.
- Summarize earnings announcements or macro trends.

---

## Engine-Backed Capabilities

| Capability | Engine function | CLI |
|---|---|---|
| P/E, P/S, dividend yield and FCF conversion from supplied fundamentals | `generateCompanyTearSheet` | `research tear-sheet` |
| Keyword summary of Item 1A risk-factor text you supply | `parseEdgarFilingSummary` | library only |
| Latest observation of a FRED series (live) | `fetchLiveFredSeries` | library only |
| SEC EDGAR company facts (live; requires a declared User-Agent) | `fetchLiveEdgarCompanyFacts` | library only |

## Guidance Only (No Engine Support)

- Earnings call and press release summaries
- Market news synthesis and sector outlooks
- Time-series analysis beyond the latest observation (trends, yield-curve spreads, CPI decomposition)

## Limits to State With Every Result

- Ratios are only as current and accurate as the fundamentals supplied.
- The filing summary matches a short keyword list; it is not a reading of the filing.
- Live fetches that fail return `null` values with an explanation. Report the data as unavailable; never estimate it.
- SEC EDGAR requires `SEC_EDGAR_USER_AGENT` (or a `userAgent` option) naming your organization and a contact email.

---

## CLI & Module Usage

```bash
node bin/wealth-skills.js research tear-sheet --ticker AAPL --financials '{"marketCap":3.25e12,"price":215,"eps":7.3,"revenue":3.8e11,"netIncome":1e11,"freeCashFlow":1.08e11,"dividends":1.18}'
```

```javascript
import { generateCompanyTearSheet } from './src/engines/research.js';
import { fetchLiveFredSeries } from './src/engines/live.js';

const tearSheet = generateCompanyTearSheet('AAPL', { marketCap: 3.25e12, price: 215, eps: 7.3, revenue: 3.8e11 });
const tenYear = await fetchLiveFredSeries('GS10'); // source is FRED_LIVE_API, or FRED_UNAVAILABLE with nulls
```

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)):
- **Claude**: Render tear sheets inside Artifact cards with GitHub Alerts (`> [!NOTE]`).
- **OpenAI Codex & Canvas**: Format financial ratios using GFM tables.
- **Antigravity / Gemini**: Include the `auditMetadata` block as a footer.
