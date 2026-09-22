import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pokreniChrome, otvoriKarticu, uStranici, cekaj } from './cdp.mjs';

/*
  Snima demonstracije u stvarnim stanjima: klikne prekidače, pomjeri klizač,
  pa uslika. Ovo je jedini način da se vidi da li H-most zaista pokazuje
  kratak spoj, a ne samo da se strana otvorila.

  Upotreba: node scripts/snimi-demo.mjs [izlazni-folder] [širina] [visina]
*/

const IZLAZ = process.argv[2] ?? 'snimci-demo';
const SIRINA = Number(process.argv[3] ?? 1920);
const VISINA = Number(process.argv[4] ?? 1080);
const PORT = 4181;
const OSNOVA = `http://localhost:${PORT}`;

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

  // --- H-most ---
  await otvori('/perjanik/h-most/');
  await snimi('h-most-1-prazno');

  await klikni('Prekidač S1');
  await klikni('Prekidač S4');
  await cekaj(600);
  await snimi('h-most-2-naprijed');

  await klikni('Prekidač S4');
  await klikni('Prekidač S2');
  await cekaj(600);
  await snimi('h-most-3-kocenje');

  await klikni('Prekidač S2');
  await klikni('Prekidač S3'); // S1 je i dalje upaljen -> kratak spoj
  await cekaj(300);
  await snimi('h-most-4-varnica');
  await cekaj(500);
  await snimi('h-most-5-izgorjelo');
  await cekaj(1200); // automatski reset poslije 2 s
  await snimi('h-most-6-poslije-reseta');

  await klikniTekst('Kako to radi L298N');
  await cekaj(500);
  await snimi('h-most-7-l298n');
  await klikni('Ulaz IN2');
  await cekaj(500);
  await snimi('h-most-8-l298n-kocenje');

  // --- PWM ---
  await otvori('/perjanik/pwm/');
  await cekaj(800);
  await snimi('pwm-1-pocetno');

  await postaviKlizac('Duty', 95);
  await cekaj(350); // šiljak struje odmah poslije skoka
  await snimi('pwm-2-siljak');
  await cekaj(1600);
  await snimi('pwm-3-ustalilo');

  await postaviKlizac('Duty', 20);
  await cekaj(1500);
  await klikniTekst('Rampa');
  await postaviKlizac('Duty', 95);
  await cekaj(450);
  await snimi('pwm-4-sa-rampom');

  // --- Radio paket ---
  await otvori('/perjanik/radio/');
  await cekaj(600);
  await snimi('radio-1-u-letu');

  await udriMunjom('ne slaže');
  await snimi('radio-2-odbacen');

  await klikniTekst('Dvije munje na istom bitu');
  await udriMunjom('XOR ovo ne vidi');
  await snimi('radio-3-prosao-pokvaren');

  await klikniTekst('Resetuj');
  await cekaj(400);
  await klikniTekst('Prekini signal');
  await cekaj(260);
  await snimi('radio-4-tajmer');
  await cekaj(900);
  await snimi('radio-5-rover-stao');

  // --- Suspenzija ---
  await otvori('/perjanik/suspenzija/');
  await cekaj(500);
  await snimi('suspenzija-1-kamen');
  await postaviKlizacTastaturom('Položaj kamena', 'ArrowLeft', 13);
  await cekaj(500);
  await snimi('suspenzija-2-zadnji-tocak');
  await klikniTekst('Bez suspenzije');
  await cekaj(600);
  await snimi('suspenzija-3-kruto');

  // --- Dvostruki servo ---
  await otvori('/perjanik/servo/');
  await cekaj(500);
  await postaviKlizac('Ugao A', 150);
  await cekaj(900);
  await snimi('servo-1-ispravno');
  await klikniTekst('Greška: B = A');
  await cekaj(700);
  await snimi('servo-2-borba');
  await cekaj(4200);
  await snimi('servo-3-dim');

  // --- XGO: povratna sprega ---
  await otvori('/xgo/ravnoteza/');
  await postaviKlizac('Nagib', 18);
  await cekaj(1600);
  await snimi('ravnoteza-1-drzi-se');

  await postaviKlizac('Pojačanje', 28);
  await postaviKlizac('Nagib', -18);
  await cekaj(900);
  await snimi('ravnoteza-2-oscilira');

  await klikniTekst('Resetuj');
  await cekaj(400);
  await klikniTekst('Povratna sprega');
  await postaviKlizac('Nagib', 24);
  await cekaj(1200);
  await snimi('ravnoteza-3-pao');

  // --- XGO: noga ---
  await otvori('/xgo/noga/');
  await cekaj(400);
  await snimi('noga-1-inverzno');
  await postaviKlizacTastaturom('Položaj stopala', 'ArrowRight', 16);
  await cekaj(400);
  await snimi('noga-2-van-dometa');
  await klikniTekst('Direktno');
  await cekaj(300);
  await postaviKlizac('Koljeno', 70);
  await cekaj(400);
  await snimi('noga-3-direktno');

  // --- XGO: put komande ---
  await otvori('/xgo/komanda/');
  await cekaj(400);
  await snimi('komanda-1-mirno');
  await klikniTekst('Pošalji');
  await cekaj(2600);
  await snimi('komanda-2-serijski');
  await cekaj(2400);
  await snimi('komanda-3-kraj');

  // --- Jarvis: pipeline ---
  await otvori('/jarvis/pipeline/');
  await cekaj(400);
  await snimi('pipeline-1-prije');
  await klikniTekst('Pokreni');
  await cekaj(2600);
  await snimi('pipeline-2-streaming-govori');
  await cekaj(2600);
  await snimi('pipeline-3-kraj');

  // --- Jarvis: frekvencije ---
  await otvori('/jarvis/frekvencije/');
  await cekaj(600);
  await snimi('frekvencije-1-u-razmjeri');
  await klikniTekst('Zid');
  await cekaj(900);
  await snimi('frekvencije-2-zid');

  // --- Jarvis: glas ---
  await otvori('/jarvis/glas/');
  await cekaj(1400);
  await snimi('glas-1-ilustracija');
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

/** Klikne po sredini elementa nađenog preko aria-label. */
async function klikni(ariaLabel) {
  const okvir = await uStranici(
    kartica,
    `(() => {
       const el = document.querySelector('[aria-label="${ariaLabel}"]');
       if (!el) return null;
       const r = el.getBoundingClientRect();
       return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
     })()`,
  );
  if (!okvir) throw new Error(`Nema elementa sa aria-label "${ariaLabel}"`);
  await klikniNa(okvir.x, okvir.y);
}

/** Klikne dugme po tekstu koji piše na njemu. */
async function klikniTekst(tekst) {
  const okvir = await uStranici(
    kartica,
    `(() => {
       const el = [...document.querySelectorAll('button')].find((b) => b.textContent.includes(${JSON.stringify(tekst)}));
       if (!el) return null;
       const r = el.getBoundingClientRect();
       return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
     })()`,
  );
  if (!okvir) throw new Error(`Nema dugmeta sa tekstom "${tekst}"`);
  await klikniNa(okvir.x, okvir.y);
}

async function klikniNa(x, y) {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await kartica.posalji('Input.dispatchMouseEvent', {
      type,
      x: Math.round(x),
      y: Math.round(y),
      button: 'left',
      clickCount: 1,
    });
  }
  await cekaj(120);
}

/** Postavlja range input tako da React vidi promjenu. */
async function postaviKlizac(ariaLabel, vrijednost) {
  await uStranici(
    kartica,
    `(() => {
       const el = document.querySelector('input[type="range"][aria-label="${ariaLabel}"]');
       if (!el) throw new Error('nema klizača ${ariaLabel}');
       const postavi = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
       postavi.call(el, '${vrijednost}');
       el.dispatchEvent(new Event('input', { bubbles: true }));
       return true;
     })()`,
  );
}

/** Udara munjom dok paket stvarno ne bude pogođen — let traje samo tren. */
async function udriMunjom(ocekivanDio) {
  for (let pokusaj = 0; pokusaj < 14; pokusaj++) {
    await klikniTekst('Munja');
    await cekaj(240);
    const poruka = await uStranici(kartica, `document.querySelector('[role="status"]')?.textContent ?? ''`);
    if (poruka.includes(ocekivanDio)) return;
  }
  throw new Error(`Munja nikad nije pogodila paket (tražio sam „${ocekivanDio}")`);
}

/** Pomjera element sa role="slider" strelicama, onako kako bi ga pomjerila tastatura. */
async function postaviKlizacTastaturom(ariaLabel, taster, koraka) {
  await uStranici(
    kartica,
    `document.querySelector('[aria-label="${ariaLabel}"]').focus()`,
  );
  const kod = taster === 'ArrowLeft' ? 37 : 39;
  for (let i = 0; i < koraka; i++) {
    await kartica.posalji('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: taster, windowsVirtualKeyCode: kod });
    await kartica.posalji('Input.dispatchKeyEvent', { type: 'keyUp', key: taster, windowsVirtualKeyCode: kod });
    await cekaj(60);
  }
}

async function snimi(ime) {
  const { data } = await kartica.posalji('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${IZLAZ}/${ime}.png`, Buffer.from(data, 'base64'));
  const poruka = await uStranici(kartica, `document.querySelector('[role="status"]')?.textContent ?? ''`);
  console.log(`  ${ime}.png  →  "${poruka.slice(0, 62)}"`);
}
