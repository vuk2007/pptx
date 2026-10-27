import { K } from '@/lib/fizika/elektrostatika';

/*
  §8 Polje prstena na osi.

  Prsten poluprečnika a sa nabojem Q leži u ravni xy, osa je z. Podijeljen
  na n jednakih komada, svaki daje dE = K·(Q/n)·R/R³. Komponente duž ose su
  iste za svaki komad, pa se samo sabiraju; poprečne se poništavaju u
  parovima suprotnih komada. Zbir je
      E_z = Q z / (4πε₀ (a² + z²)^(3/2)),
  nula u centru, a daleko (z ≫ a) kao polje tačke: Q/(4πε₀ z²).
*/

export type V3 = { x: number; y: number; z: number };

export function prstenNaOsi(Q: number, a: number, z: number): number {
  return (K * Q * z) / (a * a + z * z) ** 1.5;
}

/** Polje tačkastog naboja Q na rastojanju z, sa predznakom smjera. */
export function tackaNaOsi(Q: number, z: number): number {
  return z === 0 ? 0 : (K * Q * Math.sign(z)) / (z * z);
}

export type Komad = { polozaj: V3; dE: V3 };

/** Doprinosi n komada prstena u tački T = (0, 0, z), i njihov zbir. */
export function komadiPrstena(Q: number, a: number, z: number, n: number): { komadi: Komad[]; ukupno: V3 } {
  const komadi: Komad[] = [];
  const ukupno = { x: 0, y: 0, z: 0 };
  const dQ = Q / n;
  for (let k = 0; k < n; k++) {
    const fi = (2 * Math.PI * k) / n;
    const polozaj = { x: a * Math.cos(fi), y: a * Math.sin(fi), z: 0 };
    const R = { x: -polozaj.x, y: -polozaj.y, z };
    const R3 = (R.x * R.x + R.y * R.y + R.z * R.z) ** 1.5;
    const dE = { x: (K * dQ * R.x) / R3, y: (K * dQ * R.y) / R3, z: (K * dQ * R.z) / R3 };
    ukupno.x += dE.x;
    ukupno.y += dE.y;
    ukupno.z += dE.z;
    komadi.push({ polozaj, dE });
  }
  return { komadi, ukupno };
}

/** Gdje je polje na osi najjače: z = a/√2. */
export function maksimumNaOsi(a: number) {
  return a / Math.SQRT2;
}
