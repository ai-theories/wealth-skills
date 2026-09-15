import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { createMessageHandler } from '../mcp-servers/lib/stdio-server.js';
import { server as universal } from '../mcp-servers/universal-wealth-server/index.js';
import { server as iapd } from '../mcp-servers/sec-iapd-lookup/index.js';
import { listCapabilities } from '../src/engines/guidance.js';

const handle = createMessageHandler(universal);
const IAPD_FIXTURE = fileURLToPath(new URL('./fixtures/iapd/sec-firms.xml', import.meta.url));
const call = (id, name, args) => handle({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });

test('MCP: Notifications Get No Response', () => {
  assert.equal(handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
});

test('MCP: Initialize And tools/list', () => {
  const init = handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  assert.equal(init.result.serverInfo.name, 'universal-wealth-server');

  const list = handle({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  assert.equal(list.result.tools.length, universal.tools.length);
  assert.ok(list.result.tools.every(tool => !('handler' in tool)));
});

test('MCP: Unknown Tools And Invalid Arguments Are JSON-RPC Errors', () => {
  assert.equal(call(3, 'nope', {}).error.code, -32602);

  const missing = call(4, 'monitor_portfolio_drift', {});
  assert.equal(missing.error.code, -32602);
  assert.match(missing.error.message, /"currentAlloc" is required/);

  const wrongType = call(5, 'calculate_portfolio_var', { portfolioValue: '1000000' });
  assert.match(wrongType.error.message, /must be of type number/);
});

test('MCP: A Throwing Tool Still Answers, With isError', () => {
  const response = call(6, 'backtest_portfolio', { weights: { TSLA: 1 } });

  assert.equal(response.id, 6);
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /No return data/);
});

test('MCP: Tool Results Carry Audit Metadata And Honour New Parameters', () => {
  const response = call(7, 'calculate_portfolio_var', { portfolioValue: 1000000, confidenceLevel: 0.99 });
  const payload = JSON.parse(response.result.content[0].text);

  assert.equal(payload.confidenceLevelPercent, 99);
  assert.equal(payload.auditMetadata.engine_function, 'calculatePortfolioVar');
});

test('MCP: Registration Lookup Reads An IAPD File Asynchronously And Carries Its Date', async () => {
  const response = await createMessageHandler(iapd)({
    jsonrpc: '2.0', id: 8, method: 'tools/call',
    params: { name: 'lookup_adviser_registration', arguments: { feedPath: IAPD_FIXTURE, crd: '900001', asOf: '2026-09-13' } }
  });
  const payload = JSON.parse(response.result.content[0].text);

  assert.equal(response.id, 8);
  assert.equal(payload.dataSource, 'SEC_IAPD_COMPILATION');
  assert.equal(payload.matches[0].businessName, 'EXAMPLE HARBOR ADVISORS LLC');
  assert.match(payload.auditMetadata.data_sources[0], /generated 2026-09-13/);
  assert.ok(payload.suggestedNextSteps.some(step => /BrokerCheck by hand/.test(step.action)));
  assert.doesNotMatch(iapd.tools[0].description, /sample|fictitious/i);
});

test('MCP: Registration Lookup Without A File Asks Where To Find One', async () => {
  const saved = process.env.WEALTH_SKILLS_IAPD_FEED;
  delete process.env.WEALTH_SKILLS_IAPD_FEED;
  try {
    const response = await createMessageHandler(iapd)({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'lookup_adviser_registration', arguments: { crd: '1' } } });
    const payload = JSON.parse(response.result.content[0].text);
    assert.equal(response.result.isError, true);
    assert.equal(payload.needsInput[0].field, 'feedPath');
  } finally {
    if (saved !== undefined) process.env.WEALTH_SKILLS_IAPD_FEED = saved;
  }
});

test('MCP: Over stdio, Notifications Are Silent And Every Request Is Answered', async () => {
  const serverPath = fileURLToPath(new URL('../mcp-servers/universal-wealth-server/index.js', import.meta.url));
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  let stdout = '';
  child.stdout.on('data', chunk => stdout += chunk);

  const messages = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'monitor_portfolio_drift', arguments: { currentAlloc: {}, targetAlloc: {}, portfolioValue: -1 } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} }
  ];
  for (const message of messages) child.stdin.write(JSON.stringify(message) + '\n');
  child.stdin.write('not json\n');
  child.stdin.end();

  await new Promise(resolve => child.on('close', resolve));

  const responses = stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.deepEqual(responses.map(r => r.id), [1, 2, 3, null]);
  assert.equal(responses[1].result.isError, true);
  assert.equal(responses[3].error.code, -32700);
});

test('MCP: Tool Results Carry Suggested Next Steps', () => {
  const response = call(10, 'monitor_portfolio_drift', { currentAlloc: { equity: 68, fixedIncome: 32 }, targetAlloc: { equity: 60, fixedIncome: 40 }, portfolioValue: 1000000 });
  const payload = JSON.parse(response.result.content[0].text);

  assert.ok(payload.suggestedNextSteps.some(step => step.tool === 'portfolio tlh'));
});

test('MCP: An Error Naming A Missing Input Returns The Question', () => {
  const response = call(11, 'backtest_portfolio', { weights: { TSLA: 1 } });
  const payload = JSON.parse(response.result.content[0].text);

  assert.equal(response.result.isError, true);
  assert.equal(payload.needsInput[0].field, 'weights');
  assert.match(payload.needsInput[0].question, /VTI/);
});

test('MCP: A Value Outside An Enum Is Rejected Before The Engine Runs', () => {
  // Schema validation catches this at the protocol level, so it never reaches the tool.
  const response = call(12, 'forward_test_simulation', { weights: { VTI: 1 }, regime: 'recession' });

  assert.equal(response.error.code, -32602);
  assert.match(response.error.message, /"regime" must be one of baseline/);
});

// --- Every capability over MCP -----------------------------------------------------------------------

test('MCP: Every CLI Capability Is Exposed By Exactly One MCP Tool', () => {
  const tools = [...universal.tools, ...iapd.tools];
  const names = tools.map(tool => tool.name);
  assert.equal(new Set(names).size, names.length, 'tool names are unique');

  const commands = tools.map(tool => tool.command).sort();
  assert.deepEqual(commands, listCapabilities().map(capability => capability.tool).sort());
});

test('MCP: Every Tool Schema Lists Its Required Arguments As Properties', () => {
  for (const tool of [...universal.tools, ...iapd.tools]) {
    assert.ok(tool.description.length > 40, `${tool.name} needs a real description`);
    for (const field of tool.inputSchema.required) {
      assert.ok(tool.inputSchema.properties[field], `${tool.name} requires "${field}" but does not describe it`);
    }
  }
});

// One realistic call per tool, so a wiring mistake (wrong argument order, wrong option name) fails here.
const EXAMPLES = {
  calculate_tax_headroom: [{ agi: 210000 }, o => o.headroomForRothConversion > 0],
  calculate_rmd: [{ age: 75, balance: 500000 }, o => o.rmdRequired > 0],
  run_monte_carlo_cash_flow: [{ assets: 1000000, spend: 40000, years: 5, trials: 20 }, o => o.successRatePercent === 100],
  net_capital_gains_losses: [{ shortTermLosses: 10000, longTermGains: 4000 }, o => o.carryoverToNextYear?.total === 3000 || JSON.stringify(o).includes('3000')],
  calculate_niit: [{ magi: 300000, netInvestmentIncome: 80000 }, o => o.netInvestmentIncomeTax === 1900],
  monitor_portfolio_drift: [{ currentAlloc: { equity: 68, fixedIncome: 32 }, targetAlloc: { equity: 60, fixedIncome: 40 }, portfolioValue: 1000000 }, o => o.isRebalanceTriggered === true && o.maxDriftPct === 8],
  calculate_portfolio_rebalance: [{ currentAlloc: { equity: 68, fixedIncome: 32 }, targetAlloc: { equity: 60, fixedIncome: 40 }, portfolioValue: 1000000 }, o => Array.isArray(o.rebalancePlan)],
  calculate_portfolio_var: [{ portfolioValue: 1000000 }, o => o.confidenceLevelPercent === 95],
  analyze_portfolio_factors: [{ holdings: [{ symbol: 'VTI', weightPct: 60 }, { symbol: 'BND', weightPct: 40 }] }, o => JSON.stringify(o).includes('60')],
  scan_tax_loss_harvesting: [{ lots: [{ id: 'L1', symbol: 'VOO', quantity: 100, purchasePrice: 500, currentPrice: 400, purchaseDate: '2020-01-01' }], saleDate: '2026-06-30' }, o => JSON.stringify(o).includes('VOO')],
  calculate_cost_basis: [{ lots: [{ id: 'A', quantity: 100, price: 50, date: '2024-01-10' }], sale: { quantity: 50, date: '2026-03-01', price: 90 } }, o => JSON.stringify(o).includes('2000')],
  calculate_time_weighted_return: [{ valuations: [{ date: '2026-01-01', value: 100000 }, { date: '2026-12-31', value: 110000 }] }, o => JSON.stringify(o).includes('10')],
  calculate_money_weighted_return: [{ cashFlows: [{ date: '2025-01-01', amount: -1000 }, { date: '2026-01-01', amount: 1100 }] }, o => JSON.stringify(o).includes('10')],
  assess_sharpe_ratio: [{ returns: [0.02, -0.01, 0.015, 0.005, -0.004, 0.012], trials: 5, sharpeVariance: 0.1 }, o => o.deflated.trials === 5 && o.probabilisticSharpeRatio > 0],
  backtest_portfolio: [{ weights: { VTI: 0.6, BND: 0.4 } }, o => Number.isFinite(o.cagrPercent ?? o.cagr ?? 0)],
  forward_test_simulation: [{ weights: { VTI: 0.6, BND: 0.4 }, years: 2, trials: 20 }, o => typeof o === 'object'],
  validate_pre_trade: [{ order: { symbol: 'VTI', action: 'BUY', quantity: 50, price: 275 }, settledCash: 25000 }, o => o.passed === true && o.estimatedCost === 13750],
  build_trade_payload: [{ broker: 'Alpaca', account: 'ACC-1', order: { symbol: 'VTI', action: 'BUY', quantity: 5, price: 275 } }, o => JSON.stringify(o).includes('VTI')],
  build_fix_order_payload: [{ account: 'A1', symbol: 'VTI', side: 'BUY', quantity: 10, price: 275, msgSeqNum: 7 }, o => o.fixMessageReadable.includes('35=D') && o.fixMessageReadable.includes('34=7')],
  validate_security_identifier: [{ id: 'US0378331005' }, o => o.valid === true && o.type === 'ISIN'],
  calculate_settlement_date: [{ tradeDate: '2026-09-11' }, o => o.settlementDate === '2026-09-14'],
  validate_cip_identity: [{ applicant: { name: 'Jane Doe', ssn: '123-45-6789', dob: '1990-05-15', address: '456 Elm St', ofacStatus: 'CLEAR' } }, o => typeof o === 'object'],
  identify_onboarding_gaps: [{ application: { accountType: 'individual', applicants: [{ name: 'Jane Doe' }], asOf: '2026-09-13' } }, o => o.blocking.length > 0],
  scan_finra_compliance: [{ text: 'We offer a guaranteed 15% return.' }, o => o.screenStatus === 'VIOLATION'],
  check_suitability: [{ profile: { riskTolerance: 'conservative', timeHorizonYears: 3 }, recommendation: { riskLevel: 4, minimumHorizonYears: 7 } }, o => o.flags.length >= 2],
  check_performance_advertisement: [{ ad: { showsGrossPerformance: true, showsNetPerformance: false, isPrivateFund: true }, asOf: '2026-09-13' }, o => o.violations.length > 0],
  generate_tear_sheet: [{ ticker: 'AAPL', financials: { marketCap: 3.25e12, price: 215, eps: 7.3, revenue: 3.8e11 } }, o => JSON.stringify(o).includes('AAPL')],
  build_dcf_valuation: [{ freeCashFlows: [100, 110], discountRate: 0.09, terminalGrowthRate: 0.02, sharesOutstanding: 10 }, o => o.enterpriseValue > 0],
  parse_meeting_transcript: [{ text: 'Client agreed to rebalance.\nAdvisor will send the proposal next week.' }, o => JSON.stringify(o).includes('proposal')],
  calculate_collar_strategy: [{ symbol: 'AAPL', shares: 1000, price: 200, basis: 25, putPremium: 4, callPremium: 4 }, o => o.zeroCostStructure !== null],
  calculate_pe_metrics: [{ commitment: 5000000, called: 3000000, distributions: 1200000, nav: 3200000 }, o => JSON.stringify(o).includes('1.47')],
  reconcile_ledger: [{ book: [{ account: 'A', security: 'X', quantity: 1, marketValue: 10 }], custodian: [{ account: 'A', security: 'X', quantity: 2, marketValue: 20 }] }, o => o.breaks.length === 1],
  tie_out_nav: [{ fund: { assets: [{ name: 'Private co', value: 100, level: 3 }], unitsOutstanding: 10 } }, o => o.requiresHumanApproval === true],
  check_lp_capital_statement: [{ statement: { beginningBalance: 100, contributions: 0, distributions: 0, incomeAllocation: 0, realizedGainLoss: 0, unrealizedGainLoss: 0, managementFees: 0, performanceAllocation: 0, otherExpenses: 0, endingBalance: 100 } }, o => JSON.stringify(o).includes('100')],
  track_close_checklist: [{ tasks: [{ id: 'a', name: 'A', status: 'not_started', due: '2026-09-01' }], asOf: '2026-09-07' }, o => JSON.stringify(o).includes('a')]
};

test('MCP: Every Universal Tool Runs On A Realistic Call, With Audit Metadata And Guidance', () => {
  assert.deepEqual(Object.keys(EXAMPLES).sort(), universal.tools.map(tool => tool.name).sort());

  for (const tool of universal.tools) {
    const [args, check] = EXAMPLES[tool.name];
    const response = call(100, tool.name, args);
    assert.equal(response.error, undefined, `${tool.name}: ${response.error?.message}`);
    assert.notEqual(response.result.isError, true, `${tool.name}: ${response.result.content[0].text}`);

    const payload = JSON.parse(response.result.content[0].text);
    assert.equal(payload.auditMetadata.tool, tool.name);
    assert.ok(Array.isArray(payload.suggestedNextSteps) && payload.suggestedNextSteps.length > 0, `${tool.name} has no next steps`);
    assert.ok(check(payload), `${tool.name} returned an unexpected result: ${JSON.stringify(payload).slice(0, 300)}`);
  }
});

test('MCP: The New Tools Fail Closed With A Question When Inputs Are Wrong', () => {
  const response = call(101, 'identify_onboarding_gaps', { application: { accountType: 'crypto' } });
  const payload = JSON.parse(response.result.content[0].text);
  assert.equal(response.result.isError, true);
  assert.equal(payload.needsInput[0].field, 'accountType');

  const niit = call(102, 'calculate_niit', { magi: 300000, netInvestmentIncome: 1, filingStatus: 'JOINT' });
  assert.equal(niit.error.code, -32602, 'enum validation rejects an unknown filing status');
});

test('MCP: Over stdio, An Async Registration Lookup Is Answered', async () => {
  const serverPath = fileURLToPath(new URL('../mcp-servers/sec-iapd-lookup/index.js', import.meta.url));
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  let stdout = '';
  child.stdout.on('data', chunk => stdout += chunk);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'lookup_adviser_registration', arguments: { feedPath: IAPD_FIXTURE, name: 'capital', asOf: '2026-09-13' } } }) + '\n');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' }) + '\n');
  child.stdin.end();

  await new Promise(resolve => child.on('close', resolve));
  const responses = stdout.trim().split('\n').map(line => JSON.parse(line));
  const lookup = responses.find(r => r.id === 1);

  assert.deepEqual(responses.map(r => r.id).sort(), [1, 2]);
  assert.equal(JSON.parse(lookup.result.content[0].text).matchCount, 2);
});
