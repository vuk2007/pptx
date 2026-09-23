'use client';

import type { CSSProperties, ReactNode, Ref } from 'react';
import Link from 'next/link';
import { neprelomno } from '@/lib/format';
import stil from './instrument.module.css';

/*
  Okvir svake demonstracije, raspoređen kao mjerni instrument:

    naslov                                   [režimi] [Resetuj]
    ┌ šema ─────────────────────┐ ┌ očitavanja ┐
    │                           │ │            │
    └───────────────────────────┘ │            │
    ┌ šta i zašto ┐ ┌ osciloskop ┐ │            │
    └─────────────┘ └────────────┘ └────────────┘

  Sve staje na jedan ekran — na TV-u niko ne skroluje klikerom.
*/

export function Okvir({
  nazad,
  naslov,
  uvod,
  rezimi,
  onResetuj,
  sema,
  status,
  osciloskop,
  strana,
}: {
  /** Kuda vodi putanja gore lijevo, npr. { naziv: 'Perjanik', putanja: '/perjanik' }. */
  nazad: { naziv: string; putanja: string };
  naslov: string;
  /** Jedna rečenica ispod naslova. */
  uvod: string;
  rezimi?: ReactNode;
  onResetuj: () => void;
  sema: ReactNode;
  status: ReactNode;
  osciloskop?: ReactNode;
  strana: ReactNode;
}) {
  return (
    <main className={stil.okvir}>
      <header className={stil.zaglavlje}>
        <div className={stil.naslovi}>
          <Link href={nazad.putanja} className={stil.putanja}>
            <span aria-hidden="true">←</span>
            Praktikum elektronike, {nazad.naziv}
          </Link>
          <h1 className={stil.naslov}>{naslov}</h1>
          <p className={stil.uvod}>{uvod}</p>
        </div>
        <div className={stil.komande}>
          {rezimi}
          <button className={stil.dugme} onClick={onResetuj}>
            Resetuj
          </button>
        </div>
      </header>

      <div className={stil.tijelo}>
        <div className={stil.glavno}>
          <section className={`${stil.panel} ${stil.sema}`}>{sema}</section>
          <div className={osciloskop ? stil.dno : stil.dnoSamo}>
            {status}
            {osciloskop}
          </div>
        </div>
        <aside className={stil.strana}>{strana}</aside>
      </div>
    </main>
  );
}

/** Izbor režima kao segmentirani prekidač. */
export function Rezimi<T extends string>({
  opis,
  opcije,
  izabran,
  onIzbor,
}: {
  opis: string;
  opcije: readonly { id: T; natpis: string }[];
  izabran: T;
  onIzbor: (id: T) => void;
}) {
  return (
    <div className={stil.rezimi} role="group" aria-label={opis}>
      {opcije.map((o) => (
        <button key={o.id} aria-pressed={o.id === izabran} onClick={() => onIzbor(o.id)}>
          {o.natpis}
        </button>
      ))}
    </div>
  );
}

/** Dvije linije koje se mijenjaju sa stanjem: šta se upravo dešava, i zašto. */
export function StatusLinija({ sta, zasto, greska = false }: { sta: string; zasto: string; greska?: boolean }) {
  return (
    <section className={`${stil.panel} ${stil.status}`} role="status" aria-live="polite">
      <p className={`${stil.sta} ${greska ? stil.staGreska : ''}`}>{neprelomno(sta)}</p>
      <p className={stil.zasto}>{neprelomno(zasto)}</p>
    </section>
  );
}

/** Mreža očitavanja, po dva u redu, odvojena tankim linijama. */
export function Ocitavanja({ children }: { children: ReactNode }) {
  return <div className={`${stil.panel} ${stil.ocitavanja}`}>{children}</div>;
}

export function Ocitavanje({
  natpis,
  vrijednost,
  jedinica,
  pod,
  vruce = false,
}: {
  natpis: string;
  vrijednost: string;
  jedinica: string;
  /** Sitna linija ispod vrijednosti. Prazna linija i dalje drži mjesto. */
  pod?: string;
  /** Vrijednost van granice: u boji greške. */
  vruce?: boolean;
}) {
  return (
    <div className={`${stil.ocitavanje} ${vruce ? stil.vruce : ''}`}>
      <p className={stil.natpis}>{natpis}</p>
      <div className={stil.vrijednost}>
        {vrijednost}
        <small>{jedinica}</small>
      </div>
      <div className={stil.pod}>{pod || ' '}</div>
    </div>
  );
}

/** Točak na motoru sa reduktorom, brzina i smjer. Točak okreće demonstracija kroz ref. */
export function KarticaTocka({
  natpis,
  obrtaja,
  smjer,
  tocakRef,
}: {
  natpis: string;
  obrtaja: number;
  smjer: string;
  tocakRef: Ref<SVGGElement>;
}) {
  return (
    <div className={`${stil.panel} ${stil.tocak}`}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <g ref={tocakRef} style={{ transformOrigin: '100px 100px' }}>
          <circle cx={100} cy={100} r={82} fill="none" stroke="var(--text)" strokeWidth={16} opacity={0.9} />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={100 + 76 * Math.cos(a)}
                y1={100 + 76 * Math.sin(a)}
                x2={100 + 88 * Math.cos(a)}
                y2={100 + 88 * Math.sin(a)}
                stroke="var(--panel)"
                strokeWidth={3}
                opacity={0.55}
              />
            );
          })}
          <circle cx={100} cy={100} r={58} fill="none" stroke="var(--line)" strokeWidth={3} />
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={100 + 13 * Math.cos(a)}
                y1={100 + 13 * Math.sin(a)}
                x2={100 + 58 * Math.cos(a)}
                y2={100 + 58 * Math.sin(a)}
                stroke="var(--line)"
                strokeWidth={6}
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={100} cy={100} r={13} fill="var(--djeluj)" />
        </g>
      </svg>
      <div>
        <p className={stil.natpis}>{natpis}</p>
        <p className={stil.veliko}>
          {obrtaja}
          <small>o/min</small>
        </p>
        <p className={stil.smjer}>{smjer}</p>
      </div>
    </div>
  );
}

/** Panel sa kontrolama na strani. */
export function PanelKontrola({ children }: { children: ReactNode }) {
  return <div className={`${stil.panel} ${stil.kontrole}`}>{children}</div>;
}

/**
  Taster. Sa `pritisnut` je prekidač koji drži stanje (aria-pressed);
  bez njega je obično dugme. Boja nosi značenje, pa se zadaje imenom tokena.
*/
export function Taster({
  pritisnut,
  boja = 'text',
  onClick,
  disabled,
  children,
}: {
  pritisnut?: boolean;
  boja?: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={stil.taster}
      style={{ '--boja-tastera': `var(--${boja})` } as CSSProperties}
      aria-pressed={pritisnut}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/** Klizač sa natpisom i vrijednošću iznad, meta za prst visoka 44 px. */
export function Klizac({
  id,
  natpis,
  vrijednost,
  prikaz,
  min = 0,
  max = 100,
  korak = 1,
  boja = 'odluci',
  onPromjena,
}: {
  id: string;
  natpis: string;
  vrijednost: number;
  prikaz: string;
  min?: number;
  max?: number;
  korak?: number;
  boja?: string;
  onPromjena: (novo: number) => void;
}) {
  return (
    <div className={stil.klizac} style={{ '--boja-klizaca': `var(--${boja})` } as CSSProperties}>
      <label htmlFor={id}>
        {natpis} <span>{prikaz}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={korak}
        value={vrijednost}
        aria-valuetext={prikaz}
        onChange={(e) => onPromjena(Number(e.target.value))}
      />
    </div>
  );
}

/** Sitna napomena na dnu strane: šta je ilustrativno ili usporeno. */
export function Napomena({ children }: { children: ReactNode }) {
  return <p className={stil.napomena}>{children}</p>;
}

export { stil as instrumentStil };
