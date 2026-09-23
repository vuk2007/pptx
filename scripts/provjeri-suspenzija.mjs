import { prevedi } from './prevedi.mjs';

/*
  Suspenzija se provjerava na svakom položaju kamena, u koraku od 2 jedinice:

  1. Sa diferencijalom sva četiri točka dodiruju tlo i nijedan ne ulazi u njega.
  2. Tijelo je tačno na prosjeku dvije poluge.
  3. Ugao poluge je onaj koji daje geometrija: sin = razlika visina / razmak točkova.
  4. Bez diferencijala, čim se poluga nagne, jedan točak desne strane visi.
  5. Kamen sa druge strane osovine daje isti ugao sa suprotnim znakom.
*/

const modul = await prevedi(['src/lib/suspenzija.ts'], 'suspenzija-');
const s = await modul.uvezi('src/lib/suspenzija.ts');
modul.pocisti();

const greske = [];
let ukupno = 0;
const provjeri = (uslov, opis) => {
  ukupno++;
  if (!uslov) greske.push(opis);
};

const L = s.GEOMETRIJA.polaPoluge;
const OSOVINA = 500;
let najveciUgao = 0;
let visiKruto = 0;

for (let d = -420; d <= 420; d += 2) {
  const xKamena = OSOVINA + d;
  const mekano = s.rijesi(OSOVINA, xKamena, false);
  const kruto = s.rijesi(OSOVINA, xKamena, true);
  const gdje = `kamen na ${d}`;

  for (const t of mekano.tockovi) {
    provjeri(Math.abs(t.zazor) < 0.25, `${gdje}: ${t.strana} ${t.polozaj} točak nije na tlu (zazor ${t.zazor.toFixed(2)})`);
  }
  provjeri(Math.abs(mekano.tijelo - (mekano.lijeva.ugao + mekano.desna.ugao) / 2) < 1e-12, `${gdje}: tijelo nije na prosjeku poluga`);

  const p = mekano.lijeva;
  const geometrija = Math.asin((p.naprijed.y - p.nazad.y) / (2 * L));
  provjeri(Math.abs(geometrija - p.ugao) < 1e-6, `${gdje}: ugao poluge ne odgovara položaju točkova`);
  najveciUgao = Math.max(najveciUgao, Math.abs(p.ugao));

  for (const t of kruto.tockovi) {
    provjeri(t.zazor > -0.25, `${gdje}: bez diferencijala ${t.strana} ${t.polozaj} točak ulazi u tlo`);
  }
  const desniVise = kruto.tockovi.filter((t) => t.strana === 'desna' && t.zazor > s.PRAG_VISI).length;
  if (Math.abs(kruto.lijeva.ugao) > 0.01) {
    provjeri(desniVise === 1, `${gdje}: bez diferencijala tačno jedan desni točak mora visiti (visi ${desniVise})`);
    visiKruto++;
  } else {
    provjeri(desniVise === 0, `${gdje}: poluga ravna, a desni točak visi`);
  }
  provjeri(kruto.tijelo === kruto.lijeva.ugao, `${gdje}: bez diferencijala tijelo nosi ugao poluge`);

  const ogledalo = s.rijesi(OSOVINA, OSOVINA - d, false);
  provjeri(Math.abs(ogledalo.lijeva.ugao + p.ugao) < 1e-6, `${gdje}: ogledalo ne daje suprotan ugao`);
}

const granica = Math.asin(s.GEOMETRIJA.visinaKamena / (2 * L));
provjeri(najveciUgao <= granica + 1e-6, `najveći ugao ${s.stepeni(najveciUgao).toFixed(2)}° veći od geometrijske granice ${s.stepeni(granica).toFixed(2)}°`);
provjeri(najveciUgao > granica * 0.99, 'kamen mora bar jednom podići samo jedan točak do vrha');
provjeri(visiKruto > 50, 'provjera mora obuhvatiti i nagnute položaje');

const daleko = s.rijesi(OSOVINA, OSOVINA + 2000, false);
provjeri(daleko.lijeva.ugao === 0 && daleko.tijelo === 0, 'bez kamena sve je ravno');

for (const g of greske.slice(0, 20)) console.log(`  PAD  ${g}`);
if (!greske.length) {
  console.log('  OK   421 položaj kamena: sa diferencijalom sva četiri točka na tlu, tijelo na prosjeku');
  console.log(`  OK   bez diferencijala jedan desni točak visi u ${visiKruto} nagnutih položaja`);
  console.log(`  OK   najveći nagib poluge ${s.stepeni(najveciUgao).toFixed(1).replace('.', ',')}°, tačno koliko dozvoljava visina kamena`);
}
console.log(`\n  Suspenzija: ${ukupno} provjera, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
