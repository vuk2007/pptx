import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/*
  Radio demonstracija tvrdi dvije stvari, i obje moraju biti tačne:
  1. jedna pokvarena bit-pozicija UVIJEK obori XOR provjeru,
  2. ista bit-pozicija pokvarena u dva bajta XOR UVIJEK prođe.

  Druga tvrdnja je cijela poenta („zato postoje jače provjere, kao CRC"),
  pa se ne provjerava na par primjera nego iscrpno.
*/

const radni = mkdtempSync(join(tmpdir(), 'paket-'));

/* Logika uvozi konfiguraciju preko aliasa @/, pa je ovdje zamjenjujemo tankim modulom. */
writeFileSync(
  join(radni, 'cinjenice.ts'),
  `export const PAKET = [
     { naziv: 'START', bajtova: 1, opis: '' },
     { naziv: 'GAS', bajtova: 1, opis: '' },
     { naziv: 'SKRETANJE', bajtova: 1, opis: '' },
     { naziv: 'XOR', bajtova: 1, opis: '' },
   ];
   export const PAKET_JE_ILUSTRATIVAN = true;`,
);

const izvor = execFileSync(process.execPath, ['-e', `
  const fs = require('fs');
  process.stdout.write(fs.readFileSync('src/lib/paket.ts', 'utf8'));
`]).toString();

writeFileSync(join(radni, 'paket.ts'), izvor.replace("@/config/cinjenice", "./cinjenice.js"));

execFileSync(process.execPath, [
  join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'),
  join(radni, 'paket.ts'),
  join(radni, 'cinjenice.ts'),
  '--outDir', radni,
  '--module', 'esnext',
  '--target', 'es2022',
  '--moduleResolution', 'bundler',
], { stdio: 'inherit' });

const { xor, napraviPaket, provjeraProlazi } = await import(pathToFileURL(join(radni, 'paket.js')).href);

const greske = [];
const provjeri = (uslov, opis) => {
  if (!uslov) greske.push(opis);
};

let ispravnih = 0;
let jednaGreska = 0;
let dvijeGreske = 0;

/* Prolazimo kroz cio prostor gasa i skretanja, u koracima. */
for (let gas = 0; gas < 256; gas += 7) {
  for (let skretanje = 0; skretanje < 256; skretanje += 11) {
    const paket = napraviPaket(gas, skretanje);
    provjeri(provjeraProlazi(paket), `čist paket gas=${gas} skretanje=${skretanje} ne prolazi provjeru`);
    ispravnih++;

    /* 1) Jedna greška: bilo koji bit, bilo kojeg bajta podataka — mora pasti. */
    for (let indeks = 0; indeks < paket.length - 1; indeks++) {
      for (let bit = 0; bit < 8; bit++) {
        const pokvaren = [...paket];
        pokvaren[indeks] ^= 1 << bit;
        provjeri(
          !provjeraProlazi(pokvaren),
          `jedna greška (bajt ${indeks}, bit ${bit}) je prošla XOR provjeru`,
        );
        jednaGreska++;
      }
    }

    /* 2) Dvije greške na istoj poziciji bita — moraju proći, i to je problem. */
    for (let a = 0; a < paket.length - 1; a++) {
      for (let b = a + 1; b < paket.length - 1; b++) {
        for (let bit = 0; bit < 8; bit++) {
          const pokvaren = [...paket];
          pokvaren[a] ^= 1 << bit;
          pokvaren[b] ^= 1 << bit;
          provjeri(
            provjeraProlazi(pokvaren),
            `dvije greške na bitu ${bit} (bajtovi ${a} i ${b}) nijesu prošle, a XOR ih ne vidi`,
          );
          provjeri(
            pokvaren[a] !== paket[a] && pokvaren[b] !== paket[b],
            `dvije greške nijesu stvarno promijenile bajtove`,
          );
          dvijeGreske++;
        }
      }
    }
  }
}

provjeri(xor([]) === 0, 'XOR praznog niza mora biti 0');
provjeri(xor([0xff, 0xff]) === 0, 'XOR dva ista bajta mora biti 0');

rmSync(radni, { recursive: true, force: true });

for (const g of greske) console.log(`  PAD  ${g}`);
if (greske.length === 0) {
  console.log(`  OK   ${ispravnih} ispravnih paketa prolazi provjeru`);
  console.log(`  OK   ${jednaGreska} pojedinačnih grešaka — sve odbačene`);
  console.log(`  OK   ${dvijeGreske} dvostrukih grešaka na istom bitu — sve prošle, kako XOR i radi`);
}
console.log(`\n  Paket: ${ispravnih + jednaGreska + dvijeGreske} slučajeva, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
