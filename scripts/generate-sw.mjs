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

const svi = sviFajlovi(IZLAZ)
  .map((f) => '/' + relative(IZLAZ, f).split(sep).join(posix.sep))
  .filter((u) => u !== '/sw.js')
  .sort();

/*
  Krupni fajlovi se keširaju odvojeno, i to je bitno.

  cache.addAll je sve-ili-ništa: ako jedan fajl padne, cio keš padne. Kad
  bi 3D model od osam megabajta bio u istom spisku, jedan prekid na lošem
  sajamskom wifiju ostavio bi sajt bez ijednog keširanog fajla — dakle bez
  elektronike, zbog helikoptera.

  Zato mali fajlovi idu atomično i prvi, a krupni se dovlače poslije, jedan
  po jedan, i svaki smije da padne za sebe.
*/
const GRANICA_KRUPNOG = 1.5 * 1024 * 1024;

const velicina = (url) => statSync(join(IZLAZ, url.slice(1))).size;
const fajlovi = svi.filter((u) => velicina(u) <= GRANICA_KRUPNOG);
const krupni = svi.filter((u) => velicina(u) > GRANICA_KRUPNOG);

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
const KRUPNI = ${JSON.stringify(krupni, null, 0)};

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

/** Krupno se dovlači tek kad sajt već radi, i svaki fajl smije da padne sam. */
async function dovuciKrupno() {
  const kes = await caches.open(KES);
  for (const url of KRUPNI) {
    if (await kes.match(url)) continue;
    try {
      const odgovor = await fetch(url, { cache: 'no-cache' });
      if (odgovor.ok) await kes.put(url, odgovor);
    } catch (greska) {
      /* Nema mreže ili je pukla usput. Sajt radi i bez ovoga. */
    }
  }
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((imena) => Promise.all(imena.filter((i) => i !== KES).map((i) => caches.delete(i))))
      .then(() => self.clients.claim())
  );
});

/*
  Krupno se NAMJERNO ne dovlači unutar activate.

  Dok waitUntil u activate ne završi, worker stoji u stanju „activating", a
  tada nijedna navigacija nije ni na kom: bez mreže browser pokaže svoju
  stranu o grešci umjesto sajta. Sa šesnaest megabajta modela taj prozor
  traje koliko i preuzimanje — na sajmu i po nekoliko minuta.

  Zato aktivacija ostaje trenutna, a strana porukom traži krupne fajlove
  kad se već učita. waitUntil ovdje samo drži workera u životu dok traje
  preuzimanje.
*/
self.addEventListener('message', (e) => {
  if (e.data === 'dovuci-krupno') e.waitUntil(dovuciKrupno());
});

self.addEventListener('fetch', (e) => {
  const zahtjev = e.request;
  if (zahtjev.method !== 'GET') return;

  const url = new URL(zahtjev.url);
  if (url.origin !== self.location.origin) return;

  /*
    Vercelova analitika. Nema je u izvozu, pa nema šta da se keširа, a
    keširanje njenog odgovora bi samo prljalo keš. Bez mreže poziv padne,
    a sajt to ne osjeti.
  */
  if (url.pathname.startsWith('/_vercel/')) return;

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
const uMB = (niz) => (niz.reduce((z, u) => z + velicina(u), 0) / 1024 / 1024).toFixed(1);
console.log(
  `Service worker: ${fajlovi.length} fajlova odmah (${uMB(fajlovi)} MB), ` +
    `${krupni.length} krupnih naknadno (${uMB(krupni)} MB), verzija ${verzija}`,
);
