import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, posix, relative, sep } from 'node:path';

/*
  Pravi out/sw.js sa spiskom SVIH izvezenih fajlova.
  Cilj: poslije prvog učitavanja sajt radi bez mreže, uključujući fontove,
  ikone i RSC pakete koje Next koristi za navigaciju bez osvježavanja.
*/

const IZLAZ = 'out';

function sviFajlovi(dir) {
  const rezultat = [];
  for (const stavka of readdirSync(dir)) {
    const puna = join(dir, stavka);
    if (statSync(puna).isDirectory()) rezultat.push(...sviFajlovi(puna));
    else rezultat.push(puna);
  }
  return rezultat;
}

const fajlovi = sviFajlovi(IZLAZ)
  .map((f) => '/' + relative(IZLAZ, f).split(sep).join(posix.sep))
  .filter((u) => u !== '/sw.js')
  .sort();

// Verzija keša je otisak sadržaja: promijeni se build, promijeni se keš.
const otisak = createHash('sha256');
for (const url of fajlovi) {
  otisak.update(url);
  otisak.update(readFileSync(join(IZLAZ, url.slice(1))));
}
const verzija = otisak.digest('hex').slice(0, 12);

const sw = `/* Generisano sa scripts/generate-sw.mjs. Ne mijenjaj ručno. */
const KES = 'praktikum-${verzija}';
const FAJLOVI = ${JSON.stringify(fajlovi, null, 0)};

/** Zahtjev za /perjanik/ ili /perjanik vodi na /perjanik/index.html u kešu. */
function kljuc(pathname) {
  if (FAJLOVI.includes(pathname)) return pathname;
  if (pathname.endsWith('/')) return pathname + 'index.html';
  if (!pathname.split('/').pop().includes('.')) return pathname + '/index.html';
  return pathname;
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(KES).then((kes) => kes.addAll(FAJLOVI)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((imena) => Promise.all(imena.filter((i) => i !== KES).map((i) => caches.delete(i))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const zahtjev = e.request;
  if (zahtjev.method !== 'GET') return;

  const url = new URL(zahtjev.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(KES).then(async (kes) => {
      const izKesa = await kes.match(kljuc(url.pathname));
      if (izKesa) return izKesa;

      try {
        const sMreze = await fetch(zahtjev);
        if (sMreze.ok && sMreze.type === 'basic') kes.put(zahtjev, sMreze.clone());
        return sMreze;
      } catch (greska) {
        // Nema mreže i nema u kešu: navigaciju vrati na početnu, ostalo padne.
        if (zahtjev.mode === 'navigate') {
          const pocetna = await kes.match('/index.html');
          if (pocetna) return pocetna;
        }
        throw greska;
      }
    })
  );
});
`;

writeFileSync(join(IZLAZ, 'sw.js'), sw, 'utf8');
console.log(`Service worker: ${fajlovi.length} fajlova u kešu, verzija ${verzija}`);
