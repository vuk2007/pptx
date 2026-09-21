import { PIPELINE_VREMENA } from '@/config/cinjenice';
import { Komponenta, Led, Pad, SilkTekst, Strelica, Vod } from '@/components/ploca/primitivi';
import { Mikrofon, Napomena, Pilula, Talas, Zvucnik } from './oblici';

/*
  Jarvis: naglasak je mozak i pretvaranje jednog oblika signala u drugi.
  Kroz sve slajdove ide isti smjer čitanja — glas ulazi lijevo, izlazi desno.
*/

/** Determinističan šum: isti rezultat na serveru i u browseru. */
function sum(i: number, j: number) {
  const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return Math.abs(v - Math.floor(v));
}

export function IlustracijaJarvisKoJe() {
  return (
    <>
      <Talas x={40} y={250} sirina={240} amplituda={46} periodi={2.5} boja="var(--osjeti)" debljina={5} />
      <Pilula x={160} y={132} tekst="JARVIS" boja="var(--osjeti)" aktivna velicina={26} />

      <Mikrofon x={382} y={250} skala={1.25} />
      <Vod tacke="430,250 520,250" struja="naprijed" debljina={6} />

      <Komponenta x={520} y={182} w={230} h={136} natpis="JARVIS" oznaka="U1" boja="var(--odluci)" noge={4} />
      <Led x={635} y={148} boja="odluci" r={16} oznaka="D2" />

      <Vod tacke="762,250 856,250" struja="naprijed" debljina={6} />
      <Zvucnik x={904} y={250} skala={1.1} />

      <SilkTekst x={40} y={330} velicina={20} boja="var(--osjeti)">
        ti pitaš
      </SilkTekst>
      <SilkTekst x={960} y={330} desno velicina={20} boja="var(--djeluj)">
        on odgovara
      </SilkTekst>

      <Vod tacke="40,440 300,440 340,480 660,480 700,440 960,440" debljina={5} />
      <SilkTekst x={500} y={534} sredina velicina={22} boja="var(--silkscreen-tih)">
        pitaj ga bilo šta
      </SilkTekst>
      <Pad x={40} y={440} />
      <Pad x={960} y={440} />
    </>
  );
}

export function IlustracijaJarvisTalasi() {
  return (
    <>
      <SilkTekst x={40} y={112} velicina={21} boja="var(--silkscreen-tih)">
        talas u vazduhu
      </SilkTekst>
      <Talas x={40} y={250} sirina={300} amplituda={62} periodi={2.2} boja="var(--silkscreen)" debljina={5} />

      <Mikrofon x={432} y={250} skala={1.35} />
      <SilkTekst x={432} y={378} sredina velicina={21} boja="var(--osjeti)">
        mikrofon
      </SilkTekst>

      <Strelica x={352} y={250} />

      <Vod tacke="486,250 620,250" struja="naprijed" debljina={7} />
      <Pad x={640} y={250} r={12} />
      <Vod tacke="660,250 960,250" struja="naprijed" debljina={7} />

      <SilkTekst x={960} y={112} desno velicina={21} boja="var(--bakar-struja)">
        električni signal
      </SilkTekst>

      <SilkTekst x={500} y={496} sredina velicina={26} boja="var(--silkscreen-tih)">
        ovdje počinje elektronika
      </SilkTekst>
      <Vod tacke="40,540 400,540 440,580" debljina={4} />
      <Vod tacke="960,540 600,540 560,580" debljina={4} />
      <Napomena x={40} y={166}>
        pojednostavljeno
      </Napomena>
    </>
  );
}

export function IlustracijaJarvisBudjenje() {
  const rijeci = [
    { tekst: 'ZDRAVO', x: 96, prolazi: false },
    { tekst: 'KOLIKO', x: 250, prolazi: false },
    { tekst: 'JARVIS', x: 420, prolazi: true },
  ];

  return (
    <>
      <Vod tacke="40,250 470,250" debljina={6} />

      {rijeci.map((r) => (
        <g key={r.tekst} opacity={r.prolazi ? 1 : 0.32}>
          <Pilula x={r.x} y={250} tekst={r.tekst} boja={r.prolazi ? 'var(--osjeti)' : 'var(--silkscreen-tih)'} aktivna={r.prolazi} velicina={22} />
        </g>
      ))}

      {/* kapija koja se otvara samo na jednu riječ */}
      <Komponenta x={520} y={168} w={210} h={164} natpis="BUĐENJE" oznaka="U1" boja="var(--odluci)" noge={3} />
      <SilkTekst x={625} y={366} sredina velicina={19} boja="var(--silkscreen-tih)">
        sluša samo „Jarvis”
      </SilkTekst>

      <Vod tacke="742,250 960,250" struja="naprijed" debljina={6} />
      <Led x={880} y={172} boja="odluci" r={17} oznaka="D2" />
      <SilkTekst x={960} y={330} desno velicina={21} boja="var(--odluci)">
        budi se
      </SilkTekst>

      <SilkTekst x={40} y={470} velicina={21} boja="var(--silkscreen-tih)">
        sve ostalo prolazi i ne budi ga
      </SilkTekst>
      <Vod tacke="40,510 300,510 340,550 720,550" debljina={4} />
      <Napomena x={40} y={598}>
        zato ne sluša cijelo vrijeme sve
      </Napomena>
    </>
  );
}

export function IlustracijaJarvisGlasUTekst() {
  const kolona = 22;
  const redova = 9;

  return (
    <>
      <SilkTekst x={40} y={96} velicina={20} boja="var(--osjeti)">
        spektrogram
      </SilkTekst>

      {/* spektrogram: vrijeme udesno, visina tona nagore */}
      <g>
        {Array.from({ length: kolona }).map((_, k) =>
          Array.from({ length: redova }).map((_, r) => {
            const jacina = sum(k, r) * (1 - r / (redova + 3)) * 1.5;
            return (
              <rect
                key={`${k}-${r}`}
                x={40 + k * 19}
                y={130 + r * 22}
                width={16}
                height={19}
                rx={2}
                fill="var(--osjeti)"
                opacity={Math.min(0.95, Math.max(0.06, jacina))}
              />
            );
          }),
        )}
      </g>
      <SilkTekst x={40} y={366} velicina={17} boja="var(--silkscreen-tih)" debljina={400}>
        vrijeme →
      </SilkTekst>

      <Vod tacke="486,236 560,236" struja="naprijed" debljina={6} />
      <Komponenta x={560} y={176} w={190} h={120} natpis="GOVOR→TEKST" oznaka="U2" boja="var(--odluci)" noge={3} />
      <SilkTekst x={655} y={330} sredina velicina={18} boja="var(--silkscreen-tih)">
        lokalno, na laptopu
      </SilkTekst>

      <Vod tacke="762,236 830,236" struja="naprijed" debljina={6} />
      <Pilula x={890} y={236} tekst="KOLIKO JE SATI" boja="var(--silkscreen)" velicina={17} />

      <SilkTekst x={40} y={470} velicina={24} boja="var(--silkscreen-tih)">
        program ne čuje riječi, nego gleda ovu sliku
      </SilkTekst>
      <Vod tacke="40,512 420,512 460,552 960,552" debljina={4} />
      <Pad x={960} y={552} />
    </>
  );
}

export function IlustracijaJarvisMozak() {
  const tokeni = ['Sad', 'je', 'pola', 'tri'];

  return (
    <>
      <Pilula x={130} y={250} tekst="KOLIKO JE SATI" boja="var(--silkscreen)" velicina={17} />
      <Vod tacke="248,250 330,250" struja="naprijed" debljina={6} />

      <Komponenta x={330} y={158} w={266} h={184} natpis="JEZIČKI MODEL" oznaka="U3" boja="var(--odluci)" noge={5} />
      <Led x={463} y={122} boja="odluci" r={18} oznaka="D2" />
      <SilkTekst x={463} y={382} sredina velicina={20} boja="var(--odluci)">
        mozak
      </SilkTekst>

      <Vod tacke="608,250 680,250" struja="naprijed" debljina={6} />

      {/* odgovor izlazi riječ po riječ, ne odjednom */}
      {tokeni.map((t, i) => (
        <g key={t} opacity={1 - i * 0.18}>
          <Pilula x={740 + i * 66} y={250} tekst={t} boja="var(--djeluj)" velicina={17} />
        </g>
      ))}
      <SilkTekst x={960} y={330} desno velicina={19} boja="var(--silkscreen-tih)">
        riječ po riječ
      </SilkTekst>

      <SilkTekst x={40} y={480} velicina={24} boja="var(--silkscreen-tih)">
        ne traži odgovor u tabeli — smišlja ga
      </SilkTekst>
      <Vod tacke="40,522 360,522 400,562 960,562" debljina={4} />
      <Napomena x={40} y={600}>
        pojednostavljeno
      </Napomena>
    </>
  );
}

export function IlustracijaJarvisTekstUGlas() {
  return (
    <>
      <Pilula x={128} y={250} tekst="SAD JE POLA TRI" boja="var(--silkscreen)" velicina={17} />
      <Vod tacke="246,250 330,250" struja="naprijed" debljina={6} />

      <Komponenta x={330} y={186} w={210} h={130} natpis="TEKST→GLAS" oznaka="U4" boja="var(--odluci)" noge={3} />

      <Vod tacke="552,250 620,250" struja="naprijed" debljina={6} />
      <Talas x={630} y={250} sirina={220} amplituda={52} periodi={3} boja="var(--djeluj)" debljina={5} />

      <Zvucnik x={906} y={250} skala={1.15} />
      <SilkTekst x={906} y={348} sredina velicina={20} boja="var(--djeluj)">
        zvučnik
      </SilkTekst>

      <SilkTekst x={40} y={470} velicina={23} boja="var(--silkscreen-tih)">
        glas koji čuješ smo sami dizajnirali
      </SilkTekst>
      <Vod tacke="40,512 380,512 420,552 960,552" debljina={4} />
      <Pad x={960} y={552} />
      <Led x={40} y={552} boja="djeluj" r={13} />
    </>
  );
}

export function IlustracijaJarvisStreaming() {
  const v = PIPELINE_VREMENA;
  const ukupno = v.budjenje + v.glasUTekst + v.mozakCijelo + v.tekstUGlas;
  /* Lijevo ostaje mjesto za naziv reda, desno za oznaku „prva riječ". */
  const x0 = 270;
  const px = (940 - x0) / ukupno;

  const faze = [
    { naziv: 'BUĐENJE', t: v.budjenje, boja: 'var(--osjeti)' },
    { naziv: 'GLAS→TEKST', t: v.glasUTekst, boja: 'var(--osjeti)' },
    { naziv: 'MOZAK', t: v.mozakCijelo, boja: 'var(--odluci)' },
    { naziv: 'TEKST→GLAS', t: v.tekstUGlas, boja: 'var(--djeluj)' },
  ];

  /** Sekvencijalno: sve redom, glas kreće tek na kraju. */
  let x = x0;
  const sekvencijalno = faze.map((f) => {
    const blok = { ...f, x, w: f.t * px };
    x += f.t * px;
    return blok;
  });
  const prvaRijecSekv = x;

  /* Streaming: čim mozak smisli prvu rečenicu, glas već kreće. */
  const pocetakMozga = x0 + (v.budjenje + v.glasUTekst) * px;
  const prvaRijecStream = pocetakMozga + v.mozakPrvaRijec * px + v.tekstUGlas * px;

  return (
    <>
      {[0, 1].map((red) => {
        const y = 150 + red * 180;
        const naslov = red === 0 ? 'ČEKA SE SVE' : 'STREAMING';
        return (
          <g key={red}>
            <SilkTekst x={40} y={y + 10} velicina={22} boja={red === 0 ? 'var(--silkscreen-tih)' : 'var(--bakar-struja)'}>
              {naslov}
            </SilkTekst>

            {red === 0
              ? sekvencijalno.map((f) => (
                  <g key={f.naziv}>
                    <rect x={f.x} y={y - 26} width={Math.max(4, f.w - 4)} height={52} rx={4} fill={f.boja} opacity={0.75} />
                  </g>
                ))
              : (
                <>
                  <rect x={x0} y={y - 26} width={v.budjenje * px - 4} height={52} rx={4} fill="var(--osjeti)" opacity={0.75} />
                  <rect x={x0 + v.budjenje * px} y={y - 26} width={v.glasUTekst * px - 4} height={52} rx={4} fill="var(--osjeti)" opacity={0.75} />
                  {/* mozak i dalje radi, ali glas je već krenuo */}
                  <rect x={pocetakMozga} y={y - 26} width={v.mozakCijelo * px - 4} height={52} rx={4} fill="var(--odluci)" opacity={0.4} />
                  <rect x={pocetakMozga} y={y - 26} width={v.mozakPrvaRijec * px - 4} height={52} rx={4} fill="var(--odluci)" opacity={0.85} />
                  <rect
                    x={pocetakMozga + v.mozakPrvaRijec * px}
                    y={y + 34}
                    width={v.tekstUGlas * px - 4}
                    height={34}
                    rx={4}
                    fill="var(--djeluj)"
                    opacity={0.85}
                  />
                </>
              )}

            {/* trenutak kad iz zvučnika izađe prva riječ */}
            {(() => {
              const x = red === 0 ? prvaRijecSekv : prvaRijecStream;
              /* Uz desnu ivicu oznaka se okreće ulijevo, da ne izađe iz crteža. */
              const uzIvicu = x > 800;
              return (
                <>
                  <line x1={x} y1={y - 52} x2={x} y2={y + 82} stroke="var(--bakar-struja)" strokeWidth={4} strokeDasharray="8 7" />
                  <SilkTekst
                    x={uzIvicu ? x - 12 : x + 12}
                    y={y - 58}
                    desno={uzIvicu}
                    velicina={17}
                    boja="var(--bakar-struja)"
                  >
                    prva riječ
                  </SilkTekst>
                </>
              );
            })()}
          </g>
        );
      })}

      <Vod tacke={`${prvaRijecStream},452 ${prvaRijecStream},486 ${prvaRijecSekv},486 ${prvaRijecSekv},452`} debljina={4} boja="var(--bakar-struja)" />
      <SilkTekst x={(prvaRijecStream + prvaRijecSekv) / 2} y={520} sredina velicina={24} boja="var(--bakar-struja)">
        ovo je ušteda
      </SilkTekst>

      <Napomena x={40} y={586}>
        vremena ilustrativna
      </Napomena>
    </>
  );
}
