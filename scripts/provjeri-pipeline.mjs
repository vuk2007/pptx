import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/*
  Raspored pipeline-a se provjerava na mreži mogućih vremena, a ne samo
  na onima koja su danas u konfiguraciji. Ako neko sjutra promijeni neki
  broj u cinjenice.ts, tvrdnja koju demonstracija izgovara mora da ostane
  tačna — inače crtež pokazuje jedno, a rečenica ispod tvrdi drugo.
*/

const radni = mkdtempSync(join(tmpdir(), 'pipeline-'));
execFileSync(
  process.execPath,
  [
    join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'),
    'src/lib/pipeline.ts',
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

const { napraviRaspored, fazaU, porukaPipelinea, ms } = await import(
  pathToFileURL(join(radni, 'lib', 'pipeline.js')).href
);
const { PIPELINE_VREMENA } = await import(
  pathToFileURL(join(radni, 'config', 'cinjenice.js')).href
);

const greske = [];
const provjeri = (uslov, opis) => {
  if (!uslov) greske.push(opis);
};

/** Poređenje u sekundama: ispod milisekunde je isto vrijeme. */
const isto = (a, b) => Math.abs(a - b) < 1e-9;

function provjeriTraku(traka, opis) {
  const glavne = traka.faze.filter((f) => !f.upozadini);

  provjeri(glavne.length > 0, `${opis}: nema nijedne glavne faze`);
  provjeri(isto(glavne[0].pocetak, 0), `${opis}: prva faza ne počinje u nuli`);

  for (const f of traka.faze) {
    provjeri(Number.isFinite(f.pocetak) && Number.isFinite(f.kraj), `${opis}/${f.id}: vrijeme nije broj`);
    provjeri(f.kraj >= f.pocetak, `${opis}/${f.id}: faza se završava prije nego što počne`);
  }

  /* Glavne faze idu jedna za drugom, bez rupe i bez preklapanja. */
  for (let i = 1; i < glavne.length; i++) {
    provjeri(
      isto(glavne[i].pocetak, glavne[i - 1].kraj),
      `${opis}: rupa ili preklapanje između „${glavne[i - 1].naziv}" i „${glavne[i].naziv}"`,
    );
  }

  provjeri(
    isto(traka.prviZvuk, glavne[glavne.length - 1].kraj),
    `${opis}: prvi zvuk ne pada na kraj posljednje faze`,
  );

  /* fazaU mora da pogodi fazu u sredini svake glavne faze. */
  for (const f of glavne) {
    if (f.kraj - f.pocetak < 1e-6) continue;
    const sredina = (f.pocetak + f.kraj) / 2;
    provjeri(fazaU(traka, sredina)?.id === f.id, `${opis}: fazaU promašuje „${f.naziv}"`);
  }
  provjeri(fazaU(traka, -1) === null, `${opis}: fazaU nešto vraća prije nule`);
  provjeri(fazaU(traka, traka.prviZvuk + 1) === null, `${opis}: fazaU nešto vraća poslije kraja`);
}

const vrijednosti = {
  budjenje: [0.05, 0.2, 0.5, 1],
  glasUTekst: [0.1, 0.8, 1.5, 3],
  tekstUGlas: [0.1, 0.5, 1.2, 2],
};
const mozakVrijednosti = [0.1, 0.6, 1.2, 2.4, 4];

let slucajeva = 0;
let saPreklapanjem = 0;

for (const budjenje of vrijednosti.budjenje) {
  for (const glasUTekst of vrijednosti.glasUTekst) {
    for (const tekstUGlas of vrijednosti.tekstUGlas) {
      for (const mozakPrvaRijec of mozakVrijednosti) {
        for (const mozakCijelo of mozakVrijednosti) {
          if (mozakCijelo < mozakPrvaRijec) continue;
          slucajeva++;

          const v = { budjenje, glasUTekst, mozakPrvaRijec, mozakCijelo, tekstUGlas };
          const r = napraviRaspored(v);
          const gdje = `[${budjenje}/${glasUTekst}/${mozakPrvaRijec}/${mozakCijelo}/${tekstUGlas}]`;

          provjeriTraku(r.cekanje, `${gdje} čekanje`);
          provjeriTraku(r.streaming, `${gdje} streaming`);

          /* Isti posao: mozak u obje trake završi u isti čas. */
          provjeri(
            isto(r.cekanje.mozakGotov, r.streaming.mozakGotov),
            `${gdje}: mozak ne završava u isto vrijeme u obje trake`,
          );

          /* Ušteda je tačno ono što mozgu treba od prve rečenice do kraja. */
          provjeri(
            isto(r.ustedjeno, mozakCijelo - mozakPrvaRijec),
            `${gdje}: ušteda ${r.ustedjeno} nije ${mozakCijelo - mozakPrvaRijec}`,
          );

          provjeri(r.streaming.prviZvuk <= r.cekanje.prviZvuk + 1e-9, `${gdje}: streaming progovara kasnije`);
          provjeri(r.ukupno >= r.cekanje.prviZvuk - 1e-9, `${gdje}: osa je kraća od čekanja`);
          provjeri(r.ukupno >= r.streaming.mozakGotov - 1e-9, `${gdje}: osa je kraća od mozga`);

          /*
            Suština streaminga: dok zvučnik govori, mozak još piše.
            Kad prva rečenica nije i cio odgovor, to preklapanje mora postojati.
          */
          /* Poruka prati vrijeme: prije prve riječi streaminga, između, i na kraju. */
          const prije = porukaPipelinea(r, r.streaming.prviZvuk / 2);
          provjeri(!prije.sta.includes('govori') && !prije.sta.includes('ranije'), `${gdje}: prije prve riječi poruka kaže „${prije.sta}"`);
          if (r.ustedjeno > 0.01) {
            const izmedju = porukaPipelinea(r, (r.streaming.prviZvuk + r.cekanje.prviZvuk) / 2);
            provjeri(izmedju.sta.startsWith('Streaming već govori'), `${gdje}: između dvije prve riječi poruka „${izmedju.sta}"`);
          }
          const kraj = porukaPipelinea(r, r.cekanje.prviZvuk);
          provjeri(kraj.sta.includes(ms(r.ustedjeno)), `${gdje}: na kraju poruka ne kaže uštedu ${ms(r.ustedjeno)}`);
          for (const p of [prije, kraj, porukaPipelinea(r, null)]) {
            provjeri(!/\d\.\d/.test(p.sta + p.zasto) && !p.sta.includes('!'), `${gdje}: tačka u broju ili uzvik u poruci`);
          }

          const ostatak = r.streaming.faze.find((f) => f.id === 'mozak-ostatak');
          const govor = r.streaming.faze.find((f) => f.id === 'tekst-u-glas');
          provjeri(isto(ostatak.pocetak, govor.pocetak), `${gdje}: ostatak mozga ne kreće kad i govor`);
          if (mozakCijelo > mozakPrvaRijec) {
            saPreklapanjem++;
            provjeri(ostatak.kraj > ostatak.pocetak, `${gdje}: nema preklapanja iako ga mora biti`);
            provjeri(r.ustedjeno > 0, `${gdje}: streaming ne donosi ništa iako mozak piše dalje`);
          } else {
            provjeri(isto(r.ustedjeno, 0), `${gdje}: ušteda postoji iako je odgovor jedna rečenica`);
          }
        }
      }
    }
  }
}

/* I vrijednosti koje danas stvarno stoje u konfiguraciji. */
const stvarni = napraviRaspored(PIPELINE_VREMENA);
provjeriTraku(stvarni.cekanje, 'konfiguracija/čekanje');
provjeriTraku(stvarni.streaming, 'konfiguracija/streaming');
provjeri(stvarni.ustedjeno > 0, 'konfiguracija: streaming ne donosi nikakvu uštedu');

rmSync(radni, { recursive: true, force: true });

console.log('');
console.log(`  OK   ${slucajeva} rasporeda — faze u nizu, bez rupa i preklapanja`);
console.log(`  OK   ${saPreklapanjem} slučajeva gdje mozak piše dok zvučnik već govori`);
console.log(
  `  OK   ušteda je uvijek tačno vrijeme od prve rečenice do kraja odgovora`,
);
console.log(
  `  OK   konfiguracija: prvi zvuk ${stvarni.streaming.prviZvuk.toFixed(1)} s umjesto ${stvarni.cekanje.prviZvuk.toFixed(1)} s`,
);
console.log('');
console.log(`  Pipeline: ${slucajeva} slučajeva, ${greske.length} grešaka`);
console.log('');

if (greske.length > 0) {
  for (const g of greske.slice(0, 12)) console.error(`  GREŠKA  ${g}`);
  if (greske.length > 12) console.error(`  ... i još ${greske.length - 12}`);
  process.exit(1);
}
