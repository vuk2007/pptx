/*
  §6 Kirchhoffov zakon za struje, za čvor.

  Svaka žica ima strelicu (orijentaciju) i struju sa predznakom. Dogovor:
  struja orijentisana iz čvora ulazi u zbir sa +, u čvor sa −. Ako zbir
  nije nula, naboj u čvoru se mijenja: dQ_not/dt = −Σ(±)i_k.

  Struja od −3 A sa strelicom iz čvora i struja od 3 A sa strelicom u čvor
  su ista stvarnost: pozitivan naboj teče u čvor.
*/

export type Orijentacija = 'u' | 'iz';
export type Grana = { i: number; orijentacija: Orijentacija };

/** Σ(±)i_k: + za struju orijentisanu iz čvora, − za struju u čvor. */
export function zbir(grane: readonly Grana[]): number {
  let s = 0;
  for (const g of grane) s += g.orijentacija === 'iz' ? g.i : -g.i;
  return s;
}

/** Brzina kojom se naboj u čvoru mijenja, dQ_not/dt. */
export function promjenaNaboja(grane: readonly Grana[]): number {
  return -zbir(grane);
}

/** Struja koju grana `indeks` mora imati (uz svoju strelicu) da zbir bude nula. */
export function izjednaci(grane: readonly Grana[], indeks: number): number {
  const s = zbir(grane.filter((_, k) => k !== indeks));
  return grane[indeks].orijentacija === 'iz' ? -s : s;
}

/** Stvarni smjer pozitivnog naboja u grani: +1 iz čvora, −1 u čvor, 0 kad struje nema. */
export function stvarniSmjer(g: Grana): -1 | 0 | 1 {
  if (g.i === 0) return 0;
  const ka = g.orijentacija === 'iz' ? 1 : -1;
  return Math.sign(g.i) * ka > 0 ? 1 : -1;
}
