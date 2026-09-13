---
name: wealth-portfolio
description: Portfolio drift monitoring and rebalancing, parametric VaR and expected shortfall, tax-loss harvesting screens with a wash-sale look-back, and small-universe historical and forward simulations - plus guidance for accounting, attribution and risk-model workflows that the engines do not implement.
catalog_ids: ["T015", "T016", "T017", "T018", "T019", "T020", "T021", "T022", "T023", "T024", "T025", "T026", "T027", "T028", "T029", "T030", "T031", "T032", "T033"]
---

# Wealth Portfolio & Risk Skill Pack (`wealth-portfolio`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to monitor allocation drift, size rebalance trades, estimate parametric risk, screen for tax-loss harvesting, and run backtests and forward simulations with local, zero-dependency Node.js engines.

---

## When to Activate

Trigger this skill when the user asks to:
- Evaluate portfolio asset allocation against targets and monitor drift.
- Run historical backtests (CAGR, Sharpe, Sortino, max drawdown) or forward Monte Carlo simulations.
- Calculate Value at Risk and expected shortfall.
- Find tax-loss harvesting opportunities across taxable lots.

---

## Engine-Backed Capabilities

| Capability | Engine function | CLI |
|---|---|---|
| Drift monitoring and rebalance trade sizing | `monitorPortfolioDrift`, `calculatePortfolioRebalance` | `portfolio drift-monitor`, `portfolio rebalance` |
| Parametric VaR and expected shortfall at any confidence level | `calculatePortfolioVar` | `portfolio var` |
| Tax-loss harvesting screen with wash-sale look-back and cross-index replacement candidates | `scanTaxLossHarvesting` | `portfolio tlh` |
| Historical backtest (VTI, BND, VXUS, VNQ; 2015–2024 annual returns) | `backtestPortfolio` | `quant backtest` |
| Forward Monte Carlo under macro regimes | `forwardTestSimulation` | `quant forward-test` |
| Asset-class mix, and factor or duration averages of values you supply | `analyzePortfolioFactors` | `portfolio factors` |

## Guidance Only (No Engine Support)

- Portfolio accounting, performance attribution and client reporting (Addepar, Orion, Black Diamond, APX, Geneva)
- Risk-model factor exposures (BarraOne, Axioma): the engine only averages factor scores you supply
- Portfolio optimization, tax-aware transitions and direct indexing

## Limits to State With Every Result

- **Tax-loss harvesting** checks only purchases in the 30 days *before* the sale, across the lots supplied. Confirm separately that nothing substantially identical is bought in the 30 days after, including in IRA and spouse accounts. Replacement candidates track a different index, but whether a fund is "substantially identical" is a judgment for the advisor or tax professional. No replacement is suggested for total-bond funds.
- Backtests use approximate embedded annual returns and capture drawdowns at year-end only.
- Forward-simulation regime assumptions are illustrative, not forecasts; pass your firm's capital market assumptions for client work.
- VaR is parametric normal and only as good as the volatility you supply.

---

## CLI & Module Usage

```bash
node bin/wealth-skills.js portfolio drift-monitor --current '{"equity":68,"fixedIncome":32}' --target '{"equity":60,"fixedIncome":40}' --value 1000000 --band 5
node bin/wealth-skills.js portfolio var --value 1000000 --vol 0.14 --confidence 0.99
node bin/wealth-skills.js portfolio tlh --lots '[{"id":"L1","symbol":"VOO","quantity":100,"purchasePrice":500,"currentPrice":420,"purchaseDate":"2025-02-03"}]'
node bin/wealth-skills.js quant backtest --weights '{"VTI":0.6,"BND":0.4}' --initial 100000
node bin/wealth-skills.js quant forward-test --weights '{"VTI":0.6,"BND":0.4}' --regime stagflation
```

```javascript
import { monitorPortfolioDrift, calculatePortfolioVar } from './src/engines/portfolio.js';
import { backtestPortfolio } from './src/engines/quant.js';

const drift = monitorPortfolioDrift({ equity: 68, fixedIncome: 32 }, { equity: 60, fixedIncome: 40 }, 1000000, 5.0);
const risk = calculatePortfolioVar(1000000, 0.14, 0.99, 1);
const backtest = backtestPortfolio({ VTI: 0.6, BND: 0.4 }, 100000);
```

---

## Conversational Use

Every CLI and MCP result carries two fields for the conversation itself:

- **`needsInput`** - questions to put to the user before the answer is usable. Ask them as written instead of assuming a value; the engines fail closed precisely so this question gets asked.
- **`suggestedNextSteps`** - what is worth doing next, each with a reason. Offer them rather than acting: anything with client impact still needs approval.

An error can carry `needsInput` too, so a refusal to guess becomes a question rather than a dead end. `node bin/wealth-skills.js capabilities` lists every tool with its required inputs and typical phrasings.

Typical requests this pack answers:
- "Is the portfolio off target?"
- "Any losses worth harvesting?"
- "How much could this lose in a bad day?"
- "How would a 60/40 have done?"

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)) and include the `auditMetadata` block returned by the tool:
- **Claude**: Use GitHub Alerts (`> [!IMPORTANT]`) and Mermaid flowcharts.
- **OpenAI Codex & Canvas**: Use block LaTeX math (`$$\text{Sharpe} = \frac{\bar{R}_p - R_f}{\sigma}$$`) and GFM data tables.
- **Cursor & VS Code**: Use code diff blocks (`diff` with `+`/`-`) for proposed rebalance trades.
