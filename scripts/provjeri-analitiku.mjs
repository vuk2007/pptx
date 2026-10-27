import { spawn } from 'node:child_process';
import { pokreniChrome, otvoriKarticu, uStranici, cekaj } from './cdp.mjs';

/*
  Analitika smije da se javi samo na pravoj adresi. Oba slučaja se provjeravaju
  u istom browseru: lokalno mora da ćuti, na lažnom domenu mora da se ubaci.

  Ovo nije sitnica. Da analitika proradi i lokalno, njena skripta bi svuda
  javljala grešku (te putanje nema van Vercela), pa bi provjera koja traži
  nula grešaka u konzoli počela da pada — ili, gore, neko bi je ublažio i
  time oslijepio jedinu provjeru koja čuva pravilo da sajt ništa ne vuče
  sa mreže.

  Lažni domen se dobija preko host-resolver-rules, a siguran kontekst preko
  unsafely-treat-insecure-origin-as-secure — bez ijednog sertifikata.

  Upotreba: node scripts/provjeri-analitiku.mjs
*/

const PORT = 4195;
const LAZNI = `http://praktikum.test:${PORT}`;

const server = spawn(process.execPath, ['scripts/serve.mjs', String(PORT)], { stdio: 'ignore' });

const chrome = await pokreniChrome({
  dodatno: [
    `--host-resolver-rules=MAP praktikum.test 127.0.0.1`,
    `--unsafely-treat-insecure-origin-as-secure=${LAZNI}`,
  ],
});
const kartica = await otvoriKarticu(chrome.port);

const ISPITAJ = `(() => ({
  domacin: location.hostname,
  siguran: window.isSecureContext,
  skripta: !!document.querySelector('script[src*="insights"]'),
}))()`;

let pao = false;
let SLUCAJEVI = [];
try {
  await kartica.posalji('Page.enable');
  /* Analitika živi samo u sajmu. Faks i zajednička početna se ne broje ni na pravoj adresi. */
  SLUCAJEVI = [
    ['lokalno', `http://localhost:${PORT}/sajam/`, false],
    ['sajam', `${LAZNI}/sajam/`, true],
    ['početna', `${LAZNI}/`, false],
    ['faks', `${LAZNI}/faks/`, false],
  ];
  for (const [ime, adresa, ocekujem] of SLUCAJEVI) {
    await kartica.posalji('Page.navigate', { url: adresa });
    await cekaj(1500);
    const r = await uStranici(kartica, ISPITAJ);
    const dobro = r.skripta === ocekujem;
    if (!dobro) pao = true;
    console.log(`  ${dobro ? 'OK  ' : 'PALO'} ${ime.padEnd(13)} domaćin=${r.domacin} siguran=${r.siguran} skripta=${r.skripta} (očekivano ${ocekujem})`);
  }
} finally {
  kartica.zatvori();
  chrome.zatvori();
  server.kill();
}

console.log('');
console.log(`  Analitika: ${SLUCAJEVI.length} slučaja, ${pao ? 'ima' : 'nema'} problema`);
console.log('');

process.exit(pao ? 1 : 0);
