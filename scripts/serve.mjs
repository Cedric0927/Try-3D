import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const page = new URL('../index.html', import.meta.url);
createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(readFileSync(page));
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173'));
