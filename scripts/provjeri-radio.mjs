import { prevedi } from './prevedi.mjs';

/*
  Prijem paketa kroz vrijeme:

  1. Bez smetnji paketi stižu tačno na 40 ms i svi prolaze.
  2. Jedna munja: taj paket je odbačen i NE resetuje failsafe.
  3. Dvije munje na istom bitu: paket prolazi pokvaren i resetuje failsafe,
     jer prijemnik ne može znati da je pokvaren.
  4. Bez signala rover staje tačno kad prođe granica, ni ranije ni kasnije.
*/

const modul = await prevedi(['src/lib/radio.ts', 'src/lib/paket.ts', 'src/config/cinjenice.ts'], 'radio-');
const r = await modul.uvezi('src/lib/radio.ts');
const { FAILSAFE_MS } = await modul.uvezi('src/config/cinjenice.ts');
modul.pocisti();

const greske = [];
let ukupno = 0;
const provjeri = (uslov, opis) => {
  ukupno++;
  if (!uslov) greske.push(opis);
};

/* Ponovljiva „slučajnost". */
function lcg(sjeme) {
  let x = sjeme >>> 0;
  return () => ((x = (1664525 * x + 1013904223) >>> 0) / 2 ** 32);
}

for (const dt of [1000 / 60, 1000 / 30, 7, 33.3]) {
  const nas = lcg(7);
  let st = r.POCETNO_RADIO;
  let najduze = 0;
  const vremena = [];
  for (let i = 0; i < 10000 / dt; i++) {
    st = r.korakRadija(st, dt, nas);
    najduze = Math.max(najduze, r.odPosljednjeg(st));
    for (const p of st.prijemi) if (!vremena.includes(p.t)) vremena.push(p.t);
  }
  const razmaci = vremena.slice(1).map((t, i) => t - vremena[i]);
  provjeri(razmaci.every((d) => d === r.RAZMAK_MS), `dt ${dt.toFixed(1)}: razmak između paketa nije uvijek ${r.RAZMAK_MS} ms`);
  provjeri(st.brojac.odbacen === 0 && st.brojac.pokvarenProsao === 0, `dt ${dt.toFixed(1)}: bez smetnji nešto nije prošlo`);
  provjeri(najduze < r.RAZMAK_MS + dt + 1e-6, `dt ${dt.toFixed(1)}: bez smetnji failsafe je izbrojao ${najduze.toFixed(1)} ms`);
  provjeri(!r.roverStao(st), `dt ${dt.toFixed(1)}: rover ne smije stati dok signal radi`);
}

/* 2 i 3: munje, stotinu puta za svaku vrstu. */
for (const dvije of [false, true]) {
  const nas = lcg(dvije ? 99 : 42);
  for (let pokusaj = 0; pokusaj < 200; pokusaj++) {
    let st = r.POCETNO_RADIO;
    for (let i = 0; i < 20; i++) st = r.korakRadija(st, 10, nas);
    const prije = st.posljednjiIspravan;
    st = r.udariMunjom(st, dvije);
    const brojPrije = st.prijemi.length;
    while (st.prijemi.length === brojPrije || st.prijemi.at(-1).t <= prije) st = r.korakRadija(st, 10, nas);
    const pogodjen = st.prijemi.at(-1);
    provjeri(pogodjen.udar !== null, 'munja mora pogoditi sljedeći paket');
    if (dvije) {
      provjeri(pogodjen.ishod === 'pokvarenProsao', 'dvije munje na istom bitu moraju proći XOR');
      provjeri(st.posljednjiIspravan === pogodjen.t, 'pokvaren paket koji prođe provjeru resetuje failsafe');
      provjeri(pogodjen.udar.bajtovi.length === 2, 'dvije munje su dva bajta');
    } else {
      provjeri(pogodjen.ishod === 'odbacen', 'jedna munja mora biti uhvaćena');
      provjeri(st.posljednjiIspravan === prije, 'odbačen paket ne smije resetovati failsafe');
    }
    provjeri(st.prikazan === pogodjen, 'tabela mora pokazati pogođen paket');
    const drzi = st;
    let s2 = drzi;
    for (let i = 0; i < 20; i++) s2 = r.korakRadija(s2, 10, nas);
    provjeri(s2.prikazan === pogodjen, 'tabela drži pogođen paket da se stigne pročitati');
    provjeri(st.munja === 'nema', 'munja se troši na jednom paketu');
  }
}

/* 4: prekid signala. */
for (const dt of [1000 / 60, 5]) {
  const nas = lcg(3);
  let st = r.POCETNO_RADIO;
  for (let i = 0; i < 50; i++) st = r.korakRadija(st, dt, nas);
  st = r.postaviSignal(st, false);
  const posljednji = st.posljednjiIspravan;
  let stao = null;
  while (st.t < posljednji + FAILSAFE_MS + 200) {
    st = r.korakRadija(st, dt, nas);
    if (stao === null && r.roverStao(st)) stao = st.t;
    provjeri(st.prijemi.every((p) => p.t <= posljednji), 'bez signala ne smije stići paket');
  }
  provjeri(stao !== null && stao - posljednji >= FAILSAFE_MS && stao - posljednji < FAILSAFE_MS + dt + 1e-6,
    `dt ${dt.toFixed(1)}: rover stao ${stao === null ? 'nikad' : `${(stao - posljednji).toFixed(1)} ms`} poslije posljednjeg paketa, granica ${FAILSAFE_MS} ms`);

  st = r.postaviSignal(st, true);
  for (let i = 0; i < Math.ceil(r.RAZMAK_MS / dt) + 1; i++) st = r.korakRadija(st, dt, nas);
  provjeri(!r.roverStao(st), 'kad se signal vrati, prvi ispravan paket pokreće rover');
  provjeri(st.prijemi.at(-1).t % r.RAZMAK_MS === 0, 'poslije prekida paketi idu u istom ritmu');
}

for (const g of greske.slice(0, 20)) console.log(`  PAD  ${g}`);
if (!greske.length) {
  console.log(`  OK   paketi na tačno ${r.RAZMAK_MS} ms, za četiri različita koraka animacije`);
  console.log('  OK   jedna munja uvijek odbačena, dvije uvijek prođu, failsafe to prati');
  console.log(`  OK   bez signala rover staje tačno poslije ${FAILSAFE_MS} ms`);
}
console.log(`\n  Radio: ${ukupno} provjera, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
