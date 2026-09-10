#!/usr/bin/env node

/**
 * Universal MCP Server for `wealth-skills`
 * Exposes all 7 domain engines over standard JSON-RPC MCP.
 */

import readline from 'readline';
import { calculateTaxBracketHeadroom, runMonteCarloCashFlow, calculateRMD } from '../../src/engines/planning.js';
import { calculatePortfolioRebalance, scanTaxLossHarvesting, monitorPortfolioDrift, calculatePortfolioVar } from '../../src/engines/portfolio.js';
import { backtestPortfolio, forwardTestSimulation } from '../../src/engines/quant.js';
import { parseMeetingTranscript, buildCrmPayload } from '../../src/engines/crm.js';
import { generateCompanyTearSheet, parseEdgarFilingSummary } from '../../src/engines/research.js';
import { validatePreTradeCompliance, buildTradePayload } from '../../src/engines/execution.js';
import { validateCipIdentity, checkOnboardingStatus } from '../../src/engines/onboarding.js';
import { scanFinraRule2210, parseBrokerCheckRecord } from '../../src/engines/compliance.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'universal-wealth-server', version: '0.1.0' }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'backtest_portfolio',
            description: 'Runs historical backtest for asset weights returning CAGR, Sharpe Ratio, Sortino Ratio, and Max Drawdown.',
            inputSchema: {
              type: 'object',
              properties: {
                weights: { type: 'object', description: 'Asset ticker weights map e.g. {"VTI":0.6,"BND":0.4}' },
                initialBalance: { type: 'number', description: 'Starting capital' }
              },
              required: ['weights']
            }
          },
          {
            name: 'forward_test_simulation',
            description: 'Runs forward walk-forward Monte Carlo simulation across macro regimes (baseline, stagflation, bull_market, bear_market).',
            inputSchema: {
              type: 'object',
              properties: {
                weights: { type: 'object', description: 'Asset ticker weights map' },
                regime: { type: 'string', description: 'Macro regime e.g. "baseline", "stagflation"' }
              },
              required: ['weights']
            }
          },
          {
            name: 'monitor_portfolio_drift',
            description: 'Monitors portfolio allocation drift against tolerance bands and triggers rebalance alerts.',
            inputSchema: {
              type: 'object',
              properties: {
                currentAlloc: { type: 'object', description: 'Current allocation percentages' },
                targetAlloc: { type: 'object', description: 'Target allocation percentages' },
                portfolioValue: { type: 'number', description: 'Total portfolio balance' },
                toleranceBandPct: { type: 'number', description: 'Drift threshold band percent (default 5.0)' }
              },
              required: ['currentAlloc', 'targetAlloc', 'portfolioValue']
            }
          },
          {
            name: 'calculate_portfolio_var',
            description: 'Calculates Parametric Value at Risk (VaR 95%/99%) and Conditional VaR (Expected Shortfall).',
            inputSchema: {
              type: 'object',
              properties: {
                portfolioValue: { type: 'number', description: 'Total portfolio balance' },
                annualizedVol: { type: 'number', description: 'Annualized volatility decimal e.g. 0.14' }
              },
              required: ['portfolioValue']
            }
          },
          {
            name: 'calculate_tax_headroom',
            description: 'Calculates headroom under current federal tax bracket for Roth conversions.',
            inputSchema: {
              type: 'object',
              properties: {
                agi: { type: 'number', description: 'Adjusted Gross Income' },
                filingStatus: { type: 'string', enum: ['MFJ', 'SINGLE'], description: 'Filing Status' }
              },
              required: ['agi']
            }
          },
          {
            name: 'scan_finra_compliance',
            description: 'Scans advisory text for FINRA Rule 2210 prohibited promotional statements.',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Communication text to audit' }
              },
              required: ['text']
            }
          }
        ]
      }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    let resData = null;

    switch (name) {
      case 'backtest_portfolio':
        resData = backtestPortfolio(args.weights, args.initialBalance || 100000);
        break;
      case 'forward_test_simulation':
        resData = forwardTestSimulation(args.weights, args.regime || 'baseline');
        break;
      case 'monitor_portfolio_drift':
        resData = monitorPortfolioDrift(args.currentAlloc, args.targetAlloc, args.portfolioValue, args.toleranceBandPct || 5.0);
        break;
      case 'calculate_portfolio_var':
        resData = calculatePortfolioVar(args.portfolioValue, args.annualizedVol || 0.14);
        break;
      case 'calculate_tax_headroom':
        resData = calculateTaxBracketHeadroom(args.agi, args.filingStatus || 'MFJ');
        break;
      case 'scan_finra_compliance':
        resData = scanFinraRule2210(args.text);
        break;
      default:
        return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Tool not found' } };
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          { type: 'text', text: JSON.stringify(resData, null, 2) }
        ]
      }
    };
  }

  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
}

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    const response = handleRequest(request);
    console.log(JSON.stringify(response));
  } catch (err) {
    console.error('Error processing JSON-RPC request:', err);
  }
});
