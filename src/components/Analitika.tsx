'use client';

import { useSyncExternalStore } from 'react';
import { Analytics } from '@vercel/analytics/next';

/*
  Vercel Analytics, ali samo na pravoj adresi.

  Skripta se dovlači sa /_vercel/insights/script.js, koji postoji jedino na
  Vercelu. Kad se izvezeni sajt servira lokalno — a tako rade sve naše
  provjere — te putanje nema, pa bi svaka strana javljala grešku u konzoli i
  oborila provjeru koja traži nula grešaka. Zato se ovdje gleda domen.

  Posljedica koju vrijedi znati: ovo je jedini mrežni poziv na cijelom sajtu.
  Sve ostalo ide iz keša. Bez mreže poziv padne, strana radi normalno, a
  posjeta se ne izbroji.
*/

/** useSyncExternalStore traži stabilnu referencu, a ovdje nema šta da se mijenja. */
function prazanUpis() {
  return () => {};
}

function naPravojAdresi() {
  const domacin = window.location.hostname;
  if (domacin === 'localhost' || domacin === '127.0.0.1' || domacin === '[::1]') return false;
  /* Isti pojam sigurnog konteksta koji traži i mikrofon na /jarvis/glas. */
  return window.isSecureContext;
}

export function Analitika() {
  /* Server ne zna domen, pa na serveru uvijek ispada „ne" — bez neslaganja pri hidraciji. */
  const brojimo = useSyncExternalStore(prazanUpis, naPravojAdresi, () => false);

  if (!brojimo) return null;
  return <Analytics />;
}
