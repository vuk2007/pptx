import { useEffect, useRef } from 'react';

/**
 * Petlja na requestAnimationFrame. Korak dobija proteklo vrijeme u sekundama,
 * ograničeno odozgo — kad se kartica vrati iz pozadine, dt ne smije da skoči
 * na nekoliko sekundi i baci simulaciju u besmislicu.
 *
 * Namjerno ne poštuje prefers-reduced-motion: ovdje pokret nosi objašnjenje,
 * nije ukras. Dekorativni pokret staje kroz CSS.
 */
export function useAnimacija(korak: (dt: number) => void, aktivno = true) {
  const korakRef = useRef(korak);

  useEffect(() => {
    korakRef.current = korak;
  });

  useEffect(() => {
    if (!aktivno) return;

    let zahtjev = 0;
    let prethodni = performance.now();

    const petlja = (sada: number) => {
      const dt = Math.min(0.05, Math.max(0, (sada - prethodni) / 1000));
      prethodni = sada;
      korakRef.current(dt);
      zahtjev = requestAnimationFrame(petlja);
    };

    zahtjev = requestAnimationFrame(petlja);
    return () => cancelAnimationFrame(zahtjev);
  }, [aktivno]);
}

/** Eksponencijalno primicanje cilju, nezavisno od broja kadrova u sekundi. */
export function primakni(trenutno: number, cilj: number, brzina: number, dt: number) {
  return trenutno + (cilj - trenutno) * (1 - Math.exp(-brzina * dt));
}
