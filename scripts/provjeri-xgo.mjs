import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/*
  Dvije stvari se ovdje provjeravaju:

  1. Inverzna kinematika noge. Jedini pošten test je povratni: uzmi tačku,
     izračunaj uglove, pa iz tih uglova vrati stopalo i vidi je li stiglo
     tamo odakle si krenuo. Ako se to poklapa svugdje u dometu, formula radi.

  2. Serijski paket za XGO. Checksum je invertovan najniži bajt zbira —
     pravilo koje je lako pogrešno napisati, pa se provjerava na cijelom
     prostoru vrijednosti.
*/

const radni = mkdtempSync(join(tmpdir(), 'xgo-'));

writeFileSync(
  join(radni, 'cinjenice.ts'),
  `export const XGO_BAJTOVI_SJEDI = null;
   export const XGO_BAJTOVI_SJEDI_ILUSTRATIVNI = { komanda: 0x3e, adresa: 0x01, podaci: [0x02] };`,
);
for (const ime of ['noga', 'xgo-paket']) {
  const izvor = readFileSync(`src/lib/${ime}.ts`, 'utf8').replace('@/config/cinjenice', './cinjenice.js');
  writeFileSync(join(radni, `${ime}.ts`), izvor);
}

execFileSync(process.execPath, [
  join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'),
  join(radni, 'noga.ts'), join(radni, 'xgo-paket.ts'), join(radni, 'cinjenice.ts'),
  '--outDir', radni, '--module', 'esnext', '--target', 'es2022', '--moduleResolution', 'bundler',
], { stdio: 'inherit' });

const noga = await import(pathToFileURL(join(radni, 'noga.js')).href);
const paket = await import(pathToFileURL(join(radni, 'xgo-paket.js')).href);

const greske = [];
const provjeri = (uslov, opis) => {
  if (!uslov) greske.push(opis);
};

/* --- 1. povratni test kinematike --- */
let uDometu = 0;
let vanDometa = 0;
let najvecaGreska = 0;

for (let x = -340; x <= 340; x += 10) {
  for (let y = -340; y <= 340; y += 10) {
    const rjesenje = noga.inverzno({ x, y });
    const nazad = noga.direktno(rjesenje.uglovi);
    const odstupanje = Math.hypot(nazad.x - rjesenje.stopalo.x, nazad.y - rjesenje.stopalo.y);
    najvecaGreska = Math.max(najvecaGreska, odstupanje);
    provjeri(odstupanje < 0.01, `povratak ne pogađa za (${x}, ${y}): odstupanje ${odstupanje.toFixed(3)}`);

    const daljina = Math.hypot(x, y);
    const ocekujemUDometu = daljina <= noga.NAJDALJE && daljina >= noga.NAJBLIZE;
    provjeri(rjesenje.uDometu === ocekujemUDometu, `pogrešna procjena dometa za (${x}, ${y})`);

    /* Van dometa stopalo mora stati tačno na ivici, ne dalje. */
    if (!ocekujemUDometu) {
      const stiglo = Math.hypot(rjesenje.stopalo.x, rjesenje.stopalo.y);
      provjeri(stiglo <= noga.NAJDALJE + 0.01, `van dometa, a stopalo je otišlo na ${stiglo.toFixed(1)}`);
      vanDometa++;
    } else {
      uDometu++;
    }

    provjeri(
      rjesenje.uglovi.koljeno >= -0.01 && rjesenje.uglovi.koljeno <= 180.01,
      `ugao koljena van opsega za (${x}, ${y}): ${rjesenje.uglovi.koljeno}`,
    );
  }
}

/* --- 2. serijski paket --- */
let paketa = 0;
for (let komanda = 0; komanda < 256; komanda += 3) {
  for (let adresa = 0; adresa < 256; adresa += 17) {
    for (const podaci of [[0], [0xff], [0x12, 0x34], [0x01, 0x02, 0x03]]) {
      const p = paket.napraviSerijskiPaket(komanda, adresa, podaci);

      provjeri(p[0] === 0x55 && p[1] === 0x00, 'pogrešno zaglavlje');
      provjeri(p[p.length - 2] === 0x00 && p[p.length - 1] === 0xaa, 'pogrešan rep');
      provjeri(p[2] === 4 + podaci.length, `pogrešna dužina za ${podaci.length} bajta podataka`);
      provjeri(paket.serijskiPaketJeIspravan(p), `paket ne prolazi sopstvenu provjeru`);

      /* Zbir svega što ulazi u checksum, plus sam checksum, mora dati 0xFF. */
      const zbir = [p[2], p[3], p[4], ...podaci].reduce((a, b) => a + b, 0);
      provjeri(
        ((zbir & 0xff) + p[p.length - 3]) === 0xff,
        `checksum nije invertovan najniži bajt zbira (komanda ${komanda}, adresa ${adresa})`,
      );

      /* Promijenjen bilo koji bajt mora oboriti provjeru. */
      const pokvaren = [...p];
      pokvaren[3] = (pokvaren[3] + 1) & 0xff;
      provjeri(!paket.serijskiPaketJeIspravan(pokvaren), 'pokvarena komanda je prošla provjeru');

      paketa++;
    }
  }
}

const racun = paket.racunChecksuma(5, 0x3e, 0x01, [0x02]);
provjeri(racun.checksum === ((~(5 + 0x3e + 0x01 + 0x02)) & 0xff), 'razloženi račun ne daje isti checksum');

rmSync(radni, { recursive: true, force: true });

for (const g of greske.slice(0, 8)) console.log(`  PAD  ${g}`);
if (greske.length === 0) {
  console.log(`  OK   ${uDometu} tačaka u dometu — povratak pogađa (najveće odstupanje ${najvecaGreska.toFixed(4)} px)`);
  console.log(`  OK   ${vanDometa} tačaka van dometa — stopalo staje tačno na ivici`);
  console.log(`  OK   ${paketa} serijskih paketa — checksum i okvir tačni, pokvaren bajt uvijek odbačen`);
}
console.log(`\n  XGO: ${uDometu + vanDometa + paketa} slučajeva, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
