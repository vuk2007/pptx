import type { CSSProperties, ReactNode } from 'react';

/*
  Gradivni elementi ploče. Sve se crta u SVG-u, bez ijedne biblioteke.
  Pravilo kao na pravoj ploči: vodovi se lome samo pod 45° ili 90°.
*/

export type BojaPetlje = 'osjeti' | 'odluci' | 'djeluj';

export const BOJA: Record<BojaPetlje, string> = {
  osjeti: 'var(--osjeti)',
  odluci: 'var(--odluci)',
  djeluj: 'var(--djeluj)',
};

export const NAZIV: Record<BojaPetlje, string> = {
  osjeti: 'osjeti',
  odluci: 'odluči',
  djeluj: 'djeluj',
};

export const OZNAKA_LED: Record<BojaPetlje, string> = {
  osjeti: 'D1',
  odluci: 'D2',
  djeluj: 'D3',
};

type VodProps = {
  /** Tačke voda, npr. "10,20 40,20 60,40". Lomovi pod 45° ili 90°. */
  tacke: string;
  debljina?: number;
  /** Smjer toka struje. false znači vod bez struje. */
  struja?: 'naprijed' | 'nazad' | false;
  /** Sekundi po ciklusu; manje = brže. */
  brzina?: number;
  boja?: string;
  zatvoren?: boolean;
};

/** Bakarni vod. Kad kroz njega teče struja, svjetlo putuje po njemu. */
export function Vod({
  tacke,
  debljina = 5,
  struja = false,
  brzina = 1.4,
  boja,
  zatvoren = false,
}: VodProps) {
  const Oblik = zatvoren ? 'polygon' : 'polyline';
  return (
    <g>
      <Oblik
        points={tacke}
        fill="none"
        stroke={boja ?? 'var(--bakar)'}
        strokeWidth={debljina}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {struja !== false && (
        <Oblik
          className="struja-tece"
          points={tacke}
          fill="none"
          stroke="var(--bakar-struja)"
          strokeWidth={debljina}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 22"
          style={{
            animation: `struja-${struja} ${brzina}s linear infinite`,
          }}
        />
      )}
    </g>
  );
}

/** Lemni pad: mjesto gdje je komponenta zalemljena na ploču. */
export function Pad({ x, y, r = 9, boja }: { x: number; y: number; r?: number; boja?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={boja ?? 'var(--bakar)'} />
      <circle cx={x} cy={y} r={r * 0.42} fill="var(--maska-duboka)" />
    </g>
  );
}

/** Prolaz kroz ploču — spaja vod na gornjoj strani sa vodom na donjoj. */
export function Via({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="var(--bakar)" strokeWidth={r * 0.7} />
      <circle cx={x} cy={y} r={r * 0.4} fill="var(--maska-duboka)" />
    </g>
  );
}

/** LED u boji jednog dijela petlje. Upaljena baca oreol. */
export function Led({
  x,
  y,
  boja,
  r = 16,
  upaljen = true,
  oznaka,
}: {
  x: number;
  y: number;
  boja: BojaPetlje;
  r?: number;
  upaljen?: boolean;
  oznaka?: string;
}) {
  const b = BOJA[boja];
  return (
    <g>
      {upaljen && <circle cx={x} cy={y} r={r * 2.6} fill={b} opacity={0.14} />}
      {upaljen && <circle cx={x} cy={y} r={r * 1.6} fill={b} opacity={0.2} />}
      <circle cx={x} cy={y} r={r} fill={upaljen ? b : 'var(--maska-svijetla)'} stroke={b} strokeWidth={2.5} />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill="var(--silkscreen)" opacity={upaljen ? 0.55 : 0.12} />
      {oznaka && (
        <SilkTekst x={x} y={y + r * 2.5} sredina velicina={17}>
          {oznaka}
        </SilkTekst>
      )}
    </g>
  );
}

/** Obris komponente u silkscreenu, sa oznakom i natpisom. */
export function Komponenta({
  x,
  y,
  w,
  h,
  oznaka,
  natpis,
  boja,
  djeca,
  noge = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  oznaka?: string;
  natpis?: string;
  boja?: string;
  djeca?: ReactNode;
  /** Broj nogica sa lijeve i desne strane. */
  noge?: number;
}) {
  const ivica = boja ?? 'var(--silkscreen)';
  const nogice = [];
  for (let i = 0; i < noge; i++) {
    const ny = y + (h / (noge + 1)) * (i + 1);
    nogice.push(
      <g key={i}>
        <rect x={x - 12} y={ny - 3} width={12} height={6} fill="var(--bakar)" />
        <rect x={x + w} y={ny - 3} width={12} height={6} fill="var(--bakar)" />
      </g>,
    );
  }

  return (
    <g>
      {nogice}
      <rect x={x} y={y} width={w} height={h} rx={5} fill="var(--maska-svijetla)" stroke={ivica} strokeWidth={2.5} />
      {/* Tačka koja označava prvi pin, kao na pravom čipu. */}
      <circle cx={x + 13} cy={y + 13} r={4} fill={ivica} opacity={0.8} />
      {natpis && (
        <SilkTekst x={x + w / 2} y={y + h / 2 + 7} sredina velicina={22} boja={ivica}>
          {natpis}
        </SilkTekst>
      )}
      {oznaka && (
        <SilkTekst x={x} y={y - 12} velicina={17}>
          {oznaka}
        </SilkTekst>
      )}
      {djeca}
    </g>
  );
}

/** Tekst u silkscreen stilu: mono, verzal, razmaknuto. */
export function SilkTekst({
  x,
  y,
  children,
  velicina = 18,
  boja = 'var(--silkscreen-tih)',
  sredina = false,
  desno = false,
  debljina = 700,
}: {
  x: number;
  y: number;
  children: ReactNode;
  velicina?: number;
  boja?: string;
  sredina?: boolean;
  desno?: boolean;
  debljina?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={boja}
      fontSize={velicina}
      fontWeight={debljina}
      letterSpacing="0.12em"
      textAnchor={sredina ? 'middle' : desno ? 'end' : 'start'}
      style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', textTransform: 'uppercase' }}
    >
      {children}
    </text>
  );
}

/** Strelica na kraju voda, za smjer signala. */
export function Strelica({ x, y, ugao = 0, velicina = 13, boja }: { x: number; y: number; ugao?: number; velicina?: number; boja?: string }) {
  return (
    <polygon
      points={`0,${-velicina * 0.62} ${velicina},0 0,${velicina * 0.62}`}
      fill={boja ?? 'var(--bakar-struja)'}
      transform={`translate(${x} ${y}) rotate(${ugao})`}
    />
  );
}

/** Rupa za montažu, u uglovima ploče. */
export function Rupa({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={3.5} />
    </g>
  );
}

export const SVG_STIL: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  overflow: 'visible',
};
