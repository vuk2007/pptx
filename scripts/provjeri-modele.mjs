import { spawn } from 'node:child_process';
import { pokreniChrome, otvoriKarticu, uStranici, cekaj } from './cdp.mjs';

/*
  Modeli se ne keširaju u activate događaju nego na poruku koju strana
  pošalje kad se učita. Razlog je što bi, dok waitUntil u activate traje,
  worker stajao u stanju „activating", a tada offline navigacija nema ko
  da posluži.

  Cijena tog rješenja je tiha: ako poruka ikad promaši workera, modeli
  nikad ne uđu u keš, simulator bez mreže ne radi — a offline provjera i
  dalje prolazi, jer ona gleda strane, ne modele. To se već jednom desilo:
  poruka je išla na navigator.serviceWorker.controller, koji pri prvoj
  posjeti još nije popunjen, pa ju je optional chaining progutao bez traga.

  Zato ova provjera pita samo jedno: stignu li modeli u keš.

  Upotreba: node scripts/provjeri-modele.mjs
*/

const PORT = 4201;
const MODELI = ['/modeli/ka-50-collective.glb', '/modeli/abris-kontrole.glb', '/modeli/prona-kontroler.glb'];

const server = spawn(process.execPath, ['scripts/serve.mjs', String(PORT)], { stdio: 'ignore' });
const chrome = await pokreniChrome();
const kartica = await otvoriKarticu(chrome.port);

let pao = false;
try {
  await kartica.posalji('Page.enable');
  await kartica.posalji('Page.navigate', { url: `http://localhost:${PORT}/` });
  await cekaj(2000);

  console.log('  kontroler odmah:', await uStranici(kartica, `!!navigator.serviceWorker.controller`));

  /* Čeka se dok sva tri ne uđu, najviše 60 s. */
  let stanje = null;
  for (let i = 0; i < 60; i++) {
    stanje = await uStranici(kartica, `caches.keys().then(async (k) => {
      const c = await caches.open(k[0]);
      const kljucevi = (await c.keys()).map((r) => new URL(r.url).pathname);
      return { ukupno: kljucevi.length, modeli: ${JSON.stringify(MODELI)}.filter((m) => kljucevi.includes(m)) };
    })`);
    if (stanje.modeli.length === MODELI.length) break;
    await cekaj(1000);
  }

  console.log(`  u kešu: ${stanje.ukupno} fajlova, modela ${stanje.modeli.length}/${MODELI.length}`);
  for (const m of MODELI) {
    const ima = stanje.modeli.includes(m);
    if (!ima) pao = true;
    console.log(`  ${ima ? 'OK  ' : 'PALO'} ${m}`);
  }

  /* I da stvarno radi bez mreže. */
  await kartica.posalji('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await kartica.posalji('Page.navigate', { url: `http://localhost:${PORT}/simulator/` });
  await cekaj(1500);
  let spreman = false;
  for (let i = 0; i < 40; i++) {
    spreman = await uStranici(kartica, `document.querySelector('[role="status"]')?.textContent?.includes('Vuci prstom') ?? false`);
    if (spreman) break;
    await cekaj(500);
  }
  if (!spreman) pao = true;
  console.log(`  ${spreman ? 'OK  ' : 'PALO'} model se prikazuje bez mreže`);
} finally {
  kartica.zatvori();
  chrome.zatvori();
  server.kill();
}

console.log('');
console.log(`  Modeli: ${MODELI.length} fajla, ${pao ? 'ima' : 'nema'} problema`);
console.log('');

process.exit(pao ? 1 : 0);
