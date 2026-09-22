import { readFileSync } from 'node:fs';

/*
  Vercel odbija vercel.json sa bilo kojim ključem koji ne poznaje, i to radi
  prije nego što uopšte pokrene build. Greška se tako vidi tek poslije push-a,
  na tuđoj mašini — zato se spisak dozvoljenih ključeva provjerava ovdje.

  Povod: ključ „//" kao komentar radi u package.json, ali ovdje obara deploy.

  JSON nema komentare, pa objašnjenje zašto je framework isključen stoji u
  README-u, a ne u samom fajlu.
*/

/* Ključevi najvišeg nivoa koje vercel.json priznaje. */
const DOZVOLJENI = new Set([
  '$schema',
  'buildCommand',
  'cleanUrls',
  'crons',
  'devCommand',
  'framework',
  'functions',
  'git',
  'github',
  'headers',
  'ignoreCommand',
  'images',
  'installCommand',
  'outputDirectory',
  'public',
  'redirects',
  'regions',
  'rewrites',
  'routes',
  'trailingSlash',
]);

const greske = [];
const provjeri = (uslov, opis) => {
  if (!uslov) greske.push(opis);
};

let podesavanja;
try {
  podesavanja = JSON.parse(readFileSync('vercel.json', 'utf8'));
} catch (e) {
  console.error(`  GREŠKA  vercel.json nije ispravan JSON: ${e.message}`);
  process.exit(1);
}

for (const kljuc of Object.keys(podesavanja)) {
  provjeri(
    DOZVOLJENI.has(kljuc),
    `nepoznat ključ „${kljuc}" — Vercel odbija cio fajl prije build-a`,
  );
}

/* Ono što Next izvozi i ono što Vercel servira mora biti isti folder. */
const next = readFileSync('next.config.mjs', 'utf8');
const izvozi = /output:\s*'export'/.test(next);
provjeri(izvozi, "next.config.mjs više ne radi output: 'export'");

if (izvozi) {
  provjeri(
    podesavanja.outputDirectory === 'out',
    `outputDirectory je „${podesavanja.outputDirectory}", a statički izvoz ide u „out"`,
  );
  provjeri(
    podesavanja.framework === null,
    'framework mora biti null: sa Next.js presetom Vercel traži routes-manifest.json u izlaznom folderu, a taj fajl živi u .next/',
  );
}

/* Kosa crta na kraju mora da se slaže sa izvozom, inače svaka veza ide kroz preusmjeravanje. */
const kosaCrtaUNextu = /trailingSlash:\s*true/.test(next);
provjeri(
  podesavanja.trailingSlash === kosaCrtaUNextu,
  `trailingSlash: vercel.json kaže ${podesavanja.trailingSlash}, next.config.mjs kaže ${kosaCrtaUNextu}`,
);

if (greske.length > 0) {
  console.error('');
  for (const g of greske) console.error(`  GREŠKA  ${g}`);
  console.error('');
  process.exit(1);
}

console.log('');
console.log(
  `  OK   vercel.json: ${Object.keys(podesavanja).length} ključeva, svi poznati, izlaz „${podesavanja.outputDirectory}" se slaže sa izvozom`,
);
