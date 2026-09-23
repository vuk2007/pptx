import { prevedi } from './prevedi.mjs';

/*
  Dvostruki servo, za svaki ugao A od 0 do 180:

  1. Ispravno (B = 180 − A): osovina stigne na A, struja padne na struju
     mirovanja, temperatura ostane blizu okoline.
  2. Greška (B = A): osovina stane negdje između dvije želje (dvije jednake
     sile u suprotnom smjeru drže je gdje god zatekne), oba servoa guraju
     punom snagom, struja je struja zastoja, temperatura pređe granicu.
     Jedini izuzetak je 90°, gdje se isti ugao slučajno slaže.
  3. Impuls: 1 ms za 0°, 2 ms za 180°, i uvijek u periodi od 20 ms.
*/

const modul = await prevedi(['src/lib/servo.ts', 'src/config/cinjenice.ts'], 'servo-');
const sv = await modul.uvezi('src/lib/servo.ts');
modul.pocisti();

const greske = [];
let ukupno = 0;
const provjeri = (uslov, opis) => {
  ukupno++;
  if (!uslov) greske.push(opis);
};
const DT = 1 / 60;
const vrti = (st, sekundi) => {
  let s = st;
  for (let i = 0; i < Math.round(sekundi / DT); i++) s = sv.korakServa(s, DT);
  return s;
};

for (let a = 0; a <= 180; a += 5) {
  const ispravno = vrti({ ...sv.POCETNO_SERVO, ugaoA: a, osovina: 90 }, 30);
  const u = sv.pogon(ispravno);
  provjeri(Math.abs(ispravno.osovina - a) < 0.5, `ispravno, A=${a}°: osovina na ${ispravno.osovina.toFixed(1)}°`);
  provjeri(sv.strujaServa(u.a) < sv.S.strujaMirovanja + 0.05, `ispravno, A=${a}°: struja nije pala`);
  provjeri(ispravno.temperatura < sv.S.granica, `ispravno, A=${a}°: servo se pregrijao`);
  provjeri(sv.ugaoB(ispravno) === 180 - a, `ispravno, A=${a}°: B nije 180 − A`);

  const borba = vrti({ ...sv.POCETNO_SERVO, ugaoA: a, osovina: a, greska: true }, 30);
  const ub = sv.pogon(borba);
  if (Math.abs(a - 90) >= sv.S.punaSnagaIznad) {
    const z = sv.zelje(borba);
    provjeri(
      borba.osovina > Math.min(z.a, z.b) && borba.osovina < Math.max(z.a, z.b),
      `greška, A=${a}°: osovina nije između želja (${borba.osovina.toFixed(1)}°)`,
    );
    const kasnije = vrti(borba, 5);
    provjeri(Math.abs(kasnije.osovina - borba.osovina) < 1e-9, `greška, A=${a}°: osovina se i dalje pomjera`);
    /* Osovina se ravnoteži približava postepeno, pa je „puna snaga" do na procenat. */
    provjeri(Math.abs(ub.a) > 0.99 && Math.abs(ub.b) > 0.99 && Math.sign(ub.a) === -Math.sign(ub.b), `greška, A=${a}°: servoi ne guraju suprotno punom snagom`);
    provjeri(sv.strujaServa(ub.a) > 0.99 * sv.STRUJA_ZASTOJA, `greška, A=${a}°: struja nije struja zastoja`);
    provjeri(borba.temperatura > sv.S.granica, `greška, A=${a}°: temperatura ${borba.temperatura.toFixed(0)} °C nije prešla granicu`);
  }
  if (a === 90) {
    provjeri(sv.strujaServa(ub.a) < sv.S.strujaMirovanja + 0.05, 'na 90° se isti ugao slaže i nema borbe');
  }

  const w = sv.sirinaImpulsa(a);
  provjeri(w >= 1 && w <= 2 && Math.abs(w - (1 + a / 180)) < 1e-12, `impuls za ${a}° je ${w} ms`);
}

provjeri(sv.sirinaImpulsa(0) === 1 && sv.sirinaImpulsa(180) === 2, 'krajevi impulsa moraju biti 1 i 2 ms');
provjeri(sv.PERIOD_MS === 20, 'period signala servoa je 20 ms');
provjeri(sv.TEMPERATURA_ZASTOJA > sv.S.granica, 'zastoj mora voditi preko granice, inače demonstracija ništa ne pokazuje');

for (const g of greske.slice(0, 20)) console.log(`  PAD  ${g}`);
if (!greske.length) {
  console.log('  OK   37 uglova: ispravno osovina stiže i struja pada; sa greškom osovina stoji, a servoi guraju punom snagom');
  console.log(`  OK   borba: ${sv.STRUJA_ZASTOJA.toFixed(2).replace('.', ',')} A po servou, temperatura ide ka ${Math.round(sv.TEMPERATURA_ZASTOJA)} °C`);
  console.log('  OK   impuls 1 do 2 ms, period 20 ms');
}
console.log(`\n  Servo: ${ukupno} provjera, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
