import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/*
  Tabela istinitosti H-mosta se provjerava iscrpno: svih 16 kombinacija
  četiri prekidača, pa svih 8 kombinacija ulaza L298N. Ovo je jedina
  demonstracija gdje pogrešno stanje uči djecu pogrešnu stvar.
*/

const radni = mkdtempSync(join(tmpdir(), 'h-most-'));
const ts = join(radni, 'logika.ts');
execFileSync(process.execPath, [
  join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'),
  'src/lib/h-most.ts',
  '--outDir', radni,
  '--module', 'esnext',
  '--target', 'es2022',
  '--moduleResolution', 'bundler',
], { stdio: 'inherit' });
rmSync(ts, { force: true });

const { rezimZa, prekidaciZaL298N, kratkaNoga, smjerZa, redTabele, TABELA_L298N } =
  await import(pathToFileURL(join(radni, 'h-most.js')).href);

const greske = [];
const provjeri = (uslov, opis) => {
  if (!uslov) greske.push(opis);
};

/* --- svih 16 kombinacija prekidača --- */
const ocekivano = {
  '0000': 'nista', '1000': 'nista', '0100': 'nista', '0010': 'nista', '0001': 'nista',
  '1001': 'naprijed',
  '0110': 'nazad',
  '1100': 'kocenjeGore',
  '0011': 'kocenjeDolje',
  '1010': 'kratakSpoj', '0101': 'kratakSpoj',
  '1110': 'kratakSpoj', '1101': 'kratakSpoj', '1011': 'kratakSpoj', '0111': 'kratakSpoj',
  '1111': 'kratakSpoj',
};

let ukupno = 0;
for (let maska = 0; maska < 16; maska++) {
  const p = {
    s1: Boolean(maska & 8),
    s2: Boolean(maska & 4),
    s3: Boolean(maska & 2),
    s4: Boolean(maska & 1),
  };
  const kljuc = `${+p.s1}${+p.s2}${+p.s3}${+p.s4}`;
  const dobijeno = rezimZa(p);
  provjeri(dobijeno === ocekivano[kljuc], `S1S2S3S4=${kljuc}: očekivano ${ocekivano[kljuc]}, dobijeno ${dobijeno}`);
  ukupno++;
}

/* --- kratak spoj se prepoznaje na tačnoj nozi --- */
provjeri(kratkaNoga({ s1: true, s2: false, s3: true, s4: false }) === 'lijeva', 'S1+S3 mora biti lijeva noga');
provjeri(kratkaNoga({ s1: false, s2: true, s3: false, s4: true }) === 'desna', 'S2+S4 mora biti desna noga');
provjeri(kratkaNoga({ s1: true, s2: false, s3: false, s4: true }) === null, 'S1+S4 nije kratak spoj');

/* --- smjer točka --- */
provjeri(smjerZa('naprijed') === 1, 'naprijed mora biti +1');
provjeri(smjerZa('nazad') === -1, 'nazad mora biti -1');
for (const r of ['nista', 'kocenjeGore', 'kocenjeDolje', 'kratakSpoj']) {
  provjeri(smjerZa(r) === 0, `${r} mora zaustaviti točak`);
}

/* --- L298N: nijedna kombinacija ulaza ne smije napraviti kratak spoj --- */
for (const en of [false, true]) {
  for (const in1 of [false, true]) {
    for (const in2 of [false, true]) {
      const p = prekidaciZaL298N(in1, in2, en);
      provjeri(kratkaNoga(p) === null, `L298N EN=${+en} IN1=${+in1} IN2=${+in2} pravi kratak spoj`);

      const rezim = rezimZa(p);
      const red = redTabele(in1, in2, en);
      const ishod = TABELA_L298N[red].ishod;
      const slaze =
        (ishod === 'naprijed' && rezim === 'naprijed') ||
        (ishod === 'nazad' && rezim === 'nazad') ||
        (ishod === 'kočenje' && (rezim === 'kocenjeGore' || rezim === 'kocenjeDolje')) ||
        (ishod === 'slobodno staje' && rezim === 'nista');
      provjeri(slaze, `L298N EN=${+en} IN1=${+in1} IN2=${+in2}: tabela kaže „${ishod}", logika daje ${rezim}`);
      ukupno++;
    }
  }
}

rmSync(radni, { recursive: true, force: true });

for (const g of greske) console.log(`  PAD  ${g}`);
if (greske.length === 0) {
  console.log(`  OK   svih 16 kombinacija prekidača i svih 8 ulaza L298N daju očekivan režim`);
  console.log(`  OK   nijedna kombinacija ulaza L298N ne pravi kratak spoj`);
}
console.log(`\n  H-most: ${ukupno} stanja provjereno, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
