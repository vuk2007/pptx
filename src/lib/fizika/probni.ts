import { K, polje, type Naboj, type V2 } from '@/lib/fizika/elektrostatika';

/*
  §8 Zašto probni naboj mora biti mali.

  Polje se mjeri kao sila na probni naboj kroz njegov naboj, F/δQ. Ali
  probni naboj gura (ili vuče) slobodne naboje na provodniku, pa mjeri
  polje rasporeda koji je sam pokvario. Što je δQ manji, to je raspored
  bliži onom bez njega, pa F/δQ teži pravom polju.

  Provodnik je u presjeku krug poluprečnika R0 sa N jednakih naboja koji
  klize po obodu; ravnoteža se nalazi opuštanjem duž tangente.
*/

export type Provodnik = { cx: number; cy: number; R0: number; Q: number; N: number };

export function jednoliko(p: Provodnik): number[] {
  return Array.from({ length: p.N }, (_, k) => (2 * Math.PI * k) / p.N);
}

export function nabojiProvodnika(p: Provodnik, uglovi: readonly number[]): Naboj[] {
  return uglovi.map((u) => ({ Q: p.Q / p.N, x: p.cx + p.R0 * Math.cos(u), y: p.cy + p.R0 * Math.sin(u) }));
}

/**
  Koraci opuštanja: svaki naboj se pomjeri po obodu u smjeru tangencijalne
  sile od ostalih naboja provodnika i od probnog naboja. Vraća nove uglove.
*/
export function opusti(p: Provodnik, uglovi: readonly number[], probni: Naboj | null, koraka: number): number[] {
  const u = [...uglovi];
  const q = p.Q / p.N;
  /* Sila između susjednih naboja jednolikog rasporeda: prirodna jedinica za korak. */
  const razmak = 2 * p.R0 * Math.sin(Math.PI / p.N);
  const jedinica = (K * q * q) / (razmak * razmak);
  for (let s = 0; s < koraka; s++) {
    const naboji = nabojiProvodnika(p, u);
    const izvori = probni ? [...naboji, probni] : naboji;
    for (let i = 0; i < u.length; i++) {
      const ostali = izvori.filter((_, j) => j !== i);
      const E = polje(ostali, naboji[i]);
      const Ft = q * (-Math.sin(u[i]) * E.x + Math.cos(u[i]) * E.y);
      const pomak = Math.max(-0.02, Math.min(0.02, (0.02 * Ft) / jedinica));
      u[i] += pomak;
    }
  }
  return u;
}

/** Polje samog provodnika u tački T, za zadati raspored. */
export function poljeProvodnika(p: Provodnik, uglovi: readonly number[], T: V2): V2 {
  return polje(nabojiProvodnika(p, uglovi), T);
}

/** Ravnotežni raspored uz probni naboj δQ u tački T, i izmjereno F/δQ. */
export function izmjeri(p: Provodnik, T: V2, dQ: number, koraka = 500) {
  const uglovi = opusti(p, jednoliko(p), { Q: dQ, x: T.x, y: T.y }, koraka);
  return { uglovi, E: poljeProvodnika(p, uglovi, T) };
}
