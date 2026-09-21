'use client';

import { useEffect } from 'react';

/**
 * Registruje service worker koji prekešira cio izvezeni sajt.
 * Bez njega sajt radi, ali samo dok ima mreže.
 */
export function RegistracijaServiceWorkera() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* Bez service workera sajt i dalje radi dok ima mreže. */
    });
  }, []);

  return null;
}
