import type { ReactNode } from 'react';
import { FAILSAFE_MS, PIPELINE_VREMENA, RADIO_VEZE, XGO_RADIO } from '@/config/cinjenice';
import { napraviRaspored } from '@/lib/pipeline';
import { RAZMAK_MS } from '@/lib/radio';
import { GEOMETRIJA, rijesi } from '@/lib/suspenzija';
import c from './crtezi.module.css';

/*
  Linijske šeme za slajdove. Nema fotografija, pa svaki slajd dobija
  šemu: standardni simboli (mikrofon, zvučnik, antena, motor, LED,
  otpornik, masa), linije od 2 do 2,5 px, čvorovi kao tačke, a boja
  samo tamo gdje nosi značenje (osjeti, odluči, djeluj, struja).

  Svi crteži dijele koordinatni sistem 1000 × 620, osim široke petlje.
*/

type Uloga = 'osjeti' | 'odluci' | 'djeluj';
type T = { x: number; y: number };

const ULOGA_BLOKA: Record<Uloga, string> = { osjeti: c.blokOsjeti, odluci: c.blokOdluci, djeluj: c.blokDjeluj };
const ULOGA_TEKSTA: Record<Uloga, string> = { osjeti: c.osjeti, odluci: c.odluci, djeluj: c.djeluj };
const RIJEC_ULOGE: Record<Uloga, string> = { osjeti: 'osjeti', odluci: 'odluči', djeluj: 'djeluj' };

/* ------------------------------------------------------------------ simboli */

function Blok({
  x,
  y,
  w,
  h,
  naslov,
  pod,
  uloga,
  oznakaUloge = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  naslov: string;
  pod?: string;
  uloga?: Uloga;
  /** Riječ uloge (osjeti, odluči, djeluj) iznad bloka. */
  oznakaUloge?: boolean;
}) {
  return (
    <g>
      {oznakaUloge && uloga && (
        <text x={x + w / 2} y={y - 14} textAnchor="middle" className={ULOGA_TEKSTA[uloga]}>
          {RIJEC_ULOGE[uloga]}
        </text>
      )}
      <rect x={x} y={y} width={w} height={h} rx={4} className={uloga ? ULOGA_BLOKA[uloga] : c.blok} />
      <text x={x + w / 2} y={y + h / 2 + (pod ? -2 : 9)} textAnchor="middle" className={c.naslovBloka}>
        {naslov}
      </text>
      {pod && (
        <text x={x + w / 2} y={y + h / 2 + 24} textAnchor="middle" className={c.tih}>
          {pod}
        </text>
      )}
    </g>
  );
}

function Zica({ tacke, klasa = c.zica }: { tacke: [number, number][]; klasa?: string }) {
  return <polyline points={tacke.map((t) => t.join(',')).join(' ')} className={klasa} />;
}

/** Vrh strelice na tački, okrenut za ugao u stepenima (0 je desno). */
function Strelica({ x, y, ugao = 0, klasa = c.vrh }: { x: number; y: number; ugao?: number; klasa?: string }) {
  return <polygon points="0,0 -14,-7 -14,7" transform={`translate(${x} ${y}) rotate(${ugao})`} className={klasa} />;
}

/** Žica sa strelicom na kraju, vodoravna ili uspravna. */
function Veza({ od, do: ka, klasa }: { od: T; do: T; klasa?: string }) {
  const ugao = (Math.atan2(ka.y - od.y, ka.x - od.x) * 180) / Math.PI;
  return (
    <g>
      <line x1={od.x} y1={od.y} x2={ka.x} y2={ka.y} className={klasa ?? c.zica} />
      <Strelica x={ka.x} y={ka.y} ugao={ugao} />
    </g>
  );
}

function Cvor({ x, y }: T) {
  return <circle cx={x} cy={y} r={5} className={c.cvor} />;
}

/** Mikrofon: krug sa pločicom uz lijevu ivicu, kao na šemi. */
function Mikrofon({ x, y, uloga = 'osjeti' }: T & { uloga?: Uloga }) {
  return (
    <g>
      <circle cx={x} cy={y} r={26} className={ULOGA_BLOKA[uloga]} />
      <line x1={x - 26} y1={y - 26} x2={x - 26} y2={y + 26} className={c.simbolDebeo} />
    </g>
  );
}

/** Zvučnik: pravougaonik i levak. */
function Zvucnik({ x, y }: T) {
  return (
    <g>
      <rect x={x - 14} y={y - 16} width={16} height={32} className={c.blokDjeluj} />
      <polygon points={`${x + 2},${y - 16} ${x + 30},${y - 38} ${x + 30},${y + 38} ${x + 2},${y + 16}`} className={c.blokDjeluj} />
    </g>
  );
}

/** Antena: stub i trougao. `dolje` je okrene naglavačke. */
function Antena({ x, y, dolje = false, visina = 50 }: T & { dolje?: boolean; visina?: number }) {
  const s = dolje ? 1 : -1;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + s * visina} className={c.zica} />
      <polyline points={`${x - 16},${y + s * visina} ${x},${y + s * (visina - 20)} ${x + 16},${y + s * visina}`} className={c.zica} />
    </g>
  );
}

/** Talasi koji se šire iz antene: lukovi. */
function Lukovi({ x, y, smjer = 1, broj = 3 }: T & { smjer?: 1 | -1; broj?: number }) {
  return (
    <g>
      {Array.from({ length: broj }, (_, i) => {
        const r = 22 + i * 18;
        const a = (40 * Math.PI) / 180;
        return (
          <path
            key={i}
            d={`M${x + smjer * r * Math.cos(a)},${y - r * Math.sin(a)} A${r},${r} 0 0 ${smjer > 0 ? 1 : 0} ${x + smjer * r * Math.cos(a)},${y + r * Math.sin(a)}`}
            className={c.zicaTanka}
          />
        );
      })}
    </g>
  );
}

/** Motor: krug sa slovom M. */
function Motor({ x, y, r = 24 }: T & { r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} className={c.blokDjeluj} />
      <text x={x} y={y + r * 0.36} textAnchor="middle" className={c.slovoMotora} style={{ fontSize: r * 1.05 }}>
        M
      </text>
    </g>
  );
}

/** Otpornik kao cik-cak, vodoravno od x1 do x2. */
function Otpornik({ x1, x2, y, klasa = c.zica }: { x1: number; x2: number; y: number; klasa?: string }) {
  const n = 6;
  const korak = (x2 - x1 - 40) / n;
  const tacke: [number, number][] = [[x1, y], [x1 + 20, y]];
  for (let i = 0; i < n; i++) tacke.push([x1 + 20 + korak * (i + 0.5), y + (i % 2 ? 14 : -14)]);
  tacke.push([x2 - 20, y], [x2, y]);
  return <Zica tacke={tacke} klasa={klasa} />;
}

/** LED uspravno: trougao nadolje, crta, i dvije strelice svjetla. */
function Led({ x, y, klasa = c.zica }: T & { klasa?: string }) {
  return (
    <g>
      <polygon points={`${x - 22},${y - 18} ${x + 22},${y - 18} ${x},${y + 18}`} className={c.ledTijelo} />
      <line x1={x - 24} y1={y + 18} x2={x + 24} y2={y + 18} className={klasa} />
      {[0, 18].map((d) => (
        <g key={d}>
          <line x1={x + 28} y1={y - 8 + d} x2={x + 52} y2={y - 28 + d} className={c.svjetlo} />
          <Strelica x={x + 52} y={y - 28 + d} ugao={-40} klasa={c.vrhSvjetla} />
        </g>
      ))}
    </g>
  );
}

/** Masa: tri crte koje se skraćuju. */
function Masa({ x, y }: T) {
  return (
    <g>
      <line x1={x - 22} y1={y} x2={x + 22} y2={y} className={c.zica} />
      <line x1={x - 14} y1={y + 8} x2={x + 14} y2={y + 8} className={c.zica} />
      <line x1={x - 6} y1={y + 16} x2={x + 6} y2={y + 16} className={c.zica} />
    </g>
  );
}

/** Talas nalik govoru: zbir tri sinusa, isti oblik gdje god se nacrta. */
function talasGovora(x0: number, x1: number, y: number, a: number) {
  const tacke: string[] = [];
  for (let x = x0; x <= x1; x += 3) {
    const t = (x - x0) / (x1 - x0);
    const omotac = Math.sin(Math.PI * t) ** 0.6;
    const v = Math.sin(t * 38) * 0.6 + Math.sin(t * 87 + 1) * 0.3 + Math.sin(t * 151 + 2) * 0.1;
    tacke.push(`${x.toFixed(1)},${(y - a * omotac * v).toFixed(1)}`);
  }
  return tacke.join(' ');
}

function Rijec({ x, y, tekst, istaknuta = false, sirina }: T & { tekst: string; istaknuta?: boolean; sirina?: number }) {
  const w = sirina ?? tekst.length * 15 + 30;
  return (
    <g>
      <rect x={x} y={y - 24} width={w} height={48} rx={4} className={istaknuta ? c.blokOdluci : c.blok} />
      <text x={x + w / 2} y={y + 8} textAnchor="middle" className={istaknuta ? c.odluci : c.tekst}>
        {tekst}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ petlja */

function petlja(y: number, dno: number, natpisDno: string, imena: [string, string, string]) {
  const stanice: { x: number; uloga: Uloga; ime: string }[] = [
    { x: 180, uloga: 'osjeti', ime: imena[0] },
    { x: 500, uloga: 'odluci', ime: imena[1] },
    { x: 820, uloga: 'djeluj', ime: imena[2] },
  ];
  const W = 220;
  const H = 104;
  return (
    <>
      {stanice.map((s) => (
        <Blok key={s.ime} x={s.x - W / 2} y={y} w={W} h={H} naslov={s.ime} uloga={s.uloga} oznakaUloge />
      ))}
      <Veza od={{ x: 180 + W / 2, y: y + H / 2 }} do={{ x: 500 - W / 2, y: y + H / 2 }} />
      <Veza od={{ x: 500 + W / 2, y: y + H / 2 }} do={{ x: 820 - W / 2, y: y + H / 2 }} />
      <Zica tacke={[[820, y + H], [820, dno], [180, dno], [180, y + H + 14]]} />
      <Strelica x={180} y={y + H} ugao={-90} />
      <Cvor x={820} y={dno} />
      <Cvor x={180} y={dno} />
      <text x={500} y={dno + 34} textAnchor="middle" className={c.tih}>
        {natpisDno}
      </text>
    </>
  );
}

export function CrtezPetlja() {
  return petlja(200, 460, 'pokret mijenja svijet, a senzor to opet izmjeri', ['senzor', 'mozak', 'motor']);
}

export function CrtezPetljaSiroka() {
  return petlja(90, 290, 'pa opet iz početka', ['senzor', 'mozak', 'motor']);
}

/* ------------------------------------------------------------------ Jarvis */

export function CrtezJarvisKoJe() {
  return (
    <>
      <Mikrofon x={130} y={300} />
      <text x={130} y={250} textAnchor="middle" className={c.osjeti}>
        mikrofon
      </text>
      <Veza od={{ x: 160, y: 300 }} do={{ x: 330, y: 300 }} />
      <Blok x={330} y={220} w={340} h={160} naslov="Jarvis" pod="laptop na štandu" uloga="odluci" oznakaUloge />
      <Veza od={{ x: 670, y: 300 }} do={{ x: 842, y: 300 }} />
      <Zvucnik x={860} y={300} />
      <text x={874} y={250} textAnchor="middle" className={c.djeluj}>
        zvučnik
      </text>
      <text x={130} y={372} textAnchor="middle" className={c.tih}>
        tvoje pitanje
      </text>
      <text x={874} y={372} textAnchor="middle" className={c.tih}>
        njegov odgovor
      </text>
    </>
  );
}

export function CrtezJarvisTalasi() {
  return (
    <>
      <text x={330} y={110} className={c.tekst}>
        u vazduhu: pritisak
      </text>
      <line x1={330} y1={190} x2={950} y2={190} className={c.osa} />
      <polyline points={talasGovora(330, 950, 190, 70)} className={c.signal} />

      <Mikrofon x={170} y={310} />
      <Zica tacke={[[330, 190], [250, 190], [170, 250], [170, 284]]} klasa={c.isprekidano} />
      <Veza od={{ x: 170, y: 336 }} do={{ x: 170, y: 420 }} />
      <Zica tacke={[[170, 430], [250, 430], [330, 430]]} klasa={c.zicaTanka} />

      <text x={330} y={350} className={c.tekst}>
        u žici: napon
      </text>
      <line x1={330} y1={430} x2={950} y2={430} className={c.osa} />
      <polyline points={talasGovora(330, 950, 430, 70)} className={c.signalOsjeti} />

      <text x={950} y={540} textAnchor="end" className={c.tih}>
        vrijeme →
      </text>
      <text x={170} y={560} textAnchor="middle" className={c.tih}>
        isti oblik, drugi oblik energije
      </text>
    </>
  );
}

export function CrtezJarvisBudjenje() {
  const rijeci = ['danas', 'je', 'lijepo', 'Jarvis', 'koliko', 'je', 'sati'];
  let x = 60;
  const mjesta = rijeci.map((r) => {
    const w = r.length * 15 + 30;
    const m = { r, x, w };
    x += w + 14;
    return m;
  });
  const jarvis = mjesta[3];
  const ivica = jarvis.x + jarvis.w;
  return (
    <>
      <text x={60} y={150} className={c.tih}>
        sve što mikrofon čuje
      </text>
      {mjesta.map((m, i) => (
        <Rijec key={i} x={m.x} y={210} tekst={m.r} istaknuta={i === 3} sirina={m.w} />
      ))}
      <line x1={ivica} y1={240} x2={ivica} y2={470} className={c.isprekidano} />

      <text x={60} y={350} className={c.tih}>
        prvi program: čeka samo „Jarvis”
      </text>
      <Zica tacke={[[60, 470], [ivica, 470], [ivica, 400], [950, 400]]} klasa={c.logika} />
      <text x={60} y={460} className={c.tih}>
        spava
      </text>
      <text x={ivica + 16} y={388} className={c.odluci}>
        budi se
      </text>
      <text x={950} y={540} textAnchor="end" className={c.tih}>
        vrijeme →
      </text>
    </>
  );
}

export function CrtezJarvisGlasUTekst() {
  return (
    <>
      <line x1={60} y1={310} x2={330} y2={310} className={c.osa} />
      <polyline points={talasGovora(60, 330, 310, 80)} className={c.signalOsjeti} />
      <text x={60} y={200} className={c.tih}>
        tvoj glas
      </text>
      <Veza od={{ x: 340, y: 310 }} do={{ x: 410, y: 310 }} />
      <Blok x={410} y={250} w={200} h={120} naslov="glas → tekst" pod="radi na laptopu" uloga="osjeti" oznakaUloge />
      <Veza od={{ x: 610, y: 310 }} do={{ x: 670, y: 310 }} />
      <Rijec x={680} y={310} tekst="koliko" />
      <Rijec x={808} y={310} tekst="je" />
      <Rijec x={680} y={380} tekst="sati" />
      <text x={680} y={230} className={c.tih}>
        tekst
      </text>
    </>
  );
}

export function CrtezJarvisMozak() {
  return (
    <>
      <text x={60} y={200} className={c.tih}>
        pitanje, kao tekst
      </text>
      <Rijec x={60} y={260} tekst="koliko" />
      <Rijec x={60} y={330} tekst="je" />
      <Rijec x={60} y={400} tekst="sati" />
      <Veza od={{ x: 220, y: 330 }} do={{ x: 330, y: 330 }} />
      <Blok x={330} y={240} w={300} h={180} naslov="jezički model" pod="mozak" uloga="odluci" oznakaUloge />
      <Veza od={{ x: 630, y: 330 }} do={{ x: 690, y: 330 }} />
      <text x={700} y={200} className={c.tih}>
        odgovor nastaje riječ po riječ
      </text>
      {['riječ 1', 'riječ 2', 'riječ 3'].map((r, i) => (
        <Rijec key={r} x={700 + i * 30} y={260 + i * 70} tekst={r} sirina={150} />
      ))}
      <line x1={700} y1={470} x2={950} y2={470} className={c.osa} />
      <text x={950} y={500} textAnchor="end" className={c.tih}>
        vrijeme →
      </text>
    </>
  );
}

export function CrtezJarvisTekstUGlas() {
  return (
    <>
      <text x={60} y={200} className={c.tih}>
        odgovor, kao tekst
      </text>
      <Rijec x={60} y={270} tekst="riječ 1" sirina={140} />
      <Rijec x={60} y={340} tekst="riječ 2" sirina={140} />
      <Veza od={{ x: 210, y: 305 }} do={{ x: 300, y: 305 }} />
      <Blok x={300} y={245} w={210} h={120} naslov="tekst → glas" pod="glas kao filmski Jarvis" uloga="djeluj" oznakaUloge />
      <Veza od={{ x: 510, y: 305 }} do={{ x: 560, y: 305 }} />
      <line x1={570} y1={305} x2={800} y2={305} className={c.osa} />
      <polyline points={talasGovora(570, 800, 305, 70)} className={c.signalDjeluj} />
      <Veza od={{ x: 806, y: 305 }} do={{ x: 846, y: 305 }} />
      <Zvucnik x={864} y={305} />
    </>
  );
}

export function CrtezJarvisStreaming() {
  const r = napraviRaspored(PIPELINE_VREMENA);
  const X0 = 250;
  const X1 = 950;
  const sk = (X1 - X0) / (r.ukupno + 0.4);
  const uX = (t: number) => X0 + t * sk;
  const traka = (y: number, naziv: string, faze: { od: number; do: number; uloga: Uloga; ime: string; pozadina?: boolean }[], prvi: number) => (
    <g>
      <text x={X0 - 20} y={y + 34} textAnchor="end" className={c.tekst}>
        {naziv}
      </text>
      {faze.map((f) => (
        <g key={f.ime}>
          <rect
            x={uX(f.od)}
            y={f.pozadina ? y + 70 : y}
            width={uX(f.do) - uX(f.od)}
            height={f.pozadina ? 36 : 56}
            rx={3}
            className={f.pozadina ? c.pozadina : ULOGA_BLOKA[f.uloga]}
          />
          <text x={(uX(f.od) + uX(f.do)) / 2} y={(f.pozadina ? y + 70 : y) + (f.pozadina ? 25 : 35)} textAnchor="middle" className={ULOGA_TEKSTA[f.uloga]}>
            {f.ime}
          </text>
        </g>
      ))}
      <line x1={uX(prvi)} y1={y - 26} x2={uX(prvi)} y2={y + 64} className={c.prvaRijec} />
      <text x={uX(prvi) + 8} y={y - 10} className={c.djeluj}>
        prva riječ
      </text>
    </g>
  );
  const g = r.cekanje;
  const s = r.streaming;
  const kraj = (id: string, t: typeof g) => t.faze.find((f) => f.id === id)!;
  return (
    <>
      {traka(
        150,
        'čeka se sve',
        [
          { od: kraj('mozak', g).pocetak, do: kraj('mozak', g).kraj, uloga: 'odluci', ime: 'mozak piše sve' },
          { od: kraj('tekst-u-glas', g).pocetak, do: kraj('tekst-u-glas', g).kraj, uloga: 'djeluj', ime: 'glas' },
        ],
        g.prviZvuk,
      )}
      {traka(
        360,
        'streaming',
        [
          { od: kraj('mozak', s).pocetak, do: kraj('mozak', s).kraj, uloga: 'odluci', ime: 'prva' },
          { od: kraj('tekst-u-glas', s).pocetak, do: kraj('tekst-u-glas', s).kraj, uloga: 'djeluj', ime: 'glas' },
          { od: kraj('mozak-ostatak', s).pocetak, do: kraj('mozak-ostatak', s).kraj, uloga: 'odluci', ime: 'mozak piše dalje', pozadina: true },
        ],
        s.prviZvuk,
      )}
      <line x1={uX(s.prviZvuk)} y1={290} x2={uX(g.prviZvuk)} y2={290} className={c.kota} />
      <Strelica x={uX(s.prviZvuk)} y={290} ugao={180} klasa={c.vrhKote} />
      <Strelica x={uX(g.prviZvuk)} y={290} klasa={c.vrhKote} />
      <text x={(uX(s.prviZvuk) + uX(g.prviZvuk)) / 2} y={278} textAnchor="middle" className={c.tekst}>
        ranije
      </text>
      <line x1={X0} y1={530} x2={X1} y2={530} className={c.osa} />
      <text x={X1} y={566} textAnchor="end" className={c.tih}>
        vrijeme od pitanja →
      </text>
    </>
  );
}

/* ------------------------------------------------------------------ XGO */

/** Pas sa strane: tijelo, dvije vidljive noge sa po dva zgloba. */
function PasSaStrane({ x, y, sirina = 380 }: T & { sirina?: number }) {
  const h = 56;
  const noga = (kuk: T, smjer: 1 | -1) => {
    const koljeno = { x: kuk.x + smjer * 40, y: kuk.y + 96 };
    const stopalo = { x: kuk.x, y: kuk.y + 190 };
    return (
      <g>
        <Zica tacke={[[kuk.x, kuk.y], [koljeno.x, koljeno.y], [stopalo.x, stopalo.y]]} klasa={c.noga} />
        <Cvor {...kuk} />
        <Cvor {...koljeno} />
        <Cvor {...stopalo} />
      </g>
    );
  };
  return (
    <g>
      <rect x={x} y={y} width={sirina} height={h} rx={4} className={c.blok} />
      {noga({ x: x + 40, y: y + h }, -1)}
      {noga({ x: x + sirina - 40, y: y + h }, -1)}
    </g>
  );
}

export function CrtezXgoPas() {
  return (
    <>
      <Zica tacke={[[120, 500], [880, 500]]} />
      {Array.from({ length: 38 }, (_, i) => (
        <line key={i} x1={134 + i * 20} y1={502} x2={122 + i * 20} y2={516} className={c.zicaTanka} />
      ))}
      <PasSaStrane x={320} y={254} />
      <Veza od={{ x: 160, y: 282 }} do={{ x: 312, y: 282 }} klasa={c.sila} />
      <text x={160} y={260} className={c.tekst}>
        gurni
      </text>
      <text x={720} y={230} className={c.djeluj}>
        noge odmah ispravljaju
      </text>
    </>
  );
}

export function CrtezXgoImu() {
  const C = { x: 500, y: 330 };
  const nagib = 14;
  const u = { x: Math.cos((nagib * Math.PI) / 180), y: Math.sin((nagib * Math.PI) / 180) };
  return (
    <>
      <line x1={C.x - 360} y1={C.y} x2={C.x + 360} y2={C.y} className={c.isprekidano} />
      <line x1={C.x - 340 * u.x} y1={C.y - 340 * u.y} x2={C.x + 340 * u.x} y2={C.y + 340 * u.y} className={c.zica} />
      <path d={`M${C.x + 300},${C.y} A300,300 0 0 1 ${C.x + 300 * u.x},${C.y + 300 * u.y}`} className={c.luk} />
      <text x={C.x + 312} y={C.y + 52} className={c.tekst}>
        nagib
      </text>
      <g transform={`rotate(${nagib} ${C.x} ${C.y})`}>
        <rect x={C.x - 90} y={C.y - 60} width={180} height={120} rx={4} className={c.blokOsjeti} />
        <text x={C.x} y={C.y + 12} textAnchor="middle" className={c.naslovBlokaVeliki}>
          IMU
        </text>
        <Veza od={{ x: C.x + 90, y: C.y - 80 }} do={{ x: C.x + 170, y: C.y - 80 }} klasa={c.osaSenzora} />
        <Veza od={{ x: C.x - 110, y: C.y - 60 }} do={{ x: C.x - 110, y: C.y - 150 }} klasa={c.osaSenzora} />
        <text x={C.x + 178} y={C.y - 72} className={c.osjeti}>
          x
        </text>
        <text x={C.x - 104} y={C.y - 158} className={c.osjeti}>
          z
        </text>
      </g>
      <text x={C.x} y={570} textAnchor="middle" className={c.tih}>
        mjeri nagib i okretanje, kao tvoje uho ravnotežu
      </text>
    </>
  );
}

export function CrtezXgoPetlja() {
  return petlja(200, 460, 'pa opet izmjeri', ['IMU', 'procesor', 'motori']);
}

export function CrtezXgoSvugdje() {
  const redovi = [
    ['dron', 'žiroskop', 'regulator', 'propeleri'],
    ['raketa', 'IMU', 'regulator', 'mlaznica'],
    ['autopilot', 'IMU', 'računar', 'kormila'],
    ['klima', 'termometar', 'termostat', 'kompresor'],
  ];
  const kolone: { x: number; uloga: Uloga }[] = [
    { x: 250, uloga: 'osjeti' },
    { x: 500, uloga: 'odluci' },
    { x: 750, uloga: 'djeluj' },
  ];
  const W = 200;
  return (
    <>
      {kolone.map((k) => (
        <text key={k.x} x={k.x + W / 2} y={110} textAnchor="middle" className={ULOGA_TEKSTA[k.uloga]}>
          {RIJEC_ULOGE[k.uloga]}
        </text>
      ))}
      {redovi.map((r, i) => {
        const y = 140 + i * 110;
        return (
          <g key={r[0]}>
            <text x={220} y={y + 44} textAnchor="end" className={c.tekst}>
              {r[0]}
            </text>
            {kolone.map((k, j) => (
              <g key={k.x}>
                <rect x={k.x} y={y} width={W} height={70} rx={4} className={ULOGA_BLOKA[k.uloga]} />
                <text x={k.x + W / 2} y={y + 44} textAnchor="middle" className={c.naslovBloka}>
                  {r[j + 1]}
                </text>
                {j < 2 && <Veza od={{ x: k.x + W, y: y + 35 }} do={{ x: k.x + 250, y: y + 35 }} />}
              </g>
            ))}
          </g>
        );
      })}
    </>
  );
}

export function CrtezXgoMotori() {
  const tijelo = { x: 320, y: 220, w: 360, h: 180 };
  const grupa = (x: number, y: number, n: number) => (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <Motor key={i} x={x + i * 58} y={y} r={22} />
      ))}
    </g>
  );
  const noge = [
    { x: 90, y: 180, kuk: { x: tijelo.x, y: tijelo.y + 30 } },
    { x: 90, y: 440, kuk: { x: tijelo.x, y: tijelo.y + tijelo.h - 30 } },
    { x: 794, y: 180, kuk: { x: tijelo.x + tijelo.w, y: tijelo.y + 30 } },
    { x: 794, y: 440, kuk: { x: tijelo.x + tijelo.w, y: tijelo.y + tijelo.h - 30 } },
  ];
  return (
    <>
      <text x={500} y={70} textAnchor="middle" className={c.tih}>
        pogled odozgo
      </text>
      <rect x={tijelo.x} y={tijelo.y} width={tijelo.w} height={tijelo.h} rx={4} className={c.blok} />
      <text x={500} y={tijelo.y + tijelo.h / 2 + 42} textAnchor="middle" className={c.tih}>
        tijelo
      </text>
      {noge.map((n, i) => (
        <g key={i}>
          <Zica tacke={[[n.kuk.x, n.kuk.y], [n.x < 500 ? n.x + 138 : n.x - 22, n.y]]} klasa={c.zicaTanka} />
          {grupa(n.x, n.y, 3)}
        </g>
      ))}
      <Zica tacke={[[500, tijelo.y + 50], [500, 160]]} klasa={c.zicaTanka} />
      {grupa(442, 136, 3)}
      <text x={500} y={104} textAnchor="middle" className={c.djeluj}>
        ruka: 3
      </text>
      <text x={90} y={140} className={c.djeluj}>
        noga: 3
      </text>
      <text x={500} y={560} textAnchor="middle" className={c.tekst}>
        4 noge × 3 + ruka 3 = 15 motora
      </text>
    </>
  );
}

export function CrtezXgoKomanda() {
  const W = 170;
  const H = 80;
  return (
    <>
      <Mikrofon x={90} y={190} />
      <Veza od={{ x: 116, y: 190 }} do={{ x: 190, y: 190 }} />
      <Blok x={190} y={150} w={W} h={H} naslov="Jarvis" uloga="odluci" />
      <Veza od={{ x: 190 + W, y: 190 }} do={{ x: 450, y: 190 }} />
      <Blok x={450} y={150} w={W} h={H} naslov="micro:bit" pod="most" />
      <Antena x={535} y={230} dolje visina={60} />
      <Lukovi x={535} y={320} smjer={-1} />
      <text x={455} y={316} textAnchor="end" className={c.tekst}>
        radio {XGO_RADIO.mhz} MHz
      </text>
      <text x={455} y={344} textAnchor="end" className={c.tih}>
        grupa {XGO_RADIO.grupa}
      </text>
      <Antena x={535} y={440} visina={60} />
      <Blok x={450} y={440} w={W} h={H} naslov="micro:bit" pod="u psu" />
      <Veza od={{ x: 450 + W, y: 480 }} do={{ x: 700, y: 480 }} />
      <Blok x={700} y={440} w={W} h={H} naslov="ESP32" uloga="odluci" />
      <Veza od={{ x: 700 + W / 2, y: 440 }} do={{ x: 700 + W / 2, y: 330 }} />
      {[0, 1, 2].map((i) => (
        <Motor key={i} x={728 + i * 58} y={300} r={22} />
      ))}
      <text x={785} y={250} textAnchor="middle" className={c.djeluj}>
        12 zglobova
      </text>
      <text x={90} y={250} textAnchor="middle" className={c.tih}>
        glas
      </text>
    </>
  );
}

/* ------------------------------------------------------------------ Perjanik */

function Tlo({ y, x0 = 80, x1 = 920 }: { y: number; x0?: number; x1?: number }) {
  return (
    <g>
      <line x1={x0} y1={y} x2={x1} y2={y} className={c.zica} />
      {Array.from({ length: Math.floor((x1 - x0) / 20) }, (_, i) => (
        <line key={i} x1={x0 + 14 + i * 20} y1={y + 2} x2={x0 + 2 + i * 20} y2={y + 16} className={c.zicaTanka} />
      ))}
    </g>
  );
}

export function CrtezPerjanikRover() {
  const tlo = 500;
  const R = 66;
  const t1 = { x: 330, y: tlo - R };
  const t2 = { x: 670, y: tlo - R };
  const zglob = { x: 500, y: tlo - R };
  return (
    <>
      <Tlo y={tlo} />
      <rect x={300} y={250} width={400} height={80} rx={4} className={c.blok} />
      <text x={500} y={298} textAnchor="middle" className={c.tih}>
        tijelo
      </text>
      <Zica tacke={[[t1.x, t1.y], [t2.x, t2.y]]} klasa={c.poluga} />
      <Zica tacke={[[zglob.x, 330], [zglob.x, zglob.y]]} />
      {[t1, t2].map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r={R} className={c.tocak} />
          <Cvor {...t} />
        </g>
      ))}
      <circle cx={zglob.x} cy={zglob.y} r={8} className={c.zglob} />
      <text x={zglob.x + 16} y={zglob.y + 40} className={c.tekst}>
        poluga
      </text>

      {/* ruka na vrhu i kamera sprijeda */}
      <Zica tacke={[[560, 250], [610, 160], [720, 130]]} klasa={c.noga} />
      <Cvor x={560} y={250} />
      <Cvor x={610} y={160} />
      <text x={730} y={126} className={c.djeluj}>
        ruka
      </text>
      <rect x={700} y={266} width={46} height={40} rx={3} className={c.blokOsjeti} />
      <text x={760} y={296} className={c.osjeti}>
        kamera
      </text>
      <text x={500} y={570} textAnchor="middle" className={c.tih}>
        sa druge strane ista poluga: ukupno četiri točka
      </text>
    </>
  );
}

export function CrtezPerjanikStampa() {
  const slojeva = 11;
  const dno = 470;
  const h = 18;
  return (
    <>
      <Zica tacke={[[200, dno], [800, dno]]} klasa={c.zicaDebela} />
      <text x={800} y={dno + 36} textAnchor="end" className={c.tih}>
        ploča štampača
      </text>
      {Array.from({ length: slojeva }, (_, i) => {
        const y = dno - (i + 1) * h;
        const suzenje = i * 10;
        const x0 = 330 + suzenje;
        const x1 = i === slojeva - 1 ? 560 : 670 - suzenje;
        return <rect key={i} x={x0} y={y} width={x1 - x0} height={h - 2} rx={2} className={i === slojeva - 1 ? c.slojNovi : c.sloj} />;
      })}
      {/* mlaznica iznad sloja koji se upravo nanosi */}
      <polygon points={`530,${dno - slojeva * h - 70} 590,${dno - slojeva * h - 70} 560,${dno - slojeva * h - 4}`} className={c.blokDjeluj} />
      <text x={610} y={dno - slojeva * h - 40} className={c.djeluj}>
        mlaznica
      </text>
      <Veza od={{ x: 580, y: dno - slojeva * h + 8 }} do={{ x: 660, y: dno - slojeva * h + 8 }} klasa={c.zicaTanka} />
      <line x1={250} y1={dno - h} x2={250} y2={dno} className={c.kota} />
      <Strelica x={250} y={dno - h} ugao={-90} klasa={c.vrhKote} />
      <Strelica x={250} y={dno} ugao={90} klasa={c.vrhKote} />
      <text x={236} y={dno - 4} textAnchor="end" className={c.tekst}>
        jedan sloj
      </text>
    </>
  );
}

export function CrtezPerjanikSuspenzija() {
  const G = GEOMETRIJA;
  const OS = 500;
  const S = 1.5;
  const TLO = 480;
  const r = rijesi(OS, OS + 118, false);
  const X = (x: number) => OS + (x - OS) * S;
  const Y = (y: number) => TLO - (G.rTocka + y) * S;
  const kamen = [
    [OS + 118 - G.polaKamena, 0],
    [OS + 118 - G.polaKamena + G.kosina, G.visinaKamena],
    [OS + 118 + G.polaKamena - G.kosina, G.visinaKamena],
    [OS + 118 + G.polaKamena, 0],
  ]
    .map(([x, y]) => `${X(x)},${TLO - y * S}`)
    .join(' ');
  const L = r.lijeva;
  const tijeloUgao = (r.tijelo * 180) / Math.PI;
  const yOs = Y(L.podignutost);
  return (
    <>
      <Tlo y={TLO} x0={120} x1={880} />
      <polygon points={kamen} className={c.kamen} />
      <Zica tacke={[[X(L.nazad.x), Y(L.nazad.y)], [X(L.naprijed.x), Y(L.naprijed.y)]]} klasa={c.poluga} />
      {[L.nazad, L.naprijed].map((t, i) => (
        <g key={i}>
          <circle cx={X(t.x)} cy={Y(t.y)} r={G.rTocka * S} className={c.tocak} />
          <Cvor x={X(t.x)} y={Y(t.y)} />
        </g>
      ))}
      <circle cx={OS} cy={yOs} r={8} className={c.zglob} />
      <g transform={`rotate(${-tijeloUgao} ${OS} ${yOs - 90})`}>
        <rect x={OS - 230} y={yOs - 130} width={460} height={70} rx={4} className={c.blok} />
        <text x={OS} y={yOs - 88} textAnchor="middle" className={c.tih}>
          tijelo: pola ugla poluge
        </text>
      </g>
      <Zica tacke={[[OS, yOs], [OS, yOs - 60]]} />
      <text x={120} y={110} className={c.tekst}>
        kamen podigne jedan točak,
      </text>
      <text x={120} y={140} className={c.tekst}>
        a oba ostaju na tlu
      </text>
      <text x={500} y={570} textAnchor="middle" className={c.tih}>
        diferencijal dijeli nagib između lijeve i desne poluge
      </text>
    </>
  );
}

export function CrtezPerjanikArduino() {
  return (
    <>
      <Antena x={110} y={260} visina={60} />
      <Blok x={40} y={260} w={140} h={90} naslov="prijemnik" pod="radio" uloga="osjeti" />
      <Veza od={{ x: 180, y: 305 }} do={{ x: 300, y: 305 }} />
      <text x={240} y={290} textAnchor="middle" className={c.tih}>
        komanda
      </text>
      <Blok x={300} y={220} w={220} h={170} naslov="Arduino" pod="mozak" uloga="odluci" oznakaUloge />
      <Veza od={{ x: 520, y: 305 }} do={{ x: 630, y: 305 }} />
      <text x={575} y={290} textAnchor="middle" className={c.tih}>
        PWM
      </text>
      <Blok x={630} y={250} w={160} h={110} naslov="drajver" pod="H-most" />
      <Zica tacke={[[790, 288], [872, 288]]} klasa={c.struja} />
      <Zica tacke={[[790, 322], [872, 322]]} klasa={c.struja} />
      <Motor x={900} y={305} r={34} />
      <text x={825} y={380} textAnchor="middle" className={c.struja2}>
        struja
      </text>
    </>
  );
}

export function CrtezPerjanikRadio() {
  const komande = RADIO_VEZE.find((v) => v.naziv.startsWith('Komande za Perjanika'))!;
  const kamera = RADIO_VEZE.find((v) => v.naziv.startsWith('Kamera'))!;
  return (
    <>
      <Blok x={60} y={170} w={170} h={90} naslov="palica" pod="predajnik" />
      <Antena x={145} y={170} />
      <Lukovi x={170} y={120} />
      <text x={320} y={126} className={c.tekst}>
        komande, {komande.mhz} MHz
      </text>
      <Lukovi x={680} y={120} smjer={-1} />
      <Antena x={705} y={170} />
      <Blok x={620} y={170} w={170} h={90} naslov="prijemnik" />
      <Veza od={{ x: 790, y: 215 }} do={{ x: 850, y: 215 }} />
      <Blok x={850} y={170} w={120} h={90} naslov="Arduino" uloga="odluci" />

      <Blok x={620} y={400} w={170} h={90} naslov="kamera" uloga="osjeti" />
      <Antena x={705} y={400} />
      <Lukovi x={680} y={350} smjer={-1} />
      <text x={705} y={530} textAnchor="middle" className={c.tekst}>
        slika preko WiFi-ja, {kamera.mhz} MHz
      </text>
    </>
  );
}

export function CrtezPerjanikFailsafe() {
  const X0 = 90;
  const X1 = 950;
  const prekid = 400;
  const kraj = prekid + FAILSAFE_MS + 300;
  const uX = (ms: number) => X0 + (ms / kraj) * (X1 - X0);
  const paketi: number[] = [];
  for (let t = 0; t <= prekid; t += RAZMAK_MS) paketi.push(t);
  const stop = prekid + FAILSAFE_MS;
  return (
    <>
      <text x={X0} y={120} className={c.tekst}>
        paketi sa palice
      </text>
      <line x1={X0} y1={200} x2={X1} y2={200} className={c.osa} />
      {paketi.map((t) => (
        <rect key={t} x={uX(t) - 3} y={150} width={6} height={50} className={c.paket} />
      ))}
      <text x={uX(prekid) + 16} y={180} className={c.greska}>
        signal nestao
      </text>

      <rect x={uX(prekid)} y={240} width={uX(stop) - uX(prekid)} height={30} rx={3} className={c.trakaGreske} />
      <text x={(uX(prekid) + uX(stop)) / 2} y={300} textAnchor="middle" className={c.tekst}>
        {FAILSAFE_MS} ms bez paketa
      </text>

      <text x={X0} y={380} className={c.tekst}>
        brzina motora
      </text>
      <line x1={X0} y1={500} x2={X1} y2={500} className={c.osa} />
      <Zica tacke={[[X0, 420], [uX(stop), 420], [uX(stop), 500], [X1, 500]]} klasa={c.signalDjeluj} />
      <line x1={uX(stop)} y1={230} x2={uX(stop)} y2={500} className={c.isprekidano} />
      <text x={uX(stop) + 14} y={480} className={c.djeluj}>
        sam stane
      </text>
      {[0, prekid, stop].map((t) => (
        <text key={t} x={uX(t)} y={540} textAnchor="middle" className={c.tih}>
          {t} ms
        </text>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ zatvaranje */

export function CrtezZatvaranje() {
  const y = 230;
  return (
    <>
      <Blok x={80} y={170} w={240} h={260} naslov="micro:bit" pod="ili Arduino" />
      <text x={330} y={y - 12} className={c.tih}>
        pin
      </text>
      <Cvor x={320} y={y} />
      <Zica tacke={[[320, y], [420, y]]} klasa={c.struja} />
      <Otpornik x1={420} x2={600} y={y} klasa={c.struja} />
      <text x={510} y={y - 30} textAnchor="middle" className={c.tih}>
        otpornik
      </text>
      <Zica tacke={[[600, y], [760, y], [760, 300]]} klasa={c.struja} />
      <Led x={760} y={330} klasa={c.struja} />
      <text x={840} y={336} className={c.djeluj}>
        LED
      </text>
      <Zica tacke={[[760, 348], [760, 440]]} klasa={c.struja} />
      <Masa x={760} y={440} />
      <Cvor x={320} y={380} />
      <Zica tacke={[[320, 380], [370, 380], [370, 440]]} />
      <Masa x={370} y={440} />
      <text x={332} y={370} className={c.tih}>
        masa
      </text>
      <Strelica x={400} y={y} klasa={c.vrhStruje} />
      <Strelica x={760} y={420} ugao={90} klasa={c.vrhStruje} />
      <text x={784} y={426} className={c.struja2}>
        struja
      </text>
      <text x={560} y={520} textAnchor="middle" className={c.tih}>
        struja se kroz masu vraća u pločicu
      </text>
    </>
  );
}

/* ------------------------------------------------------------------ registar */

export type Crtez = { crtez: () => ReactNode; visina?: number };

export const CRTEZI: Record<string, Crtez> = {
  petlja: { crtez: CrtezPetlja },
  'petlja-siroka': { crtez: CrtezPetljaSiroka, visina: 380 },
  zatvaranje: { crtez: CrtezZatvaranje },
  'jarvis-ko-je': { crtez: CrtezJarvisKoJe },
  'jarvis-talasi': { crtez: CrtezJarvisTalasi },
  'jarvis-budjenje': { crtez: CrtezJarvisBudjenje },
  'jarvis-glas-u-tekst': { crtez: CrtezJarvisGlasUTekst },
  'jarvis-mozak': { crtez: CrtezJarvisMozak },
  'jarvis-tekst-u-glas': { crtez: CrtezJarvisTekstUGlas },
  'jarvis-streaming': { crtez: CrtezJarvisStreaming },
  'xgo-pas': { crtez: CrtezXgoPas },
  'xgo-imu': { crtez: CrtezXgoImu },
  'xgo-petlja': { crtez: CrtezXgoPetlja },
  'xgo-svugdje': { crtez: CrtezXgoSvugdje },
  'xgo-motori': { crtez: CrtezXgoMotori },
  'xgo-komanda': { crtez: CrtezXgoKomanda },
  'perjanik-rover': { crtez: CrtezPerjanikRover },
  'perjanik-stampa': { crtez: CrtezPerjanikStampa },
  'perjanik-suspenzija': { crtez: CrtezPerjanikSuspenzija },
  'perjanik-arduino': { crtez: CrtezPerjanikArduino },
  'perjanik-radio': { crtez: CrtezPerjanikRadio },
  'perjanik-failsafe': { crtez: CrtezPerjanikFailsafe },
};

export const KLJUCEVI_CRTEZA = Object.keys(CRTEZI);

/** Crta šemu po ključu iz sadržaja slajda. */
export function Sema({ kljuc, opis }: { kljuc: string; opis?: string }) {
  const unos = CRTEZI[kljuc];
  if (!unos) throw new Error(`Nepoznat crtež: ${kljuc}`);
  const Crtez = unos.crtez;
  return (
    <svg
      viewBox={`0 0 1000 ${unos.visina ?? 620}`}
      preserveAspectRatio="xMidYMid meet"
      role={opis ? 'img' : undefined}
      aria-label={opis}
      aria-hidden={opis ? undefined : true}
      className={c.svg}
    >
      <Crtez />
    </svg>
  );
}
