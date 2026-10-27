import { useSyncExternalStore } from 'react';

/*
  prefers-reduced-motion na faksu: simulacije koje se same kreću tada
  počinju zaustavljene, a pokreću se dugmetom. Brojevi i crtež se i dalje
  mijenjaju sa kontrolama, samo ništa ne klizi samo od sebe.
*/

const UPIT = '(prefers-reduced-motion: reduce)';

function upisi(javi: () => void) {
  const m = window.matchMedia(UPIT);
  m.addEventListener('change', javi);
  return () => m.removeEventListener('change', javi);
}

export function useSmanjenPokret() {
  return useSyncExternalStore(
    upisi,
    () => window.matchMedia(UPIT).matches,
    () => false,
  );
}
