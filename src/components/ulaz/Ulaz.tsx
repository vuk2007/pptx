'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sema } from '@/components/slajdovi/crtezi';
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
    crtez: <Sema kljuc="petlja-siroka" />,
  },
  {
    putanja: '/simulator',
    naziv: 'Simulator letenja',
    opis: 'Komande helikoptera izbliza, u tri dimenzije.',
    mentor: 'Drugi mentor',
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
    <main className={stil.strana}>
      <header className={stil.zaglavlje}>
        {/*
          Logo je fajl, da se mijenja bez diranja koda. Crta se kao maska u boji
          teksta, pa radi u obje teme bez obzira na boju u samom fajlu.
        */}
        <span role="img" aria-label="Prona" className={stil.logo} />
        <h1 className={stil.naslov}>Praktikum elektronike</h1>
        <p className={stil.uvod}>Izaberi šta hoćeš da vidiš.</p>
      </header>

      <nav className={stil.projekti} aria-label="Projekti">
        {PROJEKTI.map((p, i) => (
          <Link
            key={p.putanja}
            href={p.putanja}
            ref={(el) => {
              veze.current[i] = el;
            }}
            className={stil.projekat}
          >
            <span className={stil.redniBroj}>{i + 1}</span>
            <span className={stil.ime}>{p.naziv}</span>
            <span className={stil.opis}>{p.opis}</span>
            <div className={stil.crtez} aria-hidden="true">
              {p.crtez}
            </div>
            <span className={stil.mentor}>{p.mentor}</span>
          </Link>
        ))}
      </nav>

      <footer className={stil.podnozje}>
        <span className={stil.samoDodir}>dodirni šta hoćeš da otvoriš</span>
        <span className={stil.samoTaster}>
          <kbd>←</kbd>
          <kbd>→</kbd> biraj
        </span>
        <span className={stil.samoTaster}>
          <kbd>↵</kbd> otvori
        </span>
      </footer>
    </main>
  );
}

/** Kolektiv helikoptera sa strane: ručica na osovini, u donjem i gornjem položaju. */
function CrtezSimulatora() {
  const os = { x: 330, y: 250 };
  const duzina = 300;
  const vrh = (stepeni: number) => {
    const a = (stepeni * Math.PI) / 180;
    return { x: os.x + Math.cos(a) * duzina, y: os.y - Math.sin(a) * duzina };
  };
  const dolje = vrh(12);
  const gore = vrh(38);
  const luk = Array.from({ length: 16 }, (_, i) => {
    const t = vrh(12 + ((38 - 12) * i) / 15);
    return `${t.x.toFixed(1)},${t.y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 1000 380" preserveAspectRatio="xMidYMid meet" className={stil.svg}>
      <line x1={120} y1={300} x2={880} y2={300} className={stil.zica} />
      {Array.from({ length: 38 }, (_, i) => (
        <line key={i} x1={134 + i * 20} y1={302} x2={122 + i * 20} y2={316} className={stil.zicaTanka} />
      ))}
      <line x1={os.x} y1={os.y} x2={dolje.x} y2={dolje.y} className={stil.isprekidano} />
      <line x1={os.x} y1={os.y} x2={gore.x} y2={gore.y} className={stil.rucica} />
      <circle cx={gore.x} cy={gore.y} r={14} className={stil.drska} />
      <polyline points={luk} className={stil.hod} />
      <polygon points={`${os.x - 40},300 ${os.x + 40},300 ${os.x},${os.y}`} className={stil.oslonac} />
      <circle cx={os.x} cy={os.y} r={8} className={stil.drska} />
      <text x={gore.x + 26} y={gore.y + 8} className={stil.tekstSvg}>
        gore
      </text>
      <text x={dolje.x + 26} y={dolje.y + 8} className={stil.tihSvg}>
        dolje
      </text>
      <text x={os.x} y={350} textAnchor="middle" className={stil.tihSvg}>
        kolektiv: podiže i spušta helikopter
      </text>
    </svg>
  );
}
