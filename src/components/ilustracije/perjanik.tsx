import { FAILSAFE_MS, KAMERA_SENZOR } from '@/config/cinjenice';
import { Komponenta, Led, Pad, SilkTekst, Strelica, Vod } from '@/components/ploca/primitivi';
import { Antena, Napomena, RadioLukovi, Tocak } from './oblici';

/*
  Perjanik: rover na ČETIRI točka. Suspenzija je rocker sa diferencijalom —
  po jedna poluga sa dva točka sa svake strane, i diferencijal između njih.
  Nije rocker-bogie; to ima NASA, sa tri točka po strani.
*/

const TLO = 452;
const R_TOCKA = 44;
const Y_TOCKA_NA_RAVNOM = TLO - R_TOCKA;
/** Pola raspona poluge: rastojanje od osovine do svakog točka. */
const POLA_POLUGE = 116;

/**
 * Gdje se šta nalazi na roveru, za dati položaj i visinu kamena.
 * Ilustracije odavde uzimaju tačke za oznake, pa nijedna strelica
 * ne pokazuje u prazno kad se geometrija promijeni.
 */
function geometrija(x: number, visinaKamena: number) {
  const ugao = Math.asin(Math.max(-1, Math.min(1, -visinaKamena / (2 * POLA_POLUGE))));
  const yOsovine = Y_TOCKA_NA_RAVNOM - visinaKamena / 2;
  const dnoTijela = yOsovine - 66;
  const vrhTijela = dnoTijela - 84;
  return {
    ugao,
    yOsovine,
    dnoTijela,
    vrhTijela,
    lijevoTijela: x - 132,
    desnoTijela: x + 132,
    lakatRuke: { x: x - 96, y: vrhTijela - 70 },
    vrhAntene: { x: x + 96, y: vrhTijela - 70 },
    kamera: { x: x + 176, y: vrhTijela + 39 },
    tocak: (smjer: 1 | -1) => ({
      x: x + smjer * POLA_POLUGE * Math.cos(ugao),
      y: yOsovine + smjer * POLA_POLUGE * Math.sin(ugao),
    }),
  };
}

/**
 * Rover sa strane. Daleka strana se crta prigušeno, da se u jednom pogledu
 * vide sva četiri točka.
 *
 * Kad prednji točak stane na kamen visine h, poluga se zarotira taman toliko
 * da oba njena točka ostanu na podlozi, a osovina se podigne za h/2 — to je
 * tačno ono što diferencijal radi sa tijelom: drži ga na prosjeku dvije strane.
 */
function Rover({
  x = 500,
  visinaKamena = 0,
  dalekaStrana = true,
}: {
  x?: number;
  visinaKamena?: number;
  dalekaStrana?: boolean;
}) {
  const sinNagiba = -visinaKamena / (2 * POLA_POLUGE);
  const ugao = Math.asin(Math.max(-1, Math.min(1, sinNagiba)));
  const yOsovine = Y_TOCKA_NA_RAVNOM - visinaKamena / 2;

  const kraj = (smjer: number) => ({
    x: x + smjer * POLA_POLUGE * Math.cos(ugao),
    y: yOsovine + smjer * POLA_POLUGE * Math.sin(ugao),
  });
  const nazad = kraj(-1);
  const naprijed = kraj(1);

  const dnoTijela = yOsovine - 66;
  const vrhTijela = dnoTijela - 84;

  return (
    <g>
      {/* daleka strana: ista poluga, ista dva točka, samo pomjerena i prigušena */}
      <g opacity={dalekaStrana ? 0.26 : 0} transform="translate(-36 -24)">
        <line
          x1={x - POLA_POLUGE}
          y1={Y_TOCKA_NA_RAVNOM}
          x2={x + POLA_POLUGE}
          y2={Y_TOCKA_NA_RAVNOM}
          stroke="var(--silkscreen)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <Tocak x={x - POLA_POLUGE} y={Y_TOCKA_NA_RAVNOM} r={R_TOCKA} />
        <Tocak x={x + POLA_POLUGE} y={Y_TOCKA_NA_RAVNOM} r={R_TOCKA} />
      </g>

      {/* nosač od tijela do osovine poluge */}
      <line x1={x} y1={dnoTijela} x2={x} y2={yOsovine} stroke="var(--silkscreen)" strokeWidth={9} />

      {/* poluga: greda kroz oba glavčina, osovina na sredini */}
      <line x1={nazad.x} y1={nazad.y} x2={naprijed.x} y2={naprijed.y} stroke="var(--silkscreen)" strokeWidth={11} strokeLinecap="round" />
      <circle cx={x} cy={yOsovine} r={14} fill="var(--maska-duboka)" stroke="var(--bakar)" strokeWidth={5} />

      <Tocak x={nazad.x} y={nazad.y} r={R_TOCKA} />
      <Tocak x={naprijed.x} y={naprijed.y} r={R_TOCKA} />

      {/* tijelo ostaje vodoravno */}
      <rect x={x - 132} y={vrhTijela} width={264} height={84} rx={12} fill="var(--maska-svijetla)" stroke="var(--silkscreen)" strokeWidth={5} />

      {/* kamera naprijed */}
      <rect x={x + 132} y={vrhTijela + 18} width={44} height={42} rx={6} fill="var(--maska-svijetla)" stroke="var(--osjeti)" strokeWidth={4} />
      <circle cx={x + 170} cy={vrhTijela + 39} r={12} fill="none" stroke="var(--osjeti)" strokeWidth={4} />

      {/* robotska ruka na vrhu, sa hvataljkom */}
      <line x1={x - 62} y1={vrhTijela} x2={x - 96} y2={vrhTijela - 70} stroke="var(--djeluj)" strokeWidth={6} strokeLinecap="round" />
      <line x1={x - 96} y1={vrhTijela - 70} x2={x - 14} y2={vrhTijela - 96} stroke="var(--djeluj)" strokeWidth={6} strokeLinecap="round" />
      <line x1={x - 14} y1={vrhTijela - 96} x2={x + 16} y2={vrhTijela - 82} stroke="var(--djeluj)" strokeWidth={6} strokeLinecap="round" />
      <line x1={x - 14} y1={vrhTijela - 96} x2={x + 14} y2={vrhTijela - 112} stroke="var(--djeluj)" strokeWidth={6} strokeLinecap="round" />

      <Antena x={x + 96} y={vrhTijela} visina={70} />
    </g>
  );
}

export function IlustracijaPerjanikRover() {
  const g = geometrija(500, 0);

  return (
    <>
      <Rover />
      <Vod tacke={`40,${TLO} 960,${TLO}`} debljina={6} />

      {/* Oznake stoje van crteža, a vod ih vodi tačno do dijela na koji se odnose. */}
      <Vod tacke={`${g.lakatRuke.x - 6},${g.lakatRuke.y} 300,${g.lakatRuke.y}`} debljina={3} boja="var(--djeluj)" />
      <SilkTekst x={288} y={g.lakatRuke.y + 6} desno velicina={19} boja="var(--djeluj)">
        ruka
      </SilkTekst>

      <Vod tacke={`${g.vrhAntene.x + 8},${g.vrhAntene.y} 700,${g.vrhAntene.y}`} debljina={3} boja="var(--bakar)" />
      <SilkTekst x={712} y={g.vrhAntene.y + 6} velicina={19} boja="var(--bakar-struja)">
        antena
      </SilkTekst>

      <Vod tacke={`${g.kamera.x + 6},${g.kamera.y} 790,${g.kamera.y}`} debljina={3} boja="var(--osjeti)" />
      <SilkTekst x={802} y={g.kamera.y + 6} velicina={19} boja="var(--osjeti)">
        kamera
      </SilkTekst>

      <SilkTekst x={500} y={512} sredina velicina={26} boja="var(--silkscreen-tih)">
        četiri točka, dvije poluge, jedan diferencijal
      </SilkTekst>

      <Vod tacke="40,564 380,564 420,600 960,600" debljina={5} />
      <Pad x={40} y={564} />
      <Pad x={960} y={600} />
      <Napomena x={440} y={580}>
        nije kupljen
      </Napomena>
    </>
  );
}

export function IlustracijaPerjanikStampa() {
  const slojeva = 14;

  return (
    <>
      {/* mlaznica */}
      <g stroke="var(--djeluj)" strokeWidth={5} fill="var(--maska-svijetla)" strokeLinejoin="round">
        <path d="M 470 96 L 590 96 L 590 152 L 546 196 L 514 196 L 470 152 Z" />
      </g>
      <SilkTekst x={610} y={140} velicina={20} boja="var(--djeluj)">
        mlaznica
      </SilkTekst>

      {/* dio koji raste sloj po sloj */}
      {Array.from({ length: slojeva }).map((_, i) => {
        const y = 400 - i * 15;
        const sirina = 250 - Math.abs(i - slojeva / 2) * 9;
        const gotov = i < slojeva - 3;
        return (
          <rect
            key={i}
            x={530 - sirina / 2}
            y={y}
            width={sirina}
            height={12}
            rx={2}
            fill={gotov ? 'var(--bakar)' : 'var(--bakar-struja)'}
            opacity={gotov ? 0.55 + (i / slojeva) * 0.4 : 1}
          />
        );
      })}

      {/* sto štampača */}
      <Vod tacke="330,424 730,424" debljina={7} />
      <SilkTekst x={330} y={462} velicina={19} boja="var(--silkscreen-tih)">
        sto štampača
      </SilkTekst>

      <SilkTekst x={60} y={250} velicina={30} boja="var(--bakar-struja)">
        sloj
      </SilkTekst>
      <SilkTekst x={60} y={292} velicina={30} boja="var(--bakar-struja)">
        po sloj
      </SilkTekst>
      <Vod tacke="60,320 220,320 260,360 260,400" debljina={5} />

      <SilkTekst x={60} y={540} velicina={26} boja="var(--silkscreen-tih)">
        prvo nacrtaš na računaru, pa štampaš
      </SilkTekst>
      <Vod tacke="60,580 420,580 460,540 940,540" debljina={4} />
      <Pad x={940} y={540} />
    </>
  );
}

/*
  Kamen je postavljen tako da mu sredina padne tačno pod prednji točak:
  sredina gornje površine je X_KAMENA + 82, a prednji točak na 620 + 116·cos(ugao).
*/
const VISINA_KAMENA = 56;
const X_KAMENA = 650;

export function IlustracijaPerjanikSuspenzija() {
  return (
    <>
      {/*
        Kamen pod prednjim točkom. Poluga se zarotira taman toliko da oba njena
        točka ostanu na podlozi, a osovina se podigne za pola visine kamena.
        Daleka strana je ovdje isključena — na ovom slajdu smeta poluzi.
      */}
      <Rover x={620} visinaKamena={VISINA_KAMENA} dalekaStrana={false} />
      <Vod
        tacke={`300,${TLO} ${X_KAMENA},${TLO} ${X_KAMENA + 26},${TLO - VISINA_KAMENA} ${X_KAMENA + 138},${TLO - VISINA_KAMENA} ${X_KAMENA + 164},${TLO} 960,${TLO}`}
        debljina={6}
      />

      <Vod
        tacke={`${X_KAMENA + 146},${TLO - VISINA_KAMENA + 12} ${X_KAMENA + 190},${TLO - VISINA_KAMENA - 14}`}
        debljina={3}
        boja="var(--bakar)"
      />
      <SilkTekst x={X_KAMENA + 200} y={TLO - VISINA_KAMENA - 10} velicina={19} boja="var(--bakar-struja)">
        kamen
      </SilkTekst>

      {/* diferencijal drži tijelo na prosjeku dvije poluge */}
      <Komponenta x={40} y={236} w={232} h={64} natpis="DIFERENCIJAL" boja="var(--bakar-struja)" />
      <Vod tacke={`284,268 ${620 - 132},268`} debljina={4} boja="var(--bakar)" />
      <SilkTekst x={40} y={336} velicina={20} boja="var(--silkscreen-tih)">
        drži tijelo u sredini
      </SilkTekst>
      <SilkTekst x={40} y={366} velicina={20} boja="var(--silkscreen-tih)">
        kad jedna strana ide gore
      </SilkTekst>

      <SilkTekst x={40} y={528} velicina={26} boja="var(--silkscreen)">
        sva četiri točka i dalje guraju
      </SilkTekst>
      <Vod tacke="40,564 420,564 456,600 960,600" debljina={5} />
      <Napomena x={470} y={582}>
        sa druge strane ista poluga i još dva točka
      </Napomena>
    </>
  );
}

export function IlustracijaPerjanikArduino() {
  return (
    <>
      <Komponenta x={300} y={150} w={400} h={236} oznaka="ARDUINO" natpis="" boja="var(--odluci)" />

      {/* redovi pinova gore i dolje */}
      {[0, 1].map((red) =>
        Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={`${red}-${i}`}
            x={330 + i * 29}
            y={red === 0 ? 162 : 356}
            width={19}
            height={19}
            rx={2}
            fill="var(--maska-duboka)"
            stroke="var(--bakar)"
            strokeWidth={2.5}
          />
        )),
      )}

      {/* procesor */}
      <Komponenta x={410} y={218} w={180} h={100} natpis="ATmega" boja="var(--odluci)" noge={4} />
      <Led x={660} y={200} boja="odluci" r={14} oznaka="D2" />

      <SilkTekst x={500} y={430} sredina velicina={26} boja="var(--odluci)">
        mozak rovera
      </SilkTekst>

      {/* izlazi ka motorima */}
      <Vod tacke="700,268 800,268 840,308 940,308" struja="naprijed" debljina={6} />
      <SilkTekst x={940} y={278} desno velicina={19} boja="var(--djeluj)">
        motori
      </SilkTekst>

      {/* ulaz sa radija */}
      <Vod tacke="60,268 160,268 200,228 300,228" struja="naprijed" debljina={6} />
      <SilkTekst x={60} y={238} velicina={19} boja="var(--osjeti)">
        komande
      </SilkTekst>

      <SilkTekst x={60} y={512} velicina={26} boja="var(--silkscreen-tih)">
        košta koliko jedna igrica, a vozi cio rover
      </SilkTekst>
      <Vod tacke="60,552 420,552 460,592 940,592" debljina={4} />
      <Pad x={940} y={592} />
    </>
  );
}

export function IlustracijaPerjanikRadio() {
  return (
    <>
      {/* palica: komande idu ka roveru */}
      <Komponenta x={60} y={186} w={170} h={120} natpis="PALICA" oznaka="TX" boja="var(--osjeti)" />
      <Antena x={145} y={186} visina={58} />
      <RadioLukovi x={145} y={122} broj={3} razmak={30} smjer={1} boja="var(--osjeti)" />
      <SilkTekst x={60} y={340} velicina={21} boja="var(--osjeti)">
        komande
      </SilkTekst>

      {/* rover u sredini */}
      <Komponenta x={400} y={186} w={200} h={120} natpis="PERJANIK" oznaka="RX" boja="var(--silkscreen)" />
      <Antena x={440} y={186} visina={58} />
      <Antena x={560} y={186} visina={58} />

      {/* kamera: slika ide nazad, preko WiFi-ja */}
      <RadioLukovi x={560} y={122} broj={4} razmak={17} smjer={1} boja="var(--djeluj)" />
      <Komponenta x={770} y={186} w={170} h={120} natpis="EKRAN" boja="var(--djeluj)" />
      <SilkTekst x={940} y={340} desno velicina={21} boja="var(--djeluj)">
        slika
      </SilkTekst>
      {KAMERA_SENZOR && (
        <SilkTekst x={600} y={166} velicina={16} boja="var(--silkscreen-tih)">
          {KAMERA_SENZOR}
        </SilkTekst>
      )}

      <Vod tacke="230,246 400,246" struja="naprijed" debljina={5} />
      <Vod tacke="600,246 770,246" struja="naprijed" debljina={5} />
      <Strelica x={316} y={246} />
      <Strelica x={686} y={246} />

      <SilkTekst x={60} y={452} velicina={24} boja="var(--silkscreen-tih)">
        duži talas nosi komande, kraći nosi sliku
      </SilkTekst>
      <Vod tacke="60,492 400,492 440,532 940,532" debljina={5} />
      <Pad x={940} y={532} />
      <Napomena x={60} y={584}>
        dva radija, dva posla
      </Napomena>
    </>
  );
}

export function IlustracijaPerjanikFailsafe() {
  return (
    <>
      <Komponenta x={60} y={196} w={170} h={120} natpis="PALICA" oznaka="TX" boja="var(--silkscreen-tih)" />
      <Antena x={145} y={196} visina={54} boja="var(--silkscreen-tih)" />

      {/* veza prekinuta */}
      <Vod tacke="230,256 370,256" debljina={5} boja="var(--silkscreen-tih)" />
      <Vod tacke="500,256 620,256" debljina={5} boja="var(--silkscreen-tih)" />
      <g stroke="var(--alarm)" strokeWidth={9} strokeLinecap="round">
        <line x1={402} y1={222} x2={468} y2={290} />
        <line x1={468} y1={222} x2={402} y2={290} />
      </g>
      <SilkTekst x={435} y={196} sredina velicina={21} boja="var(--alarm)">
        nema signala
      </SilkTekst>

      <Komponenta x={620} y={196} w={200} h={120} natpis="PERJANIK" oznaka="RX" boja="var(--silkscreen)" />
      <Antena x={720} y={196} visina={54} />

      {/* tajmer koji broji do granice */}
      <Komponenta x={620} y={368} w={200} h={96} boja="var(--bakar-struja)" />
      <text
        x={720}
        y={432}
        textAnchor="middle"
        fontSize={46}
        fontWeight={700}
        fill="var(--bakar-struja)"
        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
      >
        {FAILSAFE_MS} ms
      </text>
      <Vod tacke="720,316 720,368" debljina={5} />
      <SilkTekst x={840} y={400} velicina={18} boja="var(--silkscreen-tih)">
        tajmer
      </SilkTekst>

      <Led x={880} y={256} boja="djeluj" upaljen={false} r={17} oznaka="D3" />

      <SilkTekst x={60} y={420} velicina={40} boja="var(--alarm)">
        STOP
      </SilkTekst>
      <SilkTekst x={60} y={466} velicina={22} boja="var(--silkscreen-tih)">
        motori staju sami
      </SilkTekst>

      <SilkTekst x={60} y={546} velicina={24} boja="var(--silkscreen-tih)">
        ne nastavlja da juri u zid
      </SilkTekst>
      <Vod tacke="60,586 400,586 440,546 940,546" debljina={4} />
      <Pad x={940} y={546} />
    </>
  );
}
