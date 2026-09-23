import { prevedi } from './prevedi.mjs';

/*
  Glas uživo: brojevi na ekranu dolaze iz FFT-a i autokorelacije, pa se
  provjeravaju na signalima čiji se odgovor zna unaprijed.

  1. FFT: čist sinus frekvencije f daje vrh tačno na f, na 0 dB kad je
     amplituda 1, i −6 dB kad je 0,5. Najjača frekvencija se pogađa na
     par herca, i na 44,1 i na 48 kHz.
  2. Logaritamska osa: red i frekvencija su inverzni, osa raste naviše,
     a sinus svijetli baš u redu svoje frekvencije.
  3. Osnovni ton: harmonijski signal od 70 do 450 Hz se pogađa na 0,5 %,
     i kad mu je osnovni harmonik slab (kao u telefonu); tišina i šum
     daju null.
  4. Ilustrativni govor: bez NaN, u opsegu, a izmjereni ton je onaj koji
     je sintetizovan.
  5. Paleta: 256 boja, od tamne ka svijetloj, svjetlina stalno raste.
*/

const modul = await prevedi(['src/lib/spektar.ts'], 'glas-');
const sp = await modul.uvezi('src/lib/spektar.ts');
modul.pocisti();

const greske = [];
let ukupno = 0;
const provjeri = (uslov, opis) => {
  ukupno++;
  if (!uslov) greske.push(opis);
};

const N = sp.FFT;
const db = new Float32Array(N / 2);
const sinus = (f, a, sr, faza = 0.3) => Float32Array.from({ length: N }, (_, i) => a * Math.sin((2 * Math.PI * f * i) / sr + faza));

/* --- 1. FFT --- */
let najgoreHz = 0;
for (const sr of [44100, 48000]) {
  for (let f = sp.F_MIN; f <= sp.F_MAX; f *= 1.07) {
    sp.spektarDb(sinus(f, 1, sr), db);
    const k = Math.round((f * N) / sr);
    const vrh = Math.max(...db);
    provjeri(Math.abs(vrh - db[k]) < 1e-3 || Math.abs(vrh - db[k + 1]) < 1e-3 || Math.abs(vrh - db[k - 1]) < 1e-3, `${sr}, ${f.toFixed(0)} Hz: vrh nije u kanti te frekvencije`);
    provjeri(vrh <= 0.01 && vrh > -1.5, `${sr}, ${f.toFixed(0)} Hz: sinus amplitude 1 daje ${vrh.toFixed(2)} dB`);
    const hz = sp.najjacaHz(db, sr);
    najgoreHz = Math.max(najgoreHz, Math.abs(hz - f));
    provjeri(Math.abs(hz - f) < 0.6 * (sr / N), `${sr}, ${f.toFixed(0)} Hz: najjača frekvencija ${hz.toFixed(1)} Hz`);

    sp.spektarDb(sinus(f, 0.5, sr), db);
    const pola = Math.max(...db);
    sp.spektarDb(sinus(f, 1, sr), db);
    provjeri(Math.abs(Math.max(...db) - pola - 6.02) < 0.05, `${f.toFixed(0)} Hz: pola amplitude nije −6 dB`);
  }
}
sp.spektarDb(new Float32Array(N), db);
provjeri(db.every((v) => Number.isFinite(v)), 'tišina daje NaN ili beskonačnost u spektru');
sp.spektarDb(Float32Array.from({ length: N }, (_, i) => (i === 5 ? NaN : 0)), db);
provjeri(db.every((v) => Number.isFinite(v)), 'NaN u ulazu se prenosi u spektar');

/* --- 2. Logaritamska osa --- */
const REDOVA = 256;
for (let y = 0; y < REDOVA; y++) {
  const f = sp.hzZaRed(y, REDOVA);
  provjeri(Math.abs(sp.redZaHz(f, REDOVA) - y) < 1e-9, `red ${y}: red i frekvencija nisu inverzni`);
  if (y > 0) provjeri(f < sp.hzZaRed(y - 1, REDOVA), `red ${y}: frekvencija ne raste naviše`);
}
provjeri(Math.abs(sp.hzZaRed(-0.5, REDOVA) - sp.F_MAX) < 1e-6 && Math.abs(sp.hzZaRed(REDOVA - 0.5, REDOVA) - sp.F_MIN) < 1e-6, 'ivice ose nisu F_MAX i F_MIN');
/* Oktava je uvijek isti broj redova: to je smisao logaritamske ose. */
const oktava = sp.redZaHz(100, REDOVA) - sp.redZaHz(200, REDOVA);
provjeri(Math.abs(sp.redZaHz(1000, REDOVA) - sp.redZaHz(2000, REDOVA) - oktava) < 1e-9, 'oktava nema isti broj redova svuda');

const redovi = new Uint8Array(REDOVA);
for (const f of [100, 150, 300, 700, 1500, 3000, 6000]) {
  /* Tih sinus (−40 dB), da vrh ne udari u najsvjetliju boju pa se ne vidi gdje je. */
  sp.spektarDb(sinus(f, 0.01, 48000), db);
  sp.uRedove(db, 48000, redovi);
  let y = 0;
  for (let i = 0; i < REDOVA; i++) if (redovi[i] > redovi[y]) y = i;
  /* Dolje je red uži od FFT kante (23 Hz), pa vrh smije stajati bilo gdje unutar pola kante. */
  const blizu = Math.abs(y - sp.redZaHz(f, REDOVA)) <= 1.5 || Math.abs(sp.hzZaRed(y, REDOVA) - f) <= 0.6 * (48000 / N);
  provjeri(blizu, `${f} Hz svijetli u redu ${y} (${sp.hzZaRed(y, REDOVA).toFixed(0)} Hz), a treba ${sp.redZaHz(f, REDOVA).toFixed(1)}`);
  provjeri(redovi.every((v) => v >= 0 && v <= 255 && Number.isInteger(v)), `${f} Hz: red van 0–255`);
}

/* --- 3. Osnovni ton --- */
let tonova = 0;
let najgoriTon = 0;
for (const sr of [44100, 48000]) {
  for (let f0 = 75; f0 <= 440; f0 += 5) {
    for (const slabOsnovni of [false, true]) {
      const s = Float32Array.from({ length: N }, (_, i) => {
        let v = 0;
        for (let k = 1; k * f0 < 4000; k++) v += ((k === 1 && slabOsnovni ? 0.1 : 1) / k) * Math.sin((2 * Math.PI * k * f0 * i) / sr + k);
        return 0.2 * v + 0.01 * Math.sin(i * 12.9898) * Math.cos(i * 4.1);
      });
      const ton = sp.osnovniTon(s, sr);
      tonova++;
      const odstupanje = ton === null ? Infinity : Math.abs(ton - f0) / f0;
      najgoriTon = Math.max(najgoriTon, odstupanje);
      provjeri(odstupanje < 0.005, `${sr}, ${f0} Hz${slabOsnovni ? ' (slab osnovni)' : ''}: ton ${ton === null ? 'nije nađen' : ton.toFixed(1) + ' Hz'}`);
    }
  }
}
provjeri(sp.osnovniTon(new Float32Array(N), 48000) === null, 'tišina ne smije imati ton');
const bijeliSum = Float32Array.from({ length: N }, (_, i) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return 0.3 * ((x - Math.floor(x)) * 2 - 1);
});
provjeri(sp.osnovniTon(bijeliSum, 48000) === null, 'šum ne smije imati ton');
const pomjeren = sinus(100, 1, 48000, 1);
const ok = sp.okidanje(pomjeren, 1000);
provjeri(pomjeren[ok - 1] < 0 && pomjeren[ok] >= 0, 'okidanje nije na prolazu kroz nulu naviše');

/* --- 4. Ilustrativni govor --- */
const g = new Float32Array(N);
let glasnih = 0;
for (let t = 0; t < 120; t += 0.05) {
  sp.sintetizujGovor(t, 48000, g);
  provjeri(g.every((v) => Number.isFinite(v) && Math.abs(v) < 1), `t=${t.toFixed(2)}: ilustracija van opsega ili NaN`);
  sp.spektarDb(g, db);
  provjeri(db.every((v) => Number.isFinite(v)), `t=${t.toFixed(2)}: spektar ilustracije ima NaN`);
  if (sp.slog(t) > 0.4) {
    glasnih++;
    const ton = sp.osnovniTon(g, 48000);
    const f0 = sp.tonIlustracije(t);
    provjeri(ton !== null && Math.abs(ton - f0) / f0 < 0.03, `t=${t.toFixed(2)}: ton ilustracije ${ton?.toFixed(1)} Hz, a sintetizovan je ${f0.toFixed(1)} Hz`);
    provjeri(sp.nivoDbfs(g) > sp.PRAG_GOVORA_DB, `t=${t.toFixed(2)}: glasan slog je ispod praga govora`);
  }
}
provjeri(glasnih > 100, 'ilustracija skoro nikad ne govori');
provjeri(Math.abs(sp.nivoDbfs(sinus(440, 1, 48000)) - -3.01) < 0.05, 'sinus amplitude 1 mora biti −3 dBFS RMS');
provjeri(sp.nivoDbfs(new Float32Array(N)) === -Infinity, 'tišina je −∞ dBFS');

/* --- 5. Paleta --- */
const p = sp.napraviPaletu(sp.MAGMA);
provjeri(p.length === 768, 'paleta mora imati 256 boja');
const svjetlina = (i) => 0.2126 * p[i * 3] + 0.7152 * p[i * 3 + 1] + 0.0722 * p[i * 3 + 2];
for (let i = 1; i < 256; i++) provjeri(svjetlina(i) >= svjetlina(i - 1) - 0.5, `paleta: svjetlina pada na ${i}`);
provjeri(svjetlina(0) < 5 && svjetlina(255) > 240, 'paleta mora ići od skoro crne do skoro bijele');
let bacila = false;
try {
  sp.parsirajHex('rgb(1,2,3)');
} catch {
  bacila = true;
}
provjeri(bacila, 'nepoznata boja mora baciti grešku, a ne dati NaN');

for (const g of greske.slice(0, 20)) console.log(`  PAD  ${g}`);
if (!greske.length) {
  console.log(`  OK   FFT: sinus pogođen na ${najgoreHz.toFixed(1).replace('.', ',')} Hz, 0 dB za amplitudu 1, −6 dB za pola`);
  console.log('  OK   logaritamska osa: oktava je uvijek isti broj redova, sinus svijetli u svom redu');
  console.log(`  OK   osnovni ton: ${tonova} glasova od 75 do 440 Hz, najveće odstupanje ${(najgoriTon * 100).toFixed(2).replace('.', ',')} %`);
  console.log(`  OK   ilustrativni govor: ${glasnih} glasnih trenutaka, ton izmjeren kako je sintetizovan`);
}
console.log(`\n  Glas: ${ukupno} provjera, ${greske.length} grešaka\n`);
process.exit(greske.length ? 1 : 0);
