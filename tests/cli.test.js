import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const CLI = fileURLToPath(new URL('../bin/wealth-skills.js', import.meta.url));
const run = (...argv) => spawnSync(process.execPath, [CLI, ...argv], { encoding: 'utf8' });

test('CLI: Invalid JSON Exits Non-Zero Instead Of Running On Sample Data', () => {
  const result = run('portfolio', 'rebalance', '--current', '{equity:68}');

  assert.equal(result.status, 2);
  assert.match(result.stderr, /--current is not valid JSON/);
  assert.equal(result.stdout, '');
});

test('CLI: Non-Numeric Flags Are Rejected', () => {
  const result = run('planning', 'rmd', '--age', 'seventy');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--age must be a number/);
});

test('CLI: tlh Analyses The Supplied Lots', () => {
  const lots = [{ id: 'A', symbol: 'VOO', quantity: 10, purchasePrice: 500, currentPrice: 300, purchaseDate: '2020-01-01' }];
  const result = run('portfolio', 'tlh', '--lots', JSON.stringify(lots));
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(output.opportunities[0].symbol, 'VOO');
  assert.equal(output.opportunities[0].recommendedReplacement, 'VV');
});

test('CLI: Omitted Inputs Are Announced On stderr', () => {
  const result = run('onboarding', 'validate-cip');

  assert.equal(result.status, 0);
  assert.match(result.stderr, /using built-in sample inputs/);
});

test('CLI: Results Carry Audit Metadata', () => {
  const result = run('portfolio', 'var', '--value', '2000000', '--vol', '0.2', '--confidence', '0.99');
  const output = JSON.parse(result.stdout);

  assert.equal(output.confidenceLevelPercent, 99);
  assert.equal(output.auditMetadata.engine_function, 'calculatePortfolioVar');
  assert.equal(output.auditMetadata.skill_pack, 'wealth-portfolio');
});

test('CLI: --distributions Is Honoured For PE Metrics', () => {
  const result = run('uhnw', 'pe-metrics', '--commitment', '5000000', '--called', '2000000', '--distributions', '1000000', '--nav', '1500000');
  assert.equal(JSON.parse(result.stdout).metrics.dpi, '0.5x');
});

test('CLI: IBKR Payload Without A conid Exits With An Engine Error', () => {
  const order = JSON.stringify({ symbol: 'MSFT', action: 'BUY', quantity: 1, price: 400 });
  const result = run('execution', 'payload', '--broker', 'IBKR', '--order', order);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /conid/);
});
