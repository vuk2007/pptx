import { EPS0 } from '@/lib/fizika/elektrostatika';
import type { V2 } from '@/lib/fizika/elektrostatika';

/*
  §8 Cijev i koaksijalni kabel, u presjeku.

  Dugačka cijev poluprečnika a sa nabojem q po dužini: unutra nema polja,
  vani je polje isto kao od prave u osi, q/(2πε₀ρ). Koaksijalni kabel:
  unutrašnji vodič (a) nosi +q, spoljašnji plašt (b) −q, pa polje postoji
  samo između njih.

  Za provjeru i crtanje cijev je i niz n pravih po obodu presjeka.
*/

export function cijevPolje(q: number, a: number, rho: number) {
  return rho < a ? 0 : q / (2 * Math.PI * EPS0 * rho);
}

export function koaksPolje(q: number, a: number, b: number, rho: number) {
  if (rho < a || rho > b) return 0;
  return q / (2 * Math.PI * EPS0 * rho);
}

/** Polje n pravih, svaka sa q/n, raspoređenih po krugu poluprečnika a oko centra. */
export function obodKaoPrave(q: number, a: number, n: number, T: V2): V2 {
  let x = 0;
  let y = 0;
  for (let k = 0; k < n; k++) {
    const fi = (2 * Math.PI * (k + 0.5)) / n;
    const rx = T.x - a * Math.cos(fi);
    const ry = T.y - a * Math.sin(fi);
    const r2 = rx * rx + ry * ry;
    if (r2 === 0) continue;
    const s = q / n / (2 * Math.PI * EPS0 * r2);
    x += s * rx;
    y += s * ry;
  }
  return { x, y };
}
