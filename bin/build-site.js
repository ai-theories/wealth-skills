#!/usr/bin/env node

/**
 * Assembles the GitHub Pages site into a directory (default _site):
 *
 *   index.html          the dashboard, with its search and social metadata
 *   404.html            a small not-found page that links home
 *   src/engines/*.js    the browser-safe engine modules the dashboard imports
 *   robots.txt          allows everything and names the sitemap (crawlers read only the host root robots.txt, so submit the sitemap in Search Console)
 *   sitemap.xml         the published pages, dated by the last commit
 *   llms.txt            a plain summary for AI assistants and answer engines (llmstxt.org)
 *   llms-full.txt       the README and every skill pack, in one Markdown file
 *   og-image.png        the social preview image
 *   <key>.txt           the IndexNow key, proving this site may notify search engines of updates
 *
 * llms.txt is generated from listCapabilities() and the catalog, so it cannot drift from the code.
 *
 *   node bin/build-site.js [outDir]
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { listCapabilities } from '../src/engines/guidance.js';
import { LIBRARY_VERSION } from '../src/engines/audit.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITE_URL = 'https://ai-theories.github.io/wealth-skills/';
const REPO_URL = 'https://github.com/ai-theories/wealth-skills';
const PACKS_DIR = path.join(root, 'skills');
// IndexNow keys are public by design: search engines fetch this file to confirm a notification came
// from the site owner. See bin/notify-indexnow.js.
export const INDEXNOW_KEY = '6bd9647ed8bf0626c71c84c870b653b6';

function lastModified() {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: root, encoding: 'utf8' }).trim() || today();
  } catch {
    return today();
  }
}

const today = () => new Date().toISOString().slice(0, 10);

function packs() {
  return fs.readdirSync(PACKS_DIR)
    .filter(name => fs.existsSync(path.join(PACKS_DIR, name, 'SKILL.md')))
    .sort()
    .map(name => {
      const text = fs.readFileSync(path.join(PACKS_DIR, name, 'SKILL.md'), 'utf8');
      const description = text.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? '';
      return { name, description, text };
    });
}

export function buildLlmsTxt() {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'catalog.json'), 'utf8'));
  const codeBacked = catalog.items.filter(i => ['engine', 'partial-engine', 'payload-builder'].includes(i.tier)).length;
  const byArea = new Map();
  for (const capability of listCapabilities()) {
    const area = capability.tool.split(' ')[0];
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area).push(capability);
  }

  const lines = [
    '# Wealth Skills',
    '',
    `> Open-source (MIT) wealth skills and investing skills for Claude, Claude Code, Codex and Cursor: Claude skills (SKILL.md packs) for wealth management, zero-dependency calculation engines, a CLI and Model Context Protocol servers for US wealth management. Version ${LIBRARY_VERSION}. It prepares analysis and payloads for a licensed professional to review; it never submits orders, moves money or gives investment advice.`,
    '',
    `Every capability below is available as a CLI command (\`node bin/wealth-skills.js <command>\`) and as an MCP tool. Results carry \`auditMetadata\`, \`needsInput\` (questions to ask when an input is missing) and \`suggestedNextSteps\`. ${codeBacked} of the ${catalog.items.length} resources in the US Wealth Management Capability Catalog are backed by engine code; the rest are mapped to packs as guidance or cited references.`,
    '',
    '## Links',
    '',
    `- [Interactive calculators](${SITE_URL}): the engines running in the browser`,
    `- [Source code and README](${REPO_URL}): installation, journeys and guardrails`,
    `- [Full documentation for LLMs](${SITE_URL}llms-full.txt): README and every skill pack in one file`,
    `- [MCP and agent setup](${REPO_URL}/blob/main/docs/AGENT_INTEGRATION.md)`,
    `- [Compliance rules for agents](${REPO_URL}/blob/main/docs/COMPLIANCE_GUIDELINES.md)`,
    `- [Catalog crosswalk](${REPO_URL}/blob/main/CATALOG_CROSSWALK.md): coverage tier for all 400 catalog resources`,
    '',
    '## Skill packs',
    ''
  ];
  for (const pack of packs()) {
    lines.push(`- [${pack.name}](${REPO_URL}/blob/main/skills/${pack.name}/SKILL.md): ${pack.description}`);
  }

  lines.push('', '## Capabilities', '');
  for (const [area, capabilities] of byArea) {
    lines.push(`### ${area}`, '');
    for (const capability of capabilities) {
      const required = capability.inputs.filter(input => input.required).map(input => input.field);
      lines.push(`- \`${capability.tool}\`: ${capability.summary} Needs: ${required.join(', ')}. Answers requests like "${capability.typicalRequests[0]}".`);
    }
    lines.push('');
  }

  lines.push(
    '## Limits',
    '',
    '- Does not connect to custodians, brokers or CRMs, and does not query FINRA BrokerCheck (its terms prohibit automated access).',
    '- Registration lookups read SEC IAPD compilation files downloaded from https://adviserinfo.sec.gov/compilation and cover investment advisers only.',
    '- Does not price options, screen sanctions lists, run a factor risk model or prepare tax returns.',
    '- Not investment, tax or legal advice.',
    ''
  );
  return lines.join('\n');
}

export function buildLlmsFullTxt() {
  const parts = [`# Wealth Skills: full documentation\n\nSource: ${REPO_URL}\n`, fs.readFileSync(path.join(root, 'README.md'), 'utf8')];
  for (const pack of packs()) parts.push(`\n---\n\n<!-- skills/${pack.name}/SKILL.md -->\n\n${pack.text}`);
  return parts.join('\n');
}

export function buildSitemap(lastmod = lastModified()) {
  const urls = [SITE_URL, `${SITE_URL}llms.txt`, `${SITE_URL}llms-full.txt`];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(loc => `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`),
    '</urlset>',
    ''
  ].join('\n');
}

export function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`;
}

export function build404() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page not found | Wealth Skills</title>
  <meta name="robots" content="noindex">
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0d14; color: #f3f4f6; display: grid; place-items: center; min-height: 100vh; margin: 0; }
    main { text-align: center; padding: 24px; }
    a { color: #3b82f6; }
  </style>
</head>
<body>
  <main>
    <h1>Page not found</h1>
    <p>This page does not exist. The <a href="${SITE_URL}">Wealth Skills calculators</a> and the <a href="${REPO_URL}">source code</a> do.</p>
  </main>
</body>
</html>
`;
}

export function buildSite(outDir = path.join(root, '_site')) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'src', 'engines'), { recursive: true });

  fs.copyFileSync(path.join(root, 'dashboard.html'), path.join(outDir, 'index.html'));
  for (const file of fs.readdirSync(path.join(root, 'src', 'engines')).filter(f => f.endsWith('.js'))) {
    fs.copyFileSync(path.join(root, 'src', 'engines', file), path.join(outDir, 'src', 'engines', file));
  }
  fs.copyFileSync(path.join(root, 'site', 'og-image.png'), path.join(outDir, 'og-image.png'));
  fs.writeFileSync(path.join(outDir, '404.html'), build404());
  fs.writeFileSync(path.join(outDir, 'robots.txt'), buildRobots());
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), buildSitemap());
  fs.writeFileSync(path.join(outDir, 'llms.txt'), buildLlmsTxt());
  fs.writeFileSync(path.join(outDir, 'llms-full.txt'), buildLlmsFullTxt());
  fs.writeFileSync(path.join(outDir, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);
  // Serve files as they are, without Jekyll processing.
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  return outDir;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = buildSite(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  console.log(`Site assembled in ${path.relative(root, out) || out}`);
}
