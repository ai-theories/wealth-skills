#!/usr/bin/env node

/**
 * Universal CLI Entrypoint for `wealth-skills`
 * Executable by Claude Code, Devin, Cursor, OpenAI Codex, Antigravity, and terminal agents.
 */

import { calculateTaxBracketHeadroom, runMonteCarloCashFlow, calculateRMD } from '../src/engines/planning.js';
import { calculatePortfolioRebalance, scanTaxLossHarvesting, monitorPortfolioDrift, analyzePortfolioFactors, calculatePortfolioVar } from '../src/engines/portfolio.js';
import { backtestPortfolio, forwardTestSimulation } from '../src/engines/quant.js';
import { parseMeetingTranscript, buildCrmPayload } from '../src/engines/crm.js';
import { generateCompanyTearSheet, parseEdgarFilingSummary } from '../src/engines/research.js';
import { validatePreTradeCompliance, buildTradePayload } from '../src/engines/execution.js';
import { validateCipIdentity, checkOnboardingStatus } from '../src/engines/onboarding.js';
import { scanFinraRule2210, parseBrokerCheckRecord } from '../src/engines/compliance.js';
import { renderAdaptiveUI } from '../src/engines/ui.js';
import { buildFixOrderPayload } from '../src/engines/fix.js';
import { calculateCollarStrategy, calculatePeMetrics } from '../src/engines/uhnw.js';

const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

function getArgVal(flag, defaultVal = null) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultVal;
}

function parseJsonArg(flag, defaultVal = {}) {
  const raw = getArgVal(flag);
  if (!raw) return defaultVal;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error parsing JSON flag ${flag}:`, e.message);
    return defaultVal;
  }
}

function printResult(data) {
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

switch (command) {
  case 'uhnw':
    if (subCommand === 'collar') {
      const sym = getArgVal('--symbol', 'AAPL');
      const shares = parseFloat(getArgVal('--shares', '100000'));
      printResult(calculateCollarStrategy(sym, shares));
    } else if (subCommand === 'pe-metrics') {
      const commitment = parseFloat(getArgVal('--commitment', '5000000'));
      const called = parseFloat(getArgVal('--called', '3000000'));
      const dist = parseFloat(getArgVal('--dist', '1200000'));
      const nav = parseFloat(getArgVal('--nav', '3200000'));
      printResult(calculatePeMetrics(commitment, called, dist, nav));
    } else {
      console.log("Usage: wealth-skills uhnw [collar|pe-metrics]");
    }
    break;

  case 'ui':
    if (subCommand === 'render') {
      const platform = getArgVal('--platform', 'claude');
      const data = parseJsonArg('--data', {
        title: 'Portfolio Review',
        summary: 'Rebalance recommended due to equity drift.',
        metrics: { 'Portfolio Value': '$1,250,000', 'Equity Drift': '+8%' }
      });
      printResult(renderAdaptiveUI(data, platform));
    } else {
      console.log("Usage: wealth-skills ui render --platform [claude|codex|cursor|antigravity]");
    }
    break;

  case 'quant':
    if (subCommand === 'backtest') {
      const weights = parseJsonArg('--weights', { VTI: 0.6, BND: 0.4 });
      const initial = parseFloat(getArgVal('--initial', '100000'));
      printResult(backtestPortfolio(weights, initial));
    } else if (subCommand === 'forward-test') {
      const weights = parseJsonArg('--weights', { VTI: 0.6, BND: 0.4 });
      const regime = getArgVal('--regime', 'baseline');
      const years = parseInt(getArgVal('--years', '5'), 10);
      printResult(forwardTestSimulation(weights, regime, years));
    } else {
      console.log("Usage: wealth-skills quant [backtest|forward-test]");
    }
    break;

  case 'planning':
    if (subCommand === 'tax-headroom') {
      const agi = parseFloat(getArgVal('--agi', '210000'));
      const status = getArgVal('--status', 'MFJ');
      printResult(calculateTaxBracketHeadroom(agi, status));
    } else if (subCommand === 'monte-carlo') {
      const assets = parseFloat(getArgVal('--assets', '1000000'));
      const spend = parseFloat(getArgVal('--spend', '40000'));
      printResult(runMonteCarloCashFlow(assets, spend));
    } else if (subCommand === 'rmd') {
      const age = parseInt(getArgVal('--age', '75'), 10);
      const balance = parseFloat(getArgVal('--balance', '500000'));
      printResult(calculateRMD(age, balance));
    } else {
      console.log("Usage: wealth-skills planning [tax-headroom|monte-carlo|rmd]");
    }
    break;

  case 'portfolio':
    if (subCommand === 'rebalance') {
      const current = parseJsonArg('--current', { equity: 68, bond: 22, cash: 10 });
      const target = parseJsonArg('--target', { equity: 60, bond: 30, cash: 10 });
      const value = parseFloat(getArgVal('--value', '1250000'));
      printResult(calculatePortfolioRebalance(current, target, value));
    } else if (subCommand === 'drift-monitor') {
      const current = parseJsonArg('--current', { equity: 68, bond: 22, cash: 10 });
      const target = parseJsonArg('--target', { equity: 60, bond: 30, cash: 10 });
      const value = parseFloat(getArgVal('--value', '1250000'));
      const band = parseFloat(getArgVal('--band', '5'));
      printResult(monitorPortfolioDrift(current, target, value, band));
    } else if (subCommand === 'var') {
      const value = parseFloat(getArgVal('--value', '1000000'));
      const vol = parseFloat(getArgVal('--vol', '0.14'));
      printResult(calculatePortfolioVar(value, vol));
    } else if (subCommand === 'factors') {
      const holdings = parseJsonArg('--holdings', [{ symbol: 'VTI', weightPct: 60 }, { symbol: 'BND', weightPct: 40 }]);
      printResult(analyzePortfolioFactors(holdings));
    } else if (subCommand === 'tlh') {
      const sampleLots = [
        { id: 'LOT-1', symbol: 'IWM', quantity: 100, purchasePrice: 220, currentPrice: 150, purchaseDate: '2026-01-10' }
      ];
      printResult(scanTaxLossHarvesting(sampleLots));
    } else {
      console.log("Usage: wealth-skills portfolio [rebalance|drift-monitor|var|factors|tlh]");
    }
    break;

  case 'execution':
    if (subCommand === 'fix-payload') {
      const cust = getArgVal('--custodian', 'Pershing_NetX360');
      const sym = getArgVal('--symbol', 'VTI');
      const qty = parseFloat(getArgVal('--qty', '500'));
      const price = parseFloat(getArgVal('--price', '275.50'));
      printResult(buildFixOrderPayload({ targetCustodian: cust, symbol: sym, quantity: qty, price }));
    } else if (subCommand === 'validate') {
      const balance = { settledCash: 25000 };
      const order = { symbol: 'VTI', action: 'BUY', quantity: 50, price: 275 };
      printResult(validatePreTradeCompliance(balance, order));
    } else if (subCommand === 'payload') {
      const order = { symbol: 'VTI', action: 'BUY', quantity: 50, price: 275 };
      printResult(buildTradePayload('Alpaca', 'ACC-123', order));
    } else {
      console.log("Usage: wealth-skills execution [validate|payload|fix-payload]");
    }
    break;

  case 'crm':
    if (subCommand === 'parse-transcript') {
      const text = getArgVal('--text', 'Client agreed to rebalance into bonds. Advisor will send proposal next week.');
      printResult(parseMeetingTranscript(text));
    } else {
      console.log("Usage: wealth-skills crm [parse-transcript]");
    }
    break;

  case 'research':
    if (subCommand === 'tear-sheet') {
      const ticker = getArgVal('--ticker', 'AAPL');
      const financials = { marketCap: 3.25e12, price: 215, eps: 7.3, revenue: 3.8e11, netIncome: 1e11, freeCashFlow: 1.08e11, dividends: 1.18, sector: 'Technology' };
      printResult(generateCompanyTearSheet(ticker, financials));
    } else {
      console.log("Usage: wealth-skills research [tear-sheet]");
    }
    break;

  case 'onboarding':
    if (subCommand === 'validate-cip') {
      const applicant = { name: 'Arthur Pendelton', ssn: '123-45-6789', dob: '1985-04-12', address: '123 Main St', ofacStatus: 'CLEAR' };
      printResult(validateCipIdentity(applicant));
    } else {
      console.log("Usage: wealth-skills onboarding [validate-cip]");
    }
    break;

  case 'compliance':
    if (subCommand === 'scan') {
      const text = getArgVal('--text', 'We offer a guaranteed 15% return with past performance.');
      printResult(scanFinraRule2210(text));
    } else if (subCommand === 'lookup') {
      const crd = getArgVal('--crd', '5910482');
      printResult(parseBrokerCheckRecord(crd));
    } else {
      console.log("Usage: wealth-skills compliance [scan|lookup]");
    }
    break;

  default:
    console.log(`
===================================================
 Wealth Skills CLI - Universal Agent Executor
===================================================
Available Skill Commands:
  - wealth-skills uhnw [collar|pe-metrics]
  - wealth-skills ui render --platform [claude|codex|cursor|antigravity]
  - wealth-skills quant [backtest|forward-test]
  - wealth-skills planning [tax-headroom|monte-carlo|rmd]
  - wealth-skills portfolio [rebalance|drift-monitor|var|factors|tlh]
  - wealth-skills crm [parse-transcript]
  - wealth-skills research [tear-sheet]
  - wealth-skills execution [validate|payload|fix-payload]
  - wealth-skills onboarding [validate-cip]
  - wealth-skills compliance [scan|lookup]
`);
    break;
}
