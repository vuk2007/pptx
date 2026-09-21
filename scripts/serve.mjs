import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

/*
  Mali statički server za out/. Ponaša se kao Vercel za ovaj sajt:
  /perjanik/ servira out/perjanik/index.html.
  Postoji da bi se offline rad mogao stvarno isprobati, bez ijedne zavisnosti.
*/

const KOREN = 'out';
const PORT = Number(process.argv[2] ?? 4173);

const TIPOVI = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function razrijesi(pathname) {
  const cist = normalize(decodeURIComponent(pathname));
  if (cist.split(/[/\\]/).includes('..')) return null; // nikakvo penjanje iznad out/
  const kandidati = cist.endsWith('/')
    ? [join(KOREN, cist, 'index.html')]
    : [join(KOREN, cist), join(KOREN, cist, 'index.html'), join(KOREN, `${cist}.html`)];

  for (const k of kandidati) {
    if (existsSync(k) && statSync(k).isFile()) return k;
  }
  return null;
}

createServer((zahtjev, odgovor) => {
  const { pathname } = new URL(zahtjev.url, 'http://localhost');
  const fajl = razrijesi(pathname);

  if (!fajl) {
    const notFound = join(KOREN, '404.html');
    odgovor.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    if (existsSync(notFound)) return createReadStream(notFound).pipe(odgovor);
    return odgovor.end('404');
  }

  odgovor.writeHead(200, {
    'content-type': TIPOVI[extname(fajl)] ?? 'application/octet-stream',
    // Bez keša u browseru, da se mjeri service worker, a ne browser keš.
    'cache-control': 'no-store',
    'service-worker-allowed': '/',
  });
  createReadStream(fajl).pipe(odgovor);
}).listen(PORT, () => {
  console.log(`Sajt na http://localhost:${PORT}`);
});
