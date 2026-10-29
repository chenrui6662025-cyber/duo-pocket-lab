import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const production = process.argv[2] === 'dist';
const root = resolve(production ? 'dist' : '.');
const port = Number(process.env.PORT || 4173);
const base = process.env.APP_BASE || '/duo-pocket-lab/';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/') { res.writeHead(302, { Location: base }); res.end(); return; }
    if (pathname === base.slice(0, -1)) { res.writeHead(301, { Location: base }); res.end(); return; }
    if (!pathname.startsWith(base)) throw new Error('Not found');
    let relative = pathname.slice(base.length) || 'index.html';
    if (!production && !relative.startsWith('src/') && relative !== 'index.html') relative = `public/${relative}`;
    const file = resolve(root, relative);
    if (!file.startsWith(root + sep) || !(await stat(file)).isFile()) throw new Error('Not found');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Pocket Lab → http://localhost:${port}${base}`));
