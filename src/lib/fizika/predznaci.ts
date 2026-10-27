import { zbir, type Grana } from '@/lib/fizika/kirchhoff';

/*
  §5 Predznaci u pet koraka, za tijelo u koje ulaze i iz kojeg izlaze žice.

  1. smjer: na svakoj žici strelica u tijelo ili iz tijela
  2. struja van sa predznakom: + za strelicu prema van, − prema unutra
  3. izvor (struja van > 0), ponor (< 0) ili ni jedno ni drugo
  4. naboj unutra opada kod izvora, raste kod ponora
  5. Q_not(t) = Q_not(0) − i_van · t, za stalne struje

  Okretanje normale prema unutra mijenja predznak koraka 2, ali ne i
  stvarnost: izvor ostaje izvor, a naboj i dalje opada.
*/

export type Uloga = 'izvor' | 'ponor' | 'nista';
export type Promjena = 'opada' | 'raste' | 'stalno';

/** Struja kroz površinu tijela u smjeru normale: +1 prema van, −1 prema unutra. */
export function strujaKrozPovrsinu(grane: readonly Grana[], normala: 1 | -1) {
  return normala * zbir(grane);
}

/** Uloga ne zavisi od normale: gleda se šta naboj stvarno radi. */
export function uloga(grane: readonly Grana[]): Uloga {
  const s = zbir(grane);
  if (Math.abs(s) < 1e-12) return 'nista';
  return s > 0 ? 'izvor' : 'ponor';
}

export function promjena(grane: readonly Grana[]): Promjena {
  const u = uloga(grane);
  return u === 'izvor' ? 'opada' : u === 'ponor' ? 'raste' : 'stalno';
}

/** Naboj unutra poslije vremena t, za stalne struje. */
export function nabojUnutra(t: number, pocetni: number, grane: readonly Grana[]) {
  return pocetni - zbir(grane) * t;
}
