import { spawn } from 'node:child_process';
import { pokreniChrome, otvoriKarticu, uStranici, cekaj } from './cdp.mjs';

/*
  Natpis koji izlazi izvan ekrana se na 16:9 ne vidi — a na iPadu, koji je
  bliži kvadratu, isti crtež stane drugačije i tekst se odsiječe. Zato se
  svaka ruta otvori u četiri veličine i izmjeri se svaki natpis: mora da
  stoji unutar ekrana i mora da ima neku veličinu.

  Mjeri se i sadržaj svakog SVG-a naspram njegovog viewBox-a: ono što je
  nacrtano izvan viewBox-a preživi na širokom ekranu, a na uskom ga
  odsiječe ivica ploče.

  Upotreba: node scripts/provjeri-raspored.mjs
*/

const PORT = 4183;
const OSNOVA = `http://localhost:${PORT}`;

const RUTE = [
  '/',
  '/sajam/',
  '/sajam/robotika/',
  '/sajam/simulator/',
  '/sajam/izlog/',
  '/sajam/izlog/jarvis/',
  '/sajam/izlog/xgo/',
  '/sajam/izlog/perjanik/',
  '/sajam/perjanik/',
  '/sajam/perjanik/h-most/',
  /* Režim L298N dodaje cijeli panel na stranu; mora stati i on. */
  {
    ruta: '/sajam/perjanik/h-most/',
    stanje: 'L298N',
    pripremi: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
      return true;
    })()`,
  },
  '/sajam/perjanik/pwm/',
  '/sajam/perjanik/radio/',
  '/sajam/perjanik/suspenzija/',
  '/sajam/perjanik/servo/',
  '/sajam/xgo/',
  '/sajam/xgo/ravnoteza/',
  '/sajam/xgo/noga/',
  '/sajam/xgo/komanda/',
  '/sajam/jarvis/',
  '/sajam/jarvis/glas/',
  '/sajam/jarvis/pipeline/',
  '/sajam/jarvis/frekvencije/',
  '/sajam/pocni/',

  /*
    Faks se skroluje, pa se tamo mjeri samo širina: ništa ne smije da viri
    lijevo ili desno, a ispod donje ivice ekrana sadržaj sme da se nastavi.
  */
  { ruta: '/faks/', skrol: true },
  { ruta: '/faks/oe1/', skrol: true },
  ...[
    'gustine-naboja',
    'q-i-izvod-integral',
    'smjer-struje-elektroni',
    'prizma-gustina-struje',
    'kontinuitet-q-noter-zunaj',
    'predznaci-5-koraka',
    'kirchhoff-cvor',
    'coulomb-sila',
    'polje-tackastih-naboja',
    'probni-naboj-mali',
    'prsten-polje-na-osi',
  ].flatMap((slug) => [
    { ruta: `/faks/oe1/${slug}/`, skrol: true },
    /* Otključano i sa otkrivenim odgovorom: tada je strana najduža i najšira. */
    {
      ruta: `/faks/oe1/${slug}/`,
      skrol: true,
      stanje: 'otkriveno',
      pripremi: `(() => {
        document.querySelector('[aria-label="Tvoje predviđanje"] button')?.click();
        return new Promise((r) => setTimeout(() => {
          [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Otkrij odgovor'))?.click();
          r(true);
        }, 100));
      })()`,
    },
  ]),
];

const VELICINE = [
  { naziv: 'TV 1080p', sirina: 1920, visina: 1080 },
  { naziv: 'TV 4K', sirina: 3840, visina: 2160 },
  { naziv: 'iPad 11"', sirina: 1180, visina: 820 },
  { naziv: 'iPad 9,7"', sirina: 1024, visina: 768 },
  /* Telefon je meta samo za faks; štand nema telefon. */
  { naziv: 'Telefon', sirina: 390, visina: 844, mobilni: true, samoSkrol: true },
];

/* Koliko piksela smije da viri preko ivice prije nego što se broji kao greška. */
const DOZVOLJENO = 2;

const mjera = (skrol) => `(() => {
  const dozvoljeno = ${DOZVOLJENO};
  const skrol = ${skrol};
  const s = window.innerWidth;
  const v = window.innerHeight;
  const problemi = [];

  /* Providno ili sakriveno se ne crta, pa ga ivica ploče ne može odsjeći. */
  const nevidljiv = (el) => {
    for (let c = el; c && c !== document.documentElement; c = c.parentElement) {
      const st = getComputedStyle(c);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return true;
    }
    return false;
  };

  const opis = (el) => {
    const tekst = (el.textContent ?? '').trim().replace(/\\s+/g, ' ').slice(0, 42);
    return tekst || '<' + el.tagName.toLowerCase() + '>';
  };

  /* 1. Svaki natpis mora cio da stane na ekran. */
  for (const el of document.querySelectorAll('svg text, h1, h2, h3, p, span, a, button')) {
    if (el.closest('[hidden]')) continue;
    if (nevidljiv(el)) continue;
    if (!(el.textContent ?? '').trim()) continue;
    /* Namjerno sakriven naslov za čitače ekrana stoji izvan ekrana. */
    if (el.classList.contains('samo-za-citace') || el.closest('.samo-za-citace')) continue;
    /* KaTeX uz vidljivu formulu nosi i MathML za čitače, sakriven izrezivanjem. */
    if (el.closest('.katex-mathml')) continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;

    const vertikalno = skrol ? false : r.top < -dozvoljeno || r.bottom > v + dozvoljeno;
    if (r.left < -dozvoljeno || r.right > s + dozvoljeno || vertikalno) {
      problemi.push({
        vrsta: 'izvan ekrana',
        sta: opis(el),
        gdje: 'l=' + Math.round(r.left) + ' t=' + Math.round(r.top) + ' d=' + Math.round(r.right) + ' b=' + Math.round(r.bottom),
      });
    }
  }

  /*
    2. Sadržaj SVG-a mora da stane u svoj viewBox, inače ga uska ploča
    odsiječe. getBBox() vraća koordinate u prostoru samog elementa, prije
    transformacija roditelja, pa se okvir mora prevesti u koordinate korijena.
  */
  for (const svg of document.querySelectorAll('svg[viewBox]')) {
    /* KaTeX crta korijen i razlomačke crte namjerno šire od viewBox-a (preserveAspectRatio slice). */
    if (svg.closest('.katex')) continue;
    const [vx, vy, vs, vv] = svg.getAttribute('viewBox').trim().split(/[ ,]+/).map(Number);
    /* Da se provjera ne bi tiho preskočila ako viewBox ikad bude neočitljiv. */
    if (![vx, vy, vs, vv].every(Number.isFinite)) {
      problemi.push({ vrsta: 'neočitljiv viewBox', sta: svg.getAttribute('viewBox'), gdje: '-' });
      continue;
    }
    const korijen = svg.getScreenCTM();
    if (!korijen) continue;
    const uKorijen = korijen.inverse();

    for (const dijete of svg.querySelectorAll('text, rect, circle, polyline, polygon, line, path')) {
      /* Šare i maske u defs-u se ne crtaju tu gdje su definisane. */
      if (dijete.closest('defs, pattern, clipPath, mask, marker, symbol')) continue;
      if (nevidljiv(dijete)) continue;

      let b;
      let m;
      try {
        b = dijete.getBBox();
        m = dijete.getScreenCTM();
      } catch {
        continue;
      }
      if (!m) continue;
      if (b.width === 0 && b.height === 0) continue;

      const puna = uKorijen.multiply(m);
      const tacka = svg.createSVGPoint();
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [dx, dy] of [[0, 0], [b.width, 0], [0, b.height], [b.width, b.height]]) {
        tacka.x = b.x + dx;
        tacka.y = b.y + dy;
        const t = tacka.matrixTransform(puna);
        minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x);
        minY = Math.min(minY, t.y); maxY = Math.max(maxY, t.y);
      }

      if (minX < vx - 6 || minY < vy - 6 || maxX > vx + vs + 6 || maxY > vy + vv + 6) {
        problemi.push({
          vrsta: 'izvan viewBox-a',
          sta: opis(dijete),
          gdje: 'x=' + Math.round(minX) + '..' + Math.round(maxX) + ' y=' + Math.round(minY) + '..' + Math.round(maxY) + ' viewBox=' + vs + 'x' + vv,
        });
      }
    }
  }

  return problemi;
})()`;

const server = spawn(process.execPath, ['scripts/serve.mjs', String(PORT)], { stdio: 'ignore' });
const chrome = await pokreniChrome();
const kartica = await otvoriKarticu(chrome.port);

const greske = [];
let provjereno = 0;

try {
  await kartica.posalji('Page.enable');

  for (const velicina of VELICINE) {
    await kartica.posalji('Emulation.setDeviceMetricsOverride', {
      width: velicina.sirina,
      height: velicina.visina,
      deviceScaleFactor: 1,
      mobile: Boolean(velicina.mobilni),
    });

    let palihUVelicini = 0;
    const rute = RUTE.map((u) => (typeof u === 'string' ? { ruta: u } : u)).filter((u) => !velicina.samoSkrol || u.skrol);

    for (const { ruta, stanje, pripremi, skrol = false } of rute) {
      await kartica.posalji('Page.navigate', { url: OSNOVA + ruta });
      await cekaj(500);
      await uStranici(kartica, 'document.fonts.ready.then(() => true)');
      await cekaj(250);
      if (pripremi) {
        await uStranici(kartica, pripremi);
        await cekaj(400);
      }
      provjereno++;

      const sirovi = await uStranici(kartica, mjera(skrol));
      /* Isti natpis se u istoj ruti zna ponoviti; broji se jednom. */
      const vidjeno = new Set();
      const problemi = sirovi.filter((p) => {
        const kljuc = `${p.vrsta}|${p.sta}|${p.gdje}`;
        if (vidjeno.has(kljuc)) return false;
        vidjeno.add(kljuc);
        return true;
      });
      for (const p of problemi) {
        palihUVelicini++;
        greske.push(`${velicina.naziv}  ${ruta}${stanje ? ` (${stanje})` : ''}  ${p.vrsta}: „${p.sta}"  (${p.gdje})`);
      }
    }

    const oznaka = palihUVelicini === 0 ? 'OK  ' : 'PALO';
    console.log(
      `  ${oznaka} ${velicina.naziv.padEnd(10)} ${velicina.sirina}×${velicina.visina} — ${rute.length} ruta, ${palihUVelicini} problema`,
    );
  }
} finally {
  kartica.zatvori();
  chrome.zatvori();
  server.kill();
}

console.log('');
console.log(`  Raspored: ${provjereno} provjera, ${greske.length} problema`);
console.log('');

if (greske.length > 0) {
  for (const g of greske.slice(0, 30)) console.error(`  GREŠKA  ${g}`);
  if (greske.length > 30) console.error(`  ... i još ${greske.length - 30}`);
  process.exit(1);
}
