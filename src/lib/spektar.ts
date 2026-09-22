/*
  Računski dio demonstracije glasa, odvojen od crtanja.

  Dvije stvari žive ovdje: paleta kojom se jačina pretvara u boju, i
  ilustrativni govor koji se prikazuje kad mikrofon nije dostupan. Ako
  bilo šta od toga da NaN, spektrogram se pretvori u praznu crnu mrlju,
  a to na štandu izgleda kao da sajt ne radi.
*/

/** Broj traka spektra koje se crtaju. Kod živog zvuka to su najniže FFT kante. */
export const TRAKA = 256;

/** #rrggbb u tri broja. Baca ako niz nije boja koju umijemo pročitati. */
export function parsirajHex(boja: string): [number, number, number] {
  const ocisceno = boja.trim();
  const m = /^#([0-9a-f]{6})$/i.exec(ocisceno);
  if (!m) throw new Error(`Nije #rrggbb boja: „${boja}”`);
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/**
  Paleta od 256 boja: tiho je boja ploče, glasno ide ka bijelom.
  Stanice dolaze iz istih promjenljivih koje koristi ostatak sajta.
*/
export function napraviPaletu(stanice: string[]): Uint8ClampedArray {
  if (stanice.length < 2) throw new Error('Paleti trebaju bar dvije stanice');
  const tacke = stanice.map(parsirajHex);
  const paleta = new Uint8ClampedArray(256 * 3);

  for (let i = 0; i < 256; i++) {
    const p = (i / 255) * (tacke.length - 1);
    const donja = Math.min(tacke.length - 2, Math.floor(p));
    const dio = p - donja;
    for (let k = 0; k < 3; k++) {
      paleta[i * 3 + k] = tacke[donja][k] + (tacke[donja + 1][k] - tacke[donja][k]) * dio;
    }
  }
  return paleta;
}

/**
  Glasnoća ilustrativnog govora: slogovi, sa tišinom između.

  Pod od nekoliko procenata je tiha šuštava soba. Bez njega talas u
  pauzama postane savršeno prava linija, što na ekranu izgleda kao da
  je demonstracija stala.
*/
const POD = 0.04;

function slog(t: number): number {
  const talas = Math.sin(t * 3.4) * 0.5 + Math.sin(t * 1.27 + 1.1) * 0.5;
  return POD + (1 - POD) * Math.max(0, talas) ** 0.7;
}

/**
  Ilustrativni spektar govora: nekoliko formanata koji se lagano šetaju.
  Nije snimak ničijeg glasa — samo pokazuje kako govor izgleda.
*/
export function ilustrativniSpektar(t: number, izlaz: Uint8Array): void {
  const glasnoca = slog(t);

  const formanti = [
    { sredina: 14 + 5 * Math.sin(t * 0.9), jacina: 1, sirina: 7 },
    { sredina: 44 + 16 * Math.sin(t * 0.63 + 1.7), jacina: 0.82, sirina: 11 },
    { sredina: 96 + 26 * Math.sin(t * 0.41 + 3.1), jacina: 0.55, sirina: 18 },
  ];

  for (let i = 0; i < izlaz.length; i++) {
    let v = 0;
    for (const f of formanti) {
      const d = (i - f.sredina) / f.sirina;
      v += f.jacina * Math.exp(-d * d);
    }

    /*
      Šum daha pada sa visinom. Talasi su namjerno niske frekvencije po
      indeksu: brz šum po kantama na ekranu izgleda kao pruge od crtanja,
      a ne kao zvuk.
    */
    const sum =
      (0.15 + 0.05 * Math.sin(i * 0.31 + t * 2.1) + 0.04 * Math.sin(i * 0.11 - t * 1.3)) *
      Math.exp(-i / 70);
    const ukupno = (v * glasnoca + sum * (0.3 + 0.7 * glasnoca)) * 255;

    izlaz[i] = Math.max(0, Math.min(255, ukupno));
  }
}

/**
  Ilustrativni talas u vremenu, u istom obliku u kom ga daje AnalyserNode:
  bajtovi oko 128, gdje je 128 tišina.
*/
export function ilustrativniTalas(t: number, izlaz: Uint8Array): void {
  const glasnoca = slog(t);

  for (let i = 0; i < izlaz.length; i++) {
    const f = i / izlaz.length;
    const v =
      Math.sin((f * 18 + t * 6) * Math.PI * 2) * 0.55 +
      Math.sin((f * 41 + t * 3) * Math.PI * 2) * 0.28 +
      Math.sin((f * 97 + t * 11) * Math.PI * 2) * 0.12;

    izlaz[i] = Math.max(0, Math.min(255, 128 + v * glasnoca * 120));
  }
}

/** Jačina signala, 0 do 1, iz talasa u vremenu. */
export function jacina(talas: Uint8Array): number {
  if (talas.length === 0) return 0;
  let zbir = 0;
  for (let i = 0; i < talas.length; i++) {
    const v = (talas[i] - 128) / 128;
    zbir += v * v;
  }
  return Math.min(1, Math.sqrt(zbir / talas.length) * 2.2);
}
