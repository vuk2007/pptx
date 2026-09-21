import { Komponenta, Led, Pad, SilkTekst, Strelica, Vod } from '@/components/ploca/primitivi';
import { Napomena } from './oblici';

/*
  Petlja osjeti-odluči-djeluj: tri stanice na ploči, spojene bakarnim vodom
  koji se zatvara u krug. Ovo je kičma cijelog sajta, pa se isti raspored
  ponavlja svugdje gdje se petlja pominje.
*/

/*
  X pozicije se poklapaju sa tri eksponata na početnoj strani (1/6, 3/6, 5/6),
  pa vodovi koji spajaju petlju sa eksponatima idu pravo nadolje.
*/
const STANICE = [
  { x: 167, boja: 'osjeti' as const, natpis: 'SENZOR', rijec: 'OSJETI', oznaka: 'D1' },
  { x: 500, boja: 'odluci' as const, natpis: 'MOZAK', rijec: 'ODLUČI', oznaka: 'D2' },
  { x: 833, boja: 'djeluj' as const, natpis: 'MOTOR', rijec: 'DJELUJ', oznaka: 'D3' },
];

const SIRINA_KUTIJE = 206;
const VISINA_KUTIJE = 128;
const Y_KUTIJE = 196;

export function IlustracijaPetlja() {
  const vrh = Y_KUTIJE;
  const dno = Y_KUTIJE + VISINA_KUTIJE;
  const sredina = Y_KUTIJE + VISINA_KUTIJE / 2;

  return (
    <>
      {/* vodovi između stanica */}
      <Vod tacke={`${170 + SIRINA_KUTIJE / 2},${sredina} ${500 - SIRINA_KUTIJE / 2},${sredina}`} struja="naprijed" debljina={6} />
      <Vod tacke={`${500 + SIRINA_KUTIJE / 2},${sredina} ${830 - SIRINA_KUTIJE / 2},${sredina}`} struja="naprijed" debljina={6} />

      {/* povratni vod: djeluj se vraća na osjeti, jer robot mjeri posljedicu svog pokreta */}
      <Vod
        tacke={`830,${dno} 830,466 790,506 210,506 170,466 170,${dno}`}
        struja="naprijed"
        debljina={6}
        brzina={2.6}
      />

      <Strelica x={334} y={sredina} ugao={0} />
      <Strelica x={664} y={sredina} ugao={0} />
      <Strelica x={500} y={506} ugao={180} />

      <SilkTekst x={500} y={546} sredina velicina={19} boja="var(--silkscreen-tih)">
        pa opet iz početka
      </SilkTekst>

      {STANICE.map((s) => (
        <g key={s.rijec}>
          <Komponenta
            x={s.x - SIRINA_KUTIJE / 2}
            y={Y_KUTIJE}
            w={SIRINA_KUTIJE}
            h={VISINA_KUTIJE}
            natpis={s.natpis}
            boja={`var(--${s.boja})`}
            noge={3}
          />
          <Led x={s.x} y={vrh - 46} boja={s.boja} r={17} oznaka={s.oznaka} />
          <SilkTekst x={s.x} y={dno + 52} sredina velicina={30} boja={`var(--${s.boja})`}>
            {s.rijec}
          </SilkTekst>
        </g>
      ))}

      <Pad x={60} y={sredina} r={11} />
      <Pad x={940} y={sredina} r={11} />
      <Vod tacke={`60,${sredina} ${170 - SIRINA_KUTIJE / 2},${sredina}`} debljina={5} />
      <Vod tacke={`${830 + SIRINA_KUTIJE / 2},${sredina} 940,${sredina}`} debljina={5} />

      <Napomena x={60} y={596}>
        ista petlja radi i u tebi
      </Napomena>
    </>
  );
}

/*
  Široka varijanta iste petlje, za početnu stranu. Tamo petlji pripada
  traka preko cijele širine, a ne kvadratno polje, pa se crta niže i šire.
*/
export function IlustracijaPetljaSiroka() {
  const vrh = 52;
  const dno = 162;
  const sredina = (vrh + dno) / 2;
  const pola = 122;

  return (
    <>
      <Vod tacke={`${167 + pola},${sredina} ${500 - pola},${sredina}`} struja="naprijed" debljina={6} />
      <Vod tacke={`${500 + pola},${sredina} ${833 - pola},${sredina}`} struja="naprijed" debljina={6} />
      <Strelica x={334} y={sredina} />
      <Strelica x={667} y={sredina} />

      <Vod tacke={`833,${dno} 833,240 797,276 203,276 167,240 167,${dno}`} struja="naprijed" debljina={6} brzina={2.6} />
      <Strelica x={500} y={276} ugao={180} />
      <SilkTekst x={500} y={316} sredina velicina={19} boja="var(--silkscreen-tih)">
        pa opet iz početka
      </SilkTekst>

      {STANICE.map((s) => (
        <g key={s.rijec}>
          <SilkTekst x={s.x} y={32} sredina velicina={26} boja={`var(--${s.boja})`}>
            {s.rijec}
          </SilkTekst>
          <Komponenta
            x={s.x - pola}
            y={vrh}
            w={pola * 2}
            h={dno - vrh}
            boja={`var(--${s.boja})`}
            noge={2}
          />
          <Led x={s.x - 76} y={sredina} boja={s.boja} r={15} />
          <SilkTekst x={s.x - 34} y={sredina + 8} velicina={21} boja={`var(--${s.boja})`}>
            {s.natpis}
          </SilkTekst>
        </g>
      ))}

      <Pad x={40} y={sredina} r={11} />
      <Pad x={960} y={sredina} r={11} />
      <Vod tacke={`40,${sredina} ${167 - pola},${sredina}`} debljina={5} />
      <Vod tacke={`${833 + pola},${sredina} 960,${sredina}`} debljina={5} />
    </>
  );
}

/* Srce na matrici 5×5 — prvo što svaki micro:bit prikaže. */
const SRCE = [1, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 22];

/*
  Zatvaranje: micro:bit, nekoliko žica i jedna LED koja se upalila kad treba.
  Namjerno najmanja ploča na cijelom sajtu.
*/
export function IlustracijaZatvaranje() {
  return (
    <>
      {/* micro:bit: pločica sa ivičnim konektorom i matricom LED-ova */}
      <Komponenta x={250} y={170} w={330} h={220} oznaka="micro:bit" boja="var(--odluci)" />
      <g>
        {Array.from({ length: 5 }).map((_, red) =>
          Array.from({ length: 5 }).map((_, kolona) => {
            const upaljena = SRCE.includes(red * 5 + kolona);
            return (
              <rect
                key={`${red}-${kolona}`}
                x={330 + kolona * 34}
                y={220 + red * 30}
                width={18}
                height={18}
                rx={3}
                fill={upaljena ? 'var(--djeluj)' : 'var(--maska-duboka)'}
                stroke="var(--djeluj)"
                strokeWidth={1.6}
                opacity={upaljena ? 1 : 0.35}
              />
            );
          }),
        )}
      </g>
      {/* ivični konektor sa zlatnim prstima */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={276 + i * 62} y={390} width={38} height={26} rx={2} fill="var(--bakar)" />
      ))}

      {/* dvije žice do jedne LED diode */}
      <Vod tacke="314,416 314,470 380,470" struja="naprijed" debljina={6} />
      <Vod tacke="710,470 776,470 776,416" debljina={6} />
      <Vod tacke="380,470 710,470" struja="naprijed" debljina={6} />
      <Led x={545} y={470} boja="djeluj" r={22} oznaka="D1" />

      <Vod tacke="250,206 156,206" debljina={3} boja="var(--bakar)" />
      <SilkTekst x={144} y={200} desno velicina={20} boja="var(--silkscreen-tih)">
        jedna
      </SilkTekst>
      <SilkTekst x={144} y={226} desno velicina={20} boja="var(--silkscreen-tih)">
        pločica
      </SilkTekst>

      <Vod tacke="776,416 860,416" debljina={3} boja="var(--bakar)" />
      <SilkTekst x={872} y={422} velicina={20} boja="var(--silkscreen-tih)">
        nekoliko
      </SilkTekst>
      <SilkTekst x={872} y={448} velicina={20} boja="var(--silkscreen-tih)">
        žica
      </SilkTekst>

      <Napomena x={250} y={556}>
        odavde su počeli i rover i psi
      </Napomena>
    </>
  );
}
