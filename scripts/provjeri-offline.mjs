import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pokreniChrome, otvoriKarticu, uStranici, cekaj } from './cdp.mjs';

/*
  Pravi test, ne pretpostavka:
  1. digne lokalni server nad out/
  2. učita sajt i sačeka da se service worker aktivira
  3. isključi mrežu na nivou browsera
  4. osvježi početnu i otvori više dubokih ruta
  5. provjeri da je sadržaj stvarno tu i da nema zahtjeva ka spolja
*/

const PORT_SERVERA = 4173;
const OSNOVA = `http://localhost:${PORT_SERVERA}`;
const RUTE = ['/', '/robotika/', '/simulator/', '/izlog/', '/perjanik/', '/perjanik/h-most/', '/xgo/ravnoteza/', '/jarvis/glas/', '/pocni/'];
const SNIMCI = 'C:/Users/Vuk/AppData/Local/Temp/claude/c--Users-Vuk-Desktop-pptx/snimci';

const greske = [];
const uspjesi = [];
const provjeri = (uslov, poruka) => (uslov ? uspjesi.push(poruka) : greske.push(poruka));

const server = spawn(process.execPath, ['scripts/serve.mjs', String(PORT_SERVERA)], { stdio: 'ignore' });
const chrome = await pokreniChrome({ sirina: 1920, visina: 1080 });
const kartica = await otvoriKarticu(chrome.port);

try {
  mkdirSync(SNIMCI, { recursive: true });
  await kartica.posalji('Page.enable');
  await kartica.posalji('Runtime.enable');
  await kartica.posalji('Network.enable');

  const spoljniZahtjevi = [];
  kartica.na('Network.requestWillBeSent', ({ request }) => {
    if (!request.url.startsWith(OSNOVA) && !request.url.startsWith('data:')) spoljniZahtjevi.push(request.url);
  });

  const greskeUKonzoli = [];
  kartica.na('Runtime.consoleAPICalled', ({ type, args }) => {
    if (type === 'error' || type === 'warning') {
      greskeUKonzoli.push(`${type}: ${args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
    }
  });

  // ---- 1. Učitavanje sa mrežom ----
  await kartica.posalji('Page.navigate', { url: OSNOVA + '/' });
  await cekaj(2500);

  const swStanje = await uStranici(
    kartica,
    `navigator.serviceWorker.ready.then(r => r.active ? r.active.state : 'nema')`,
  );
  provjeri(swStanje === 'activated', `Service worker aktiviran (stanje: ${swStanje})`);

  const uKesu = await uStranici(
    kartica,
    `caches.keys()
       .then(k => k.length ? caches.open(k[0]).then(c => c.keys()) : [])
       .then(z => z.length)`,
  );
  provjeri(uKesu > 100, `Prekeširano fajlova: ${uKesu}`);

  await snimi(kartica, `${SNIMCI}/01-online-pocetna.png`);

  // ---- 2. Mreža se gasi ----
  await kartica.posalji('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  });

  // ---- 3. Osvježavanje bez mreže ----
  await kartica.posalji('Page.reload', { ignoreCache: true });
  await cekaj(2000);

  const naslovOffline = await uStranici(kartica, `document.querySelector('h1')?.textContent ?? ''`);
  provjeri(naslovOffline.includes('Praktikum'), `Offline osvježavanje početne daje naslov: "${naslovOffline}"`);

  /*
    document.fonts.check() vraća true i za ime koje ne postoji, pa se ovdje
    traži stvarno učitan font sa tim imenom.
  */
  const fontUcitan = await uStranici(
    kartica,
    `document.fonts.ready.then(() => [...document.fonts].some((f) => f.family.replaceAll('"', '') === 'Archivo' && f.status === 'loaded'))`,
  );
  provjeri(fontUcitan === true, `Font iz keša renderuje offline (Archivo učitan: ${fontUcitan})`);

  await snimi(kartica, `${SNIMCI}/02-offline-pocetna.png`);

  // ---- 4. Duboke rute bez mreže ----
  /* Dijakritika se skuplja kroz sve rute — nijedna strana sama ne nosi sva slova. */
  const nadjenaSlova = new Set();
  for (const ruta of RUTE) {
    await kartica.posalji('Page.navigate', { url: OSNOVA + ruta });
    await cekaj(900);
    const naslov = await uStranici(kartica, `document.querySelector('h1')?.textContent ?? ''`);
    const tekst = await uStranici(kartica, `document.body.innerText.length`);
    provjeri(naslov.length > 0 && tekst > 40, `Offline ruta ${ruta} → h1 "${naslov}"`);

    const slova = await uStranici(
      kartica,
      `[...'čćđšž'].filter((slovo) => document.documentElement.textContent.includes(slovo)).join('')`,
    );
    for (const slovo of slova) nadjenaSlova.add(slovo);
  }

  const sva = [...'čćđšž'];
  const fale = sva.filter((slovo) => !nadjenaSlova.has(slovo));
  provjeri(
    fale.length === 0,
    fale.length === 0
      ? `Sva slova čćđšž renderuju offline kroz ${RUTE.length} ruta`
      : `Nedostaju slova: ${fale.join('')}`,
  );

  // ---- 5. Duboka ruta sa demonstracijom, i dalje bez mreže ----
  await kartica.posalji('Page.navigate', { url: OSNOVA + '/perjanik/h-most/' });
  await cekaj(900);
  await snimi(kartica, `${SNIMCI}/03-offline-duboka-ruta.png`);

  provjeri(spoljniZahtjevi.length === 0, `Zahtjeva ka spolja: ${spoljniZahtjevi.length}${spoljniZahtjevi.length ? ' → ' + spoljniZahtjevi.slice(0, 3).join(', ') : ''}`);
  provjeri(greskeUKonzoli.length === 0, `Grešaka i upozorenja u konzoli: ${greskeUKonzoli.length}${greskeUKonzoli.length ? ' → ' + greskeUKonzoli.slice(0, 3).join(' | ') : ''}`);
} finally {
  kartica.zatvori();
  chrome.zatvori();
  server.kill();
}

console.log('\n  OFFLINE PROVJERA\n');
for (const u of uspjesi) console.log(`  OK   ${u}`);
for (const g of greske) console.log(`  PAD  ${g}`);
console.log(`\n  ${uspjesi.length} prošlo, ${greske.length} palo. Snimci: ${SNIMCI}\n`);
process.exit(greske.length ? 1 : 0);

async function snimi(kartica, putanja) {
  const { data } = await kartica.posalji('Page.captureScreenshot', { format: 'png' });
  writeFileSync(putanja, Buffer.from(data, 'base64'));
}
