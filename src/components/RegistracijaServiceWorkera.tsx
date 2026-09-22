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

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async () => {
        /*
          Krupni fajlovi (3D modeli) se traže tek sada, kad je worker već
          aktivan i strana radi. Da se to radi u njegovom activate događaju,
          aktivacija bi trajala koliko i preuzimanje, a sve to vrijeme
          offline navigacija ne bi imala ko da posluži.

          Poruka ide na registracijin active, a NE na navigator.serviceWorker
          .controller: pri prvoj posjeti strana je učitana bez kontrolera, pa
          se controller popuni tek koji trenutak poslije clients.claim().
          Sa controllerom bi upit tiho promašio i modeli nikad ne bi ušli u keš.

          Šalje se pri svakom učitavanju: već keširano se preskače, a ono što
          je prošli put palo dobija novu priliku.
        */
        const registracija = await navigator.serviceWorker.ready;
        registracija.active?.postMessage('dovuci-krupno');
      })
      .catch(() => {
        /* Bez service workera sajt i dalje radi dok ima mreže. */
      });
  }, []);

  return null;
}
