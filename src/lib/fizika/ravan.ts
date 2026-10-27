import { EPS0 } from '@/lib/fizika/elektrostatika';
import type { V2 } from '@/lib/fizika/elektrostatika';

/*
  §8 Ravan i kondenzator, u presjeku.

  Ravan okomita na crtež je niz beskonačnih pravih (u presjeku: tačaka),
  svaka sa q = σ·dy. Traka širine 2w na x = x₀, od y = −w do w, daje
      E_x = σ/(2πε₀) [ atan((w − y)/(x − x₀)) + atan((w + y)/(x − x₀)) ]
      E_y = σ/(4πε₀) ln( ((x − x₀)² + (y + w)²) / ((x − x₀)² + (y − w)²) )
  Za w → ∞ ostaje σ/(2ε₀), sa obje strane, od ravni prema van.
  Dvije suprotne ravni: između σ/ε₀, vani nula.
*/

export function ravanPolje(sigma: number) {
  return sigma / (2 * EPS0);
}

export function trakaPolje(sigma: number, w: number, x0: number, T: V2): V2 {
  const dx = T.x - x0;
  if (dx === 0 && Math.abs(T.y) < w) return { x: 0, y: 0 };
  const Ex =
    dx === 0
      ? 0
      : (sigma / (2 * Math.PI * EPS0)) * (Math.atan((w - T.y) / dx) + Math.atan((w + T.y) / dx));
  const Ey = (sigma / (4 * Math.PI * EPS0)) * Math.log((dx * dx + (T.y + w) ** 2) / (dx * dx + (T.y - w) ** 2));
  return { x: Ex, y: Ey };
}

/** Ista traka kao zbir n pravih: svaka daje q/(2πε₀ r) u smjeru od prave. */
export function trakaKaoPrave(sigma: number, w: number, x0: number, T: V2, n: number): V2 {
  const dy = (2 * w) / n;
  let x = 0;
  let y = 0;
  for (let k = 0; k < n; k++) {
    const yp = -w + (k + 0.5) * dy;
    const rx = T.x - x0;
    const ry = T.y - yp;
    const r2 = rx * rx + ry * ry;
    if (r2 === 0) continue;
    const k2 = (sigma * dy) / (2 * Math.PI * EPS0 * r2);
    x += k2 * rx;
    y += k2 * ry;
  }
  return { x, y };
}

/** Kondenzator: +σ na x = −d/2, −σ na x = +d/2, obje trake širine 2w. */
export function kondenzatorPolje(sigma: number, w: number, d: number, T: V2): V2 {
  const a = trakaPolje(sigma, w, -d / 2, T);
  const b = trakaPolje(-sigma, w, d / 2, T);
  return { x: a.x + b.x, y: a.y + b.y };
}
