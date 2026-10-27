/*
  §3 Struja kao izvod naboja, naboj kao integral struje.

  Q → izvod → i:   i(t) = dQ/dt, granica nagiba sječice δQ/δt kad δt → 0.
  i → integral → ΔQ:   Q(t₂) − Q(t₁) = ∫ i dt od t₁ do t₂.

  Konstanta C u Q(t) + C pomjera graf naboja gore ili dolje, a nagib
  (struja) ostaje isti; zato iz i(t) integral daje samo promjenu ΔQ,
  a ne i sam naboj.
*/

export type FunkcijaQ = {
  id: string;
  /** Q(t) u TeX-u, bez konstante C. */
  tex: string;
  /** Ista funkcija kao čitljiv tekst, za natpise na crtežu. */
  tekst: string;
  /** Naboj u kulonima, t u sekundama. */
  Q: (t: number) => number;
  /** Tačan izvod, u amperima. */
  i: (t: number) => number;
  /** Graf ide od 0 do tMax sekundi. */
  tMax: number;
};

export const FUNKCIJE: FunkcijaQ[] = [
  { id: 't2', tex: 'Q(t) = t^2', tekst: 'Q(t) = t²', Q: (t) => t * t, i: (t) => 2 * t, tMax: 5 },
  { id: 'linearna', tex: 'Q(t) = 5t + 2', tekst: 'Q(t) = 5t + 2', Q: (t) => 5 * t + 2, i: () => 5, tMax: 5 },
  { id: 'kvadratna', tex: 'Q(t) = 3t^2 + 4', tekst: 'Q(t) = 3t² + 4', Q: (t) => 3 * t * t + 4, i: (t) => 6 * t, tMax: 5 },
  { id: 'sinus', tex: 'Q(t) = 4\\sin t', tekst: 'Q(t) = 4 sin t', Q: (t) => 4 * Math.sin(t), i: (t) => 4 * Math.cos(t), tMax: 2 * Math.PI },
];

/** Najveći δt na klizaču; t₀ ide najviše do tMax − DT_MAX da sječica ostane na grafu. */
export const DT_MAX = 2;
export const DT_MIN = 0.01;

/** Klizač ide od 0 do 1, a δt od DT_MAX do DT_MIN po logaritamskoj skali. */
export function dtZaPolozaj(p: number): number {
  return DT_MAX * (DT_MIN / DT_MAX) ** p;
}

/** Nagib sječice između t₀ i t₀ + δt: prosječna struja na tom intervalu. */
export function sjecica(Q: (t: number) => number, t0: number, dt: number): number {
  return (Q(t0 + dt) - Q(t0)) / dt;
}

/** ∫ f dt od a do b, Simpsonovim pravilom sa n (parnim) komada. */
export function integral(f: (t: number) => number, a: number, b: number, n = 200): number {
  if (a === b) return 0;
  const m = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / m;
  let s = f(a) + f(b);
  for (let k = 1; k < m; k++) s += f(a + k * h) * (k % 2 === 1 ? 4 : 2);
  return (s * h) / 3;
}

/** Najmanja i najveća vrijednost funkcije na [a, b], uzorkovano gusto. */
export function raspon(f: (t: number) => number, a: number, b: number, n = 400): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (let k = 0; k <= n; k++) {
    const v = f(a + ((b - a) * k) / n);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}
