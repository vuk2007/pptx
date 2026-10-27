/*
  Skalarni i vektorski proizvod.

  a·b = a_x b_x + a_y b_y + a_z b_z = a b cos α: broj, najveći za
  paralelne vektore, nula za okomite, negativan preko 90°.

  a × b je vektor okomit na oba, iznosa a b sin α (površina
  paralelograma), smjera po pravilu desne ruke: x × y = z. Redoslijed
  je bitan: b × a = −(a × b). Zato u Lorentzovoj sili stoji w × B.
*/

export type V3 = { x: number; y: number; z: number };

export const v3 = (x: number, y: number, z = 0): V3 => ({ x, y, z });
export const iznos = (a: V3) => Math.hypot(a.x, a.y, a.z);

export function skalarni(a: V3, b: V3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vektorski(a: V3, b: V3): V3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

/** Ugao između vektora, od 0 do π. */
export function ugao(a: V3, b: V3) {
  const n = iznos(a) * iznos(b);
  if (n === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, skalarni(a, b) / n)));
}

/** Projekcija vektora a na pravac b, sa predznakom: a cos α. */
export function projekcija(a: V3, b: V3) {
  const nb = iznos(b);
  return nb === 0 ? 0 : skalarni(a, b) / nb;
}
