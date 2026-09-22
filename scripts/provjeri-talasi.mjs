import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/*
  Crtež tvrdi da su tri talasa u razmjeri. To se ne provjerava gledanjem
  nego mjerenjem: iz nacrtanih tačaka se izmjeri razmak između brjegova
  i uporedi sa talasnom dužinom koja je tražena. Faktor 2π na pogrešnom
  mjestu bi crtež učinio besmislenim, a oku bi i dalje izgledao uredno.
*/

const radni = mkdtempSync(join(tmpdir(), 'talasi-'));
execFileSync(
  process.execPath,
  [
    join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'),
    'src/lib/talasi.ts',
    'src/config/cinjenice.ts',
    '--outDir',
    radni,
    '--module',
    'esnext',
    '--target',
    'es2022',
    '--moduleResolution',
    'bundler',
  ],
  { stdio: 'inherit' },
);

const { C, talasnaDuzina, duzinaUCm, prolazKrozZid, uzorkujTalas, uTacke } = await import(
  pathToFileURL(join(radni, 'lib', 'talasi.js')).href
);
const { RADIO_VEZE } = await import(pathToFileURL(join(radni, 'config', 'cinjenice.js')).href);

const greske = [];
const provjeri = (uslov, opis) => {
  if (!uslov) greske.push(opis);
};

/* --- 1. λ · f = c, za širok raspon frekvencija --- */
let frekvencija = 0;
for (let mhz = 1; mhz <= 6000; mhz += 1) {
  frekvencija++;
  const lambda = talasnaDuzina(mhz);
  provjeri(Number.isFinite(lambda) && lambda > 0, `${mhz} MHz: besmislena talasna dužina`);
  provjeri(Math.abs(lambda * mhz * 1e6 - C) < 1e-6, `${mhz} MHz: λ·f nije c`);
  provjeri(Math.abs(duzinaUCm(mhz) - lambda * 100) < 1e-9, `${mhz} MHz: centimetri se ne slažu sa metrima`);
  if (mhz > 1) {
    provjeri(talasnaDuzina(mhz) < talasnaDuzina(mhz - 1), `${mhz} MHz: viša frekvencija nije kraći talas`);
  }
}

/* --- 2. Brjegovi u nacrtanom talasu stoje na tačno jednu talasnu dužinu --- */
let talasa = 0;
let izmjerenihBrjegova = 0;
let najgoraGreska = 0;

for (const duzinaPx of [40, 63, 100, 127, 210, 333, 705]) {
  for (const faza of [0, 0.7, 1.9, 3.3, 5.1]) {
    for (const korak of [1, 2, 4]) {
      talasa++;
      const y = 300;
      const amplituda = 46;
      /* Mjeri se razmak brjegova, pa raspon mora da pokrije bar tri talasa. */
      const x1 = 320 + Math.max(1120, duzinaPx * 3.5);
      const tacke = uzorkujTalas({ x0: 320, x1, y, amplituda, duzinaPx, faza, korak });

      provjeri(tacke.length >= 2, `λ=${duzinaPx}px: premalo uzoraka`);
      for (let i = 1; i < tacke.length; i++) {
        provjeri(tacke[i].x > tacke[i - 1].x, `λ=${duzinaPx}px: x nije rastuće`);
      }
      for (const t of tacke) {
        provjeri(
          Math.abs(t.y - y) <= amplituda + 1e-9,
          `λ=${duzinaPx}px: talas izlazi izvan amplitude`,
        );
        provjeri(Number.isFinite(t.y), `λ=${duzinaPx}px: y nije broj`);
      }
      provjeri(Math.abs(tacke[tacke.length - 1].x - x1) < 1e-9, `λ=${duzinaPx}px: talas ne stiže do kraja`);

      /* Lokalni maksimumi: uzorkovanje ih pomjeri najviše za pola koraka. */
      const brjegovi = [];
      for (let i = 1; i < tacke.length - 1; i++) {
        if (tacke[i].y < tacke[i - 1].y && tacke[i].y <= tacke[i + 1].y) brjegovi.push(tacke[i].x);
      }
      provjeri(brjegovi.length >= 2, `λ=${duzinaPx}px: nema dovoljno brjegova za mjerenje`);

      for (let i = 1; i < brjegovi.length; i++) {
        izmjerenihBrjegova++;
        const razmak = brjegovi[i] - brjegovi[i - 1];
        const odstupanje = Math.abs(razmak - duzinaPx);
        najgoraGreska = Math.max(najgoraGreska, odstupanje);
        provjeri(
          odstupanje <= korak,
          `λ=${duzinaPx}px, korak ${korak}: razmak brjegova ${razmak} umjesto ${duzinaPx}`,
        );
      }
    }
  }
}

/* --- 3. Prigušenje usput: talas iza zida ne smije da naraste --- */
{
  const zid = 880;
  const tacke = uzorkujTalas({
    x0: 320,
    x1: 1440,
    y: 300,
    amplituda: (x) => (x < zid ? 46 : 46 * prolazKrozZid(12.1)),
    duzinaPx: 127,
    korak: 2,
  });
  const prije = Math.max(...tacke.filter((t) => t.x < zid).map((t) => Math.abs(t.y - 300)));
  const poslije = Math.max(...tacke.filter((t) => t.x > zid + 127).map((t) => Math.abs(t.y - 300)));
  provjeri(poslije < prije, 'talas iza zida nije slabiji');
}

/* --- 4. Prolaz kroz zid raste sa talasnom dužinom --- */
let prolaza = 0;
for (let cm = 1; cm <= 400; cm += 1) {
  prolaza++;
  const p = prolazKrozZid(cm);
  provjeri(p > 0 && p < 1, `${cm} cm: prolaz izvan opsega 0–1`);
  if (cm > 1) provjeri(p > prolazKrozZid(cm - 1), `${cm} cm: duži talas ne prolazi lakše`);
}

/* --- 5. Tvrdnja koju demonstracija izgovara o baš ovim trima vezama --- */
const veze = [...RADIO_VEZE].map((v) => ({ ...v, cm: duzinaUCm(v.mhz) }));
const poDuzini = [...veze].sort((a, b) => b.cm - a.cm);
provjeri(poDuzini[0].mhz === 433, 'najduži talas nije onaj od 433 MHz');
provjeri(
  poDuzini[poDuzini.length - 1].mhz === 2483,
  'najkraći talas nije onaj od 2483 MHz',
);
for (let i = 1; i < poDuzini.length; i++) {
  provjeri(
    prolazKrozZid(poDuzini[i - 1].cm) > prolazKrozZid(poDuzini[i].cm),
    'poredak prolaza kroz zid ne prati poredak talasnih dužina',
  );
}

const odnos = poDuzini[0].cm / poDuzini[poDuzini.length - 1].cm;
provjeri(odnos > 1, 'odnos najdužeg i najkraćeg talasa nije veći od 1');

/* --- 6. Ispis tačaka ne smije da proizvede NaN --- */
provjeri(
  !uTacke(uzorkujTalas({ x0: 0, x1: 100, y: 50, amplituda: 10, duzinaPx: 25 })).includes('NaN'),
  'ispis tačaka sadrži NaN',
);

let bacilo = false;
try {
  uzorkujTalas({ x0: 0, x1: 10, y: 0, amplituda: 1, duzinaPx: 0 });
} catch {
  bacilo = true;
}
provjeri(bacilo, 'talasna dužina nula ne baca grešku');

rmSync(radni, { recursive: true, force: true });

console.log('');
console.log(`  OK   ${frekvencija} frekvencija — λ·f = c i viša frekvencija je uvijek kraći talas`);
console.log(
  `  OK   ${talasa} nacrtanih talasa, ${izmjerenihBrjegova} izmjerenih razmaka (najveće odstupanje ${najgoraGreska.toFixed(1)} px, unutar koraka uzorkovanja)`,
);
console.log(`  OK   ${prolaza} dužina — duži talas uvijek prolazi kroz zid lakše`);
for (const v of poDuzini) {
  console.log(`       ${String(v.mhz).padStart(4)} MHz → ${v.cm.toFixed(1)} cm`);
}
console.log(
  `  OK   najduži talas je ${odnos.toFixed(1)} puta duži od najkraćeg — to je jedini odnos koji demonstracija tvrdi`,
);
console.log('');
console.log(`  Talasi: ${frekvencija + talasa + prolaza} slučajeva, ${greske.length} grešaka`);
console.log('');

if (greske.length > 0) {
  for (const g of greske.slice(0, 12)) console.error(`  GREŠKA  ${g}`);
  if (greske.length > 12) console.error(`  ... i još ${greske.length - 12}`);
  process.exit(1);
}
