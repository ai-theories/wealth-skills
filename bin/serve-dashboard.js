#!/usr/bin/env node

/**
 * Minimal static server for dashboard.html. Browsers refuse to load ES modules from file://, and
 * the dashboard imports the real engines from src/engines, so it has to be served over HTTP.
 * Only the dashboard and the engine modules are served; nothing else in the repo is exposed.
 */

import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enginesDir = path.join(root, 'src', 'engines') + path.sep;
const dashboardFile = path.join(root, 'dashboard.html');
const port = Number(process.env.PORT) || 4173;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  const filePath = urlPath === '/' ? dashboardFile : path.resolve(root, '.' + urlPath);
  const allowed = filePath === dashboardFile || (filePath.startsWith(enginesDir) && filePath.endsWith('.js'));

  if (!allowed) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(filePath)] });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Wealth Skills dashboard: http://127.0.0.1:${port}/`);
});
