import { prevedi } from './prevedi.mjs';

/*
  Fizika iz eksperimenata za faks, odvojena od crtanja.

  Ne provjerava se samo da funkcija vrati očekivan broj, nego i da se
  slaže sa nezavisnim putem do istog rezultata: prizma se poredi sa
  presjekom duži, prebrojani naboji sa formulom ρ·δa·w·δt·cos α, a struja
  van sa promjenom broja naboja unutra, kadar po kadar.

  Upotreba: node scripts/provjeri-fizika.mjs
*/

const prevod = await prevedi(
  [
    'src/lib/osa.ts',
    'src/lib/fizika/slucajno.ts',
    'src/lib/fizika/prizma.ts',
    'src/lib/fizika/kontinuitet.ts',
    'src/lib/fizika/kirchhoff.ts',
    'src/lib/fizika/racun.ts',
    'src/lib/fizika/nosioci.ts',
    'src/lib/fizika/predznaci.ts',
    'src/lib/fizika/gustine.ts',
    'src/lib/fizika/elektrostatika.ts',
    'src/lib/fizika/probni.ts',
  ],
  'fizika-',
);
const { slucajno } = await prevod.uvezi('src/lib/fizika/slucajno.ts');
const P = await prevod.uvezi('src/lib/fizika/prizma.ts');
const K = await prevod.uvezi('src/lib/fizika/kontinuitet.ts');
const H = await prevod.uvezi('src/lib/fizika/kirchhoff.ts');
const O = await prevod.uvezi('src/lib/osa.ts');
const R = await prevod.uvezi('src/lib/fizika/racun.ts');
const N3 = await prevod.uvezi('src/lib/fizika/nosioci.ts');
const Z = await prevod.uvezi('src/lib/fizika/predznaci.ts');
const G = await prevod.uvezi('src/lib/fizika/gustine.ts');
const EL = await prevod.uvezi('src/lib/fizika/elektrostatika.ts');
const PB = await prevod.uvezi('src/lib/fizika/probni.ts');
prevod.pocisti();

const greske = [];
let provjera = 0;
function provjeri(uslov, opis) {
  provjera++;
  if (!uslov) greske.push(opis);
}
const blizu = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const STEPEN = Math.PI / 180;

/* ------------------------------------------------------------ §4 prizma */

provjeri(blizu(P.nabojPoFormuli(2, 4, 4, 2, 0), 64), 'ρ·δa·w·δt za α = 0');
provjeri(blizu(P.nabojPoFormuli(2, 4, 4, 2, 60 * STEPEN), 32), 'cos 60° prepolovi naboj');
provjeri(Math.abs(P.nabojPoFormuli(2, 4, 4, 2, 90 * STEPEN)) < 1e-9, 'pri 90° ništa ne prolazi');

function povrsina(v) {
  let s = 0;
  for (let i = 0; i < v.length; i++) {
    const a = v[i];
    const b = v[(i + 1) % v.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/** Da li duž p → q siječe prozorčić (uspravnu duž). Nezavisno od uPrizmi. */
function sijece(p, q, prozor) {
  if ((p.x - prozor.x) * (q.x - prozor.x) > 0) return false;
  if (p.x === q.x) return false;
  const t = (prozor.x - p.x) / (q.x - p.x);
  const y = p.y + t * (q.y - p.y);
  return y >= prozor.y1 && y <= prozor.y2;
}

const PROZOR = { x: 760, y1: 200, y2: 300 };
const h = PROZOR.y2 - PROZOR.y1;
const rnd = slucajno(7);

for (let a = 0; a <= 75; a += 5) {
  const alfa = a * STEPEN;
  for (const L of [12.5, 25, 60, 100, 150, 200]) {
    provjeri(blizu(povrsina(P.vrhoviPrizme(PROZOR, L, alfa)), h * L * Math.cos(alfa), 1e-9), `površina prizme α=${a}° L=${L}`);

    /* Naboj je u prizmi tačno onda kad njegov put za δt presiječe prozorčić. */
    const u = P.smjer(alfa);
    for (let k = 0; k < 300; k++) {
      const p = { x: PROZOR.x - 260 + rnd() * 300, y: PROZOR.y1 - 60 + rnd() * 330 };
      const q = { x: p.x + L * u.x, y: p.y + L * u.y };
      provjeri(P.uPrizmi(p, PROZOR, L, alfa) === sijece(p, q, PROZOR), `uPrizmi i put naboja se ne slažu (α=${a}°, L=${L})`);
    }
  }
}

/*
  Prebrojano naspram formule. Mreža pomjerena za slučajan iznos ima u
  prosjeku tačno gustina × površina naboja u svakom liku, pa prosjek
  preko mnogo pomaka mora pasti na formulu.
*/
for (const rhoCm of [0.5, 1, 2, 3]) {
  const gustina = rhoCm / P.PX_PO_CM ** 2;
  const mreza = P.napraviMrezu(gustina, 1000, 520, slucajno(11));
  provjeri(blizu(mreza.tacke.length / (mreza.perioda.x * mreza.perioda.y), gustina, 1e-9), `gustina mreže ρ=${rhoCm}`);
  for (const [a, L] of [[0, 100], [30, 200], [60, 150], [75, 200]]) {
    const alfa = a * STEPEN;
    let zbir = 0;
    const PUTA = 600;
    const r = slucajno(rhoCm * 100 + a);
    for (let k = 0; k < PUTA; k++) {
      P.pomjeri(mreza, r() * mreza.perioda.x, r() * mreza.perioda.y);
      zbir += P.prebroj(mreza.tacke, PROZOR, L, alfa);
    }
    const ocekivano = gustina * h * L * Math.cos(alfa);
    const prosjek = zbir / PUTA;
    provjeri(Math.abs(prosjek - ocekivano) <= 0.03 * ocekivano + 0.05, `prosjek ${prosjek.toFixed(2)} ≠ formula ${ocekivano.toFixed(2)} (ρ=${rhoCm}, α=${a}°)`);
  }
}

/* ------------------------------------------------------------ §5 kontinuitet */

const POLJE = { sirina: 680, visina: 330, cx: 340, cy: 165, r: 95 };
const N = 150;

function vozi(oblik, rezim, sjeme, koraci, dt = 1 / 60) {
  const r = slucajno(sjeme);
  const s = K.napraviStanje(oblik, rezim, POLJE, N, r);
  let prije = K.brojUnutra(s);
  let ukupnoVan = 0;
  let prelaza = 0;
  let tacno = true;
  for (let i = 0; i < koraci; i++) {
    const pr = K.korak(s, dt, r);
    const sad = K.brojUnutra(s);
    /* Brojanje prelaza i promjena naboja unutra moraju se slagati u svakom kadru. */
    if (sad - prije !== pr.uslo - pr.izaslo) tacno = false;
    if (!blizu(K.strujaVan(pr, dt, 1) * dt, -(sad - prije), 1e-9)) tacno = false;
    if (!blizu(K.strujaVan(pr, dt, -1), -K.strujaVan(pr, dt, 1), 1e-12)) tacno = false;
    ukupnoVan += pr.izaslo - pr.uslo;
    prelaza += pr.izaslo + pr.uslo;
    prije = sad;
  }
  return { s, ukupnoVan, prelaza, tacno, unutra: K.brojUnutra(s) };
}

for (const oblik of ['zatvorena', 'ravan']) {
  for (const rezim of ['izlazi', 'ulazi', 'prolazi']) {
    for (const sjeme of [1, 2, 3, 4, 5]) {
      const v = vozi(oblik, rezim, sjeme, 600);
      /*
        Samo zatvorena površina ima „unutra". Kod ravni se naboj koji izađe
        desno vrati lijevo bez prelaza, pa lijeva strana nije zatvorena i
        jednačina kontinuiteta za nju ne važi — što i jeste poenta ravni.
      */
      if (oblik === 'zatvorena') provjeri(v.tacno, `${oblik}/${rezim}/${sjeme}: struja van ≠ −dQ_not/dt u nekom kadru`);
      provjeri(v.s.naboji.length === N, `${oblik}/${rezim}: broj naboja se promijenio`);
      for (const n of v.s.naboji) {
        provjeri(n.x >= 0 && n.x <= POLJE.sirina && n.y >= 0 && n.y <= POLJE.visina, `${oblik}/${rezim}: naboj izašao iz crteža`);
      }
      if (oblik === 'zatvorena' && rezim === 'izlazi') provjeri(v.ukupnoVan > 30, `izlazi/${sjeme}: struja van nije pozitivna (${v.ukupnoVan})`);
      if (oblik === 'zatvorena' && rezim === 'ulazi') provjeri(v.ukupnoVan < -30, `ulazi/${sjeme}: struja van nije negativna (${v.ukupnoVan})`);
      if (oblik === 'zatvorena' && rezim === 'prolazi') {
        provjeri(Math.abs(v.ukupnoVan) < 0.1 * v.prelaza, `prolazi/${sjeme}: neto struja ${v.ukupnoVan} od ${v.prelaza} prelaza`);
      }
      if (oblik === 'ravan') provjeri(v.ukupnoVan > 30, `ravan/${sjeme}: naboj ne teče udesno (${v.ukupnoVan})`);
    }
  }
}

{
  const a = vozi('zatvorena', 'izlazi', 9, 300);
  const b = vozi('zatvorena', 'izlazi', 9, 300);
  provjeri(a.ukupnoVan === b.ukupnoVan && a.unutra === b.unutra, 'isto sjeme ne daje isto kretanje');
}
provjeri(K.unutra(POLJE.cx, POLJE.cy, 'zatvorena', POLJE), 'središte nije unutra');
provjeri(!K.unutra(POLJE.cx + POLJE.r + 1, POLJE.cy, 'zatvorena', POLJE), 'tačka iza kruga je unutra');
provjeri(K.unutra(POLJE.cx - 1, 0, 'ravan', POLJE) && !K.unutra(POLJE.cx + 1, 0, 'ravan', POLJE), 'ravan: lijevo je „unutra"');
provjeri(K.napraviStanje('ravan', 'izlazi', POLJE, 10, slucajno(1)).rezim === 'prolazi', 'kroz ravan naboj samo prolazi');

/* ------------------------------------------------------------ §6 Kirchhoff */

const g = (i, orijentacija) => ({ i, orijentacija });
provjeri(H.zbir([g(2, 'u'), g(5, 'u'), g(7, 'iz')]) === 0, 'ulazi 2 A i 5 A, izlazi 7 A: zbir nije nula');
provjeri(H.promjenaNaboja([g(2, 'u'), g(5, 'u'), g(7, 'iz')]) === 0, '2 + 5 = 7: naboj se mijenja');
provjeri(H.zbir([g(4, 'u'), g(1, 'u'), g(3, 'iz')]) === -2, 'zbir −i₁ − i₂ + i₃');
provjeri(H.promjenaNaboja([g(4, 'u'), g(1, 'u'), g(3, 'iz')]) === 2, 'ulazi više: naboj raste');
provjeri(H.promjenaNaboja([g(1, 'u'), g(6, 'iz')]) === -5, 'izlazi više: naboj opada');
provjeri(H.zbir([g(-3, 'iz')]) === H.zbir([g(3, 'u')]), '−3 A iz čvora = 3 A u čvor');
provjeri(H.stvarniSmjer(g(-3, 'iz')) === -1 && H.stvarniSmjer(g(3, 'u')) === -1, 'stvarni smjer: u čvor');
provjeri(H.stvarniSmjer(g(2, 'iz')) === 1 && H.stvarniSmjer(g(-2, 'u')) === 1, 'stvarni smjer: iz čvora');
provjeri(H.stvarniSmjer(g(0, 'u')) === 0, 'bez struje nema smjera');

{
  const r = slucajno(5);
  for (let k = 0; k < 2000; k++) {
    const grane = Array.from({ length: 2 + Math.floor(r() * 4) }, () =>
      g(Math.round((r() * 12 - 6) * 2) / 2, r() < 0.5 ? 'u' : 'iz'),
    );
    const indeks = Math.floor(r() * grane.length);
    const nove = grane.map((x, j) => (j === indeks ? { ...x, i: H.izjednaci(grane, indeks) } : x));
    provjeri(Math.abs(H.zbir(nove)) < 1e-12, `izjednači ne daje nulu: ${JSON.stringify(grane)} → ${indeks}`);
  }
}

/* ------------------------------------------------------------ osa grafa */

{
  const r = slucajno(31);
  for (let k = 0; k < 3000; k++) {
    const a = (r() - 0.5) * 10 ** (r() * 6 - 2);
    const b = a + 10 ** (r() * 6 - 3);
    const cilj = 3 + Math.floor(r() * 6);
    const p = O.podioci(a, b, cilj);
    const korak = O.korakOse(a, b, cilj);
    const mantisa = korak / 10 ** Math.floor(Math.log10(korak) + 1e-12);
    provjeri([1, 2, 5, 10].some((m) => Math.abs(mantisa - m) < 1e-9), `korak ${korak} nije 1, 2 ili 5 puta 10ⁿ`);
    provjeri(p.length >= 2 && p.length <= cilj * 3 + 1, `${p.length} podioka za cilj ${cilj} na [${a}, ${b}]`);
    provjeri(p.every((v) => v >= a - korak * 1e-9 && v <= b + korak * 1e-9), `podiok van raspona [${a}, ${b}]`);
    provjeri(p.every((v, j) => j === 0 || Math.abs(v - p[j - 1] - korak) < korak * 1e-6), `podioci nisu ravnomjerni na [${a}, ${b}]`);
    provjeri(p.every((v) => String(v).length < 16), `šum u zapisu podioka: ${p.find((v) => String(v).length >= 16)}`);
    if (a < 0 && b > 0) provjeri(p.includes(0), `nula fali u [${a}, ${b}]`);
  }
}

/* ------------------------------------------------------------ §2 gustine */

{
  const Q = 6;
  const polazno = G.gustine(Q, G.dimenzije('zapremina', 1));
  for (const s of [1, 0.5, 0.1, 0.01]) {
    const ploca = G.gustine(Q, G.dimenzije('ploca', s));
    const dP = G.dimenzije('ploca', s);
    provjeri(blizu(ploca.sigma, Q / (G.KVADAR.a * G.KVADAR.b)), `ploča s=${s}: σ se mijenja`);
    provjeri(blizu(ploca.rho * dP.c, ploca.sigma), `ploča s=${s}: σ ≠ ρ·c`);
    provjeri(blizu(ploca.rho, polazno.rho / s), `ploča s=${s}: ρ ne raste kao 1/s`);

    const zica = G.gustine(Q, G.dimenzije('zica', s));
    const dZ = G.dimenzije('zica', s);
    provjeri(blizu(zica.q, Q / G.KVADAR.a), `žica s=${s}: q se mijenja`);
    provjeri(blizu(zica.rho * dZ.b * dZ.c, zica.q), `žica s=${s}: q ≠ ρ·b·c`);
    provjeri(blizu(zica.rho, polazno.rho / (s * s)), `žica s=${s}: ρ ne raste kao 1/s²`);

    const tacka = G.gustine(Q, G.dimenzije('tacka', s));
    provjeri(blizu(tacka.rho * tacka.V, Q), `tačka s=${s}: ρ·V ≠ Q`);
    provjeri(blizu(tacka.rho, polazno.rho / s ** 3), `tačka s=${s}: ρ ne raste kao 1/s³`);
  }

  /* Od atoma do kontinuuma: veliki kvadrat daje prosjek, mali broji cijele naboje. */
  const L = 100;
  const tacke = G.razbaci(4000, L, slucajno(41));
  const prosjek = 4000 / (L * L);
  const r = slucajno(43);
  for (let k = 0; k < 200; k++) {
    const c = { x: 30 + r() * 40, y: 30 + r() * 40 };
    provjeri(Math.abs(G.procjena(tacke, c, 50) - prosjek) < 0.12 * prosjek, 'veliki kvadrat ne daje prosječnu gustinu');
    const l = 0.3;
    const n = G.procjena(tacke, c, l) * l * l;
    provjeri(Math.abs(n - Math.round(n)) < 1e-9, 'mali kvadrat ne broji cijele naboje');
  }
}

/* ------------------------------------------------------------ §3 izvod i integral */

for (const f of R.FUNKCIJE) {
  for (let t0 = 0; t0 <= f.tMax - R.DT_MAX + 1e-9; t0 += 0.25) {
    /* Sječica se za mali δt primiče tangenti, a tangenta je tačan izvod. */
    provjeri(Math.abs(R.sjecica(f.Q, t0, 1e-6) - f.i(t0)) < 1e-4 * Math.max(1, Math.abs(f.i(t0))), `${f.id}: izvod u t=${t0}`);
    const veliki = Math.abs(R.sjecica(f.Q, t0, R.DT_MAX) - f.i(t0));
    const mali = Math.abs(R.sjecica(f.Q, t0, R.DT_MIN) - f.i(t0));
    provjeri(mali <= veliki + 1e-9, `${f.id}: za manji δt sječica nije bliža tangenti (t=${t0})`);
    provjeri(mali < 0.05, `${f.id}: pri δt = ${R.DT_MIN} s sječica odstupa ${mali} A`);
    /* Konstanta pomjera graf, a ne mijenja nagib. */
    for (const C of [-5, 3, 5]) {
      provjeri(blizu(R.sjecica((t) => f.Q(t) + C, t0, 0.5), R.sjecica(f.Q, t0, 0.5), 1e-9), `${f.id}: konstanta ${C} mijenja struju`);
    }
  }
  for (let t1 = 0; t1 < f.tMax; t1 += 0.5) {
    for (let t2 = t1; t2 <= f.tMax; t2 += 0.5) {
      provjeri(Math.abs(R.integral(f.i, t1, t2) - (f.Q(t2) - f.Q(t1))) < 1e-6, `${f.id}: ∫i dt ≠ ΔQ na [${t1}, ${t2}]`);
    }
  }
}
provjeri(blizu(R.sjecica((t) => t * t, 1.5, 0.4), 2 * 1.5 + 0.4), 'sječica za t² je 2t₀ + δt');
provjeri(blizu(R.dtZaPolozaj(0), R.DT_MAX) && blizu(R.dtZaPolozaj(1), R.DT_MIN), 'krajevi klizača δt');
for (let p = 0.05; p <= 1; p += 0.05) provjeri(R.dtZaPolozaj(p) < R.dtZaPolozaj(p - 0.05), 'klizač δt nije monoton');

/* ------------------------------------------------------------ §3 nosioci */

{
  const L = 900;
  const PRESJEK = 450;
  const BROJ = 120;
  const w = 40;
  const dt = 1 / 60;
  const KORAKA = 600;
  const rezultat = {};
  for (const vrsta of ['elektroni', 'ioni', 'oba']) {
    for (const smjer of [1, -1]) {
      const nosioci = N3.napraviNosioce(vrsta, BROJ, L, 60, slucajno(17));
      /*
        Tačno očekivanje, nezavisno od koraka simulacije: iz početnog
        položaja i brzine svakog nosioca, koliko puta pređe presjek na
        prstenu dužine L za ukupno vrijeme.
      */
      const T = KORAKA * dt;
      const ocekivaniKraj = nosioci.map((n) => ((((n.x + N3.brzina(n.q, smjer, w) * T) % L) + L) % L));
      let tacno = 0;
      for (const n of nosioci) {
        const v = N3.brzina(n.q, smjer, w);
        const put = Math.abs(v) * T;
        const doPresjeka = v > 0 ? (PRESJEK - n.x + L) % L : (n.x - PRESJEK + L) % L;
        const prelaza = doPresjeka <= put ? 1 + Math.floor((put - doPresjeka) / L) : 0;
        tacno += n.q * Math.sign(v) * prelaza;
      }
      let ukupno = N3.NULA;
      for (let k = 0; k < KORAKA; k++) ukupno = N3.saberi(ukupno, N3.korak(nosioci, smjer, w, dt, PRESJEK, L));
      const udesno = N3.prenesenoUdesno(ukupno);
      rezultat[`${vrsta}${smjer}`] = udesno;
      /* Očekivano: BROJ·w/L prelaza u sekundi, svaki nosi struju u smjeru polja. */
      const ocekivano = (smjer * BROJ * w * KORAKA * dt) / L;
      provjeri(Math.abs(udesno - tacno) <= 1, `${vrsta}, polje ${smjer}: prešlo ${udesno}, a po putanjama ${tacno}`);
      provjeri(Math.abs(udesno - ocekivano) <= 4 * Math.sqrt(Math.abs(ocekivano)) + 2, `${vrsta}, polje ${smjer}: prešlo ${udesno}, očekivano oko ${ocekivano.toFixed(1)}`);
      provjeri(Math.sign(udesno) === smjer, `${vrsta}, polje ${smjer}: struja nije u smjeru polja`);
      const b = N3.bilans(ukupno);
      provjeri(b.lijevo === -b.desno && b.desno === udesno, `${vrsta}: bilans lijevo i desno nije suprotan`);
      if (vrsta === 'elektroni') provjeri(ukupno.plusDesno + ukupno.plusLijevo === 0, 'elektroni: pojavio se pozitivan nosilac');
      if (vrsta === 'ioni') provjeri(ukupno.minusDesno + ukupno.minusLijevo === 0, 'ioni: pojavio se negativan nosilac');
      if (vrsta === 'elektroni') {
        /* Elektroni idu protiv polja: kroz presjek prelaze samo u jednom smjeru. */
        provjeri(smjer === 1 ? ukupno.minusDesno === 0 : ukupno.minusLijevo === 0, 'elektroni idu niz polje');
      }
      nosioci.forEach((n, j) => {
        provjeri(n.x >= 0 && n.x < L, 'nosilac izašao iz žice');
        /* Povratak kroz izvor ne smije ni da doda ni da oduzme put. */
        const razlika = Math.abs(n.x - ocekivaniKraj[j]);
        provjeri(Math.min(razlika, L - razlika) < 1e-6, `${vrsta}: nosilac nije gdje treba poslije ${T} s`);
      });
    }
  }
  provjeri(Math.sign(rezultat.elektroni1) === Math.sign(rezultat.ioni1), 'elektroni i ioni daju struju suprotnog smjera');
  provjeri(N3.brzina(-1, 1, 5) === -5 && N3.brzina(1, 1, 5) === 5, 'smjer brzine nosilaca');
}

/* ------------------------------------------------------------ §5 predznaci */

{
  const r = slucajno(23);
  for (let k = 0; k < 2000; k++) {
    const grane = Array.from({ length: 1 + Math.floor(r() * 3) }, () => g(Math.round(r() * 12) / 2, r() < 0.5 ? 'u' : 'iz'));
    const van = Z.strujaKrozPovrsinu(grane, 1);
    provjeri(Z.strujaKrozPovrsinu(grane, -1) === -van, 'okretanje normale ne okreće samo predznak');
    const u = Z.uloga(grane);
    provjeri(u === (van > 0 ? 'izvor' : van < 0 ? 'ponor' : 'nista'), `uloga ${u} za struju van ${van}`);
    const p = Z.promjena(grane);
    provjeri(p === (van > 0 ? 'opada' : van < 0 ? 'raste' : 'stalno'), `promjena ${p} za struju van ${van}`);
    provjeri(Z.nabojUnutra(0, 10, grane) === 10, 'Q_not(0) nije početni naboj');
    const nagib = Z.nabojUnutra(2, 10, grane) - Z.nabojUnutra(1, 10, grane);
    provjeri(blizu(nagib, -van, 1e-9), 'nagib Q_not(t) nije −i_van');
  }
  const primjer = [g(3, 'iz'), g(5, 'u')];
  provjeri(Z.strujaKrozPovrsinu(primjer, 1) === -2, '3 A van i 5 A unutra: struja van −2 A');
  provjeri(Z.uloga(primjer) === 'ponor' && Z.promjena(primjer) === 'raste', '3 A van i 5 A unutra: ponor, naboj raste');
  provjeri(Z.nabojUnutra(4, 10, primjer) === 18, 'Q_not(4 s) = 10 C + 2 A · 4 s');
}

/* ------------------------------------------------------------ §7 Coulomb */

{
  const r = slucajno(51);
  provjeri(Math.abs(EL.duzina(EL.poljeOd({ Q: 1e-9, x: 0, y: 0 }, { x: 0.1, y: 0 })) - EL.K * 1e-9 / 0.01) < 1e-9, '1 nC na 10 cm');
  for (let k = 0; k < 2000; k++) {
    const a = { Q: (r() - 0.5) * 2e-8, x: r() - 0.5, y: r() - 0.5 };
    const b = { Q: (r() - 0.5) * 2e-8, x: r() - 0.5, y: r() - 0.5 };
    const Fab = EL.sila(a, b);
    const Fba = EL.sila(b, a);
    /* Treći Newtonov zakon: F₁ + F₂ = 0. */
    provjeri(Math.abs(Fab.x + Fba.x) <= 1e-12 * EL.duzina(Fab) + 1e-30 && Math.abs(Fab.y + Fba.y) <= 1e-12 * EL.duzina(Fab) + 1e-30, 'F₁ + F₂ ≠ 0');
    const R = Math.hypot(b.x - a.x, b.y - a.y);
    provjeri(blizu(EL.duzina(Fab), (EL.K * Math.abs(a.Q * b.Q)) / (R * R), 1e-9), 'iznos sile nije K|Q₁Q₂|/R²');
    /* Isti predznaci se odbijaju: sila na b gleda od a. */
    const odA = (Fab.x * (b.x - a.x) + Fab.y * (b.y - a.y)) * Math.sign(a.Q * b.Q);
    provjeri(odA >= 0, 'isti predznaci se ne odbijaju');
  }
  const d = 0.1;
  const Q = 5e-9;
  const dipol = [{ Q, x: -d, y: 0 }, { Q: -Q, x: d, y: 0 }];
  const usred = EL.polje(dipol, { x: 0, y: 0 });
  provjeri(blizu(usred.x, (2 * EL.K * Q) / (d * d), 1e-9) && Math.abs(usred.y) < 1e-9, '+Q i −Q: polje u sredini nije 2KQ/d² prema −Q');
  const isti = EL.polje([{ Q, x: -d, y: 0 }, { Q, x: d, y: 0 }], { x: 0, y: 0 });
  provjeri(EL.duzina(isti) < 1e-6, '+Q i +Q: polje u sredini nije nula');

  /* Linije polja dipola: idu niz polje i završavaju na −Q ili van crteža. */
  const granice = { x0: -0.5, y0: -0.3, x1: 0.5, y1: 0.3 };
  const linije = EL.linijePolja(dipol, { poJedinici: 12, jedinica: Q, poluprecnik: 0.01, korak: 0.004, granice });
  provjeri(linije.length === 12, `dipol: ${linije.length} linija umjesto 12`);
  let naMinus = 0;
  for (const l of linije) {
    const kraj = l[l.length - 1];
    if (Math.hypot(kraj.x - d, kraj.y) < 0.012) naMinus++;
    for (let j = 1; j < l.length; j++) {
      const E = EL.polje(dipol, l[j - 1]);
      const pomak = { x: l[j].x - l[j - 1].x, y: l[j].y - l[j - 1].y };
      if (E.x * pomak.x + E.y * pomak.y < 0) {
        provjeri(false, 'linija polja ide protiv polja');
        break;
      }
    }
  }
  provjeri(naMinus >= 8, `dipol: samo ${naMinus} od 12 linija stiže do −Q`);
  const samoMinus = EL.linijePolja([{ Q: -Q, x: 0, y: 0 }], { poJedinici: 8, jedinica: Q, poluprecnik: 0.01, korak: 0.01, granice });
  provjeri(samoMinus.length === 8, 'samo negativan naboj: linije ne kreću od njega');
}

/* ------------------------------------------------------------ §8 probni naboj */

{
  const p = { cx: 0, cy: 0, R0: 0.05, Q: 20e-9, N: 24 };
  const T = { x: 0.1, y: 0 };
  const pravo = PB.poljeProvodnika(p, PB.jednoliko(p), T);
  const bez = PB.opusti(p, PB.jednoliko(p), null, 50);
  provjeri(bez.every((u, k) => Math.abs(u - PB.jednoliko(p)[k]) < 1e-9), 'bez probnog naboja jednolik raspored nije u ravnoteži');
  let prethodno = 0;
  for (const dQ of [2e-12, 2e-11, 2e-10, 2e-9, 2e-8]) {
    const { E, uglovi } = PB.izmjeri(p, T, dQ);
    const odstupanje = 1 - E.x / pravo.x;
    provjeri(odstupanje >= prethodno - 1e-6, `veći probni naboj (${dQ}) daje manje odstupanje`);
    provjeri(odstupanje >= -1e-9, 'pozitivan probni naboj ne potiskuje naboje provodnika');
    provjeri(uglovi.length === p.N, 'broj naboja na provodniku se promijenio');
    if (dQ <= 2e-11) provjeri(odstupanje < 0.01, `mali probni naboj (${dQ}) odstupa ${(odstupanje * 100).toFixed(2)} %`);
    if (dQ >= 2e-8) provjeri(odstupanje > 0.05, `veliki probni naboj (${dQ}) odstupa samo ${(odstupanje * 100).toFixed(2)} %`);
    prethodno = odstupanje;
  }
}

/* ------------------------------------------------------------ izvještaj */

console.log('');
console.log('  OK   osa: podioci 1, 2, 5 · 10ⁿ, ravnomjerni, sa nulom');
console.log('  OK   §2 gustine: σ, q i Q ostaju dok ρ raste kao 1/s, 1/s², 1/s³');
console.log('  OK   §3 izvod i integral: sječica → tangenta, ∫ i dt = ΔQ, konstanta ne mijenja struju');
console.log('  OK   §3 nosioci: elektroni ulijevo i ioni udesno daju istu struju, N·w/L prelaza u sekundi');
console.log('  OK   §5 predznaci: normala mijenja samo predznak, uloga i promjena ne');
console.log('  OK   §7 Coulomb: F₁ + F₂ = 0, K|Q₁Q₂|/R², dipol i linije polja');
console.log('  OK   §8 probni naboj: F/δQ teži pravom polju kad δQ → 0');
console.log('  OK   §4 prizma: površina, put naboja kroz prozorčić i prosjek naspram ρ·δa·w·δt·cos α');
console.log('  OK   §5 kontinuitet: struja van = −dQ_not/dt u svakom kadru, izvor, ponor i prolaz');
console.log('  OK   §6 Kirchhoff: 2 A + 5 A = 7 A, predznaci po orijentaciji, izjednačavanje');
console.log('');
console.log(`  Fizika: ${provjera} provjera, ${greske.length} grešaka`);
console.log('');

if (greske.length > 0) {
  for (const x of greske.slice(0, 12)) console.error(`  GREŠKA  ${x}`);
  if (greske.length > 12) console.error(`  ... i još ${greske.length - 12}`);
  process.exit(1);
}
