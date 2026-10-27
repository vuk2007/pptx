import { K } from '@/lib/fizika/elektrostatika';

/*
  §9 Gaussov zakon za zatvorenu površinu.

  Površina je obrtni elipsoid sa poluosama rx (duž x) i ry (u y i z),
  a naboji leže u ravni crteža (z = 0). Crtež je presjek z = 0, pa se
  površina vidi kao elipsa. Fluks se računa brojčano po cijeloj
  prostornoj površini: ∮ E·da = Σ Q_k(unutra)/ε₀, a svaki naboj vani
  daje nulu, jer su mu doprinosi prednje i zadnje strane suprotni.
*/

export type Naboj3 = { Q: number; x: number; y: number };
export type Elipsoid = { cx: number; cy: number; rx: number; ry: number };

export function jeUnutra(n: Naboj3, e: Elipsoid) {
  return ((n.x - e.cx) / e.rx) ** 2 + ((n.y - e.cy) / e.ry) ** 2 < 1;
}

/**
  ∮ E·da za jedan naboj, sredinskim pravilom na mreži nθ × nφ.
  Vektor površine je ∂P/∂θ × ∂P/∂φ, koji gleda prema van.
*/
export function fluksNaboja(n: Naboj3, e: Elipsoid, nTheta = 90, nPhi = 180): number {
  const dT = Math.PI / nTheta;
  const dF = (2 * Math.PI) / nPhi;
  let fluks = 0;
  for (let i = 0; i < nTheta; i++) {
    const t = (i + 0.5) * dT;
    const st = Math.sin(t);
    const ct = Math.cos(t);
    for (let j = 0; j < nPhi; j++) {
      const f = (j + 0.5) * dF;
      const cf = Math.cos(f);
      const sf = Math.sin(f);
      const px = e.cx + e.rx * ct;
      const py = e.cy + e.ry * st * cf;
      const pz = e.ry * st * sf;
      const ax = e.ry * e.ry * st * ct;
      const ay = e.rx * e.ry * st * st * cf;
      const az = e.rx * e.ry * st * st * sf;
      const Rx = px - n.x;
      const Ry = py - n.y;
      const Rz = pz;
      const R2 = Rx * Rx + Ry * Ry + Rz * Rz;
      fluks += ((K * n.Q) / (R2 * Math.sqrt(R2))) * (Rx * ax + Ry * ay + Rz * az) * dT * dF;
    }
  }
  return fluks;
}

export function fluks(naboji: readonly Naboj3[], e: Elipsoid, nTheta?: number, nPhi?: number) {
  return naboji.reduce((s, n) => s + fluksNaboja(n, e, nTheta, nPhi), 0);
}

/**
  Gustina fluksa E·n na obodu presjeka (z = 0), u N tačaka: pozitivno
  gdje polje izlazi, negativno gdje ulazi. Za crtanje.
*/
export function fluksNaObodu(naboji: readonly Naboj3[], e: Elipsoid, N = 120) {
  const tacke: { x: number; y: number; En: number }[] = [];
  for (let k = 0; k < N; k++) {
    const u = (2 * Math.PI * (k + 0.5)) / N;
    const x = e.cx + e.rx * Math.cos(u);
    const y = e.cy + e.ry * Math.sin(u);
    let nx = Math.cos(u) / e.rx;
    let ny = Math.sin(u) / e.ry;
    const d = Math.hypot(nx, ny);
    nx /= d;
    ny /= d;
    let En = 0;
    for (const n of naboji) {
      const Rx = x - n.x;
      const Ry = y - n.y;
      const R2 = Rx * Rx + Ry * Ry;
      if (R2 === 0) continue;
      En += ((K * n.Q) / (R2 * Math.sqrt(R2))) * (Rx * nx + Ry * ny);
    }
    tacke.push({ x, y, En });
  }
  return tacke;
}
