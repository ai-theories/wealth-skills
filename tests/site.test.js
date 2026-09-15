import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSite, SITE_URL, INDEXNOW_KEY } from '../bin/build-site.js';
import { indexNowRequest } from '../bin/notify-indexnow.js';
import { listCapabilities } from '../src/engines/guidance.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'wealth-site-'));
buildSite(out);
test.after(() => fs.rmSync(out, { recursive: true, force: true }));

const read = (file) => fs.readFileSync(path.join(out, file), 'utf8');
const index = read('index.html');
const meta = (attr, name) => index.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];

test('Site: The Build Publishes Only The Dashboard, Engines And Discovery Files', () => {
  const files = fs.readdirSync(out).sort();
  assert.deepEqual(files, ['.nojekyll', `${INDEXNOW_KEY}.txt`, '404.html', 'index.html', 'llms-full.txt', 'llms.txt', 'og-image.png', 'robots.txt', 'sitemap.xml', 'src'].sort());
  assert.deepEqual(fs.readdirSync(path.join(out, 'src')), ['engines']);
  assert.ok(fs.readdirSync(path.join(out, 'src', 'engines')).every(f => f.endsWith('.js')));
});

test('Site: The Page Has A Title, Description, Canonical URL And Social Cards', () => {
  const title = index.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(title.length >= 30 && title.length <= 65, `title is ${title.length} characters`);

  const description = meta('name', 'description');
  assert.ok(description.length >= 120 && description.length <= 160, `description is ${description.length} characters`);

  assert.match(index, new RegExp(`<link rel="canonical" href="${SITE_URL}">`));
  assert.match(index, /<html lang="en">/);
  assert.equal(meta('property', 'og:url'), SITE_URL);
  assert.equal(meta('property', 'og:image'), `${SITE_URL}og-image.png`);
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
  assert.equal((index.match(/<h1[\s>]/g) ?? []).length, 1, 'exactly one h1');
});

test('Site: The Social Image Is A 1200 x 630 PNG', () => {
  const png = fs.readFileSync(path.join(out, 'og-image.png'));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('Site: Structured Data Parses And The FAQ Matches The Visible Questions', () => {
  const json = index.match(/<script type="application\/ld\+json" id="structured-data">([\s\S]*?)<\/script>/)[1];
  const graph = JSON.parse(json)['@graph'];

  const software = graph.find(node => node['@type'] === 'SoftwareApplication');
  assert.equal(software.url, SITE_URL);
  assert.equal(software.softwareVersion, JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version);

  // Google requires FAQ structured data to match content visible on the page.
  const faq = graph.find(node => node['@type'] === 'FAQPage').mainEntity.map(q => q.name);
  const visible = [...index.matchAll(/<summary>([^<]+)<\/summary>/g)].map(match => match[1]);
  assert.deepEqual(faq, visible);
});

test('Site: Crawlers Without JavaScript Do Not See The file:// Warning First', () => {
  assert.match(index, /<div id="module-warning" class="module-warning" hidden>/);
});

test('Site: robots.txt, sitemap.xml And 404 Are Well Formed', () => {
  assert.match(read('robots.txt'), new RegExp(`Sitemap: ${SITE_URL}sitemap.xml`));
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap, new RegExp(`<loc>${SITE_URL}</loc><lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`));
  assert.match(read('404.html'), /<meta name="robots" content="noindex">/);
});

test('Site: llms.txt Lists Every Capability And Every Skill Pack', () => {
  const llms = read('llms.txt');
  assert.match(llms, /^# Wealth Skills\n\n> /);
  for (const capability of listCapabilities()) assert.ok(llms.includes(`\`${capability.tool}\``), `llms.txt is missing ${capability.tool}`);
  for (const pack of fs.readdirSync(path.join(root, 'skills')).filter(p => fs.existsSync(path.join(root, 'skills', p, 'SKILL.md')))) {
    assert.ok(llms.includes(`[${pack}]`), `llms.txt is missing ${pack}`);
    assert.ok(read('llms-full.txt').includes(`skills/${pack}/SKILL.md`));
  }
});

test('Site: Every Dashboard Import Is An Export Of The Engine It Names', async () => {
  const imports = [...index.matchAll(/import \{([^}]+)\} from '\.\/src\/engines\/([\w-]+\.js)'/g)];
  assert.ok(imports.length >= 10);
  for (const [, names, file] of imports) {
    const module = await import(path.join(root, 'src', 'engines', file));
    for (const name of names.split(',').map(n => n.trim())) assert.equal(typeof module[name], 'function', `${file} does not export ${name}`);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'src', 'engines', file), 'utf8'), /^import .* from 'node:/m, `${file} imports a Node built-in and cannot run in the browser`);
  }
});

test('Site: Every Tab Has A Panel And Every Element The Script Reads Exists', () => {
  const tabs = [...index.matchAll(/data-tab="([\w-]+)"/g)].map(match => match[1]);
  assert.ok(tabs.length >= 10);
  for (const tab of tabs) assert.match(index, new RegExp(`id="${tab}" class="tab-content`), `no panel for ${tab}`);

  const script = index.slice(index.indexOf('<script type="module">'));
  const ids = new Set([...script.matchAll(/\$\('([\w-]+)'\)/g), ...script.matchAll(/'([a-z]+-[\w-]+)'/g)].map(match => match[1]).filter(id => !id.startsWith('tab-') || tabs.includes(id)));
  for (const id of ids) {
    if (/^(input|change)$/.test(id)) continue;
    if (!/^(plan|port|quant|uhnw|fix|tax|perf|suit|mkt|fund|planning|portfolio|performance|suitability|markets|fundops|module)-/.test(id)) continue;
    assert.match(index, new RegExp(`id="${id}"`), `the script reads #${id}, which is not on the page`);
  }
});

test('Site: Every Suitability Dropdown Value Is One The Engine Accepts', async () => {
  const { checkSuitability } = await import('../src/engines/compliance.js');
  const options = (id) => [...index.match(new RegExp(`<select id="${id}"[\\s\\S]*?</select>`))[0].matchAll(/value="([^"]+)"/g)].map(match => match[1]);

  for (const riskTolerance of options('suit-risk')) assert.doesNotThrow(() => checkSuitability({ riskTolerance }, { riskLevel: 3 }), riskTolerance);
  for (const liquidityNeeds of options('suit-liquidity')) assert.doesNotThrow(() => checkSuitability({ liquidityNeeds }, { liquidity: 'daily' }), liquidityNeeds);
  for (const liquidity of options('suit-pliquidity')) assert.doesNotThrow(() => checkSuitability({ liquidityNeeds: 'low' }, { liquidity }), liquidity);
});

test('Site: The IndexNow Key File Matches The Notification, And Every URL Is Under The Key Location', () => {
  assert.match(INDEXNOW_KEY, /^[a-f0-9]{32}$/);
  assert.equal(read(`${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);

  const request = indexNowRequest();
  assert.equal(request.host, 'ai-theories.github.io');
  assert.equal(request.keyLocation, `${SITE_URL}${INDEXNOW_KEY}.txt`);
  for (const url of request.urlList) assert.ok(url.startsWith(SITE_URL), `${url} is outside the key location's path`);
});

test('Site: The Search Phrases People Use Appear In The Title, Description And Visible Text', () => {
  const title = index.match(/<title>([^<]+)<\/title>/)[1].toLowerCase();
  const description = meta('name', 'description').toLowerCase();
  const visible = index.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').toLowerCase();

  assert.match(title, /claude skills for wealth management/);
  for (const phrase of ['wealth skills', 'investing skills', 'claude code']) assert.ok(description.includes(phrase), `description lacks "${phrase}"`);
  for (const phrase of ['claude skills for wealth management', 'investing skills', 'wealth skills', 'claude code', 'codex', 'cursor']) {
    assert.ok(visible.includes(phrase), `visible page text lacks "${phrase}"`);
  }
  assert.match(read('llms.txt'), /wealth skills and investing skills for Claude, Claude Code/);
});
