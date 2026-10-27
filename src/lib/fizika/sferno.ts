import { K } from '@/lib/fizika/elektrostatika';

/*
  §9 Sferna ljuska, oblak i sferni kondenzator.

  Za sferno simetričan naboj Gaussova sfera poluprečnika r daje
  E · 4πr² = Q_not(r)/ε₀, pa je E(r) = K·Q_not(r)/r².
    ljuska (R):    Q_not = 0 za r < R, Q za r > R
    oblak (R):     Q_not = Q (r/R)³ za r < R, Q za r > R  →  E linearno pa 1/r²
    kondenzator:   +Q na a, −Q na b  →  polje samo između a i b
*/

export type Model = 'ljuska' | 'oblak' | 'kondenzator';
export type Raspored = { model: Model; Q: number; R: number; b: number };

export function obuhvaceno(r: Raspored, rG: number): number {
  switch (r.model) {
    case 'ljuska':
      return rG < r.R ? 0 : r.Q;
    case 'oblak':
      return rG < r.R ? r.Q * (rG / r.R) ** 3 : r.Q;
    case 'kondenzator':
      return rG < r.R || rG > r.b ? 0 : r.Q;
  }
}

export function poljeSferno(r: Raspored, rG: number): number {
  if (rG === 0) return 0;
  return (K * obuhvaceno(r, rG)) / (rG * rG);
}

/** Tačke ravnomjerno po sferi (Fibonaccijeva spirala), za brojčanu provjeru. */
export function tackeNaSferi(N: number, R: number) {
  const zlatni = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: N }, (_, k) => {
    const y = 1 - (2 * (k + 0.5)) / N;
    const rr = Math.sqrt(1 - y * y);
    const f = zlatni * k;
    return { x: R * rr * Math.cos(f), y: R * y, z: R * rr * Math.sin(f) };
  });
}
