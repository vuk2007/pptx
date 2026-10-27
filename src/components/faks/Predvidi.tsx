'use client';

import { useState, type ReactNode } from 'react';
import stil from './faks.module.css';

/*
  Predviđanje prije pomjeranja. Bez njega simulacija postaje igranje:
  vidiš šta se desi, ali nikad ne provjeriš šta si mislio da će se desiti.

  Dok se ne izabere odgovor, interaktivni dio je zaključan (inert). Odgovor
  se otkriva tek na poseban klik, kad je već bilo vremena da se proba.
  „Preskoči“ otključa bez predviđanja, za ponovni dolazak na stranu.
*/

export function Predvidi({
  pitanje,
  opcije,
  tacna,
  objasnjenje,
  children,
}: {
  pitanje: ReactNode;
  opcije: ReactNode[];
  tacna: number;
  objasnjenje: ReactNode;
  children: ReactNode;
}) {
  const [izbor, postaviIzbor] = useState<number | null>(null);
  const [preskoceno, postaviPreskoceno] = useState(false);
  const [otkriveno, postaviOtkriveno] = useState(false);
  const zakljucano = izbor === null && !preskoceno;

  return (
    <>
      <section className={stil.predvidi} aria-labelledby="predvidi-naslov">
        <h2 id="predvidi-naslov" className={stil.oznakaSekcije}>
          Predvidi prije nego što pomjeriš
        </h2>
        <p className={stil.pitanje}>{pitanje}</p>
        <div className={stil.opcije} role="group" aria-label="Tvoje predviđanje">
          {opcije.map((o, i) => (
            <button
              key={i}
              className={stil.opcija}
              aria-pressed={izbor === i}
              data-tacna={otkriveno && i === tacna ? '' : undefined}
              disabled={otkriveno}
              onClick={() => postaviIzbor(i)}
            >
              {o}
            </button>
          ))}
        </div>

        {zakljucano ? (
          <button className={stil.tiho} onClick={() => postaviPreskoceno(true)}>
            Preskoči predviđanje
          </button>
        ) : !otkriveno ? (
          <p className={stil.dalje}>
            <span>{izbor === null ? 'Probaj na crtežu.' : 'Zapamćeno. Sad probaj na crtežu, pa provjeri.'}</span>
            <button className={stil.dugme} onClick={() => postaviOtkriveno(true)}>
              Otkrij odgovor
            </button>
          </p>
        ) : (
          <div className={stil.odgovor} role="status">
            <p className={stil.odgovorNaslov}>
              {izbor === null
                ? 'Tačan odgovor je označen.'
                : izbor === tacna
                  ? 'Tvoje predviđanje je tačno.'
                  : 'Tvoje predviđanje nije tačno; tačan odgovor je označen.'}
            </p>
            <p>{objasnjenje}</p>
          </div>
        )}
      </section>

      <div className={stil.zakljucavanje} data-zakljucano={zakljucano || undefined}>
        {zakljucano && <p className={stil.natpisZakljucano}>Prvo izaberi odgovor gore, pa se crtež otključa.</p>}
        <div inert={zakljucano} className={stil.sadrzajLaboratorije}>
          {children}
        </div>
      </div>
    </>
  );
}
