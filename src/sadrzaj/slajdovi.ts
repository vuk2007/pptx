import { FAILSAFE_MS } from '@/config/cinjenice';

export type BojaPetlje = 'osjeti' | 'odluci' | 'djeluj';

export type BlokId = 'uvod' | 'jarvis' | 'xgo' | 'perjanik' | 'zatvaranje';

export type Slajd = {
  id: string;
  /** Kratak naslov, krupno i usko. */
  naslov: string;
  /** Jedna rečenica. Nikad dvije. */
  recenica: string;
  /** Ključ šeme u src/components/slajdovi/crtezi.tsx */
  ilustracija: string;
  /** Dio bilješke nivoa 2 koji pripada ovom slajdu. Tekst je doslovan iz scenarija. */
  biljeska: string[];
  demo?: { putanja: string; naziv: string };
};

export type Blok = {
  id: BlokId;
  naziv: string;
  /** Koji dio petlje blok naglašava. */
  naglasak?: BojaPetlje;
  slajdovi: Slajd[];
};

export const BLOKOVI: Blok[] = [
  {
    id: 'uvod',
    naziv: 'Uvod',
    slajdovi: [
      {
        id: 'uvod-petlja',
        naslov: 'Osjeti, odluči, djeluj',
        recenica: 'Svaki robot radi tri stvari: osjeti, odluči i djeluje.',
        ilustracija: 'petlja',
        biljeska: [
          'Svaki robot na svijetu radi tri stvari: osjeti, odluči i djeluje.',
          'Ovdje imaš tri robota, i svaki ti pokazuje jedan dio toga. Kreni odakle hoćeš.',
        ],
      },
    ],
  },

  {
    id: 'jarvis',
    naziv: 'Jarvis',
    naglasak: 'odluci',
    slajdovi: [
      {
        id: 'jarvis-ko-je',
        naslov: 'Jarvis',
        recenica: 'Ovo je Jarvis. Reci „Jarvis” i pitaj ga šta god hoćeš.',
        ilustracija: 'jarvis-ko-je',
        biljeska: [],
        demo: { putanja: '/jarvis/glas', naziv: 'Vidi svoj glas' },
      },
      {
        id: 'jarvis-talasi',
        naslov: 'Glas je talas',
        recenica: 'Tvoj glas su talasi u vazduhu.',
        ilustracija: 'jarvis-talasi',
        biljeska: [
          'Kad pričaš, ti zapravo praviš talase u vazduhu.',
          'Mikrofon te talase pretvara u električni signal, tu počinje elektronika.',
        ],
        demo: { putanja: '/jarvis/glas', naziv: 'Vidi svoj glas' },
      },
      {
        id: 'jarvis-budjenje',
        naslov: 'Buđenje',
        recenica: 'Prvi program čeka samo riječ „Jarvis”.',
        ilustracija: 'jarvis-budjenje',
        biljeska: ['Prvi program sluša samo jednu riječ, „Jarvis”, i tek tada se budi.'],
        demo: { putanja: '/jarvis/pipeline', naziv: 'Cio put od glasa do odgovora' },
      },
      {
        id: 'jarvis-glas-u-tekst',
        naslov: 'Glas u tekst',
        recenica: 'Drugi program pretvara glas u tekst.',
        ilustracija: 'jarvis-glas-u-tekst',
        biljeska: ['Onda drugi program, koji radi ovdje na laptopu, pretvara tvoj glas u tekst.'],
        demo: { putanja: '/jarvis/glas', naziv: 'Vidi svoj spektrogram' },
      },
      {
        id: 'jarvis-mozak',
        naslov: 'Mozak',
        recenica: 'Mozak smišlja odgovor.',
        ilustracija: 'jarvis-mozak',
        biljeska: ['Taj tekst ide jezičkom modelu, to je mozak, koji smisli odgovor.'],
        demo: { putanja: '/jarvis/pipeline', naziv: 'Gdje mozak troši vrijeme' },
      },
      {
        id: 'jarvis-tekst-u-glas',
        naslov: 'Tekst u glas',
        recenica: 'Treći program pretvara tekst u glas.',
        ilustracija: 'jarvis-tekst-u-glas',
        biljeska: [
          'Na kraju treći program pretvara tekst nazad u glas, i to u glas koji smo sami dizajnirali da zvuči kao filmski Jarvis.',
        ],
        demo: { putanja: '/jarvis/pipeline', naziv: 'Cio put od glasa do odgovora' },
      },
      {
        id: 'jarvis-streaming',
        naslov: 'Bez čekanja',
        recenica: 'Ne čeka se: prva rečenica svira dok se druga još piše.',
        ilustracija: 'jarvis-streaming',
        biljeska: [
          'Cijela fora je u tome da se ništa ne čeka: čim mozak smisli prvu rečenicu, ona već ide u zvučnik dok on smišlja drugu. Zato odgovara za dvije sekunde, a ne za deset.',
          'Znači, Jarvis je jedan veliki prevodilac: zvuk u signal, signal u tekst, tekst u odluku, i sve to nazad u zvuk.',
        ],
        demo: { putanja: '/jarvis/pipeline', naziv: 'Uporedi čekanje i streaming' },
      },
    ],
  },

  {
    id: 'xgo',
    naziv: 'XGO psi',
    naglasak: 'osjeti',
    slajdovi: [
      {
        id: 'xgo-pas',
        naslov: 'Robot pas',
        recenica: 'Ovo je robot pas. Probaj ga lagano gurnuti.',
        ilustracija: 'xgo-pas',
        biljeska: [],
        demo: { putanja: '/xgo/ravnoteza', naziv: 'Gurni ga i ti' },
      },
      {
        id: 'xgo-imu',
        naslov: 'IMU',
        recenica: 'Senzor u njemu osjeća nagib, kao tvoje uho ravnotežu.',
        ilustracija: 'xgo-imu',
        biljeska: [
          'Unutra je senzor koji se zove IMU. To je isto što ti imaš u uhu za ravnotežu, i isto što ima tvoj telefon kad okreneš ekran.',
          'On stalno mjeri koliko je pas nagnut.',
        ],
        demo: { putanja: '/xgo/ravnoteza', naziv: 'Nagni platformu' },
      },
      {
        id: 'xgo-petlja',
        naslov: 'Povratna sprega',
        recenica: 'Mjeri, ispravi, pa opet mjeri. Stotinama puta u sekundi.',
        ilustracija: 'xgo-petlja',
        biljeska: [
          'Kad ga gurneš, senzor to osjeti, procesor izračuna koliko svaka noga treba da se pomjeri, i motori to izvrše. To se ponavlja mnogo puta u sekundi, zato izgleda kao da pas sam razmišlja.',
          'Ta petlja, mjeri, ispravi, pa opet mjeri, zove se povratna sprega.',
        ],
        demo: { putanja: '/xgo/ravnoteza', naziv: 'Isključi povratnu spregu' },
      },
      {
        id: 'xgo-svugdje',
        naslov: 'Svuda oko tebe',
        recenica: 'Na istom principu rade dronovi, rakete i autopilot.',
        ilustracija: 'xgo-svugdje',
        biljeska: ['Na njoj rade dronovi, rakete, autopilot u avionu, čak i klima u kući.'],
        demo: { putanja: '/xgo/ravnoteza', naziv: 'Probaj regulator' },
      },
      {
        id: 'xgo-motori',
        naslov: '15 motora',
        recenica: '15 motora: 12 u nogama, 3 u ruci.',
        ilustracija: 'xgo-motori',
        biljeska: ['Pas ima 15 motora, 12 u nogama i 3 u ruci na leđima kojom može da uhvati predmet.'],
        demo: { putanja: '/xgo/noga', naziv: 'Pomjeri nogu' },
      },
      {
        id: 'xgo-komanda',
        naslov: 'Od glasa do pokreta',
        recenica: 'Tvoj glas postaje radio poruka, a poruka postaje pokret.',
        ilustracija: 'xgo-komanda',
        biljeska: [
          'A kad kažeš Jarvisu da psi zaplešu, tvoj glas postane komanda, komanda ode radiom do malog računara u psu, micro:bita, i pas se pomjeri.',
          'Znači, prošao si cijeli krug: glas, mozak, radio, pokret.',
        ],
        demo: { putanja: '/xgo/komanda', naziv: 'Pošalji komandu' },
      },
    ],
  },

  {
    id: 'perjanik',
    naziv: 'Perjanik',
    naglasak: 'djeluj',
    slajdovi: [
      {
        id: 'perjanik-rover',
        naslov: 'Perjanik',
        recenica: 'Rover kao oni na Marsu. Nije kupljen, napravili smo ga sami.',
        ilustracija: 'perjanik-rover',
        biljeska: [],
        demo: { putanja: '/perjanik/h-most', naziv: 'Okreni motor' },
      },
      {
        id: 'perjanik-stampa',
        naslov: '3D štampa',
        recenica: 'Skoro sve je odštampano na 3D štampaču, sloj po sloj.',
        ilustracija: 'perjanik-stampa',
        biljeska: [
          'Skoro sve što vidiš je odštampano na 3D štampaču. Crtali smo dijelove na računaru i štampali ih sloj po sloj.',
        ],
        demo: { putanja: '/perjanik/servo', naziv: 'Rame robotske ruke' },
      },
      {
        id: 'perjanik-suspenzija',
        naslov: 'Suspenzija',
        recenica: 'Poluge drže sva četiri točka na zemlji.',
        ilustracija: 'perjanik-suspenzija',
        biljeska: [
          'Točkovi su okačeni na pojednostavljenu verziju sistema koji NASA koristi na Marsu. Sa svake strane je poluga sa dva točka koja može da se klati gore-dolje, a između lijeve i desne strane je diferencijal, mehanizam koji drži tijelo rovera u sredini kad jedna strana pređe preko kamena.',
          'Tako sva četiri točka ostaju na zemlji i guraju. NASA ima po tri točka sa svake strane, ali za naš rover i naš budžet četiri su bila pametniji izbor.',
        ],
        demo: { putanja: '/perjanik/suspenzija', naziv: 'Provuci kamen ispod' },
      },
      {
        id: 'perjanik-arduino',
        naslov: 'Arduino',
        recenica: 'Mozak je Arduino, računar koji košta koliko jedna igrica.',
        ilustracija: 'perjanik-arduino',
        biljeska: ['Mozak je Arduino, mali računar koji košta koliko jedna igrica.'],
        demo: { putanja: '/perjanik/pwm', naziv: 'Podesi brzinu motora' },
      },
      {
        id: 'perjanik-radio',
        naslov: 'Radio i WiFi',
        recenica: 'Komande idu radiom, kamera šalje sliku preko WiFi-ja.',
        ilustracija: 'perjanik-radio',
        biljeska: [
          'Palica šalje komande radiom, Arduino ih provjerava da nisu pokvarene usput, i onda govori motorima koliko brzo da se okreću.',
          'Na prednjoj strani je kamera koja šalje sliku bežično, a na vrhu robotska ruka.',
        ],
        demo: { putanja: '/jarvis/frekvencije', naziv: 'Tri radija na štandu' },
      },
      {
        id: 'perjanik-failsafe',
        naslov: 'Failsafe',
        recenica: 'Ako izgubi signal, sam stane.',
        ilustracija: 'perjanik-failsafe',
        biljeska: [
          `I jedan detalj koji je meni najdraži: ako rover izgubi signal, recimo ode predaleko, on sam stane za ${FAILSAFE_MS} milisekundi. Ne nastavi da juri u zid.`,
          'Tako razmišlja inženjer: ne samo kako da radi, nego i šta ako nešto krene po zlu.',
        ],
        demo: { putanja: '/perjanik/radio', naziv: 'Prekini signal' },
      },
    ],
  },

  {
    id: 'zatvaranje',
    naziv: 'Počni',
    slajdovi: [
      {
        id: 'zatvaranje-pocni',
        naslov: 'Počni i ti',
        recenica: 'Sve ovo je počelo sa jednim micro:bitom ili Arduinom i nekoliko žica.',
        ilustracija: 'zatvaranje',
        biljeska: [
          'Ništa od ovoga nije počelo kao rover ili robot pas. Počelo je sa jednom pločicom, nekoliko žica i jednom LED diodom koja se upalila kad treba.',
        ],
        demo: { putanja: '/pocni', naziv: 'Kako da počneš' },
      },
    ],
  },
];

export function blok(id: BlokId): Blok {
  const nadjen = BLOKOVI.find((b) => b.id === id);
  if (!nadjen) throw new Error(`Nepoznat blok: ${id}`);
  return nadjen;
}

/** Slajd zajedno sa blokom iz kojeg dolazi — izlog time zna koji LED da upali. */
export type SlajdUIzlogu = Slajd & {
  blokId: BlokId;
  nazivBloka: string;
  naglasak?: BojaPetlje;
};

function uzBlok(b: Blok): SlajdUIzlogu[] {
  return b.slajdovi.map((s) => ({ ...s, blokId: b.id, nazivBloka: b.naziv, naglasak: b.naglasak }));
}

/** Cio izlog: uvod, tri eksponata redom, zatvaranje. */
export const SVI_SLAJDOVI: SlajdUIzlogu[] = BLOKOVI.flatMap(uzBlok);

/** Izlog samo jednog eksponata: njegovi slajdovi, uokvireni uvodom i zatvaranjem. */
export function izlogEksponata(id: BlokId): SlajdUIzlogu[] {
  return [...uzBlok(blok('uvod')), ...uzBlok(blok(id)), ...uzBlok(blok('zatvaranje'))];
}
