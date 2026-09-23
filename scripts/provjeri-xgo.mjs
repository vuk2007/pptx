import { prevedi } from './prevedi.mjs';

/*
  Tri stvari se ovdje provjeravaju:

  1. Inverzna kinematika noge. Jedini pošten test je povratni: uzmi tačku,
     izračunaj uglove, pa iz tih uglova vrati stopalo i vidi je li stiglo
     tamo odakle si krenuo. Ako se to poklapa svugdje u dometu, formula radi.

  2. Serijski paket za XGO. Checksum je invertovan najniži bajt zbira —
     pravilo koje je lako pogrešno napisati, pa se provjerava na cijelom
     prostoru vrijednosti.

  3. Put komande: poruka prođe svih pet veza samo kad je paket ispravan;
     pokvaren bit u komandi staje na ESP32-u, a pas ne radi ništa.
*/

const modul = await prevedi(
  ['src/lib/noga.ts', 'src/lib/xgo-paket.ts', 'src/lib/komanda.ts', 'src/lib/format.ts', 'src/config/cinjenice.ts'],
  'xgo-',
);
const noga = await modul.uvezi('src/lib/noga.ts');
const paket = await modul.uvezi('src/lib/xgo-paket.ts');
const komanda = await modul.uvezi('src/lib/komanda.ts');
modul.pocisti();

const greske = [];
let ukupno = 0;
const provjeri = (uslov, opis) => {
  ukupno++;
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

/* --- 1b. poruke noge: broj sa zarezom, greška tačno van dometa --- */
let poruka = 0;
for (let x = -340; x <= 340; x += 20) {
  for (let y = -340; y <= 340; y += 20) {
    const r = noga.inverzno({ x, y });
    const inv = noga.porukaNoge(true, r.uglovi, r.stopalo, r.uDometu);
    provjeri(!!inv.greska === !r.uDometu, `poruka noge za (${x}, ${y}): boja greške ne prati domet`);
    const dir = noga.porukaNoge(false, r.uglovi, noga.direktno(r.uglovi), true);
    provjeri(!dir.greska, 'direktni režim nikad nije greška');
    /* Razlaganje na ekranu (θ1 = φ + α) mora dati isti ugao kao inverzna kinematika. */
    const { pravac, alfa } = noga.razlozenKuk(r.stopalo);
    if (Math.hypot(r.stopalo.x, r.stopalo.y) > 1e-6) {
      provjeri(Math.abs(pravac + alfa - r.uglovi.kuk) < 1e-4, `φ + α ≠ θ1 za (${x}, ${y})`);
    }
    for (const tekst of [inv.sta, inv.zasto, dir.sta, dir.zasto]) {
      provjeri(!/\d\.\d/.test(tekst) && !/-\d/.test(tekst), `decimalna tačka ili crtica umjesto minusa: „${tekst}"`);
    }
    poruka++;
  }
}
provjeri(noga.uDuzinamaBedra(noga.NAJDALJE) === 2, 'domet mora biti tačno 2 a kad su segmenti jednaki');

/* --- 3. put komande --- */
const DT = 1 / 60;
const pusti = (st) => {
  let s = komanda.posalji(st);
  const vidjene = new Set();
  for (let i = 0; i < 60 * 20 && s.ide; i++) {
    const a = komanda.aktivnaVeza(s);
    if (a !== null) vidjene.add(a);
    const p = komanda.porukaKomande(s);
    provjeri(!p.greska, `dok poruka putuje nema greške (veza ${a})`);
    s = komanda.korakKomande(s, DT);
  }
  return { s, vidjene };
};

const ispravno = pusti(komanda.POCETNO_KOMANDA);
provjeri(!ispravno.s.ide, 'poruka mora stići do kraja');
provjeri(komanda.sjeo(ispravno.s) && !komanda.odbacen(ispravno.s), 'ispravan paket: pas mora sjesti');
provjeri(ispravno.vidjene.size === komanda.VEZE.length, `ispravan paket prolazi ${ispravno.vidjene.size} od ${komanda.VEZE.length} veza`);
provjeri(komanda.porukaKomande(ispravno.s).sta.startsWith('Pas je sjeo'), 'poruka kad pas sjedne');

const pokvareno = pusti({ ...komanda.POCETNO_KOMANDA, pokvaren: true });
provjeri(komanda.odbacen(pokvareno.s) && !komanda.sjeo(pokvareno.s), 'pokvaren paket: ESP32 ga mora odbaciti');
provjeri(!pokvareno.vidjene.has(komanda.VEZE.length - 1), 'pokvaren paket ne smije stići do servoa');
provjeri(komanda.porukaKomande(pokvareno.s).greska === true, 'odbačen paket se prikazuje kao greška');
provjeri(!paket.serijskiPaketJeIspravan(komanda.POKVAREN_PAKET), 'pokvaren paket mora pasti na checksumu');
provjeri(paket.serijskiPaketJeIspravan(komanda.PAKET), 'pravi paket mora proći checksum');

/* Pokvaren je tačno jedan bit, i to u bajtu komande. */
const razlika = komanda.PAKET.map((b, i) => b ^ komanda.POKVAREN_PAKET[i]);
provjeri(razlika.filter((r) => r).length === 1 && razlika[komanda.MJESTO_KOMANDE] === 1, 'smetnja mora promijeniti jedan bit komande');
provjeri(komanda.PAKET[komanda.MJESTO_KOMANDE] === paket.BAJTOVI_SJEDI.komanda, 'MJESTO_KOMANDE ne pokazuje na komandu');

/* Tekst na prve tri veze je riječ, slovo po bajt. */
provjeri(String.fromCharCode(...komanda.TEKST) === komanda.RIJEC, 'bajtovi teksta ne daju riječ');
for (const v of komanda.VEZE) {
  if (v.bajtovi) provjeri(v.ispod.length === v.bajtovi.length, `veza „${v.naziv}": natpisa ispod nije koliko bajtova`);
}
provjeri(komanda.VEZE.length === komanda.BLOKOVI.length - 1, 'veza mora biti jedna manje od blokova');

for (const g of greske.slice(0, 8)) console.log(`  PAD  ${g}`);
if (greske.length === 0) {
  console.log(`  OK   ${uDometu} tačaka u dometu — povratak pogađa (najveće odstupanje ${najvecaGreska.toFixed(4)} px)`);
  console.log(`  OK   ${vanDometa} tačaka van dometa — stopalo staje tačno na ivici`);
  console.log(`  OK   ${paketa} serijskih paketa — checksum i okvir tačni, pokvaren bajt uvijek odbačen`);
  console.log(`  OK   ${poruka} poruka noge — zarez, pravi minus, greška tačno van dometa`);
  console.log(`  OK   put komande: ispravan paket stiže do servoa, pokvaren bit staje na ESP32`);
}
console.log(`\n  XGO: ${ukupno} provjera, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
