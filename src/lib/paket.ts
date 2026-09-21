import { PAKET, PAKET_JE_ILUSTRATIVAN } from '@/config/cinjenice';

/*
  Radio paket i njegova provjera.

  Checksum je XOR svih bajtova podataka. To hvata svaki pokvaren bit — ali
  samo dok je sam. Dvije greške na istoj poziciji bita u dva bajta se
  međusobno ponište i XOR ih ne vidi. To je cijela poenta demonstracije,
  pa je ovdje i provjereno testom.
*/

export const POLJA = PAKET;
export const FORMAT_JE_ILUSTRATIVAN = PAKET_JE_ILUSTRATIVAN;

/** Bajt koji označava početak paketa. Prijemnik po njemu hvata sinhronizaciju. */
export const START = 0xa5;

export function xor(bajtovi: number[]): number {
  return bajtovi.reduce((zbir, b) => zbir ^ b, 0);
}

/** Podaci paketa bez checksuma: start, gas, skretanje. */
export function podaci(gas: number, skretanje: number): number[] {
  return [START, gas & 0xff, skretanje & 0xff];
}

/** Cio paket: podaci pa checksum na kraju. */
export function napraviPaket(gas: number, skretanje: number): number[] {
  const d = podaci(gas, skretanje);
  return [...d, xor(d)];
}

/** Prijemnik računa XOR podataka i poredi ga sa primljenim checksumom. */
export function provjeraProlazi(primljeni: number[]): boolean {
  if (primljeni.length < 2) return false;
  const d = primljeni.slice(0, -1);
  const c = primljeni[primljeni.length - 1];
  return xor(d) === c;
}

export type Udar = {
  /** Indeksi bajtova u koje je munja udarila. */
  bajtovi: number[];
  /** Pozicija bita, 0 je najniži. */
  bit: number;
};

/**
  Jedna munja: jedan bit u jednom bajtu podataka.
  XOR se promijeni, prijemnik to vidi i baci paket.
*/
export function jednaMunja(paket: number[], nasumicno: () => number): { paket: number[]; udar: Udar } {
  const indeks = Math.floor(nasumicno() * (paket.length - 1));
  const bit = Math.floor(nasumicno() * 8);
  const pokvaren = [...paket];
  pokvaren[indeks] ^= 1 << bit;
  return { paket: pokvaren, udar: { bajtovi: [indeks], bit } };
}

/**
  Dvije munje na istoj poziciji bita, u dva različita bajta.
  Dvije promjene se u XOR-u ponište, pa provjera prolazi iako je paket pokvaren.
*/
export function dvijeMunje(paket: number[], nasumicno: () => number): { paket: number[]; udar: Udar } {
  const brojPodataka = paket.length - 1;
  const prvi = Math.floor(nasumicno() * brojPodataka);
  let drugi = Math.floor(nasumicno() * (brojPodataka - 1));
  if (drugi >= prvi) drugi++;
  const bit = Math.floor(nasumicno() * 8);

  const pokvaren = [...paket];
  pokvaren[prvi] ^= 1 << bit;
  pokvaren[drugi] ^= 1 << bit;
  return { paket: pokvaren, udar: { bajtovi: [prvi, drugi], bit } };
}

export function uBinarno(bajt: number): string {
  return bajt.toString(2).padStart(8, '0');
}

/** Koraci računanja XOR-a, za prikaz korak po korak. */
export function koraciXor(bajtovi: number[]): { naziv: string; vrijednost: number; medjurezultat: number }[] {
  let medjurezultat = 0;
  return bajtovi.map((vrijednost, i) => {
    medjurezultat ^= vrijednost;
    return { naziv: POLJA[i]?.naziv ?? `BAJT ${i}`, vrijednost, medjurezultat };
  });
}
