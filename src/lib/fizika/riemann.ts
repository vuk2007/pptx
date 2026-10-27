/*
  Od sume do integrala: m pravougaonika ispod krive.

  Svaki pravougaonik ima širinu δt = (b − a)/m i visinu funkcije u
  jednoj tački svog intervala: lijevo, desno ili u sredini. Zbir teži
  integralu kad m raste; lijevo i desno pravilo griješe sa 1/m, a
  sredinsko sa 1/m².
*/

export type Pravilo = 'lijevo' | 'sredina' | 'desno';

export function tackaUzorka(a: number, dt: number, k: number, pravilo: Pravilo) {
  const pomak = pravilo === 'lijevo' ? 0 : pravilo === 'desno' ? 1 : 0.5;
  return a + (k + pomak) * dt;
}

export function riemannSuma(f: (t: number) => number, a: number, b: number, m: number, pravilo: Pravilo) {
  const dt = (b - a) / m;
  let s = 0;
  for (let k = 0; k < m; k++) s += f(tackaUzorka(a, dt, k, pravilo)) * dt;
  return s;
}

/** Pravougaonici za crtanje: početak, širina i visina. */
export function pravougaonici(f: (t: number) => number, a: number, b: number, m: number, pravilo: Pravilo) {
  const dt = (b - a) / m;
  return Array.from({ length: m }, (_, k) => ({ t: a + k * dt, dt, visina: f(tackaUzorka(a, dt, k, pravilo)) }));
}
