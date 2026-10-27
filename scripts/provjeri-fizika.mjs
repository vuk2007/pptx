import { prevedi } from './prevedi.mjs';

/*
  Fizika iz eksperimenata za faks, odvojena od crtanja.

  Ne provjerava se samo da funkcija vrati očekivan broj, nego i da se
  slaže sa nezavisnim putem do istog rezultata: prizma se poredi sa
  presjekom duži, prebrojani naboji sa formulom ρ·δa·w·δt·cos α, a struja
  van sa promjenom broja naboja unutra, kadar po kadar.

  Upotreba: node scripts/provjeri-fizika.mjs
*/

const prevod = await prevedi(
  ['src/lib/fizika/slucajno.ts', 'src/lib/fizika/prizma.ts'],
  'fizika-',
);
const { slucajno } = await prevod.uvezi('src/lib/fizika/slucajno.ts');
const P = await prevod.uvezi('src/lib/fizika/prizma.ts');
prevod.pocisti();

const greske = [];
let provjera = 0;
function provjeri(uslov, opis) {
  provjera++;
  if (!uslov) greske.push(opis);
}
const blizu = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const STEPEN = Math.PI / 180;

/* ------------------------------------------------------------ §4 prizma */

provjeri(blizu(P.nabojPoFormuli(2, 4, 4, 2, 0), 64), 'ρ·δa·w·δt za α = 0');
provjeri(blizu(P.nabojPoFormuli(2, 4, 4, 2, 60 * STEPEN), 32), 'cos 60° prepolovi naboj');
provjeri(Math.abs(P.nabojPoFormuli(2, 4, 4, 2, 90 * STEPEN)) < 1e-9, 'pri 90° ništa ne prolazi');

function povrsina(v) {
  let s = 0;
  for (let i = 0; i < v.length; i++) {
    const a = v[i];
    const b = v[(i + 1) % v.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/** Da li duž p → q siječe prozorčić (uspravnu duž). Nezavisno od uPrizmi. */
function sijece(p, q, prozor) {
  if ((p.x - prozor.x) * (q.x - prozor.x) > 0) return false;
  if (p.x === q.x) return false;
  const t = (prozor.x - p.x) / (q.x - p.x);
  const y = p.y + t * (q.y - p.y);
  return y >= prozor.y1 && y <= prozor.y2;
}

const PROZOR = { x: 760, y1: 200, y2: 300 };
const h = PROZOR.y2 - PROZOR.y1;
const rnd = slucajno(7);

for (let a = 0; a <= 75; a += 5) {
  const alfa = a * STEPEN;
  for (const L of [12.5, 25, 60, 100, 150, 200]) {
    provjeri(blizu(povrsina(P.vrhoviPrizme(PROZOR, L, alfa)), h * L * Math.cos(alfa), 1e-9), `površina prizme α=${a}° L=${L}`);

    /* Naboj je u prizmi tačno onda kad njegov put za δt presiječe prozorčić. */
    const u = P.smjer(alfa);
    for (let k = 0; k < 300; k++) {
      const p = { x: PROZOR.x - 260 + rnd() * 300, y: PROZOR.y1 - 60 + rnd() * 330 };
      const q = { x: p.x + L * u.x, y: p.y + L * u.y };
      provjeri(P.uPrizmi(p, PROZOR, L, alfa) === sijece(p, q, PROZOR), `uPrizmi i put naboja se ne slažu (α=${a}°, L=${L})`);
    }
  }
}

/*
  Prebrojano naspram formule. Mreža pomjerena za slučajan iznos ima u
  prosjeku tačno gustina × površina naboja u svakom liku, pa prosjek
  preko mnogo pomaka mora pasti na formulu.
*/
for (const rhoCm of [0.5, 1, 2, 3]) {
  const gustina = rhoCm / P.PX_PO_CM ** 2;
  const mreza = P.napraviMrezu(gustina, 1000, 520, slucajno(11));
  provjeri(blizu(mreza.tacke.length / (mreza.perioda.x * mreza.perioda.y), gustina, 1e-9), `gustina mreže ρ=${rhoCm}`);
  for (const [a, L] of [[0, 100], [30, 200], [60, 150], [75, 200]]) {
    const alfa = a * STEPEN;
    let zbir = 0;
    const PUTA = 600;
    const r = slucajno(rhoCm * 100 + a);
    for (let k = 0; k < PUTA; k++) {
      P.pomjeri(mreza, r() * mreza.perioda.x, r() * mreza.perioda.y);
      zbir += P.prebroj(mreza.tacke, PROZOR, L, alfa);
    }
    const ocekivano = gustina * h * L * Math.cos(alfa);
    const prosjek = zbir / PUTA;
    provjeri(Math.abs(prosjek - ocekivano) <= 0.03 * ocekivano + 0.05, `prosjek ${prosjek.toFixed(2)} ≠ formula ${ocekivano.toFixed(2)} (ρ=${rhoCm}, α=${a}°)`);
  }
}

/* ------------------------------------------------------------ izvještaj */

console.log('');
console.log('  OK   §4 prizma: površina, put naboja kroz prozorčić i prosjek naspram ρ·δa·w·δt·cos α');
console.log('');
console.log(`  Fizika: ${provjera} provjera, ${greske.length} grešaka`);
console.log('');

if (greske.length > 0) {
  for (const x of greske.slice(0, 12)) console.error(`  GREŠKA  ${x}`);
  if (greske.length > 12) console.error(`  ... i još ${greske.length - 12}`);
  process.exit(1);
}
