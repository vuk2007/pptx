'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Komponenta, Led, SilkTekst, Strelica, Vod } from '@/components/ploca/primitivi';
import stil from './ulaz.module.css';

/*
  Prva strana na štandu: čiji je štand i koja dva projekta stoje na njemu.

  Strelicama se bira, Enterom ulazi — presenter klikere šalju baš strelice.
  Fokus se pomjera na pravi <a>, pa Enter radi sam od sebe i ne treba mu
  posebna logika koja bi mogla da se raziđe sa onim što link zaista radi.
*/

const PROJEKTI = [
  {
    putanja: '/robotika',
    naziv: 'Robotika',
    opis: 'Tri robota i elektronika iza njih: senzor, mozak i motor.',
    mentor: 'Praktikum elektronike',
    boja: 'var(--osjeti)',
    crtez: <CrtezRobotike />,
  },
  {
    putanja: '/simulator',
    naziv: 'Simulator letenja',
    opis: 'Komande helikoptera izbliza, u tri dimenzije.',
    mentor: 'Drugi mentor',
    boja: 'var(--bakar-struja)',
    crtez: <CrtezSimulatora />,
  },
];

export function Ulaz() {
  const veze = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    function naTaster(dogadjaj: KeyboardEvent) {
      const trenutni = veze.current.findIndex((v) => v === document.activeElement);

      switch (dogadjaj.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          dogadjaj.preventDefault();
          veze.current[trenutni < 0 ? 0 : (trenutni + 1) % PROJEKTI.length]?.focus();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          dogadjaj.preventDefault();
          veze.current[
            trenutni < 0 ? PROJEKTI.length - 1 : (trenutni - 1 + PROJEKTI.length) % PROJEKTI.length
          ]?.focus();
          break;
        case '1':
        case '2': {
          const i = Number(dogadjaj.key) - 1;
          if (i < PROJEKTI.length) veze.current[i]?.focus();
          break;
        }
      }
    }

    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
  }, []);

  return (
    <main className={stil.ploca}>
      <span className={`${stil.rupa} ${stil.rupaGL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaGD}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaDL}`} aria-hidden="true" />
      <span className={`${stil.rupa} ${stil.rupaDD}`} aria-hidden="true" />

      <header className={stil.zaglavlje}>
        {/* Logo je slika, a ne inline SVG, da se mijenja bez diranja koda. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/prona.svg" alt="Prona" className={stil.logo} />
        <h1 className={stil.naslov}>Praktikum elektronike</h1>
        <p className={stil.podnaslov}>Izaberi šta hoćeš da vidiš.</p>
      </header>

      <div className={stil.izbor}>
        <div className={stil.sabirnica} aria-hidden="true" />

        <nav className={stil.projekti} aria-label="Projekti">
          {PROJEKTI.map((p, i) => (
            <Link
              key={p.putanja}
              href={p.putanja}
              ref={(el) => {
                veze.current[i] = el;
              }}
              className={stil.projekat}
              style={{ ['--boja' as string]: p.boja }}
            >
              <span className={stil.nazivProjekta}>{p.naziv}</span>
              <div className={stil.crtez} aria-hidden="true">
                {p.crtez}
              </div>
              <div>
                <p className={stil.opisProjekta}>{p.opis}</p>
                <span className={stil.mentor}>{p.mentor}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className={stil.podnozje}>
        <span className={`${stil.savjet} ${stil.samoDodir}`}>dodirni šta hoćeš da otvoriš</span>
        <span className={`${stil.savjet} ${stil.samoTaster}`}>
          <span className={stil.taster}>←</span>
          <span className={stil.taster}>→</span>
          biraj
        </span>
        <span className={`${stil.savjet} ${stil.samoTaster}`}>
          <span className={stil.taster}>↵</span>
          otvori
        </span>
      </div>
    </main>
  );
}

/** Petlja u malom: ista tri koraka koja nose cijeli dio o robotici. */
function CrtezRobotike() {
  const y = 96;
  const stanice = [
    { x: 120, boja: 'osjeti' as const, natpis: 'SENZOR' },
    { x: 330, boja: 'odluci' as const, natpis: 'MOZAK' },
    { x: 540, boja: 'djeluj' as const, natpis: 'MOTOR' },
  ];
  const pola = 74;
  const visina = 62;

  return (
    <svg viewBox="0 0 660 200" preserveAspectRatio="xMidYMid meet">
      {stanice.slice(0, -1).map((s, i) => (
        <g key={s.natpis}>
          <Vod tacke={`${s.x + pola},${y} ${stanice[i + 1].x - pola},${y}`} debljina={5} struja="naprijed" brzina={0.9} />
          <Strelica x={(s.x + pola + stanice[i + 1].x - pola) / 2} y={y} />
        </g>
      ))}

      {stanice.map((s) => (
        <g key={s.natpis}>
          <Komponenta
            x={s.x - pola}
            y={y - visina / 2}
            w={pola * 2}
            h={visina}
            natpis={s.natpis}
            boja={`var(--${s.boja})`}
            noge={2}
          />
          <Led x={s.x} y={y - visina / 2 - 32} boja={s.boja} r={11} />
        </g>
      ))}

      <Vod tacke={`540,${y + visina / 2} 540,168 508,190 152,190 120,168 120,${y + visina / 2}`} debljina={5} struja="naprijed" brzina={1.3} />
      <Strelica x={330} y={190} ugao={180} />
    </svg>
  );
}

/** Kolektiv: ručica kojom se u helikopteru podiže i spušta potisak. */
function CrtezSimulatora() {
  const boja = 'var(--bakar-struja)';

  /* Ista ručica u dva položaja — zato ista dužina, samo drugi ugao. */
  const osX = 258;
  const osY = 150;
  const duzina = 146;
  const vrh = (stepeni: number) => {
    const a = (stepeni * Math.PI) / 180;
    return { x: osX + Math.cos(a) * duzina, y: osY - Math.sin(a) * duzina };
  };

  const dolje = vrh(15);
  const gore = vrh(42);

  /* Luk se uzorkuje, da ne zavisi od pogađanja zastavica u SVG putanji. */
  const luk = Array.from({ length: 14 }, (_, i) => {
    const t = vrh(15 + ((42 - 15) * i) / 13);
    return `${t.x.toFixed(1)},${t.y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 660 200" preserveAspectRatio="xMidYMid meet">
      {/* podnožje */}
      <rect x={168} y={152} width={228} height={26} rx={6} fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={3} />

      {/* spušteni položaj, prigušen */}
      <g opacity={0.32}>
        <line x1={osX} y1={osY} x2={dolje.x} y2={dolje.y} stroke={boja} strokeWidth={10} strokeLinecap="round" />
        <circle cx={dolje.x} cy={dolje.y} r={17} fill="none" stroke={boja} strokeWidth={6} />
      </g>

      {/* podignuti položaj */}
      <line x1={osX} y1={osY} x2={gore.x} y2={gore.y} stroke={boja} strokeWidth={11} strokeLinecap="round" />
      <circle cx={gore.x} cy={gore.y} r={18} fill="var(--maska-svijetla)" stroke={boja} strokeWidth={7} />

      {/* hod između dva položaja */}
      <polyline points={luk} fill="none" stroke="var(--silkscreen-tih)" strokeWidth={3} strokeDasharray="8 7" />

      <circle cx={osX} cy={osY} r={9} fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={4} />

      <SilkTekst x={442} y={gore.y + 6} velicina={19} boja={boja}>
        gore
      </SilkTekst>
      <SilkTekst x={442} y={dolje.y + 6} velicina={19} boja="var(--silkscreen-tih)" debljina={400}>
        dolje
      </SilkTekst>
      <SilkTekst x={282} y={196} sredina velicina={17} boja="var(--silkscreen-tih)" debljina={400}>
        kolektiv
      </SilkTekst>
    </svg>
  );
}
