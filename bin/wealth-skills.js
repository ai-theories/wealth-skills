#!/usr/bin/env node

/**
 * Universal CLI Entrypoint for `wealth-skills`
 * Executable by Claude Code, Devin, Cursor, OpenAI Codex, Antigravity, and terminal agents.
 *
 * Results print to stdout as JSON with an `auditMetadata` block; notes and errors print to stderr.
 * Bad input exits non-zero (2 = usage, 1 = engine error) instead of quietly running on sample data.
 */

import { calculateTaxBracketHeadroom, runMonteCarloCashFlow, calculateRMD } from '../src/engines/planning.js';
import { calculatePortfolioRebalance, scanTaxLossHarvesting, monitorPortfolioDrift, analyzePortfolioFactors, calculatePortfolioVar } from '../src/engines/portfolio.js';
import { backtestPortfolio, forwardTestSimulation } from '../src/engines/quant.js';
import { parseMeetingTranscript } from '../src/engines/crm.js';
import { generateCompanyTearSheet } from '../src/engines/research.js';
import { validatePreTradeCompliance, buildTradePayload } from '../src/engines/execution.js';
import { validateCipIdentity } from '../src/engines/onboarding.js';
import { scanFinraRule2210, parseBrokerCheckRecord } from '../src/engines/compliance.js';
import { renderAdaptiveUI } from '../src/engines/ui.js';
import { buildFixOrderPayload } from '../src/engines/fix.js';
import { calculateCollarStrategy, calculatePeMetrics } from '../src/engines/uhnw.js';
import { withAuditMetadata } from '../src/engines/audit.js';
import { withGuidance, listCapabilities } from '../src/engines/guidance.js';
import { seededRandom } from '../src/engines/stats.js';

const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

class UsageError extends Error {}

const SAMPLE_LOTS = [{ id: 'LOT-1', symbol: 'IWM', quantity: 100, purchasePrice: 220, currentPrice: 150, purchaseDate: '2026-01-10' }];
const SAMPLE_ORDER = { symbol: 'VTI', action: 'BUY', quantity: 50, price: 275 };
const SAMPLE_FINANCIALS = { marketCap: 3.25e12, price: 215, eps: 7.3, revenue: 3.8e11, netIncome: 1e11, freeCashFlow: 1.08e11, dividends: 1.18, sector: 'Technology' };
const SAMPLE_APPLICANT = { name: 'Arthur Pendelton', ssn: '123-45-6789', dob: '1985-04-12', address: '123 Main St', ofacStatus: 'CLEAR' };

const CALLER_INPUTS = 'caller-supplied inputs (built-in samples where flags were omitted)';

function hasFlag(flag) {
  return args.includes(flag);
}

function getArgVal(flag, defaultVal = null) {
  const index = args.indexOf(flag);
  if (index === -1) return defaultVal;

  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new UsageError(`${flag} requires a value.`);
  }
  return value;
}

function numArg(flag, defaultVal) {
  const raw = getArgVal(flag, null);
  if (raw === null) return defaultVal;

  const value = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(value)) {
    throw new UsageError(`${flag} must be a number, got "${raw}".`);
  }
  return value;
}

function intArg(flag, defaultVal) {
  if (!hasFlag(flag)) return defaultVal;

  const value = numArg(flag);
  if (!Number.isInteger(value)) throw new UsageError(`${flag} must be a whole number, got "${getArgVal(flag)}".`);
  return value;
}

function jsonArg(flag, defaultVal) {
  const raw = getArgVal(flag, null);
  if (raw === null) return defaultVal;

  try {
    return JSON.parse(raw);
  } catch (e) {
    // A malformed flag used to print a warning and then carry on with the sample default.
    throw new UsageError(`${flag} is not valid JSON: ${e.message}`);
  }
}

function dateArg(flag, defaultVal) {
  const raw = getArgVal(flag, null);
  if (raw === null) return defaultVal;
  if (Number.isNaN(Date.parse(raw))) throw new UsageError(`${flag} must be a date such as 2026-06-30, got "${raw}".`);
  return new Date(raw);
}

// With none of a command's input flags it runs on illustrative samples. Say so on stderr so the
// output is never mistaken for an analysis of the caller's own data.
function noteIfSample(flags) {
  if (!flags.some(hasFlag)) {
    console.error(`Note: no ${flags.join(' / ')} supplied; using built-in sample inputs.`);
  }
}

// Simulations are random by default. A seed makes a run reproducible, which is what documented
// examples and regression tests need.
function rngArg() {
  return hasFlag('--seed') ? seededRandom(intArg('--seed')) : Math.random;
}

function printResult(data, audit) {
  if (typeof data === 'string') {
    console.log(data);
    return;
  }
  // Questions and next steps ride along with the numbers, so an agent can carry the conversation
  // forward instead of stopping at a result.
  console.log(JSON.stringify(withAuditMetadata(withGuidance(data, audit?.tool), audit), null, 2));
}

function usage(line) {
  console.error(`Usage: wealth-skills ${line}`);
  process.exitCode = 2;
}

const HELP = `
===================================================
 Wealth Skills CLI - Universal Agent Executor
===================================================
JSON flags take a single-quoted JSON string. Omitted flags fall back to samples (noted on stderr).

  uhnw collar             --symbol --shares --price --basis [--put-pct --call-pct --put-premium --call-premium]
  uhnw pe-metrics         --commitment --called --distributions --nav
  ui render               --platform [claude|codex|cursor|antigravity] --data '<json>'
  quant backtest          --weights '<json>' [--initial --rf]
  quant forward-test      --weights '<json>' --regime [baseline|stagflation|bull_market|bear_market] [--years --trials --initial --seed]
  planning tax-headroom   --agi --status [MFJ|SINGLE]
  planning monte-carlo    --assets --spend [--return --vol --years --trials --inflation --seed]
  planning rmd            --age --balance [--birth-year]
  portfolio rebalance     --current '<json>' --target '<json>' --value [--min-trade-pct]
  portfolio drift-monitor --current '<json>' --target '<json>' --value --band [--min-trade-pct]
  portfolio var           --value --vol [--confidence --horizon]
  portfolio factors       --holdings '<json>'
  portfolio tlh           --lots '<json>' [--min-loss --sale-date]
  execution validate      --order '<json>' --settled-cash [--positions '<json>']
  execution payload       --broker [Alpaca|IBKR] --account --order '<json>' [--conid]
  execution fix-payload   --custodian --account --symbol --side --qty --price [--seq]
  crm parse-transcript    --text
  research tear-sheet     --ticker --financials '<json>'
  onboarding validate-cip --applicant '<json>'
  compliance scan         --text
  compliance lookup       --crd   (SAMPLE FIXTURE ONLY - not connected to BrokerCheck or IAPD)
  capabilities            what each command answers, what it needs, and typical phrasings
`;

function run() {
  switch (command) {
    case 'uhnw':
      if (subCommand === 'collar') {
        noteIfSample(['--symbol', '--shares', '--price', '--basis']);
        const result = calculateCollarStrategy(
          getArgVal('--symbol', 'AAPL'),
          numArg('--shares', 100000),
          numArg('--price', 215),
          numArg('--basis', 25),
          {
            putStrikePct: numArg('--put-pct', 0.90),
            callStrikePct: numArg('--call-pct', 1.15),
            putPremium: numArg('--put-premium', null),
            callPremium: numArg('--call-premium', null)
          }
        );
        return printResult(result, {
          skillPack: 'wealth-uhnw',
          tool: 'uhnw collar',
          engineFunction: 'calculateCollarStrategy',
          methodology: 'Strikes as a percentage of spot; net cost only from supplied option premiums',
          dataSources: [CALLER_INPUTS]
        });
      }
      if (subCommand === 'pe-metrics') {
        noteIfSample(['--commitment', '--called', '--distributions', '--nav']);
        // --dist is the original flag name; --distributions is what the docs use. Both work.
        const distributions = hasFlag('--distributions') ? numArg('--distributions') : numArg('--dist', 1200000);
        const result = calculatePeMetrics(numArg('--commitment', 5000000), numArg('--called', 3000000), distributions, numArg('--nav', 3200000));
        return printResult(result, {
          skillPack: 'wealth-uhnw',
          tool: 'uhnw pe-metrics',
          engineFunction: 'calculatePeMetrics',
          methodology: 'Private equity multiples: TVPI/MOIC, DPI, RVPI',
          dataSources: [CALLER_INPUTS]
        });
      }
      return usage('uhnw [collar|pe-metrics]');

    case 'ui':
      if (subCommand === 'render') {
        const data = jsonArg('--data', {
          title: 'Portfolio Review',
          summary: 'Rebalance recommended due to equity drift.',
          metrics: { 'Portfolio Value': '$1,250,000', 'Equity Drift': '+8%' }
        });
        return printResult(renderAdaptiveUI(data, getArgVal('--platform', 'claude')));
      }
      return usage('ui render --platform [claude|codex|cursor|antigravity] --data \'<json>\'');

    case 'quant':
      if (subCommand === 'backtest') {
        noteIfSample(['--weights']);
        const result = backtestPortfolio(jsonArg('--weights', { VTI: 0.6, BND: 0.4 }), numArg('--initial', 100000), { riskFreeRate: numArg('--rf', 0.03) });
        return printResult(result, {
          skillPack: 'wealth-portfolio',
          tool: 'quant backtest',
          engineFunction: 'backtestPortfolio',
          methodology: 'Annual historical backtest with annual rebalancing',
          dataSources: [CALLER_INPUTS, 'embedded approximate annual total returns, 2015-2024']
        });
      }
      if (subCommand === 'forward-test') {
        noteIfSample(['--weights']);
        const result = forwardTestSimulation(
          jsonArg('--weights', { VTI: 0.6, BND: 0.4 }),
          getArgVal('--regime', 'baseline'),
          intArg('--years', 5),
          intArg('--trials', 500),
          { initialBalance: numArg('--initial', 100000), rng: rngArg() }
        );
        return printResult(result, {
          skillPack: 'wealth-portfolio',
          tool: 'quant forward-test',
          engineFunction: 'forwardTestSimulation',
          methodology: 'Monte Carlo on portfolio-level normal annual returns (weighted mean, full covariance)',
          dataSources: [CALLER_INPUTS, 'illustrative regime capital market assumptions (library defaults)', 'correlations from embedded 2015-2024 annual returns']
        });
      }
      return usage('quant [backtest|forward-test]');

    case 'planning':
      if (subCommand === 'tax-headroom') {
        noteIfSample(['--agi']);
        const result = calculateTaxBracketHeadroom(numArg('--agi', 210000), getArgVal('--status', 'MFJ'));
        return printResult(result, {
          skillPack: 'wealth-planning',
          tool: 'planning tax-headroom',
          engineFunction: 'calculateTaxBracketHeadroom',
          methodology: 'Ordinary-income bracket headroom after the standard deduction',
          dataSources: [CALLER_INPUTS, 'IRS Rev. Proc. 2025-32 (tax year 2026 brackets and standard deduction)']
        });
      }
      if (subCommand === 'monte-carlo') {
        noteIfSample(['--assets', '--spend']);
        const result = runMonteCarloCashFlow(
          numArg('--assets', 1000000),
          numArg('--spend', 40000),
          numArg('--return', 0.06),
          numArg('--vol', 0.12),
          intArg('--years', 30),
          intArg('--trials', 1000),
          numArg('--inflation', 0.025),
          { rng: rngArg() }
        );
        return printResult(result, {
          skillPack: 'wealth-planning',
          tool: 'planning monte-carlo',
          engineFunction: 'runMonteCarloCashFlow',
          methodology: 'Monte Carlo of normal annual returns with inflation-adjusted start-of-year withdrawals',
          dataSources: [CALLER_INPUTS]
        });
      }
      if (subCommand === 'rmd') {
        noteIfSample(['--age', '--balance']);
        const result = calculateRMD(intArg('--age', 75), numArg('--balance', 500000), { birthYear: intArg('--birth-year', undefined) });
        return printResult(result, {
          skillPack: 'wealth-planning',
          tool: 'planning rmd',
          engineFunction: 'calculateRMD',
          methodology: 'Prior year-end balance divided by the Uniform Lifetime Table distribution period',
          dataSources: [CALLER_INPUTS, 'IRS Uniform Lifetime Table, Treas. Reg. §1.401(a)(9)-9(c)']
        });
      }
      return usage('planning [tax-headroom|monte-carlo|rmd]');

    case 'portfolio':
      if (subCommand === 'rebalance' || subCommand === 'drift-monitor') {
        noteIfSample(['--current', '--target']);
        const current = jsonArg('--current', { equity: 68, bond: 22, cash: 10 });
        const target = jsonArg('--target', { equity: 60, bond: 30, cash: 10 });
        const value = numArg('--value', 1250000);
        const options = { minTradePct: numArg('--min-trade-pct', 0.05) };

        if (subCommand === 'rebalance') {
          return printResult(calculatePortfolioRebalance(current, target, value, options), {
            skillPack: 'wealth-portfolio',
            tool: 'portfolio rebalance',
            engineFunction: 'calculatePortfolioRebalance',
            methodology: 'Target-minus-current trade sizing with proportional minimum trade size',
            dataSources: [CALLER_INPUTS]
          });
        }
        return printResult(monitorPortfolioDrift(current, target, value, numArg('--band', 5), options), {
          skillPack: 'wealth-portfolio',
          tool: 'portfolio drift-monitor',
          engineFunction: 'monitorPortfolioDrift',
          methodology: 'Absolute percentage-point drift against target tolerance band',
          dataSources: [CALLER_INPUTS]
        });
      }
      if (subCommand === 'var') {
        noteIfSample(['--value', '--vol']);
        const result = calculatePortfolioVar(numArg('--value', 1000000), numArg('--vol', 0.14), numArg('--confidence', 0.95), numArg('--horizon', 1));
        return printResult(result, {
          skillPack: 'wealth-portfolio',
          tool: 'portfolio var',
          engineFunction: 'calculatePortfolioVar',
          methodology: 'Parametric normal VaR and expected shortfall',
          dataSources: [CALLER_INPUTS]
        });
      }
      if (subCommand === 'factors') {
        noteIfSample(['--holdings']);
        const holdings = jsonArg('--holdings', [{ symbol: 'VTI', weightPct: 60 }, { symbol: 'BND', weightPct: 40 }]);
        return printResult(analyzePortfolioFactors(holdings), {
          skillPack: 'wealth-portfolio',
          tool: 'portfolio factors',
          engineFunction: 'analyzePortfolioFactors',
          methodology: 'Asset-class weights; weighted averages of per-holding factor and duration inputs',
          dataSources: [CALLER_INPUTS, 'library symbol-to-asset-class table']
        });
      }
      if (subCommand === 'tlh') {
        noteIfSample(['--lots']);
        const result = scanTaxLossHarvesting(jsonArg('--lots', SAMPLE_LOTS), numArg('--min-loss', 1000), dateArg('--sale-date', new Date()));
        return printResult(result, {
          skillPack: 'wealth-portfolio',
          tool: 'portfolio tlh',
          engineFunction: 'scanTaxLossHarvesting',
          methodology: 'Unrealized loss screen; 30-day look-back wash-sale check across supplied lots; cross-index replacement candidates',
          dataSources: [CALLER_INPUTS, 'library ETF tracked-index table']
        });
      }
      return usage('portfolio [rebalance|drift-monitor|var|factors|tlh]');

    case 'execution':
      if (subCommand === 'fix-payload') {
        noteIfSample(['--symbol', '--qty', '--price']);
        const result = buildFixOrderPayload({
          targetCustodian: getArgVal('--custodian', 'Pershing_NetX360'),
          account: getArgVal('--account', 'U9821045'),
          symbol: getArgVal('--symbol', 'VTI'),
          side: getArgVal('--side', 'BUY'),
          quantity: numArg('--qty', 500),
          price: numArg('--price', 275.50),
          msgSeqNum: intArg('--seq', undefined)
        });
        return printResult(result, {
          skillPack: 'wealth-execution',
          tool: 'execution fix-payload',
          engineFunction: 'buildFixOrderPayload',
          methodology: 'FIX 4.4 New Order Single (35=D) construction with BodyLength and CheckSum',
          dataSources: [CALLER_INPUTS]
        });
      }
      if (subCommand === 'validate') {
        noteIfSample(['--order']);
        const balance = { settledCash: numArg('--settled-cash', 25000), positions: jsonArg('--positions', undefined) };
        const result = validatePreTradeCompliance(balance, jsonArg('--order', SAMPLE_ORDER));
        return printResult(result, {
          skillPack: 'wealth-execution',
          tool: 'execution validate',
          engineFunction: 'validatePreTradeCompliance',
          methodology: 'Buying power, oversell and holding-period checks',
          dataSources: [CALLER_INPUTS]
        });
      }
      if (subCommand === 'payload') {
        noteIfSample(['--order']);
        let order = jsonArg('--order', SAMPLE_ORDER);
        if (hasFlag('--conid')) order = { ...order, conid: intArg('--conid') };
        const result = buildTradePayload(getArgVal('--broker', 'Alpaca'), getArgVal('--account', 'ACC-123'), order);
        return printResult(result, {
          skillPack: 'wealth-execution',
          tool: 'execution payload',
          engineFunction: 'buildTradePayload',
          methodology: 'Broker REST order payload construction (not submitted)',
          dataSources: [CALLER_INPUTS]
        });
      }
      return usage('execution [validate|payload|fix-payload]');

    case 'crm':
      if (subCommand === 'parse-transcript') {
        noteIfSample(['--text']);
        const text = getArgVal('--text', 'Client agreed to rebalance into bonds. Advisor will send proposal next week.');
        return printResult(parseMeetingTranscript(text), {
          skillPack: 'wealth-crm',
          tool: 'crm parse-transcript',
          engineFunction: 'parseMeetingTranscript',
          methodology: 'Line-level keyword extraction of decisions and action items',
          dataSources: [CALLER_INPUTS]
        });
      }
      return usage('crm [parse-transcript]');

    case 'research':
      if (subCommand === 'tear-sheet') {
        noteIfSample(['--financials']);
        const result = generateCompanyTearSheet(getArgVal('--ticker', 'AAPL'), jsonArg('--financials', SAMPLE_FINANCIALS));
        return printResult(result, {
          skillPack: 'wealth-research',
          tool: 'research tear-sheet',
          engineFunction: 'generateCompanyTearSheet',
          methodology: 'Valuation ratios from supplied fundamentals',
          dataSources: [CALLER_INPUTS]
        });
      }
      return usage('research [tear-sheet]');

    case 'onboarding':
      if (subCommand === 'validate-cip') {
        noteIfSample(['--applicant']);
        return printResult(validateCipIdentity(jsonArg('--applicant', SAMPLE_APPLICANT)), {
          skillPack: 'wealth-onboarding',
          tool: 'onboarding validate-cip',
          engineFunction: 'validateCipIdentity',
          methodology: 'Field presence and format checks; records a caller-performed OFAC screen result',
          dataSources: [CALLER_INPUTS]
        });
      }
      return usage('onboarding [validate-cip]');

    case 'compliance':
      if (subCommand === 'scan') {
        noteIfSample(['--text']);
        const text = getArgVal('--text', 'We offer a guaranteed 15% return with past performance.');
        return printResult(scanFinraRule2210(text), {
          skillPack: 'wealth-compliance',
          tool: 'compliance scan',
          engineFunction: 'scanFinraRule2210',
          methodology: 'Pattern matching for promissory terms and required disclosure phrases',
          dataSources: [CALLER_INPUTS]
        });
      }
      if (subCommand === 'lookup') {
        noteIfSample(['--crd']);
        return printResult(parseBrokerCheckRecord(getArgVal('--crd', '5910482')), {
          skillPack: 'wealth-compliance',
          tool: 'compliance lookup',
          engineFunction: 'parseBrokerCheckRecord',
          methodology: 'Exact CRD match against a bundled fixture',
          dataSources: ['bundled SAMPLE_FIXTURE (two fictitious records); no registry queried']
        });
      }
      return usage('compliance [scan|lookup]');

    case 'capabilities':
      // One call that tells an agent which command answers which kind of request, and what each needs.
      console.log(JSON.stringify(listCapabilities(), null, 2));
      return;

    case undefined:
    case 'help':
    case '--help':
      console.log(HELP);
      return;

    default:
      console.error(`Unknown command "${command}".`);
      console.error(HELP);
      process.exitCode = 2;
  }
}

try {
  run();
} catch (err) {
  console.error(`Error: ${err.message}`);
  // An error that names a missing input carries the question to put to the user.
  for (const item of err.needsInput ?? []) {
    console.error(`Ask: ${item.question}${item.why ? `  (${item.why})` : ''}`);
  }
  process.exitCode = err instanceof UsageError ? 2 : 1;
}
