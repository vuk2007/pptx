import { SilkTekst } from '@/components/ploca/primitivi';

/*
  Oblici koji se ponavljaju kroz ilustracije: talasi, mikrofon, zvučnik,
  točak, radio lukovi. Sve u silkscreen stilu — obris, bez punjenja.
*/

/** Sinusni talas. Kraća talasna dužina = više perioda u istoj širini. */
export function Talas({
  x,
  y,
  sirina,
  amplituda = 40,
  periodi = 3,
  boja = 'var(--silkscreen)',
  debljina = 4,
  pomak = 0,
  opacity = 1,
}: {
  x: number;
  y: number;
  sirina: number;
  amplituda?: number;
  periodi?: number;
  boja?: string;
  debljina?: number;
  /** Pomjeraj faze u radijanima — talas izgleda kao da putuje. */
  pomak?: number;
  opacity?: number;
}) {
  const koraka = Math.max(60, Math.round(periodi * 28));
  const tacke: string[] = [];
  for (let i = 0; i <= koraka; i++) {
    const t = i / koraka;
    const px = x + t * sirina;
    const py = y - Math.sin(t * periodi * Math.PI * 2 + pomak) * amplituda;
    tacke.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return (
    <polyline
      points={tacke.join(' ')}
      fill="none"
      stroke={boja}
      strokeWidth={debljina}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

/** Pravougaoni signal — ono što vod stvarno nosi. */
export function PravougaoniTalas({
  x,
  y,
  sirina,
  visina = 44,
  periodi = 4,
  udio = 0.5,
  boja = 'var(--bakar-struja)',
  debljina = 4,
}: {
  x: number;
  y: number;
  sirina: number;
  visina?: number;
  periodi?: number;
  /** Koliki dio periode je „upaljeno". */
  udio?: number;
  boja?: string;
  debljina?: number;
}) {
  const perioda = sirina / periodi;
  const tacke: string[] = [`${x},${y}`];
  for (let i = 0; i < periodi; i++) {
    const p = x + i * perioda;
    const kraj = p + perioda * udio;
    tacke.push(`${p},${y - visina}`, `${kraj},${y - visina}`, `${kraj},${y}`, `${p + perioda},${y}`);
  }
  return (
    <polyline
      points={tacke.join(' ')}
      fill="none"
      stroke={boja}
      strokeWidth={debljina}
      strokeLinejoin="miter"
      strokeLinecap="square"
    />
  );
}

/** Mikrofon u obrisu. */
export function Mikrofon({ x, y, skala = 1, boja = 'var(--osjeti)' }: { x: number; y: number; skala?: number; boja?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`}>
      <rect x={-17} y={-52} width={34} height={58} rx={17} fill="var(--maska-svijetla)" stroke={boja} strokeWidth={4} />
      <path d="M -30 -14 A 30 30 0 0 0 30 -14" fill="none" stroke={boja} strokeWidth={4} strokeLinecap="round" />
      <line x1={0} y1={16} x2={0} y2={38} stroke={boja} strokeWidth={4} strokeLinecap="round" />
      <line x1={-18} y1={38} x2={18} y2={38} stroke={boja} strokeWidth={4} strokeLinecap="round" />
      <line x1={-8} y1={-38} x2={8} y2={-38} stroke={boja} strokeWidth={3} opacity={0.6} />
      <line x1={-8} y1={-26} x2={8} y2={-26} stroke={boja} strokeWidth={3} opacity={0.6} />
      <line x1={-8} y1={-14} x2={8} y2={-14} stroke={boja} strokeWidth={3} opacity={0.6} />
    </g>
  );
}

/** Zvučnik u obrisu. */
export function Zvucnik({ x, y, skala = 1, boja = 'var(--djeluj)' }: { x: number; y: number; skala?: number; boja?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`}>
      <path
        d="M -34 -16 L -12 -16 L 10 -40 L 10 40 L -12 16 L -34 16 Z"
        fill="var(--maska-svijetla)"
        stroke={boja}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d="M 22 -20 A 26 26 0 0 1 22 20" fill="none" stroke={boja} strokeWidth={4} strokeLinecap="round" />
      <path d="M 38 -34 A 44 44 0 0 1 38 34" fill="none" stroke={boja} strokeWidth={4} strokeLinecap="round" opacity={0.65} />
    </g>
  );
}

/** Točak sa paocima. Ugao okreće paoke, pa se vrtnja vidi. */
export function Tocak({
  x,
  y,
  r = 44,
  ugao = 0,
  boja = 'var(--silkscreen)',
}: {
  x: number;
  y: number;
  r?: number;
  ugao?: number;
  boja?: string;
}) {
  const paoci = [0, 60, 120].map((a) => {
    const rad = ((a + ugao) * Math.PI) / 180;
    return (
      <line
        key={a}
        x1={-Math.cos(rad) * r * 0.78}
        y1={-Math.sin(rad) * r * 0.78}
        x2={Math.cos(rad) * r * 0.78}
        y2={Math.sin(rad) * r * 0.78}
        stroke={boja}
        strokeWidth={5}
        strokeLinecap="round"
      />
    );
  });
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="var(--maska-duboka)" stroke={boja} strokeWidth={6} />
      <circle r={r * 0.82} fill="none" stroke={boja} strokeWidth={2} opacity={0.35} />
      {paoci}
      <circle r={r * 0.14} fill={boja} />
    </g>
  );
}

/** Radio lukovi koji izlaze iz antene. Razmak luka nosi talasnu dužinu. */
export function RadioLukovi({
  x,
  y,
  broj = 3,
  razmak = 26,
  boja = 'var(--bakar-struja)',
  smjer = 1,
  ugaoLuka = 46,
  opacity = 1,
}: {
  x: number;
  y: number;
  broj?: number;
  razmak?: number;
  boja?: string;
  /** 1 = udesno, -1 = ulijevo. */
  smjer?: 1 | -1;
  ugaoLuka?: number;
  opacity?: number;
}) {
  const lukovi = [];
  for (let i = 1; i <= broj; i++) {
    const r = i * razmak;
    const a = (ugaoLuka * Math.PI) / 180;
    const x1 = smjer * r * Math.cos(a);
    const y1 = -r * Math.sin(a);
    const y2 = r * Math.sin(a);
    lukovi.push(
      <path
        key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 0 ${smjer > 0 ? 1 : 0} ${x1} ${y2}`}
        fill="none"
        stroke={boja}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={(1 - (i - 1) / (broj + 1)) * opacity}
      />,
    );
  }
  return <g transform={`translate(${x} ${y})`}>{lukovi}</g>;
}

/** Antena: štap sa lukovima. */
export function Antena({ x, y, visina = 60, boja = 'var(--bakar)' }: { x: number; y: number; visina?: number; boja?: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - visina} stroke={boja} strokeWidth={5} strokeLinecap="round" />
      <circle cx={x} cy={y - visina} r={6} fill={boja} />
    </g>
  );
}

/** Pilula sa tekstom — token, riječ, komanda u letu. */
export function Pilula({
  x,
  y,
  tekst,
  boja = 'var(--silkscreen)',
  aktivna = false,
  velicina = 20,
}: {
  x: number;
  y: number;
  tekst: string;
  boja?: string;
  aktivna?: boolean;
  velicina?: number;
}) {
  const sirina = Math.max(64, tekst.length * velicina * 0.72 + 30);
  const visina = velicina * 2.1;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={-sirina / 2}
        y={-visina / 2}
        width={sirina}
        height={visina}
        rx={visina / 2}
        fill={aktivna ? boja : 'var(--maska-svijetla)'}
        stroke={boja}
        strokeWidth={3}
      />
      <text
        x={0}
        y={velicina * 0.36}
        textAnchor="middle"
        fontSize={velicina}
        fontWeight={700}
        fill={aktivna ? 'var(--maska-duboka)' : boja}
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      >
        {tekst}
      </text>
    </g>
  );
}

/** Robot pas sa strane. Nagib naginje tijelo, noge ostaju na tlu. */
export function Pas({
  x,
  y,
  skala = 1,
  nagib = 0,
  boja = 'var(--silkscreen)',
}: {
  x: number;
  y: number;
  skala?: number;
  /** Ugao nagiba tijela u stepenima. */
  nagib?: number;
  boja?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`}>
      <g transform={`rotate(${nagib})`}>
        {/* tijelo */}
        <rect x={-92} y={-40} width={184} height={62} rx={14} fill="var(--maska-svijetla)" stroke={boja} strokeWidth={5} />
        {/* glava */}
        <rect x={78} y={-62} width={58} height={44} rx={10} fill="var(--maska-svijetla)" stroke={boja} strokeWidth={5} />
        <circle cx={120} cy={-44} r={7} fill={boja} />
        {/* ruka na leđima */}
        <line x1={-30} y1={-40} x2={-52} y2={-92} stroke={boja} strokeWidth={6} strokeLinecap="round" />
        <line x1={-52} y1={-92} x2={-4} y2={-112} stroke={boja} strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* noge — zglobovi prate tijelo, stopala ostaju na tlu */}
      {[-62, -18, 30, 74].map((nx, i) => {
        const rad = (nagib * Math.PI) / 180;
        const zglobX = nx * Math.cos(rad);
        const zglobY = nx * Math.sin(rad) + 18;
        const koljenoX = zglobX + (i < 2 ? -14 : 14);
        return (
          <g key={nx}>
            <line x1={zglobX} y1={zglobY} x2={koljenoX} y2={62} stroke={boja} strokeWidth={6} strokeLinecap="round" />
            <line x1={koljenoX} y1={62} x2={nx} y2={106} stroke={boja} strokeWidth={6} strokeLinecap="round" />
            <circle cx={koljenoX} cy={62} r={6} fill="var(--maska-duboka)" stroke={boja} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
}

/** Oznaka „usporeno" ili „ilustrativno" na samoj ilustraciji. */
export function Napomena({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <SilkTekst x={x} y={y} velicina={16} boja="var(--silkscreen-tih)" debljina={400}>
      {children}
    </SilkTekst>
  );
}
