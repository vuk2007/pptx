'use client';

import { useRef, useState } from 'react';
import { broj } from '@/lib/format';
import { duzina } from '@/lib/fizika/elektrostatika';
import { cijevPolje, koaksPolje, obodKaoPrave } from '@/lib/fizika/cijev';
import { Ocitavanja, Ocitavanje, StatusLinija, Taster } from '@/components/instrument/Okvir';
import { Laboratorija, RedDugmadi } from '@/components/faks/Laboratorija';
import { Ose, kriva, skala, type Okvir, type Raspon } from '@/components/faks/Graf';
import { usePrevlacenje, type Tacka } from '@/components/faks/prevlacenje';
import { Strelica } from '@/components/faks/svg';
import s from '@/components/faks/sema.module.css';
import f from '@/components/faks/faks.module.css';

/*
  Presjek dugačke cijevi (ili koaksijalnog kabla). Tačke na obodu su prave
  od kojih je plašt sastavljen. Polje u tački T se računa dvaput: iz
  formule i kao zbir 60 pravih po obodu, da se vidi da se unutra stvarno
  poništi, a ne samo „po formuli".
*/

const W = 1000;
const H = 560;
const PX_PO_CM = 20;
const C = { x: 280, y: 280 };
const A_CM = 5;
const B_CM = 11;
const q = 5e-9;
const PRAVIH = 60;
const GRAF: Okvir = { x: 640, y: 50, w: 320, h: 380 };
const KORAK_MREZE = 46;
const NAJDUZA = 36;

type Rezim = 'cijev' | 'koaks';

const uSI = (p: Tacka) => ({ x: (p.x - C.x) / PX_PO_CM / 100, y: -(p.y - C.y) / PX_PO_CM / 100 });

export default function Simulacija() {
  const [rezim, postaviRezim] = useState<Rezim>('cijev');
  const [T, postaviT] = useState<Tacka>({ x: 330, y: 250 });
  const svg = useRef<SVGSVGElement>(null);
  const { tacka } = usePrevlacenje({ svg, granice: { x0: 30, y0: 30, x1: 530, y1: 530 }, naPomak: (_, p) => postaviT(p) });

  const a = A_CM / 100;
  const b = B_CM / 100;
  const formula = (rho: number) => (rezim === 'cijev' ? cijevPolje(q, a, rho) : koaksPolje(q, a, b, rho));
  const zbirPravih = (p: Tacka) => {
    const t = uSI(p);
    const u = obodKaoPrave(q, a, PRAVIH, t);
    if (rezim === 'cijev') return u;
    const v = obodKaoPrave(-q, b, PRAVIH, t);
    return { x: u.x + v.x, y: u.y + v.y };
  };

  const rhoT = duzina(uSI(T));
  const ETformula = formula(rhoT);
  const ETzbir = zbirPravih(T);
  const ref = cijevPolje(q, a, a);

  const strelice: { x: number; y: number; dx: number; dy: number }[] = [];
  for (let x = 46; x < 540; x += KORAK_MREZE) {
    for (let y = 46; y < H; y += KORAK_MREZE) {
      const r = Math.hypot(x - C.x, y - C.y) / PX_PO_CM / 100;
      const E = formula(r);
      const L = Math.min(1, E / ref) * NAJDUZA;
      if (L < 3) continue;
      const ux = (x - C.x) / (r * 100 * PX_PO_CM);
      const uy = (y - C.y) / (r * 100 * PX_PO_CM);
      strelice.push({ x, y, dx: ux * L, dy: uy * L });
    }
  }

  const obod = (R: number, Q: number) =>
    Array.from({ length: 24 }, (_, k) => {
      const fi = (2 * Math.PI * (k + 0.5)) / 24;
      return <circle key={`${R}-${k}`} cx={C.x + R * PX_PO_CM * Math.cos(fi)} cy={C.y + R * PX_PO_CM * Math.sin(fi)} r={5} className={Q > 0 ? s.plus : s.minus} />;
    });

  const xr: Raspon = [0, 25];
  const yr: Raspon = [0, ref * 1.15];
  const sk = skala(GRAF, xr, yr);
  const ETv = { x: ETzbir.x, y: -ETzbir.y };
  const Ld = Math.min(1, duzina(ETv) / ref) * 90;

  const gdje =
    rezim === 'cijev'
      ? rhoT < a
        ? 'unutra'
        : 'vani'
      : rhoT < a
        ? 'u unutrašnjem vodiču'
        : rhoT < b
          ? 'između vodiča'
          : 'van kabla';

  return (
    <Laboratorija
      crtez={
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={s.dodir} role="img" aria-label={`${rezim === 'cijev' ? 'Cijev' : 'Koaksijalni kabel'} u presjeku; tačka T ${gdje}, polje ${broj(ETformula, 0)} V/m.`}>
          {strelice.map((x, i) => (
            <Strelica key={i} x1={x.x - x.dx / 2} y1={x.y - x.dy / 2} x2={x.x + x.dx / 2} y2={x.y + x.dy / 2} boja="polje" velicina={9} debljina={2} />
          ))}
          {rezim === 'koaks' && <circle cx={C.x} cy={C.y} r={A_CM * PX_PO_CM} className={f.vodic} />}
          <circle cx={C.x} cy={C.y} r={A_CM * PX_PO_CM} className={s.linija} />
          {obod(A_CM, 1)}
          {rezim === 'koaks' && (
            <>
              <circle cx={C.x} cy={C.y} r={B_CM * PX_PO_CM} className={s.linija} />
              {obod(B_CM, -1)}
            </>
          )}
          <text x={C.x} y={C.y + A_CM * PX_PO_CM + 30} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
            a = {A_CM} cm
          </text>
          {rezim === 'koaks' && (
            <text x={C.x} y={C.y + B_CM * PX_PO_CM + 30} textAnchor="middle" className={`${s.tih} ${f.naCrtezu}`}>
              b = {B_CM} cm
            </text>
          )}

          {Ld > 4 && <Strelica x1={T.x} y1={T.y} x2={T.x + (ETv.x / duzina(ETv)) * Ld} y2={T.y + (ETv.y / duzina(ETv)) * Ld} boja="polje" velicina={18} debljina={5} />}
          <g transform={`translate(${T.x} ${T.y})`} className={s.rucka} aria-label="Tačka T; prevuci je ili pomjeri strelicama" {...tacka(0, T)}>
            <circle r={13} className={f.tackaT} />
            <circle r={3} className={s.neutralno} />
            <text x={-16} y={-16} textAnchor="end" className={`${s.tekst} ${f.naCrtezu}`}>
              T
            </text>
          </g>

          <Ose okvir={GRAF} xr={xr} yr={yr} xNatpis="ρ / cm" yNatpis="E / (V/m)" xCilj={5} yCilj={4}>
            <polyline points={kriva((r) => formula(r / 100), sk, 0.01, 25, 500)} className={f.kriva} />
            <circle cx={sk.x(Math.min(25, rhoT * 100))} cy={sk.y(Math.min(yr[1], ETformula))} r={7} className={s.polje} />
          </Ose>
        </svg>
      }
      kontrole={
        <>
          <RedDugmadi opis="Raspored">
            <Taster pritisnut={rezim === 'cijev'} onClick={() => postaviRezim('cijev')}>
              Cijev
            </Taster>
            <Taster pritisnut={rezim === 'koaks'} onClick={() => postaviRezim('koaks')}>
              Koaksijalni kabel
            </Taster>
          </RedDugmadi>
          <p className={f.uputa}>Prevuci tačku T kroz cijev i van nje.</p>
        </>
      }
      ocitavanja={
        <Ocitavanja>
          <Ocitavanje natpis="ρ tačke T" vrijednost={broj(rhoT * 100, 1)} jedinica="cm" pod={gdje} />
          <Ocitavanje natpis="E po formuli" vrijednost={broj(ETformula, 0)} jedinica="V/m" />
          <Ocitavanje natpis={`Zbir ${PRAVIH} pravih`} vrijednost={broj(duzina(ETzbir), 0)} jedinica="V/m" pod="iste prave kao tačke na obodu" />
          <Ocitavanje natpis="Prava u osi" vrijednost={broj(cijevPolje(q, 0, Math.max(rhoT, 1e-6)), 0)} jedinica="V/m" pod="q/(2πε₀ρ)" />
        </Ocitavanja>
      }
      status={
        <StatusLinija
          sta={`Tačka T je ${gdje}: polje je ${broj(ETformula, 0)} V/m.`}
          zasto={
            ETformula === 0
              ? 'Doprinosi pravih sa obje strane se ovdje tačno poništavaju: bliže prave su jače, ali ih je manje u istom uglu.'
              : rezim === 'koaks'
                ? 'Između vodiča polje vidi samo unutrašnji naboj, pa je isto kao od prave u osi.'
                : 'Vani je polje isto kao da je sav naboj cijevi na pravoj u osi.'
          }
        />
      }
    />
  );
}
