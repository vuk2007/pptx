/*
  Serijski paket kojim micro:bit u psu govori ESP32-u šta da radi.

  Okvir: 0x55 0x00 | dužina | komanda | adresa | podaci | checksum | 0x00 0xAA
  Checksum: invertovan najniži bajt zbira (dužina + komanda + adresa + podaci).

  Format i račun su pravi. Same vrijednosti bajtova za „sjedi" su ilustrativne
  dok se ne potvrde — zato stoje u konfiguraciji.
*/

import { XGO_BAJTOVI_SJEDI, XGO_BAJTOVI_SJEDI_ILUSTRATIVNI } from '@/config/cinjenice';

export const ZAGLAVLJE = [0x55, 0x00];
export const REP = [0x00, 0xaa];

export const BAJTOVI_SJEDI = XGO_BAJTOVI_SJEDI ?? XGO_BAJTOVI_SJEDI_ILUSTRATIVNI;
export const BAJTOVI_SU_ILUSTRATIVNI = XGO_BAJTOVI_SJEDI === null;

export function checksum(duzina: number, komanda: number, adresa: number, podaci: number[]): number {
  const zbir = [duzina, komanda, adresa, ...podaci].reduce((a, b) => a + b, 0);
  return (~zbir) & 0xff;
}

export type Racun = {
  sabirci: { naziv: string; vrijednost: number }[];
  zbir: number;
  najniziBajt: number;
  checksum: number;
};

/** Račun checksuma razložen na korake, za prikaz na ekranu. */
export function racunChecksuma(duzina: number, komanda: number, adresa: number, podaci: number[]): Racun {
  const sabirci = [
    { naziv: 'dužina', vrijednost: duzina },
    { naziv: 'komanda', vrijednost: komanda },
    { naziv: 'adresa', vrijednost: adresa },
    ...podaci.map((v, i) => ({ naziv: podaci.length > 1 ? `podaci ${i + 1}` : 'podaci', vrijednost: v })),
  ];
  const zbir = sabirci.reduce((a, s) => a + s.vrijednost, 0);
  const najniziBajt = zbir & 0xff;
  return { sabirci, zbir, najniziBajt, checksum: (~zbir) & 0xff };
}

export function napraviSerijskiPaket(komanda: number, adresa: number, podaci: number[]): number[] {
  /* Dužina broji sebe, komandu, adresu, podatke i checksum. */
  const duzina = 4 + podaci.length;
  return [
    ...ZAGLAVLJE,
    duzina,
    komanda,
    adresa,
    ...podaci,
    checksum(duzina, komanda, adresa, podaci),
    ...REP,
  ];
}

/** Prijemnik provjerava okvir i checksum. */
export function serijskiPaketJeIspravan(paket: number[]): boolean {
  if (paket.length < 8) return false;
  if (paket[0] !== ZAGLAVLJE[0] || paket[1] !== ZAGLAVLJE[1]) return false;
  if (paket[paket.length - 2] !== REP[0] || paket[paket.length - 1] !== REP[1]) return false;

  const duzina = paket[2];
  const komanda = paket[3];
  const adresa = paket[4];
  const podaci = paket.slice(5, paket.length - 3);
  return paket[paket.length - 3] === checksum(duzina, komanda, adresa, podaci);
}

export function uHeks(bajt: number): string {
  return '0x' + bajt.toString(16).padStart(2, '0').toUpperCase();
}
