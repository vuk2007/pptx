import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';

/*
  Prevlačenje tačaka po SVG-u mišem, prstom ili strelicama na tastaturi.

  Pokazivač se pretvara u koordinate crteža kroz getScreenCTM, pa radi
  bez obzira na veličinu crteža. Svaka tačka koja se prevlači dobija
  tabIndex i strelice je pomjeraju za `korakTastature` (Shift: 5 puta više).
  SVG mora imati touch-action: none, inače iPad skroluje umjesto da vuče.
*/

export type Tacka = { x: number; y: number };
export type Okvir = { x0: number; y0: number; x1: number; y1: number };

export function usePrevlacenje({
  svg,
  granice,
  naPomak,
  korakTastature = 10,
}: {
  svg: RefObject<SVGSVGElement | null>;
  granice: Okvir;
  naPomak: (indeks: number, p: Tacka) => void;
  korakTastature?: number;
}) {
  const aktivna = useRef<number | null>(null);

  const stegni = (p: Tacka): Tacka => ({
    x: Math.min(granice.x1, Math.max(granice.x0, p.x)),
    y: Math.min(granice.y1, Math.max(granice.y0, p.y)),
  });

  const uCrtez = (e: PointerEvent): Tacka | null => {
    const s = svg.current;
    const m = s?.getScreenCTM();
    if (!s || !m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  /** Handleri za samu tačku. `polozaj` je trenutni položaj, za tastaturu. */
  const tacka = (indeks: number, polozaj: Tacka) => ({
    tabIndex: 0,
    style: { cursor: 'grab' },
    onPointerDown: (e: PointerEvent<SVGElement>) => {
      e.preventDefault();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      aktivna.current = indeks;
    },
    onPointerMove: (e: PointerEvent<SVGElement>) => {
      if (aktivna.current !== indeks) return;
      const p = uCrtez(e);
      if (p) naPomak(indeks, stegni(p));
    },
    onPointerUp: (e: PointerEvent<SVGElement>) => {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      aktivna.current = null;
    },
    onPointerCancel: () => {
      aktivna.current = null;
    },
    onKeyDown: (e: KeyboardEvent<SVGElement>) => {
      const k = korakTastature * (e.shiftKey ? 5 : 1);
      const pomak: Record<string, Tacka> = {
        ArrowLeft: { x: -k, y: 0 },
        ArrowRight: { x: k, y: 0 },
        ArrowUp: { x: 0, y: -k },
        ArrowDown: { x: 0, y: k },
      };
      const d = pomak[e.key];
      if (!d) return;
      e.preventDefault();
      naPomak(indeks, stegni({ x: polozaj.x + d.x, y: polozaj.y + d.y }));
    },
  });

  return { tacka };
}
