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

async function snimi(ime) {
  const { data } = await kartica.posalji('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${IZLAZ}/${ime}.png`, Buffer.from(data, 'base64'));
  const poruka = await uStranici(kartica, `document.querySelector('[role="status"]')?.textContent ?? ''`);
  console.log(`  ${ime}.png  →  "${poruka.slice(0, 62)}"`);
}
