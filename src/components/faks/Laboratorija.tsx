import type { ReactNode } from 'react';
import stil from './faks.module.css';

/*
  Interaktivni dio eksperimenta: crtež, pa kontrole i očitavanja.
  Na širokom ekranu stoje jedno pored drugog, na uskom jedno ispod drugog.
*/
export function Laboratorija({
  crtez,
  kontrole,
  ocitavanja,
  status,
}: {
  crtez: ReactNode;
  kontrole: ReactNode;
  ocitavanja?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <section className={stil.laboratorija} aria-label="Interaktivni dio">
      <figure className={stil.crtez}>{crtez}</figure>
      <div className={stil.bocno}>
        <div className={stil.kontrole}>{kontrole}</div>
        {ocitavanja}
      </div>
      {status && <div className={stil.statusLab}>{status}</div>}
    </section>
  );
}

/** Red dugmadi u kontrolama. */
export function RedDugmadi({ opis, children }: { opis: string; children: ReactNode }) {
  return (
    <div className={stil.redDugmadi} role="group" aria-label={opis}>
      {children}
    </div>
  );
}
