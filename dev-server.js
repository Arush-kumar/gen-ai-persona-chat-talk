// Local dev server: serves ./public and runs ./api/chat.js at /api/chat,
// mimicking Vercel. Run with: npm run dev
import 'dotenv/config';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

import chatHandler from './api/chat.js';

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = join(process.cwd(), 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // ---- API route ----
  if (url.pathname === '/api/chat') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch {
      req.body = {};
    }

    // minimal Vercel-style res helpers
    res.status = (code) => ((res.statusCode = code), res);
    res.json = (obj) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(obj));
      return res;
    };

    return chatHandler(req, res);
  }

  // ---- static files ----
  let filePath = normalize(url.pathname).replace(/^([.\\/])+/, '');
  if (filePath === '' || filePath === '.') filePath = 'index.html';

  try {
    const data = await readFile(join(PUBLIC_DIR, filePath));
    res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY missing — /api/chat will fail. Add it to .env');
  }
});
