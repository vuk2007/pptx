import { prevedi } from './prevedi.mjs';

/*
  Povratna sprega na XGO psu:

  1. Sa spregom tijelo uvijek stigne na željeni nagib, za svako pojačanje,
     svaki nagib platforme i svaki željeni nagib (greška u ustaljenom stanju
     je nula, jer se ispravka sabira dok greške ima).
  2. Bez sprege tijelo je nagnuto tačno koliko i platforma, a pas se
     prevrne tačno kad pređe granicu.
  3. Preskok izmjeren u simulaciji odgovara preskoku iz ζ = c / (2√K),
     i raste sa pojačanjem. Tako je broj na ekranu provjeren fizikom.
  4. Isto i sa najvećim korakom koji petlja može dati (50 ms): nema
     numeričke nestabilnosti ni pri najvećem pojačanju.
  5. Poruke: smireno, ispravlja, prevrnuo se; greška samo kad je pao.
*/

const modul = await prevedi(['src/lib/ravnoteza.ts', 'src/lib/format.ts', 'src/lib/h-most.ts', 'src/lib/motor.ts', 'src/config/cinjenice.ts'], 'ravnoteza-');
const rv = await modul.uvezi('src/lib/ravnoteza.ts');
modul.pocisti();

const greske = [];
let ukupno = 0;
const provjeri = (uslov, opis) => {
  ukupno++;
  if (!uslov) greske.push(opis);
};

const vrti = (st, sekundi, dt = 1 / 600, svaki) => {
  let s = st;
  const n = Math.round(sekundi / dt);
  for (let i = 0; i < n; i++) {
    s = rv.korakRavnoteze(s, dt);
    svaki?.(s);
  }
  return s;
};

/* --- 1. ustaljeno stanje sa spregom --- */
for (let K = rv.K_MIN; K <= rv.K_MAX; K++) {
  for (let p = -rv.MAX_NAGIB; p <= rv.MAX_NAGIB; p += 13) {
    for (const r of [-rv.MAX_ZELJENI, 0, rv.MAX_ZELJENI]) {
      const s = vrti({ ...rv.POCETNO_RAVNOTEZA, K, platforma: p, zeljeni: r }, 40, 1 / 240);
      provjeri(Math.abs(rv.greska(s)) < 0.01, `K=${K}, p=${p}°, r=${r}°: greška ostala ${rv.greska(s).toFixed(3)}°`);
      provjeri(rv.smireno(s), `K=${K}, p=${p}°, r=${r}°: tijelo se nije smirilo`);
      provjeri(!rv.pao(s), `K=${K}, p=${p}°: sa spregom pas ne smije pasti`);
      provjeri(rv.porukaRavnoteze(s).sta.startsWith('Tijelo drži'), `K=${K}: smireno, a poruka je „${rv.porukaRavnoteze(s).sta}"`);
    }
  }
}

/* --- 2. bez sprege --- */
for (let p = -rv.MAX_NAGIB; p <= rv.MAX_NAGIB; p += 0.5) {
  const s = vrti({ ...rv.POCETNO_RAVNOTEZA, sprega: false, platforma: p, ispravka: 7, brzina: 3 }, 0.1);
  provjeri(rv.izmjereni(s) === p, `bez sprege, p=${p}°: tijelo nije nagnuto kao platforma`);
  provjeri(rv.pao(s) === Math.abs(p) > rv.UGAO_PADA, `bez sprege, p=${p}°: pad pogrešno procijenjen`);
  provjeri(!!rv.porukaRavnoteze(s).greska === rv.pao(s), `bez sprege, p=${p}°: boja greške ne prati pad`);
}

/* --- 3. preskok iz simulacije i iz formule --- */
let prethodni = -1;
const mjereno = [];
for (let K = rv.K_MIN; K <= rv.K_MAX; K++) {
  const SKOK = 10;
  let vrh = 0;
  vrti({ ...rv.POCETNO_RAVNOTEZA, K, zeljeni: SKOK }, 20, 1 / 2000, (s) => {
    vrh = Math.max(vrh, rv.izmjereni(s));
  });
  const izmjeren = Math.max(0, (vrh - SKOK) / SKOK);
  mjereno.push([K, izmjeren]);
  provjeri(Math.abs(izmjeren - rv.preskok(K)) < 0.005, `K=${K}: preskok ${(izmjeren * 100).toFixed(1)} %, a formula kaže ${(rv.preskok(K) * 100).toFixed(1)} %`);
  provjeri(rv.preskok(K) >= prethodni, `K=${K}: preskok ne raste sa pojačanjem`);
  prethodni = rv.preskok(K);
}
provjeri(rv.preskok(rv.K_MALO - 1) < 0.02, 'ispod K_MALO preskok mora biti skoro nula, inače poruka laže');
provjeri(rv.preskok(rv.K_VELIKO + 1) > 0.25, 'iznad K_VELIKO preskok mora biti velik, inače poruka laže');

/* --- 4. najveći korak petlje --- */
for (const K of [rv.K_MIN, rv.K_POCETNO, rv.K_MAX]) {
  let najvise = 0;
  const s = vrti({ ...rv.POCETNO_RAVNOTEZA, K, platforma: rv.MAX_NAGIB }, 40, 0.05 / 4, (x) => {
    najvise = Math.max(najvise, Math.abs(rv.izmjereni(x)));
  });
  provjeri(Math.abs(rv.greska(s)) < 0.01, `K=${K}, korak 12,5 ms: ne smiruje se`);
  provjeri(najvise <= rv.MAX_NAGIB + 1e-9, `K=${K}: poslije skoka platforme tijelo je otišlo na ${najvise.toFixed(1)}°`);
}

/* --- 5. poruke dok ispravlja --- */
for (const [K, pocetak] of [[2, 'Pojačanje K = 2 je malo'], [10, 'Pojačanje K = 10 ispravi'], [25, 'Pojačanje K = 25 je veliko']]) {
  const s = vrti({ ...rv.POCETNO_RAVNOTEZA, K, platforma: 12 }, 0.05);
  const p = rv.porukaRavnoteze(s);
  provjeri(!rv.smireno(s), `K=${K}: odmah poslije skoka tijelo ne može biti smireno`);
  provjeri(p.zasto.startsWith(pocetak), `K=${K}: poruka „${p.zasto}"`);
  provjeri(!p.greska, `K=${K}: ispravljanje nije greška`);
  provjeri(!/\d\.\d/.test(p.sta + p.zasto) && !/!/.test(p.sta + p.zasto), `K=${K}: decimalna tačka ili uzvik u poruci`);
}
provjeri(Math.abs(rv.zeta(4) - 0.8) < 1e-12, 'ζ = c / (2√K)');

for (const g of greske.slice(0, 20)) console.log(`  PAD  ${g}`);
if (!greske.length) {
  console.log(`  OK   ${rv.K_MAX} pojačanja × 5 nagiba × 3 željena: tijelo uvijek stigne na željeni nagib`);
  console.log(`  OK   bez sprege tijelo prati platformu i pada preko ${rv.UGAO_PADA}°`);
  const opis = mjereno.filter(([K]) => [2, 8, 20, 30].includes(K)).map(([K, v]) => `K=${K}: ${(v * 100).toFixed(1).replace('.', ',')} %`);
  console.log(`  OK   preskok iz simulacije = preskok iz ζ (${opis.join(', ')})`);
}
console.log(`\n  Ravnoteža: ${ukupno} provjera, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
