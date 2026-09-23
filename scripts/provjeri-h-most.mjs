import { prevedi } from './prevedi.mjs';

/*
  H-most se provjerava u dva sloja.

  1. Tabela istine, iscrpno: svih 16 kombinacija četiri prekidača, pa svih
     8 kombinacija ulaza L298N. Ovo je demonstracija gdje pogrešno stanje
     uči djecu pogrešnu stvar.

  2. Fizika iz reference: motor se ustali tamo gdje jednačine kažu, šiljak
     struje na startu je napon kroz otpor, kočenje zaustavlja brže od
     slobodnog hoda, zaštita otvara prekidače poslije kratkog spoja, a
     unutar čipa kratak spoj ne nastaje ni u jednoj fazi PWM-a.
*/

const modul = await prevedi(
  ['src/lib/h-most.ts', 'src/lib/motor.ts', 'src/lib/format.ts', 'src/config/cinjenice.ts'],
  'h-most-',
);
const hm = await modul.uvezi('src/lib/h-most.ts');
const motor = await modul.uvezi('src/lib/motor.ts');
const { broj, neprelomno, NBSP } = await modul.uvezi('src/lib/format.ts');
const { MOTOR } = await modul.uvezi('src/config/cinjenice.ts');
modul.pocisti();

const greske = [];
let ukupno = 0;
const provjeri = (uslov, opis) => {
  ukupno++;
  if (!uslov) greske.push(opis);
};
const blizu = (a, b, dozvoljeno) => Math.abs(a - b) <= dozvoljeno;

/* ------------------------------------------------ 1. tabela istine */

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

for (let maska = 0; maska < 16; maska++) {
  const p = { s1: Boolean(maska & 8), s2: Boolean(maska & 4), s3: Boolean(maska & 2), s4: Boolean(maska & 1) };
  const kljuc = `${+p.s1}${+p.s2}${+p.s3}${+p.s4}`;
  const dobijeno = hm.rezimZa(p);
  provjeri(dobijeno === ocekivano[kljuc], `S1S2S3S4=${kljuc}: očekivano ${ocekivano[kljuc]}, dobijeno ${dobijeno}`);
}

provjeri(hm.kratkaNoga({ s1: true, s2: false, s3: true, s4: false }) === 'lijeva', 'S1+S3 mora biti lijeva noga');
provjeri(hm.kratkaNoga({ s1: false, s2: true, s3: false, s4: true }) === 'desna', 'S2+S4 mora biti desna noga');
provjeri(hm.kratkaNoga({ s1: true, s2: false, s3: false, s4: true }) === null, 'S1+S4 nije kratak spoj');

provjeri(hm.smjerZa('naprijed') === 1, 'naprijed mora biti +1');
provjeri(hm.smjerZa('nazad') === -1, 'nazad mora biti -1');
for (const r of ['nista', 'kocenjeGore', 'kocenjeDolje', 'kratakSpoj']) {
  provjeri(hm.smjerZa(r) === 0, `${r} mora zaustaviti točak`);
}

for (const en of [false, true]) {
  for (const in1 of [false, true]) {
    for (const in2 of [false, true]) {
      const p = hm.prekidaciZaL298N(in1, in2, en);
      provjeri(hm.kratkaNoga(p) === null, `L298N EN=${+en} IN1=${+in1} IN2=${+in2} pravi kratak spoj`);
      const rezim = hm.rezimZa(p);
      const { ishod } = hm.TABELA_L298N[hm.redTabele(in1, in2, en)];
      const slaze =
        (ishod === 'naprijed' && rezim === 'naprijed') ||
        (ishod === 'nazad' && rezim === 'nazad') ||
        (ishod === 'kočenje' && (rezim === 'kocenjeGore' || rezim === 'kocenjeDolje')) ||
        (ishod === 'slobodno staje' && rezim === 'nista');
      provjeri(slaze, `L298N EN=${+en} IN1=${+in1} IN2=${+in2}: tabela kaže „${ishod}", logika daje ${rezim}`);
    }
  }
}

/* ------------------------------------------------ 2. fizika */

const DT = 1 / 60;

function vrti(stanje, sekundi, posmatraj) {
  let st = stanje;
  let tr = null;
  const koraka = Math.round(sekundi / DT);
  for (let i = 0; i < koraka; i++) {
    ({ stanje: st, trenutno: tr } = hm.korak(st, DT));
    posmatraj?.(st, tr, i);
  }
  return { st, tr };
}

const zatvori = (st, ...koje) => koje.reduce((s, k) => hm.prebaci(s, k), st);

/* Ustaljena brzina iz jednačina se slaže sa brojem u cinjenice.ts. */
const punaBrzina = motor.ustaljenaBrzina(MOTOR.napajanje);
provjeri(blizu(punaBrzina, MOTOR.bezOpterecenja, 1), `ustaljena brzina ${punaBrzina.toFixed(1)} o/min, u cinjenice.ts piše ${MOTOR.bezOpterecenja}`);

/* Naprijed: šiljak na startu je napon kroz otpor, pa struja samo pada. */
{
  let prva = null;
  let prethodna = Infinity;
  let rastePoslije = false;
  const { st } = vrti(zatvori(hm.POCETNO, 's1', 's4'), 12, (s, _tr, i) => {
    if (i === 0) prva = s.struja;
    if (s.struja > prethodna + 1e-9) rastePoslije = true;
    prethodna = s.struja;
  });
  provjeri(blizu(prva, MOTOR.napajanje / MOTOR.otpor, 1e-9), `šiljak na startu ${prva} A, očekivano ${(MOTOR.napajanje / MOTOR.otpor).toFixed(3)} A`);
  provjeri(!rastePoslije, 'struja pri zaletu mora samo da pada');
  provjeri(blizu(st.brzina, punaBrzina, 0.5), `naprijed se ustali na ${st.brzina.toFixed(1)}, očekivano ${punaBrzina.toFixed(1)}`);
  provjeri(blizu(st.struja, (MOTOR.trenje * st.brzina) / MOTOR.pojacanje, 0.01), 'ustaljena struja mora taman savladati trenje');

  /* Slobodan hod naspram kočenja, iz iste brzine. */
  const doNule = (pocetno) => {
    let t = null;
    vrti(pocetno, 30, (s, _tr, i) => {
      if (t === null && s.brzina === 0) t = (i + 1) * DT;
    });
    return t;
  };
  const otvoreno = { ...st, prekidaci: hm.SVI_UGASENI };
  const koceno = { ...st, prekidaci: { s1: true, s2: true, s3: false, s4: false } };
  const tSlobodno = doNule(otvoreno);
  const tKocenje = doNule(koceno);
  provjeri(tSlobodno !== null && tKocenje !== null, 'točak se mora zaustaviti i slobodno i kočenjem');
  provjeri(tKocenje < tSlobodno / 2, `kočenje (${tKocenje?.toFixed(2)} s) mora biti mnogo brže od slobodnog hoda (${tSlobodno?.toFixed(2)} s)`);

  const { stanje: prviKocenja } = hm.korak(koceno, DT);
  provjeri(prviKocenja.struja < 0, 'struja kočenja mora ići suprotno od vožnje');

  /* Otvoreno kolo: napon na motoru je kontra-napon, jer motor koji se vrti je generator. */
  const { trenutno: trOtvoreno } = hm.korak(otvoreno, DT);
  provjeri(blizu(trOtvoreno.naponTrenutni, motor.kontraNapon(st.brzina), 1e-9), 'u otvorenom kolu CH1 mora pokazati kontra-napon');
}

/* Nazad je ogledalo naprijed. */
{
  const { st } = vrti(zatvori(hm.POCETNO, 's2', 's3'), 12);
  provjeri(blizu(st.brzina, -punaBrzina, 0.5), `nazad se ustali na ${st.brzina.toFixed(1)}, očekivano ${(-punaBrzina).toFixed(1)}`);
}

/* Kad nema struje, nema pokreta. */
{
  let mice = false;
  vrti(hm.POCETNO, 5, (s, tr) => {
    if (s.brzina !== 0 || tr.strujaTrenutna !== 0) mice = true;
  });
  provjeri(!mice, 'bez zatvorenog puta ništa ne smije da se pomjeri');
}

/* Kratak spoj: greška traje, pa zaštita otvara baš tu nogu. */
for (const [a, b, noga] of [['s1', 's3', 'lijeva'], ['s2', 's4', 'desna']]) {
  const pocetak = zatvori(hm.POCETNO, a, b);
  provjeri(pocetak.kvar?.noga === noga, `${a}+${b} mora pokrenuti zaštitu na ${noga} nozi`);
  const { st: usred, tr: trUsred } = vrti(pocetak, 1.0);
  provjeri(usred.prekidaci[a] && usred.prekidaci[b] && trUsred.kratak, 'prije isteka zaštite kratak spoj još traje');
  const porukaUsred = hm.porukaZa(usred, trUsred);
  provjeri(porukaUsred.greska && porukaUsred.sta.includes('!'), 'kratak spoj mora biti poruka greške');

  const { st: poslije, tr: trPoslije } = vrti(usred, 0.7);
  provjeri(!poslije.prekidaci[a] && !poslije.prekidaci[b] && !trPoslije.kratak, `zaštita mora otvoriti ${a} i ${b}`);
  provjeri(hm.porukaZa(poslije, trPoslije).sta.startsWith('Zaštita'), 'poslije zaštite poruka mora to reći');

  const { st: kasnije, tr: trKasnije } = vrti(poslije, hm.TRAJANJE_ZASTITE + 0.1);
  provjeri(!hm.porukaZa(kasnije, trKasnije).sta.startsWith('Zaštita'), 'poruka o zaštiti mora nestati');
}

/* Čip: kratak spoj ne nastaje ni u jednoj fazi PWM-a, ni za jedan ulaz. */
{
  let kratkih = 0;
  for (const in1 of [false, true]) {
    for (const in2 of [false, true]) {
      for (let posto = 0; posto <= 100; posto += 5) {
        const st = { ...hm.postaviRezim(hm.POCETNO, 'cip'), in1, in2, popuna: posto / 100 };
        vrti(st, 1 / hm.PWM_USPORENO_HZ, (_s, tr) => {
          ukupno++;
          if (tr.kratak) kratkih++;
        });
      }
    }
  }
  provjeri(kratkih === 0, `unutar čipa nastalo ${kratkih} kratkih spojeva`);

  const puno = { ...hm.postaviRezim(hm.POCETNO, 'cip'), popuna: 1 };
  const { st, tr } = vrti(puno, 12);
  const naCipu = motor.ustaljenaBrzina(MOTOR.napajanje - MOTOR.padNaDrajveru);
  provjeri(blizu(st.brzina, naCipu, 0.5), `čip na 100 % se ustali na ${st.brzina.toFixed(1)}, očekivano ${naCipu.toFixed(1)}`);
  provjeri(st.brzina < punaBrzina - 20, 'čip na 100 % mora biti sporiji od direktnih prekidača');
  provjeri(hm.ocitavanjaZa(st, tr).toplota === broj(MOTOR.padNaDrajveru * st.struja, 1), 'toplota u drajveru je pad napona puta struja');

  /* Talasanje struje se u prosjeku poništi: srednja trenutna struja je srednja struja. */
  const pola = { ...hm.postaviRezim(hm.POCETNO, 'cip'), popuna: 0.5 };
  const { st: ustaljeno } = vrti(pola, 12);
  let zbir = 0;
  let n = 0;
  const period = 1 / hm.PWM_USPORENO_HZ;
  vrti(ustaljeno, period * 4, (_s, tr) => {
    zbir += tr.strujaTrenutna;
    n++;
  });
  provjeri(blizu(zbir / n, ustaljeno.struja, 0.04), `srednja trenutna struja ${(zbir / n).toFixed(3)} A, srednja ${ustaljeno.struja.toFixed(3)} A`);

  /* EN = 0 drži sve otvoreno. */
  const nula = { ...hm.postaviRezim(hm.POCETNO, 'cip'), popuna: 0 };
  let zatvorenaSklopka = false;
  vrti(nula, 1, (_s, tr) => {
    if (hm.zatvorenih(tr.sklopke) > 0) zatvorenaSklopka = true;
  });
  provjeri(!zatvorenaSklopka, 'EN = 0 mora držati sve sklopke otvorene');
}

/* ------------------------------------------------ 3. poruke i brojevi */

{
  const stanja = [];
  for (let maska = 0; maska < 16; maska++) {
    const prekidaci = { s1: Boolean(maska & 8), s2: Boolean(maska & 4), s3: Boolean(maska & 2), s4: Boolean(maska & 1) };
    for (const brzina of [0, 40, 150, -150]) {
      stanja.push({ ...hm.POCETNO, prekidaci, brzina, struja: brzina ? 0.5 : 2.4 });
    }
  }
  for (const in1 of [false, true]) {
    for (const in2 of [false, true]) {
      for (const popuna of [0, 0.3, 0.9, 1]) {
        stanja.push({ ...hm.POCETNO, rezim: 'cip', in1, in2, popuna, brzina: 80 });
      }
    }
  }
  stanja.push({ ...hm.POCETNO, t: 1, zastitaDo: 3 });

  for (const st of stanja) {
    const { trenutno } = hm.korak({ ...st, kvar: null }, 0);
    const p = hm.porukaZa(st, trenutno);
    const opis = `${st.rezim} ${JSON.stringify(st.prekidaci)} brzina ${st.brzina}`;
    provjeri(p.sta.length > 0 && p.zasto.length > 0, `${opis}: poruka mora imati obje linije`);
    provjeri(/[.]$/.test(p.sta) && /[.]$/.test(p.zasto), `${opis}: obje linije su rečenice`);
    provjeri(p.greska || !(p.sta + p.zasto).includes('!'), `${opis}: uzvičnik samo kod greške`);
    provjeri(!/\d\.\d/.test(p.sta + p.zasto), `${opis}: decimalna tačka umjesto zareza`);

    const o = hm.ocitavanjaZa(st, trenutno);
    for (const polje of ['napon', 'struja', 'kontraNapon', 'toplota']) {
      provjeri(!o[polje].includes('.') && !o[polje].includes('-'), `${opis}: ${polje} „${o[polje]}" ima tačku ili crticu`);
    }
  }
}

for (const [n, d, ocekujem] of [
  [0, 1, '0,0'],
  [-0.04, 1, '0,0'],
  [-0.05, 1, '−0,1'],
  [-1.5, 1, '−1,5'],
  [2.456, 2, '2,46'],
  [-0.001, 2, '0,00'],
  [11.1, 1, '11,1'],
]) {
  provjeri(broj(n, d) === ocekujem, `broj(${n}, ${d}) daje „${broj(n, d)}", očekivano „${ocekujem}"`);
}

/* Broj i jedinica ostaju u istom redu; riječi koje samo počinju slovom jedinice se ne diraju. */
for (const [ulaz, izlaz] of [
  ['zagrijali su se na 72 °C!', `zagrijali su se na 72${NBSP}°C!`],
  ['dobija 5,5 V.', `dobija 5,5${NBSP}V.`],
  ['B = 180° − A', `B = 180°${NBSP}−${NBSP}A`],
  ['svakih 40 ms i', `svakih 40${NBSP}ms i`],
  ['na 90° se isti', 'na 90° se isti'],
  ['oko 2 Arduina', 'oko 2 Arduina'],
  ['pali 60 % vremena', `pali 60${NBSP}% vremena`],
]) {
  provjeri(neprelomno(ulaz) === izlaz, `neprelomno(„${ulaz}") daje „${neprelomno(ulaz)}"`);
}

for (const g of greske) console.log(`  PAD  ${g}`);
if (greske.length === 0) {
  console.log('  OK   svih 16 kombinacija prekidača i svih 8 ulaza L298N daju očekivan režim');
  console.log(`  OK   motor se ustali na ${broj(punaBrzina, 1)} o/min, šiljak na startu ${broj(MOTOR.napajanje / MOTOR.otpor, 2)} A`);
  console.log('  OK   kočenje brže od slobodnog hoda, zaštita otvara nogu, čip ne pravi kratak spoj');
  console.log('  OK   poruke imaju dvije rečenice, brojevi decimalni zarez i pravi minus');
}
console.log(`\n  H-most: ${ukupno} provjera, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
