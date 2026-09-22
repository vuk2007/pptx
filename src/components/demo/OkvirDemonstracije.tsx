'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import stil from './demo.module.css';

/**
 * Okvir koji dijele sve demonstracije: veliki crtež, malo kontrola,
 * i jedna rečenica dolje koja se mijenja sa stanjem.
 */
export function OkvirDemonstracije({
  naslov,
  oznaka,
  nazadPutanja,
  nazadNaziv,
  kontrole,
  poruka,
  alarm = false,
  napomena,
  onResetuj,
  children,
}: {
  naslov: string;
  /** Silkscreen oznaka gore lijevo, npr. „PERJANIK / H-MOST". */
  oznaka: string;
  nazadPutanja: string;
  nazadNaziv: string;
  kontrole?: ReactNode;
  /** Jedna rečenica koja opisuje trenutno stanje. */
  poruka: string;
  alarm?: boolean;
  /** Sitan tekst: „usporeno", „ilustrativno", „pojednostavljeno". */
  napomena?: string;
  onResetuj: () => void;
  children: ReactNode;
}) {
  return (
    <main className={stil.ploca}>
      <span className={`${stil.rupa} ${stil.rupaGL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaGD}`} aria-hidden="true" />

      <header className={stil.zaglavlje}>
        <div className={stil.naslovnaGrupa}>
          <h1 className={stil.naslov}>{naslov}</h1>
          <span className="oznaka">{oznaka}</span>
        </div>

        <div className={stil.kontrole}>
          {kontrole}
          <button className={stil.dugme} onClick={onResetuj}>
            Resetuj
          </button>
        </div>
      </header>

      <div className={stil.scena}>{children}</div>

      <div className={stil.podnozje}>
        <div>
          {/* Poruka se mijenja, pa čitač ekrana treba da je pročita kad se promijeni. */}
          <p className={`${stil.poruka} ${alarm ? stil.porukaAlarm : ''}`} role="status" aria-live="polite">
            {poruka}
          </p>
          {napomena && <p className={stil.napomena}>{napomena}</p>}
        </div>

        <Link href={nazadPutanja} className={stil.nazad}>
          ← {nazadNaziv}
        </Link>
      </div>
    </main>
  );
}

/**
  Prekidač režima. Stanje se vidi i bez prelaska mišem.

  Kružić i natpis su dva flex djeteta sa razmakom, a ne apsolutno
  pozicionirani pseudo-elementi. Flex djeca se po definiciji ne mogu
  preklopiti; pseudo-elementi izvan toka nisu ni sa čim vezani, pa su se
  u landscape-u, gdje se em računa iz niske visine ekrana, naslanjali na
  tekst.
*/
export function PrekidacRezima({
  ukljucen,
  onPromjena,
  children,
}: {
  ukljucen: boolean;
  onPromjena: (novo: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`${stil.dugme} ${stil.prekidac} ${ukljucen ? stil.prekidacUkljucen : ''}`}
      role="switch"
      aria-checked={ukljucen}
      onClick={() => onPromjena(!ukljucen)}
    >
      <span className={stil.staza} aria-hidden="true">
        <span className={stil.glava} />
      </span>
      <span className={stil.natpisPrekidaca}>{children}</span>
    </button>
  );
}

/** Klizač sa velikom glavom, da se pogodi prstom u gužvi. */
export function Klizac({
  natpis,
  vrijednost,
  prikaz,
  min = 0,
  max = 100,
  korak = 1,
  onPromjena,
}: {
  natpis: string;
  vrijednost: number;
  /** Ispis vrijednosti, npr. „45 %". */
  prikaz: string;
  min?: number;
  max?: number;
  korak?: number;
  onPromjena: (novo: number) => void;
}) {
  return (
    <div className={stil.klizacGrupa}>
      <span className={stil.klizacNatpis}>{natpis}</span>
      <input
        className={stil.klizac}
        type="range"
        min={min}
        max={max}
        step={korak}
        value={vrijednost}
        aria-label={natpis}
        aria-valuetext={prikaz}
        onChange={(e) => onPromjena(Number(e.target.value))}
      />
      <span className={stil.klizacVrijednost}>{prikaz}</span>
    </div>
  );
}
