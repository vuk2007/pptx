import type { Slucajno } from './slucajno';

/*
  §2 Gustine naboja: isto tijelo kao zapremina, ploča, žica i tačka.

  Naboj Q je raspoređen jednoliko u kvadru a × b × c. Kad se tijelo
  stanjuje, ρ = Q/V raste bez granice, ali ostaje konačna ona gustina
  koja odgovara obliku:
    ploča (c → 0):        σ = ρ·c   = Q/(a·b)
    žica  (b, c → 0):     q = ρ·b·c = Q/a
    tačka (a, b, c → 0):  ostaje samo Q
  Zato se za tanko tijelo ne računa sa ρ, nego sa σ, q ili Q.
*/

export type Model = 'zapremina' | 'ploca' | 'zica' | 'tacka';

/** Polazni kvadar u centimetrima. */
export const KVADAR = { a: 4, b: 3, c: 2 };

export type Dimenzije = { a: number; b: number; c: number };

/**
  Dimenzije za zadati model i faktor tankoće s (1 = polazni kvadar).
  Ploča stanjuje c, žica b i c, tačka sve tri.
*/
export function dimenzije(model: Model, s: number): Dimenzije {
  const { a, b, c } = KVADAR;
  switch (model) {
    case 'zapremina':
      return { a, b, c };
    case 'ploca':
      return { a, b, c: c * s };
    case 'zica':
      return { a, b: b * s, c: c * s };
    case 'tacka':
      return { a: a * s, b: b * s, c: c * s };
  }
}

export function gustine(Q: number, d: Dimenzije) {
  const V = d.a * d.b * d.c;
  return {
    V,
    rho: Q / V,
    /** Površinska: naboj po površini velike strane a × b. */
    sigma: Q / (d.a * d.b),
    /** Linijska: naboj po dužini a. */
    q: Q / d.a,
  };
}

/* ------------------------------------------------------------ od atoma do kontinuuma */

export type Tacka = { x: number; y: number };

/** Nasumično razbacani naboji u kvadratu stranice L, sa zadatim brojem. */
export function razbaci(broj: number, L: number, rnd: Slucajno): Tacka[] {
  return Array.from({ length: broj }, () => ({ x: rnd() * L, y: rnd() * L }));
}

/** Koliko naboja je u kvadratu stranice l sa centrom u c. */
export function uKvadratu(tacke: readonly Tacka[], c: Tacka, l: number) {
  const h = l / 2;
  let n = 0;
  for (const t of tacke) if (Math.abs(t.x - c.x) <= h && Math.abs(t.y - c.y) <= h) n++;
  return n;
}

/** Procjena gustine iz prebrojanog: N / l². Za mali kvadrat skače između nule i ogromnog broja. */
export function procjena(tacke: readonly Tacka[], c: Tacka, l: number) {
  return uKvadratu(tacke, c, l) / (l * l);
}
