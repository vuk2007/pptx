import type { Ref } from 'react';
import s from './sema.module.css';

/*
  Strelica kao linija i trougao, bez <marker>: marker sa context-stroke ne
  radi svuda na iPadu, a trougao uvijek preuzme boju klase.
*/
export function vrhStrelice(x1: number, y1: number, x2: number, y2: number, velicina = 16) {
  const d = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / d;
  const uy = (y2 - y1) / d;
  const sirina = velicina * 0.5;
  const bx = x2 - ux * velicina;
  const by = y2 - uy * velicina;
  return `${x2},${y2} ${bx - uy * sirina},${by + ux * sirina} ${bx + uy * sirina},${by - ux * sirina}`;
}

export function Strelica({
  x1,
  y1,
  x2,
  y2,
  boja,
  velicina = 16,
  debljina,
  linijaRef,
  vrhRef,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Klasa boje iz sema.module.css: plus, minus, normala, brzina, struja, polje, neutralno. */
  boja: keyof typeof s;
  velicina?: number;
  debljina?: number;
  linijaRef?: Ref<SVGLineElement>;
  vrhRef?: Ref<SVGPolygonElement>;
}) {
  const d = Math.hypot(x2 - x1, y2 - y1) || 1;
  /* Linija staje u podnožju vrha, da tupi kraj ne viri ispred šiljka. */
  const kx = x2 - ((x2 - x1) / d) * velicina * 0.8;
  const ky = y2 - ((y2 - y1) / d) * velicina * 0.8;
  return (
    <g className={`${s.strelica} ${s[boja]}`}>
      <line ref={linijaRef} x1={x1} y1={y1} x2={kx} y2={ky} style={debljina ? { strokeWidth: debljina } : undefined} />
      <polygon ref={vrhRef} points={vrhStrelice(x1, y1, x2, y2, velicina)} />
    </g>
  );
}
