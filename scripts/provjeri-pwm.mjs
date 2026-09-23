import { prevedi } from './prevedi.mjs';

/*
  PWM se provjerava kroz ono što demonstracija tvrdi:

  1. Isti skok popune bez rampe vuče mnogo veću struju nego sa rampom.
  2. Šiljak bez rampe je napon kroz otpor namotaja, kao u H-mostu.
  3. Motor se ustali na brzini koju daje srednji napon.
  4. Rampa stiže do cilja za onoliko vremena koliko kaže njena brzina.
  5. Poruka o šiljku se pojavljuje samo kad šiljak stvarno postoji.
*/

const modul = await prevedi(
  ['src/lib/pwm.ts', 'src/lib/h-most.ts', 'src/lib/motor.ts', 'src/lib/format.ts', 'src/config/cinjenice.ts'],
  'pwm-',
);
const pwm = await modul.uvezi('src/lib/pwm.ts');
const motor = await modul.uvezi('src/lib/motor.ts');
const { broj } = await modul.uvezi('src/lib/format.ts');
const { MOTOR } = await modul.uvezi('src/config/cinjenice.ts');
modul.pocisti();

const greske = [];
let ukupno = 0;
const provjeri = (uslov, opis) => {
  ukupno++;
  if (!uslov) greske.push(opis);
};
const DT = 1 / 60;

function vrti(st, sekundi, posmatraj) {
  let s = st;
  for (let i = 0; i < Math.round(sekundi / DT); i++) {
    ({ stanje: s } = pwm.korakPwm(s, DT));
    posmatraj?.(s, i);
  }
  return s;
}

/* 1 i 2: skok 0 → 100 % iz mirovanja, bez rampe i sa rampom. */
const bez = vrti(pwm.zadaj(pwm.POCETNO_PWM, 1), 6);
const sa = vrti(pwm.zadaj(pwm.postaviRampu(pwm.POCETNO_PWM, true), 1), 6);
const siljak = pwm.PUN_NAPON / MOTOR.otpor;
provjeri(Math.abs(bez.vrh - siljak) < 1e-9, `šiljak bez rampe ${bez.vrh} A, očekivano ${siljak} A`);
provjeri(bez.vrh > pwm.BLIZU_GRANICE, 'skok na 100 % bez rampe mora doći do granice L298N');
provjeri(sa.vrh < bez.vrh / 2, `rampa mora bar prepoloviti šiljak (bez ${broj(bez.vrh, 2)} A, sa ${broj(sa.vrh, 2)} A)`);
provjeri(sa.vrh < pwm.PRAG_SILJKA, `sa rampom struja mora ostati ispod praga poruke o šiljku (${broj(sa.vrh, 2)} A)`);

/* Poruka o šiljku: postoji bez rampe, ne postoji sa rampom. */
{
  /* Poruka mora ostati dovoljno dugo da se pročita, pa nestati. */
  let prvi = null;
  let posljednji = null;
  vrti(pwm.zadaj(pwm.POCETNO_PWM, 1), 6, (s, i) => {
    if (pwm.porukaPwm(s).sta.startsWith('Šiljak')) {
      prvi ??= i * DT;
      posljednji = i * DT;
    }
  });
  provjeri(prvi !== null && prvi < 0.05, 'bez rampe poruka mora odmah pokazati šiljak');
  provjeri(posljednji !== null && posljednji - prvi > 2, `poruka o šiljku traje samo ${posljednji === null ? 0 : (posljednji - prvi).toFixed(2)} s`);
  provjeri(posljednji !== null && posljednji < pwm.PORUKA_SILJKA_S + 0.1, 'poruka o šiljku mora nestati kad se motor ustali');

  let lazniSiljak = false;
  vrti(pwm.zadaj(pwm.postaviRampu(pwm.POCETNO_PWM, true), 1), 4, (s) => {
    if (pwm.porukaPwm(s).sta.startsWith('Šiljak')) lazniSiljak = true;
  });
  provjeri(!lazniSiljak, 'sa rampom poruka ne smije tvrditi šiljak');
}

/* 3: ustaljena brzina za svaku popunu. */
for (let posto = 10; posto <= 100; posto += 10) {
  const s = vrti(pwm.zadaj(pwm.POCETNO_PWM, posto / 100), 14);
  const cilj = motor.ustaljenaBrzina((posto / 100) * pwm.PUN_NAPON);
  provjeri(Math.abs(s.most.brzina - cilj) < 1, `${posto} %: brzina ${s.most.brzina.toFixed(1)}, očekivano ${cilj.toFixed(1)}`);
}

/* 4: rampa stiže za Δ / brzina rampe. */
{
  let stiglo = null;
  vrti(pwm.zadaj(pwm.postaviRampu(pwm.POCETNO_PWM, true), 0.8), 4, (s, i) => {
    if (stiglo === null && !pwm.rampaRadi(s)) stiglo = (i + 1) * DT;
  });
  const ocekivano = 0.8 / pwm.RAMPA_PO_SEKUNDI;
  provjeri(stiglo !== null && Math.abs(stiglo - ocekivano) < 0.05, `rampa do 80 % traje ${stiglo?.toFixed(2)} s, očekivano ${ocekivano.toFixed(2)} s`);
}

/* 5: poruke su dvije rečenice, sa zarezom u brojevima. */
for (const rampa of [false, true]) {
  for (let posto = 0; posto <= 100; posto += 5) {
    vrti(pwm.zadaj(pwm.postaviRampu(pwm.POCETNO_PWM, rampa), posto / 100), 3, (s, i) => {
      if (i % 20) return;
      const p = pwm.porukaPwm(s);
      const opis = `rampa=${rampa} ${posto} %`;
      provjeri(p.sta.endsWith('.') && p.zasto.endsWith('.'), `${opis}: obje linije su rečenice`);
      provjeri(!(p.sta + p.zasto).includes('!'), `${opis}: bez uzvičnika`);
      provjeri(!/\d\.\d/.test(p.sta + p.zasto), `${opis}: decimalna tačka umjesto zareza`);
    });
  }
}

for (const g of greske) console.log(`  PAD  ${g}`);
if (!greske.length) {
  console.log(`  OK   skok na 100 %: ${broj(bez.vrh, 2)} A bez rampe, ${broj(sa.vrh, 2)} A sa rampom`);
  console.log('  OK   ustaljena brzina prati srednji napon za svaku popunu');
  console.log(`  OK   rampa do 80 % traje ${broj(0.8 / pwm.RAMPA_PO_SEKUNDI, 2)} s`);
}
console.log(`\n  PWM: ${ukupno} provjera, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
