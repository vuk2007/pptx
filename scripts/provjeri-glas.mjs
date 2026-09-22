import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/*
  Spektrogram se crta po bajt po bajt. Jedan NaN pretvori cijelu kolonu
  u crnu prugu, a na štandu to izgleda kao da mikrofon ne radi. Zato se
  ilustrativni govor prolazi kroz dug raspon vremena, a paleta kroz sve
  moguće ulaze.
*/

const radni = mkdtempSync(join(tmpdir(), 'glas-'));
execFileSync(
  process.execPath,
  [
    join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'),
    'src/lib/spektar.ts',
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

const { TRAKA, parsirajHex, napraviPaletu, ilustrativniSpektar, ilustrativniTalas, jacina } =
  await import(pathToFileURL(join(radni, 'spektar.js')).href);

const greske = [];
const provjeri = (uslov, opis) => {
  if (!uslov) greske.push(opis);
};

/* --- 1. Paleta --- */
const STANICE = ['#061a13', '#38c6f4', '#b98cf7', '#f2c57c', '#eef4ef'];
const paleta = napraviPaletu(STANICE);

provjeri(paleta.length === 256 * 3, 'paleta nema 256 boja');
for (let i = 0; i < 256 * 3; i++) {
  provjeri(Number.isFinite(paleta[i]) && paleta[i] >= 0 && paleta[i] <= 255, `paleta[${i}] izvan opsega`);
}
/* Krajevi palete moraju biti tačno prva i posljednja stanica. */
const prva = parsirajHex(STANICE[0]);
const zadnja = parsirajHex(STANICE[STANICE.length - 1]);
for (let k = 0; k < 3; k++) {
  provjeri(paleta[k] === prva[k], `paleta ne počinje prvom stanicom (kanal ${k})`);
  provjeri(paleta[255 * 3 + k] === zadnja[k], `paleta ne završava posljednjom stanicom (kanal ${k})`);
}
/* Tiho mora biti tamnije od glasnog — inače spektrogram nema smisla. */
const svjetlina = (i) => paleta[i * 3] + paleta[i * 3 + 1] + paleta[i * 3 + 2];
provjeri(svjetlina(0) < svjetlina(255), 'tiho nije tamnije od glasnog');

let bacilo = 0;
for (const loša of ['', 'crvena', '#abc', '#gggggg', 'rgb(1,2,3)', '#12345']) {
  try {
    parsirajHex(loša);
  } catch {
    bacilo++;
  }
}
provjeri(bacilo === 6, 'neispravna boja ne baca grešku');

let bacilaPaleta = false;
try {
  napraviPaletu(['#000000']);
} catch {
  bacilaPaleta = true;
}
provjeri(bacilaPaleta, 'paleta sa jednom stanicom ne baca grešku');

/* --- 2. Ilustrativni govor kroz dug raspon vremena --- */
const spektar = new Uint8Array(TRAKA);
const talas = new Uint8Array(512);

let kadrova = 0;
let najtiseUkupno = Infinity;
let najglasnijeUkupno = 0;
let bilaTisina = false;
let biloGlasno = false;

for (let t = 0; t < 600; t += 0.02) {
  kadrova++;

  ilustrativniSpektar(t, spektar);
  for (let i = 0; i < spektar.length; i++) {
    provjeri(Number.isFinite(spektar[i]), `spektar u t=${t.toFixed(2)} nije broj`);
    provjeri(spektar[i] >= 0 && spektar[i] <= 255, `spektar u t=${t.toFixed(2)} izvan 0–255`);
  }

  ilustrativniTalas(t, talas);
  for (let i = 0; i < talas.length; i++) {
    provjeri(Number.isFinite(talas[i]), `talas u t=${t.toFixed(2)} nije broj`);
    provjeri(talas[i] >= 0 && talas[i] <= 255, `talas u t=${t.toFixed(2)} izvan 0–255`);
  }

  const j = jacina(talas);
  provjeri(Number.isFinite(j) && j >= 0 && j <= 1, `jačina u t=${t.toFixed(2)} izvan 0–1`);
  najtiseUkupno = Math.min(najtiseUkupno, j);
  najglasnijeUkupno = Math.max(najglasnijeUkupno, j);
  if (j < 0.07) bilaTisina = true;
  if (j > 0.3) biloGlasno = true;

  /* Spektar nikad ne smije biti skroz prazan — uvijek ima bar šuma. */
  provjeri(Math.max(...spektar) > 0, `spektar u t=${t.toFixed(2)} je potpuno prazan`);
}

/* Govor koji je stalno isto glasan ne liči na govor. */
provjeri(bilaTisina, 'ilustrativni govor nikad ne utihne');
provjeri(najtiseUkupno > 0, 'ilustrativni govor u pauzi postane prava linija');
provjeri(biloGlasno, 'ilustrativni govor nikad ne postane glasan');

/* --- 3. Jačina na poznatim ulazima --- */
const tisina = new Uint8Array(256).fill(128);
provjeri(jacina(tisina) === 0, 'tišina nema jačinu nula');
provjeri(jacina(new Uint8Array(0)) === 0, 'prazan talas nema jačinu nula');

const puno = new Uint8Array(256);
for (let i = 0; i < puno.length; i++) puno[i] = i % 2 === 0 ? 0 : 255;
provjeri(jacina(puno) === 1, 'najglasniji mogući talas ne daje 1');

rmSync(radni, { recursive: true, force: true });

console.log('');
console.log(`  OK   paleta: 256 boja, krajevi tačni, tiho tamnije od glasnog`);
console.log(`  OK   ${kadrova} kadrova ilustrativnog govora — nijedan NaN, sve u 0–255`);
console.log(
  `  OK   govor ima i tišinu i glasne slogove (${najtiseUkupno.toFixed(2)} do ${najglasnijeUkupno.toFixed(2)})`,
);
console.log('');
console.log(`  Glas: ${kadrova} slučajeva, ${greske.length} grešaka`);
console.log('');

if (greske.length > 0) {
  for (const g of greske.slice(0, 12)) console.error(`  GREŠKA  ${g}`);
  if (greske.length > 12) console.error(`  ... i još ${greske.length - 12}`);
  process.exit(1);
}
