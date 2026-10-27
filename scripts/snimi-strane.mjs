import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pokreniChrome, otvoriKarticu, uStranici, cekaj } from './cdp.mjs';

/*
  Snima izvezene strane u zadatoj rezoluciji, da se dizajn gleda onako
  kako ga vidi TV na štandu, a ne u prozoru laptopa.

  Upotreba: node scripts/snimi-strane.mjs [izlazni-folder] [širina] [visina]
*/

const IZLAZ = process.argv[2] ?? 'snimci';
const SIRINA = Number(process.argv[3] ?? 1920);
const VISINA = Number(process.argv[4] ?? 1080);
const PORT = 4179;
const OSNOVA = `http://localhost:${PORT}`;

const RUTE = [
  ['/sajam/', 'ulaz'],
  ['/sajam/robotika/', 'robotika'],
  ['/sajam/simulator/', 'simulator'],
  ['/sajam/izlog/', 'izlog'],
  ['/sajam/perjanik/', 'perjanik'],
  ['/sajam/xgo/', 'xgo'],
  ['/sajam/jarvis/', 'jarvis'],
  ['/sajam/pocni/', 'pocni'],
  ['/sajam/perjanik/h-most/', 'demo-h-most'],
  ['/sajam/perjanik/pwm/', 'demo-pwm'],
  ['/sajam/perjanik/radio/', 'demo-radio'],
  ['/sajam/perjanik/suspenzija/', 'demo-suspenzija'],
  ['/sajam/perjanik/servo/', 'demo-servo'],
  ['/sajam/xgo/ravnoteza/', 'demo-ravnoteza'],
  ['/sajam/xgo/noga/', 'demo-noga'],
  ['/sajam/xgo/komanda/', 'demo-komanda'],
  ['/sajam/jarvis/pipeline/', 'demo-pipeline'],
  ['/sajam/jarvis/frekvencije/', 'demo-frekvencije'],
  ['/sajam/jarvis/glas/', 'demo-glas'],
];

/* Slajdovi izloga koje snimamo pojedinačno, po rednom broju u punom izlogu. */
const SLAJDOVI = [0, 1, 4, 7, 8, 10, 13, 14, 16, 18, 19, 20];

mkdirSync(IZLAZ, { recursive: true });

const server = spawn(process.execPath, ['scripts/serve.mjs', String(PORT)], { stdio: 'ignore' });
const chrome = await pokreniChrome({ sirina: SIRINA, visina: VISINA });
const kartica = await otvoriKarticu(chrome.port);

try {
  await kartica.posalji('Page.enable');
  await kartica.posalji('Emulation.setDeviceMetricsOverride', {
    width: SIRINA,
    height: VISINA,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (const [ruta, ime] of RUTE) {
    await otvori(ruta);
    await snimi(`${IZLAZ}/${ime}.png`);
    console.log(`  ${ime}.png  ←  ${ruta}`);
  }

  /* Izlog: prelazak kroz slajdove strelicom, pa snimak svakog zanimljivog. */
  await otvori('/sajam/izlog/');
  let trenutni = 0;
  for (const cilj of SLAJDOVI) {
    while (trenutni < cilj) {
      await kartica.posalji('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', windowsVirtualKeyCode: 39 });
      await kartica.posalji('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', windowsVirtualKeyCode: 39 });
      trenutni++;
      await cekaj(90);
    }
    await cekaj(420);
    const ime = await uStranici(kartica, `document.querySelector('p')?.textContent?.slice(0, 26) ?? ''`);
    await snimi(`${IZLAZ}/slajd-${String(cilj).padStart(2, '0')}.png`);
    console.log(`  slajd-${String(cilj).padStart(2, '0')}.png  ←  "${ime}…"`);
  }

  /* Panel bilježaka, otvoren tasterom N. */
  await kartica.posalji('Input.dispatchKeyEvent', { type: 'keyDown', key: 'n', text: 'n', windowsVirtualKeyCode: 78 });
  await kartica.posalji('Input.dispatchKeyEvent', { type: 'keyUp', key: 'n', windowsVirtualKeyCode: 78 });
  await cekaj(400);
  await snimi(`${IZLAZ}/biljeske.png`);
  console.log('  biljeske.png  ←  taster N');
} finally {
  kartica.zatvori();
  chrome.zatvori();
  server.kill();
}

console.log(`\nGotovo: ${IZLAZ} (${SIRINA}x${VISINA})\n`);

async function otvori(ruta) {
  await kartica.posalji('Page.navigate', { url: OSNOVA + ruta });
  await cekaj(700);
  await uStranici(kartica, 'document.fonts.ready.then(() => true)');
  await cekaj(400);
}

async function snimi(putanja) {
  const { data } = await kartica.posalji('Page.captureScreenshot', { format: 'png' });
  writeFileSync(putanja, Buffer.from(data, 'base64'));
}
