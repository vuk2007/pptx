export type EksponatId = 'perjanik' | 'xgo' | 'jarvis';

export type Demonstracija = {
  putanja: string;
  naziv: string;
  opis: string;
};

export type Eksponat = {
  id: EksponatId;
  naziv: string;
  podnaslov: string;
  /** Koji dio petlje osjeti-odluči-djeluj ovaj eksponat naglašava. */
  naglasak: 'osjeti' | 'odluci' | 'djeluj';
  demonstracije: Demonstracija[];
};

export const EKSPONATI: Eksponat[] = [
  {
    id: 'perjanik',
    naziv: 'Perjanik',
    podnaslov: 'Rover na četiri točka, napravljen od nule',
    naglasak: 'djeluj',
    demonstracije: [
      { putanja: '/perjanik/h-most', naziv: 'H-most', opis: 'Četiri prekidača koja okreću motor na obje strane' },
      { putanja: '/perjanik/pwm', naziv: 'PWM', opis: 'Kako se brzina motora podešava paljenjem i gašenjem' },
      { putanja: '/perjanik/radio', naziv: 'Radio paket', opis: 'Kako rover provjerava komandu i šta radi kad signal nestane' },
      { putanja: '/perjanik/suspenzija', naziv: 'Suspenzija', opis: 'Poluge koje drže sva četiri točka na zemlji' },
      { putanja: '/perjanik/servo', naziv: 'Dvostruki servo', opis: 'Dva servoa na istoj osovini, ispravno i pogrešno' },
    ],
  },
  {
    id: 'xgo',
    naziv: 'XGO psi',
    podnaslov: 'Dva robota psa koji sami drže ravnotežu',
    naglasak: 'osjeti',
    demonstracije: [
      { putanja: '/xgo/ravnoteza', naziv: 'Povratna sprega', opis: 'Mjeri, ispravi, pa opet mjeri' },
      { putanja: '/xgo/noga', naziv: 'Noga', opis: 'Gdje treba da budu uglovi da stopalo stigne gdje hoćeš' },
      { putanja: '/xgo/komanda', naziv: 'Put komande', opis: 'Od izgovorene riječi do pokreta noge' },
    ],
  },
  {
    id: 'jarvis',
    naziv: 'Jarvis',
    podnaslov: 'Glasovni asistent koji sluša, misli i odgovara',
    naglasak: 'odluci',
    demonstracije: [
      { putanja: '/jarvis/glas', naziv: 'Tvoj glas uživo', opis: 'Talas i spektrogram tvog glasa' },
      { putanja: '/jarvis/pipeline', naziv: 'Pipeline i brzina', opis: 'Zašto odgovara za dvije sekunde, a ne za deset' },
      { putanja: '/jarvis/frekvencije', naziv: 'Tri radija na štandu', opis: 'Duži talas prolazi, kraći nosi više' },
    ],
  },
];

export function eksponat(id: EksponatId): Eksponat {
  const nadjen = EKSPONATI.find((e) => e.id === id);
  if (!nadjen) throw new Error(`Nepoznat eksponat: ${id}`);
  return nadjen;
}

export const SVE_DEMONSTRACIJE = EKSPONATI.flatMap((e) => e.demonstracije);
