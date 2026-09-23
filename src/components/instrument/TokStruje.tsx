'use client';

import { useRef, type ReactNode } from 'react';
import { useAnimacija } from '@/lib/animacija';
import { PRAG_KRETANJA, RAZMAK_CESTICA, tackaNa, type Putanja } from '@/lib/tok';

/*
  Struja kroz šemu: široka prigušena traka duž puta i tačke koje po njoj
  putuju. Brzinu i smjer daje demonstracija iz fizike; ova komponenta samo
  pomjera tačke, direktno kroz DOM, bez prolaska kroz React u svakom kadru.

  Djeca se crtaju između trake i tačaka: traka ide ispod dijelova šeme,
  tačke preko njih. Tačke ne primaju dodir, da ne zaklone prekidač.
*/

export type Tok = {
  putanja: Putanja;
  /** Brzina tačaka u px/s duž putanje; znak je smjer. */
  brzina: number;
  /** Vidljivost trake ispod tačaka, od 0 do 1. */
  jacina: number;
  /** Kratak spoj: traka i tačke u boji greške. */
  greska: boolean;
};

const NAJVISE_TACAKA = 70;

export function TokStruje({ citaj, children }: { citaj: () => Tok | null; children?: ReactNode }) {
  const trakaRef = useRef<SVGPolylineElement | null>(null);
  const tackeRef = useRef<(SVGCircleElement | null)[]>([]);
  const pomak = useRef(0);
  const prethodna = useRef<Putanja | null>(null);

  useAnimacija((dt) => {
    const traka = trakaRef.current;
    if (!traka) return;
    const tok = citaj();
    const vidljiv = tok !== null && Math.abs(tok.brzina) > PRAG_KRETANJA;

    if (!vidljiv) {
      traka.setAttribute('opacity', '0');
      for (const c of tackeRef.current) c?.setAttribute('visibility', 'hidden');
      return;
    }

    const { putanja } = tok;
    if (prethodna.current !== putanja) {
      traka.setAttribute('points', putanja.tacke);
      prethodna.current = putanja;
    }
    const boja = tok.greska ? 'var(--fault)' : 'var(--current)';
    traka.setAttribute('stroke', boja);
    traka.setAttribute('opacity', tok.jacina.toFixed(3));

    pomak.current += tok.brzina * dt;
    const n = Math.min(NAJVISE_TACAKA, Math.floor(putanja.duzina / RAZMAK_CESTICA));
    tackeRef.current.forEach((c, i) => {
      if (!c) return;
      if (i >= n) {
        c.setAttribute('visibility', 'hidden');
        return;
      }
      const [x, y] = tackaNa(putanja, pomak.current + i * (putanja.duzina / n));
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('fill', boja);
      c.setAttribute('visibility', 'visible');
    });
  });

  return (
    <>
      <polyline
        ref={trakaRef}
        points=""
        fill="none"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0}
        aria-hidden="true"
      />
      {children}
      <g aria-hidden="true" pointerEvents="none">
      {Array.from({ length: NAJVISE_TACAKA }, (_, i) => (
        <circle
          key={i}
          ref={(el) => {
            tackeRef.current[i] = el;
          }}
          r={4.5}
          cx={0}
          cy={0}
          visibility="hidden"
        />
      ))}
      </g>
    </>
  );
}
