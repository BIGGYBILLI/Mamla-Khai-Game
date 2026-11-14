// Minimal static file server — no dependencies. `npm run dev`
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 5178);
const host = process.env.HOST || '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${host}:${port}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/' || pathname.endsWith('/')) pathname += 'index.html';
    const file = join(root, pathname);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 — not found');
  }
}).listen(port, host, () => {
  console.log(`Mamla Khai → http://${host}:${port}`);
});
