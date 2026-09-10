---
name: wealth-portfolio
description: Portfolio accounting, performance attribution, tax-loss harvesting, factor risk scoring, quantitative backtesting, drift monitoring, and Value at Risk (VaR).
catalog_ids: ["T015", "T016", "T017", "T018", "T019", "T020", "T021", "T022", "T023", "T024", "T025", "T026", "T027", "T028", "T029", "T030", "T031", "T032", "T033"]
---

# Wealth Portfolio & Risk Skill Pack (`wealth-portfolio`)

This skill pack equips AI agents (**Claude Code, Devin, Cursor, Antigravity, OpenAI Codex**) to execute portfolio accounting reporting, multi-asset factor risk scoring, threshold drift monitoring, historical backtesting, walk-forward testing, Value-at-Risk (VaR), and tax-loss harvesting calculations with **baked-in, zero-dependency Node.js execution logic**.

---

## When to Activate

Trigger this skill when the user asks to:
- Evaluate portfolio asset allocation against target benchmarks and monitor drift.
- Run historical backtests (CAGR, Sharpe, Sortino, Max Drawdown) or forward walk-forward simulations.
- Calculate Value at Risk (VaR 95%/99%) and Conditional VaR (Expected Shortfall).
- Calculate tax-loss harvesting opportunities across taxable account positions (30-day wash-sale check).

---

## Baked-In CLI & JavaScript Engine Execution

```bash
# Portfolio Drift Monitor & Rebalance Alert
node bin/wealth-skills.js portfolio drift-monitor --current '{"equity":68,"bond":22}' --target '{"equity":60,"bond":30}' --value 1000000 --band 5

# Historical Backtest
node bin/wealth-skills.js quant backtest --weights '{"VTI":0.6,"BND":0.4}' --initial 100000

# Forward Walk-Forward Simulation (Stagflation Regime)
node bin/wealth-skills.js quant forward-test --weights '{"VTI":0.6,"BND":0.4}' --regime "stagflation"

# Calculate Value at Risk (VaR 95%)
node bin/wealth-skills.js portfolio var --value 1000000 --vol 0.14
```

### Baked-In Engine Module Import
```javascript
import { monitorPortfolioDrift, calculatePortfolioVar, scanTaxLossHarvesting } from './src/engines/portfolio.js';
import { backtestPortfolio, forwardTestSimulation } from './src/engines/quant.js';

// Drift Monitor
const drift = monitorPortfolioDrift({ equity: 68, bond: 22 }, { equity: 60, bond: 30 }, 1000000, 5.0);

// Backtest
const backtest = backtestPortfolio({ VTI: 0.6, BND: 0.4 }, 100000);
```

---

## Output Standard & Platform Formatting

Every response MUST format output according to the target platform UI specifications ([`docs/UI_TEMPLATES.md`](../../docs/UI_TEMPLATES.md)):
- **Claude**: Use GitHub Alerts (`> [!IMPORTANT]`) and Mermaid flowcharts.
- **OpenAI Codex & Canvas**: Use block LaTeX math (`$$\text{Sharpe} = \frac{R_p - R_f}{\sigma}$$`) and GFM data tables.
- **Cursor & VS Code**: Use code diff blocks (`diff` with `+`/`-`) for proposed rebalance trades.
