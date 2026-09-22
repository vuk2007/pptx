'use client';

import { useRef, useState } from 'react';
import { SilkTekst, Vod } from '@/components/ploca/primitivi';
import {
  BEDRO,
  NAJBLIZE,
  NAJDALJE,
  POTKOLJENICA,
  direktno,
  inverzno,
  koljenoZa,
  type Uglovi,
} from '@/lib/noga';
import { Klizac, OkvirDemonstracije, PrekidacRezima } from './OkvirDemonstracije';
import stil from './demo.module.css';

/*
  Inverzna kinematika: znaš gdje hoćeš stopalo, tražiš uglove.

  U direktnom režimu je obrnuto — vrtiš uglove i gledaš gdje stopalo završi.
  Ista noga, dva načina razmišljanja.
*/

const KUK_X = 520;
const KUK_Y = 290;

const PANEL_X = 980;

export function Noga() {
  const [inverzniRezim, postaviRezim] = useState(true);
  const [cilj, postaviCilj] = useState({ x: 40, y: 250 });
  const [rucniUglovi, postaviRucne] = useState<Uglovi>({ kuk: 18, koljeno: 120 });
  /* Podsjetnik „vuci me" nestaje čim se stopalo prvi put pomjeri. */
  const [dirano, postaviDirano] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const vuceSe = useRef(false);

  const rjesenje = inverzno(cilj);
  const uglovi = inverzniRezim ? rjesenje.uglovi : rucniUglovi;
  const stopalo = inverzniRezim ? rjesenje.stopalo : direktno(rucniUglovi);
  const koljeno = koljenoZa(uglovi);
  const vanDometa = inverzniRezim && !rjesenje.uDometu;

  function uKoordinate(klijentX: number, klijentY: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const okvir = svg.getBoundingClientRect();
    const razmjera = Math.min(okvir.width / 1480, okvir.height / 640);
    const lijevo = okvir.left + (okvir.width - 1480 * razmjera) / 2;
    const gore = okvir.top + (okvir.height - 640 * razmjera) / 2;
    return {
      x: (klijentX - lijevo) / razmjera - KUK_X,
      y: (klijentY - gore) / razmjera - KUK_Y,
    };
  }

  function vuci(klijentX: number, klijentY: number) {
    if (!inverzniRezim) return;
    const tacka = uKoordinate(klijentX, klijentY);
    if (tacka) {
      postaviCilj(tacka);
      postaviDirano(true);
    }
  }

  function resetuj() {
    postaviRezim(true);
    postaviCilj({ x: 40, y: 250 });
    postaviRucne({ kuk: 18, koljeno: 120 });
    postaviDirano(false);
  }

  const poruka = !inverzniRezim
    ? `Uglovi su ${Math.round(uglovi.kuk)}° i ${Math.round(uglovi.koljeno)}°, i stopalo završi tamo gdje završi.`
    : vanDometa
      ? 'Van dometa. Noga je ispružena koliko može i stopalo je stalo na ivici.'
      : 'Vuci stopalo. Uglovi kuka i koljena se računaju sami, zakonom kosinusa.';

  return (
    <OkvirDemonstracije
      naslov="Noga"
      oznaka="XGO · gdje treba da budu uglovi"
      nazadPutanja="/xgo"
      nazadNaziv="XGO psi"
      poruka={poruka}
      alarm={vanDometa}
      napomena="Dužine su ilustrativne. Prava noga ima i treći motor koji je pomjera u stranu — njega odavde ne vidimo, jer gledamo sa strane."
      onResetuj={resetuj}
      kontrole={
        <>
          <PrekidacRezima ukljucen={!inverzniRezim} onPromjena={(v) => postaviRezim(!v)}>
            Direktno
          </PrekidacRezima>
          {!inverzniRezim && (
            <>
              <Klizac
                natpis="Kuk"
                vrijednost={Math.round(rucniUglovi.kuk)}
                prikaz={`${Math.round(rucniUglovi.kuk)}°`}
                min={-80}
                max={80}
                onPromjena={(v) => postaviRucne((u) => ({ ...u, kuk: v }))}
              />
              <Klizac
                natpis="Koljeno"
                vrijednost={Math.round(rucniUglovi.koljeno)}
                prikaz={`${Math.round(rucniUglovi.koljeno)}°`}
                min={10}
                max={180}
                onPromjena={(v) => postaviRucne((u) => ({ ...u, koljeno: v }))}
              />
            </>
          )}
        </>
      }
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1480 640"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={(e) => {
          if (!inverzniRezim) return;
          vuceSe.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          vuci(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => vuceSe.current && vuci(e.clientX, e.clientY)}
        onPointerUp={() => {
          vuceSe.current = false;
        }}
        onPointerCancel={() => {
          vuceSe.current = false;
        }}
      >
        {/* --- dohvatljiva zona --- */}
        <circle cx={KUK_X} cy={KUK_Y} r={NAJDALJE} fill="var(--osjeti)" opacity={0.07} />
        {NAJBLIZE > 0 && <circle cx={KUK_X} cy={KUK_Y} r={NAJBLIZE} fill="var(--maska)" />}
        <circle cx={KUK_X} cy={KUK_Y} r={NAJDALJE} fill="none" stroke="var(--osjeti)" strokeWidth={2}
          strokeDasharray="10 10" opacity={0.6} />
        <SilkTekst x={KUK_X - NAJDALJE} y={KUK_Y + NAJDALJE + 34} velicina={17} boja="var(--osjeti)" debljina={400}>
          dokle noga može da dohvati
        </SilkTekst>

        {/* --- tijelo i kuk --- */}
        <rect x={KUK_X - 160} y={KUK_Y - 96} width={300} height={82} rx={12}
          fill="var(--maska-svijetla)" stroke="var(--silkscreen)" strokeWidth={5} />
        <SilkTekst x={KUK_X - 10} y={KUK_Y - 48} sredina velicina={20} boja="var(--silkscreen)">
          tijelo
        </SilkTekst>

        {/* --- segmenti noge --- */}
        <line x1={KUK_X} y1={KUK_Y} x2={KUK_X + koljeno.x} y2={KUK_Y + koljeno.y}
          stroke="var(--djeluj)" strokeWidth={14} strokeLinecap="round" />
        <line x1={KUK_X + koljeno.x} y1={KUK_Y + koljeno.y} x2={KUK_X + stopalo.x} y2={KUK_Y + stopalo.y}
          stroke="var(--djeluj)" strokeWidth={12} strokeLinecap="round" />

        {/* --- zglobovi --- */}
        <Zglob x={KUK_X} y={KUK_Y} natpisX={KUK_X - 176} naziv="kuk" ugao={uglovi.kuk} />
        <Zglob
          x={KUK_X + koljeno.x}
          y={KUK_Y + koljeno.y}
          natpisX={KUK_X + koljeno.x - 26}
          naziv="koljeno"
          ugao={uglovi.koljeno}
        />

        {/* --- stopalo --- */}
        <g
          className={inverzniRezim ? stil.prekidacSvg : undefined}
          role={inverzniRezim ? 'application' : undefined}
          tabIndex={inverzniRezim ? 0 : undefined}
          aria-label={inverzniRezim ? 'Položaj stopala' : undefined}
          onKeyDown={(e) => {
            if (!inverzniRezim) return;
            const korak = 14;
            const pomak: Record<string, [number, number]> = {
              ArrowLeft: [-korak, 0],
              ArrowRight: [korak, 0],
              ArrowUp: [0, -korak],
              ArrowDown: [0, korak],
            };
            const d = pomak[e.key];
            if (!d) return;
            e.preventDefault();
            postaviCilj((c) => ({ x: c.x + d[0], y: c.y + d[1] }));
            postaviDirano(true);
          }}
        >
          <circle cx={KUK_X + stopalo.x} cy={KUK_Y + stopalo.y} r={46} fill="transparent" />
          <circle className={stil.okvirFokusa} cx={KUK_X + stopalo.x} cy={KUK_Y + stopalo.y} r={40}
            fill="none" stroke="var(--bakar-struja)" strokeWidth={3} />
          <circle cx={KUK_X + stopalo.x} cy={KUK_Y + stopalo.y} r={19}
            fill={vanDometa ? 'var(--alarm)' : 'var(--bakar-struja)'} stroke="var(--maska-duboka)" strokeWidth={4} />
          {inverzniRezim && !dirano && (
            <SilkTekst x={KUK_X + stopalo.x} y={KUK_Y + stopalo.y + 46} sredina velicina={16}
              boja="var(--silkscreen-tih)" debljina={400}>
              vuci me
            </SilkTekst>
          )}
        </g>

        {/* gdje je ruka htjela stopalo, a noga ne stiže */}
        {vanDometa && (
          <>
            <line x1={KUK_X + stopalo.x} y1={KUK_Y + stopalo.y} x2={KUK_X + cilj.x} y2={KUK_Y + cilj.y}
              stroke="var(--alarm)" strokeWidth={3} strokeDasharray="8 8" />
            <circle cx={KUK_X + cilj.x} cy={KUK_Y + cilj.y} r={12} fill="none" stroke="var(--alarm)" strokeWidth={3} />
            {(() => {
              /* Natpis se odmiče od stopala, u istom pravcu u kojem je cilj otišao. */
              const duzina = Math.hypot(cilj.x, cilj.y) || 1;
              return (
                <SilkTekst
                  x={KUK_X + cilj.x + (cilj.x / duzina) * 58}
                  y={KUK_Y + cilj.y + (cilj.y / duzina) * 58}
                  sredina
                  velicina={20}
                  boja="var(--alarm)"
                >
                  van dometa
                </SilkTekst>
              );
            })()}
          </>
        )}

        {/* --- brojke --- */}
        <SilkTekst x={PANEL_X} y={130} velicina={22} boja="var(--silkscreen)">
          uglovi
        </SilkTekst>
        <Vod tacke={`${PANEL_X},148 1440,148`} debljina={3} />

        {[
          { naziv: 'kuk', vrijednost: uglovi.kuk, jedinica: '°' },
          { naziv: 'koljeno', vrijednost: uglovi.koljeno, jedinica: '°' },
          { naziv: 'stopalo x', vrijednost: stopalo.x, jedinica: '' },
          { naziv: 'stopalo y', vrijednost: stopalo.y, jedinica: '' },
        ].map((red, i) => (
          <g key={red.naziv}>
            <SilkTekst x={PANEL_X} y={206 + i * 58} velicina={20} boja="var(--silkscreen-tih)">
              {red.naziv}
            </SilkTekst>
            <text
              x={1440}
              y={212 + i * 58}
              textAnchor="end"
              fontSize={32}
              fontWeight={700}
              fill={i < 2 ? 'var(--djeluj)' : 'var(--bakar-struja)'}
              style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
            >
              {Math.round(red.vrijednost)}
              {red.jedinica}
            </text>
          </g>
        ))}

        {/* --- zakon kosinusa --- */}
        <SilkTekst x={PANEL_X} y={490} velicina={20} boja="var(--silkscreen)">
          zakon kosinusa
        </SilkTekst>
        <Vod tacke={`${PANEL_X},508 1440,508`} debljina={3} />
        <text
          x={PANEL_X}
          y={554}
          fontSize={22}
          fontWeight={700}
          fill="var(--odluci)"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
        >
          cos(koljeno) =
        </text>
        <text
          x={PANEL_X}
          y={590}
          fontSize={20}
          fill="var(--silkscreen-tih)"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
        >
          ({BEDRO}² + {POTKOLJENICA}² − d²)
        </text>
        <line x1={PANEL_X} y1={600} x2={PANEL_X + 250} y2={600} stroke="var(--silkscreen-tih)" strokeWidth={2} />
        <text
          x={PANEL_X}
          y={626}
          fontSize={20}
          fill="var(--silkscreen-tih)"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
        >
          2 · {BEDRO} · {POTKOLJENICA}
        </text>
        <text
          x={PANEL_X + 280}
          y={604}
          fontSize={22}
          fontWeight={700}
          fill="var(--bakar-struja)"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
        >
          d = {Math.round(Math.hypot(stopalo.x, stopalo.y))}
        </text>
      </svg>
    </OkvirDemonstracije>
  );
}

function Zglob({
  x,
  y,
  natpisX,
  naziv,
  ugao,
}: {
  x: number;
  y: number;
  /** Gdje stoji natpis — zglobovi su na raznim mjestima, pa se mjesto zadaje. */
  natpisX: number;
  naziv: string;
  ugao: number;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={17} fill="var(--maska-duboka)" stroke="var(--djeluj)" strokeWidth={5} />
      <SilkTekst x={natpisX} y={y - 6} desno velicina={17} boja="var(--silkscreen-tih)">
        {naziv}
      </SilkTekst>
      <SilkTekst x={natpisX} y={y + 20} desno velicina={20} boja="var(--djeluj)">
        {Math.round(ugao)}°
      </SilkTekst>
    </g>
  );
}
