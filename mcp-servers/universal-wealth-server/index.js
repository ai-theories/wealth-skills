#!/usr/bin/env node

/**
 * Universal MCP Server for `wealth-skills`
 * Exposes portfolio, quant, planning, and compliance engine calculations as MCP tools over stdio.
 */

import { startStdioServer, isMainModule } from '../lib/stdio-server.js';
import { calculateTaxBracketHeadroom } from '../../src/engines/planning.js';
import { monitorPortfolioDrift, calculatePortfolioVar } from '../../src/engines/portfolio.js';
import { backtestPortfolio, forwardTestSimulation } from '../../src/engines/quant.js';
import { scanFinraRule2210 } from '../../src/engines/compliance.js';
import { withAuditMetadata, LIBRARY_VERSION } from '../../src/engines/audit.js';
import { withGuidance } from '../../src/engines/guidance.js';

const CALLER_INPUTS = 'caller-supplied tool arguments';

export const server = {
  name: 'universal-wealth-server',
  version: LIBRARY_VERSION,
  tools: [
    {
      name: 'backtest_portfolio',
      description: 'Historical backtest on embedded approximate annual total returns (2015-2024) for VTI, BND, VXUS and VNQ only; any other ticker is rejected. Returns CAGR, volatility, Sharpe, Sortino and max drawdown (year-end resolution).',
      inputSchema: {
        type: 'object',
        properties: {
          weights: { type: 'object', description: 'Ticker weights, e.g. {"VTI":0.6,"BND":0.4}. Supported: VTI, BND, VXUS, VNQ.' },
          initialBalance: { type: 'number', description: 'Starting capital (default 100000)' }
        },
        required: ['weights']
      },
      handler: (args) => withAuditMetadata(withGuidance(backtestPortfolio(args.weights, args.initialBalance ?? 100000), 'quant backtest'), {
        skillPack: 'wealth-portfolio',
        tool: 'backtest_portfolio',
        engineFunction: 'backtestPortfolio',
        methodology: 'Annual historical backtest with annual rebalancing',
        dataSources: [CALLER_INPUTS, 'embedded approximate annual total returns, 2015-2024']
      })
    },
    {
      name: 'forward_test_simulation',
      description: 'Monte Carlo projection of a weighted portfolio under a macro regime, using illustrative per-asset return/volatility assumptions (not forecasts) and correlations estimated from 2015-2024 annual returns. Supported tickers: VTI, BND, VXUS, VNQ.',
      inputSchema: {
        type: 'object',
        properties: {
          weights: { type: 'object', description: 'Ticker weights, e.g. {"VTI":0.6,"BND":0.4}' },
          regime: { type: 'string', enum: ['baseline', 'stagflation', 'bull_market', 'bear_market'], description: 'Macro regime (default baseline)' },
          years: { type: 'integer', description: 'Projection horizon in years (default 5)' },
          trials: { type: 'integer', description: 'Number of simulated paths (default 500)' },
          initialBalance: { type: 'number', description: 'Starting capital (default 100000)' }
        },
        required: ['weights']
      },
      handler: (args) => withAuditMetadata(
        withGuidance(forwardTestSimulation(args.weights, args.regime ?? 'baseline', args.years ?? 5, args.trials ?? 500, { initialBalance: args.initialBalance ?? 100000 }), 'quant forward-test'),
        {
          skillPack: 'wealth-portfolio',
          tool: 'forward_test_simulation',
          engineFunction: 'forwardTestSimulation',
          methodology: 'Monte Carlo on portfolio-level normal annual returns (weighted mean, full covariance)',
          dataSources: [CALLER_INPUTS, 'illustrative regime capital market assumptions (library defaults)', 'correlations from embedded 2015-2024 annual returns']
        }
      )
    },
    {
      name: 'monitor_portfolio_drift',
      description: 'Compares current allocation percentages with targets, flags categories outside the tolerance band, and proposes rebalance trades for human approval.',
      inputSchema: {
        type: 'object',
        properties: {
          currentAlloc: { type: 'object', description: 'Current allocation percentages, e.g. {"equity":68,"fixedIncome":32}' },
          targetAlloc: { type: 'object', description: 'Target allocation percentages' },
          portfolioValue: { type: 'number', description: 'Total portfolio value' },
          toleranceBandPct: { type: 'number', description: 'Drift threshold in percentage points (default 5)' }
        },
        required: ['currentAlloc', 'targetAlloc', 'portfolioValue']
      },
      handler: (args) => withAuditMetadata(
        withGuidance(monitorPortfolioDrift(args.currentAlloc, args.targetAlloc, args.portfolioValue, args.toleranceBandPct ?? 5.0), 'portfolio drift-monitor'),
        {
          skillPack: 'wealth-portfolio',
          tool: 'monitor_portfolio_drift',
          engineFunction: 'monitorPortfolioDrift',
          methodology: 'Absolute percentage-point drift against target with proportional minimum trade size',
          dataSources: [CALLER_INPUTS]
        }
      )
    },
    {
      name: 'calculate_portfolio_var',
      description: 'Parametric (normal) Value at Risk and expected shortfall at any confidence level and horizon, from a supplied annualized volatility.',
      inputSchema: {
        type: 'object',
        properties: {
          portfolioValue: { type: 'number', description: 'Total portfolio value' },
          annualizedVol: { type: 'number', description: 'Annualized volatility as a decimal (default 0.14)' },
          confidenceLevel: { type: 'number', description: 'Confidence level as a decimal between 0.5 and 1 (default 0.95)' },
          horizonDays: { type: 'number', description: 'Horizon in trading days (default 1)' }
        },
        required: ['portfolioValue']
      },
      handler: (args) => withAuditMetadata(
        withGuidance(calculatePortfolioVar(args.portfolioValue, args.annualizedVol ?? 0.14, args.confidenceLevel ?? 0.95, args.horizonDays ?? 1), 'portfolio var'),
        {
          skillPack: 'wealth-portfolio',
          tool: 'calculate_portfolio_var',
          engineFunction: 'calculatePortfolioVar',
          methodology: 'Parametric normal VaR and expected shortfall',
          dataSources: [CALLER_INPUTS]
        }
      )
    },
    {
      name: 'calculate_tax_headroom',
      description: 'Remaining room in the current federal ordinary-income bracket for tax year 2026 after the standard deduction. A starting point for sizing Roth conversions, not a tax return: ignores itemizing, credits, capital gains stacking, NIIT and state tax.',
      inputSchema: {
        type: 'object',
        properties: {
          agi: { type: 'number', description: 'Adjusted Gross Income' },
          filingStatus: { type: 'string', enum: ['MFJ', 'SINGLE'], description: 'Filing status (default MFJ)' }
        },
        required: ['agi']
      },
      handler: (args) => withAuditMetadata(withGuidance(calculateTaxBracketHeadroom(args.agi, args.filingStatus ?? 'MFJ'), 'planning tax-headroom'), {
        skillPack: 'wealth-planning',
        tool: 'calculate_tax_headroom',
        engineFunction: 'calculateTaxBracketHeadroom',
        methodology: 'Ordinary-income bracket headroom after the standard deduction',
        dataSources: [CALLER_INPUTS, 'IRS Rev. Proc. 2025-32 (tax year 2026 brackets and standard deduction)']
      })
    },
    {
      name: 'scan_finra_compliance',
      description: 'Automated keyword and pattern screen of advisory text for promissory language and missing standard disclosures. Not a substitute for registered-principal review under FINRA Rule 2210.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Communication text to screen' }
        },
        required: ['text']
      },
      handler: (args) => withAuditMetadata(withGuidance(scanFinraRule2210(args.text), 'compliance scan'), {
        skillPack: 'wealth-compliance',
        tool: 'scan_finra_compliance',
        engineFunction: 'scanFinraRule2210',
        methodology: 'Pattern matching for promissory terms and required disclosure phrases',
        dataSources: [CALLER_INPUTS]
      })
    }
  ]
};

if (isMainModule(import.meta.url)) startStdioServer(server);
