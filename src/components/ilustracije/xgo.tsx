import { Komponenta, Led, Pad, SilkTekst, Strelica, Vod } from '@/components/ploca/primitivi';
import { Antena, Mikrofon, Napomena, Pas, Pilula, RadioLukovi, Talas } from './oblici';

/*
  XGO psi: naglasak je povratna sprega. Svaka ilustracija ovog bloka
  vraća se na isti ritam — izmjeri, izračunaj, pomjeri, pa opet izmjeri.
*/

export function IlustracijaXgoPas() {
  return (
    <>
      <Pas x={520} y={230} skala={1.35} nagib={-7} />
      {/* tlo */}
      <Vod tacke="60,394 940,394" debljina={6} />

      {/* ruka koja gura */}
      <g stroke="var(--djeluj)" strokeWidth={7} strokeLinecap="round" fill="none">
        <line x1={110} y1={190} x2={250} y2={190} />
      </g>
      <Strelica x={266} y={190} ugao={0} velicina={22} boja="var(--djeluj)" />
      <SilkTekst x={110} y={150} velicina={24} boja="var(--djeluj)">
        gurni
      </SilkTekst>

      {/* nagib koji je nastao od guranja */}
      <path d="M 700 150 A 90 90 0 0 1 736 216" fill="none" stroke="var(--osjeti)" strokeWidth={4} strokeDasharray="7 6" />
      <SilkTekst x={752} y={186} velicina={20} boja="var(--osjeti)">
        nagib
      </SilkTekst>

      <SilkTekst x={60} y={470} velicina={26} boja="var(--silkscreen-tih)">
        vratiće se sam, bez da mu iko kaže
      </SilkTekst>
      <Vod tacke="60,510 400,510 440,550 940,550" debljina={4} />
      <Pad x={940} y={550} />
      <Napomena x={60} y={594}>
        probaj lagano
      </Napomena>
    </>
  );
}

export function IlustracijaXgoImu() {
  return (
    <>
      {/* unutrašnje uho: tri polukružna kanala i puž */}
      <g fill="none" stroke="var(--osjeti)" strokeWidth={5} strokeLinecap="round">
        <ellipse cx={212} cy={196} rx={62} ry={44} transform="rotate(-24 212 196)" />
        <ellipse cx={268} cy={242} rx={58} ry={40} transform="rotate(38 268 242)" />
        <ellipse cx={180} cy={262} rx={54} ry={38} transform="rotate(84 180 262)" />
        <path d="M 236 306 C 236 372 168 372 168 322 C 168 290 208 290 208 330 C 208 352 188 352 188 334" />
      </g>
      <SilkTekst x={212} y={420} sredina velicina={22} boja="var(--osjeti)">
        tvoje uho
      </SilkTekst>

      {/* znak jednakosti: isti posao, drugi materijal */}
      <g stroke="var(--silkscreen-tih)" strokeWidth={7} strokeLinecap="round">
        <line x1={430} y1={238} x2={500} y2={238} />
        <line x1={430} y1={272} x2={500} y2={272} />
      </g>

      {/* IMU na pločici */}
      <Komponenta x={620} y={188} w={216} h={140} natpis="IMU" oznaka="U1" boja="var(--osjeti)" noge={4} />
      <Led x={728} y={152} boja="osjeti" r={16} oznaka="D1" />
      <SilkTekst x={728} y={420} sredina velicina={22} boja="var(--osjeti)">
        senzor u psu
      </SilkTekst>

      {/* osa nagiba koju mjeri */}
      <line x1={572} y1={258} x2={884} y2={258} stroke="var(--silkscreen-tih)" strokeWidth={3} strokeDasharray="8 7" />
      <path d="M 884 258 A 90 90 0 0 0 858 196" fill="none" stroke="var(--bakar-struja)" strokeWidth={4} />
      <SilkTekst x={896} y={212} velicina={18} boja="var(--bakar-struja)">
        ugao
      </SilkTekst>

      <SilkTekst x={60} y={506} velicina={26} boja="var(--silkscreen-tih)">
        isti senzor je i u tvom telefonu, kad okreneš ekran
      </SilkTekst>
      <Vod tacke="60,546 460,546 500,586 940,586" debljina={4} />
      <Pad x={940} y={586} />
    </>
  );
}

export function IlustracijaXgoPetlja() {
  return (
    <>
      <Pas x={500} y={250} skala={0.92} nagib={-5} />

      {/* petlja koja obilazi psa */}
      <Vod tacke="150,180 150,120 850,120 850,180" struja="naprijed" debljina={6} brzina={0.9} />
      <Vod tacke="850,320 850,420 150,420 150,320" struja="naprijed" debljina={6} brzina={0.9} />

      <Komponenta x={64} y={180} w={172} h={140} natpis="IMU" oznaka="U1" boja="var(--osjeti)" noge={3} />
      <SilkTekst x={150} y={352} sredina velicina={21} boja="var(--osjeti)">
        izmjeri
      </SilkTekst>

      <SilkTekst x={500} y={80} sredina velicina={23} boja="var(--odluci)">
        izračunaj ispravku
      </SilkTekst>
      <Led x={620} y={120} boja="odluci" r={15} />

      <Komponenta x={764} y={180} w={172} h={140} natpis="MOTORI" oznaka="M1-M12" boja="var(--djeluj)" noge={3} />
      <SilkTekst x={850} y={352} sredina velicina={21} boja="var(--djeluj)">
        pomjeri
      </SilkTekst>

      <Strelica x={500} y={120} ugao={0} velicina={16} />
      <Strelica x={500} y={420} ugao={180} velicina={16} />

      <SilkTekst x={500} y={462} sredina velicina={21} boja="var(--silkscreen-tih)">
        pa opet izmjeri
      </SilkTekst>

      <SilkTekst x={500} y={534} sredina velicina={30} boja="var(--bakar-struja)">
        stotinama puta u sekundi
      </SilkTekst>
      <Napomena x={60} y={592}>
        usporeno
      </Napomena>
    </>
  );
}

export function IlustracijaXgoSvugdje() {
  const primjeri = [
    { naziv: 'DRON', x: 180 },
    { naziv: 'RAKETA', x: 500 },
    { naziv: 'AUTOPILOT', x: 820 },
  ];

  return (
    <>
      {primjeri.map((p, i) => (
        <g key={p.naziv}>
          {i === 0 && (
            <g fill="none" stroke="var(--silkscreen)" strokeWidth={5} strokeLinecap="round">
              <line x1={p.x - 74} y1={152} x2={p.x + 74} y2={152} />
              <line x1={p.x - 74} y1={126} x2={p.x - 74} y2={152} />
              <line x1={p.x + 74} y1={126} x2={p.x + 74} y2={152} />
              <line x1={p.x - 108} y1={126} x2={p.x - 40} y2={126} />
              <line x1={p.x + 40} y1={126} x2={p.x + 108} y2={126} />
              <rect x={p.x - 36} y={152} width={72} height={44} rx={8} />
            </g>
          )}
          {i === 1 && (
            <g fill="none" stroke="var(--silkscreen)" strokeWidth={5} strokeLinejoin="round">
              <path d={`M ${p.x} 108 L ${p.x + 30} 164 L ${p.x + 30} 196 L ${p.x - 30} 196 L ${p.x - 30} 164 Z`} />
              <path d={`M ${p.x - 30} 168 L ${p.x - 56} 200 L ${p.x - 30} 196`} />
              <path d={`M ${p.x + 30} 168 L ${p.x + 56} 200 L ${p.x + 30} 196`} />
            </g>
          )}
          {i === 2 && (
            <g fill="none" stroke="var(--silkscreen)" strokeWidth={5} strokeLinejoin="round">
              <path d={`M ${p.x - 96} 176 L ${p.x + 66} 176 L ${p.x + 96} 156 L ${p.x + 66} 196 L ${p.x - 96} 196 Z`} />
              <path d={`M ${p.x - 30} 176 L ${p.x - 8} 126 L ${p.x + 14} 176`} />
            </g>
          )}

          <SilkTekst x={p.x} y={248} sredina velicina={23} boja="var(--silkscreen)">
            {p.naziv}
          </SilkTekst>

          {/* svaki nosi istu petlju */}
          <Vod tacke={`${p.x - 92},300 ${p.x + 92},300 ${p.x + 92},380 ${p.x - 92},380 ${p.x - 92},300`} zatvoren struja="naprijed" debljina={5} brzina={1.6} />
          <Led x={p.x - 92} y={340} boja="osjeti" r={13} />
          <Led x={p.x} y={300} boja="odluci" r={13} />
          <Led x={p.x + 92} y={340} boja="djeluj" r={13} />
        </g>
      ))}

      <SilkTekst x={500} y={462} sredina velicina={28} boja="var(--bakar-struja)">
        ista petlja, drugi posao
      </SilkTekst>
      <Vod tacke="80,510 420,510 460,550 540,550 580,510 920,510" debljina={5} />
      <SilkTekst x={500} y={598} sredina velicina={21} boja="var(--silkscreen-tih)">
        čak i klima u kući
      </SilkTekst>
    </>
  );
}

export function IlustracijaXgoMotori() {
  /* 12 u nogama: po tri zgloba na svakoj od četiri noge. */
  const noge = [-84, -24, 40, 100];

  return (
    <>
      <Pas x={500} y={228} skala={1.22} />
      <Vod tacke="60,396 940,396" debljina={6} />

      {noge.map((nx, i) =>
        [0, 1, 2].map((z) => (
          <Pad key={`${nx}-${z}`} x={500 + nx * 1.22 + (z === 0 ? 0 : i < 2 ? -17 : 17)} y={228 + [22, 76, 130][z]} r={9} boja="var(--djeluj)" />
        )),
      )}

      {/* 3 u ruci na leđima */}
      <Pad x={464} y={180} r={9} boja="var(--djeluj)" />
      <Pad x={436} y={116} r={9} boja="var(--djeluj)" />
      <Pad x={496} y={90} r={9} boja="var(--djeluj)" />

      <SilkTekst x={60} y={470} velicina={34} boja="var(--djeluj)">
        12 u nogama
      </SilkTekst>
      <SilkTekst x={940} y={470} desno velicina={34} boja="var(--djeluj)">
        3 u ruci
      </SilkTekst>

      <Vod tacke="60,510 300,510 340,550 660,550 700,510 940,510" debljina={5} />
      <SilkTekst x={500} y={598} sredina velicina={26} boja="var(--bakar-struja)">
        svaki motor zna svoj ugao
      </SilkTekst>
    </>
  );
}

export function IlustracijaXgoKomanda() {
  return (
    <>
      <Mikrofon x={90} y={200} skala={0.92} />
      <Talas x={122} y={200} sirina={80} amplituda={26} periodi={1.6} boja="var(--osjeti)" debljina={4} />
      <SilkTekst x={90} y={286} sredina velicina={19} boja="var(--osjeti)">
        tvoj glas
      </SilkTekst>

      <Vod tacke="216,200 268,200" struja="naprijed" debljina={6} />
      <Komponenta x={268} y={150} w={160} h={104} natpis="JARVIS" oznaka="U1" boja="var(--odluci)" noge={2} />

      <Vod tacke="440,200 500,200" struja="naprijed" debljina={6} />
      <Komponenta x={500} y={150} w={150} h={104} natpis="micro:bit" oznaka="A1" boja="var(--odluci)" noge={2} />
      <Antena x={575} y={150} visina={54} />
      <RadioLukovi x={575} y={90} broj={3} razmak={22} smjer={1} />

      <Pilula x={742} y={96} tekst="SJEDI" boja="var(--bakar-struja)" aktivna velicina={19} />

      <Komponenta x={790} y={150} w={150} h={104} natpis="micro:bit" oznaka="A2" boja="var(--odluci)" noge={2} />
      <Antena x={865} y={150} visina={54} />

      <Vod tacke="865,254 865,320 500,320" struja="naprijed" debljina={6} />
      <Pas x={360} y={362} skala={0.78} />
      <Vod tacke="60,470 940,470" debljina={6} />

      <SilkTekst x={620} y={360} velicina={21} boja="var(--djeluj)">
        pas sjeda
      </SilkTekst>
      <Led x={760} y={352} boja="djeluj" r={15} oznaka="D3" />

      <SilkTekst x={60} y={540} velicina={26} boja="var(--bakar-struja)">
        glas → mozak → radio → pokret
      </SilkTekst>
      <Napomena x={60} y={584}>
        cio krug, od tvoje riječi do njegove noge
      </Napomena>
    </>
  );
}
