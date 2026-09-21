/**
 * Sve vrijednosti koje nijesu sigurno provjerene stoje ovdje.
 * Pravilo: ako je vrijednost `null` ili prazan string, sajt prikazuje
 * neutralnu verziju bez tog detalja. Nikad izmišljen broj.
 */

/** Koliko milisekundi rover čeka bez radio paketa prije nego sam stane. */
export const FAILSAFE_MS: number = 500; // TODO: provjeriti u Feniks v3 firmveru

/** Pravi format Perjanikovog radio paketa. Dok je null, demo koristi ilustrativni format. */
export const PAKET_FORMAT: PaketPolje[] | null = null; // TODO: pravi format Perjanikovog paketa

/** Koliko L298N drajvera ima na roveru. */
export const BROJ_L298N: number | null = null; // TODO

/** Koja robotska ruka ide na sajam. */
export const RUKA_NA_SAJMU: 'EEZYbotARM MK1' | 'V2 (6× MG90S)' | null = null; // TODO

/** Senzor u kameri na prednjoj strani rovera. */
export const KAMERA_SENZOR: 'OV2640' | 'OV3660' | null = null; // TODO

/** URL na koji vodi QR kod na strani /pocni. */
export const QR_URL: string = ''; // TODO

/** Tekst o lokalnim klubovima na strani /pocni. */
export const KLUBOVI_TEKST: string = ''; // TODO: Techlab, Prona...

/** Koliko sekundi stoji jedan slajd u automatskom izlogu. */
export const IZLOG_SEKUNDE_PO_SLAJDU: number = 9;

/** Pauza auto-prelaza poslije ručne interakcije, u sekundama. */
export const IZLOG_PAUZA_SEKUNDE: number = 30;

/** Ilustrativna vremena faza Jarvisovog pipeline-a, u sekundama. */
export const PIPELINE_VREMENA = {
  budjenje: 0.2,
  glasUTekst: 0.8,
  mozakPrvaRijec: 0.6,
  mozakCijelo: 2.4,
  tekstUGlas: 0.5,
} as const;

/** Ilustrativni naponi za H-most demonstraciju. */
export const NAPON = {
  ulaz: 11.1,
  naMotoru: 9,
  padNaDrajveru: 2.1,
} as const;

/** Radio veze na štandu. Frekvencije su poznate, talasne dužine računate iz njih. */
export const RADIO_VEZE = [
  { naziv: 'Komande za Perjanika', mhz: 433, boja: 'djeluj' },
  { naziv: 'Kamera na Perjaniku (WiFi)', mhz: 2400, boja: 'osjeti' },
  { naziv: 'Komande za pse (micro:bit, grupa 42)', mhz: 2483, boja: 'odluci' },
] as const;

export type PaketPolje = {
  naziv: string;
  bajtova: number;
  opis: string;
};

/** Ilustrativni format paketa, koristi se dok PAKET_FORMAT nije popunjen. */
export const PAKET_ILUSTRATIVNI: PaketPolje[] = [
  { naziv: 'START', bajtova: 1, opis: 'početak paketa' },
  { naziv: 'GAS', bajtova: 1, opis: 'naprijed / nazad' },
  { naziv: 'SKRETANJE', bajtova: 1, opis: 'lijevo / desno' },
  { naziv: 'XOR', bajtova: 1, opis: 'provjera' },
];

export const PAKET_JE_ILUSTRATIVAN = PAKET_FORMAT === null;
export const PAKET = PAKET_FORMAT ?? PAKET_ILUSTRATIVNI;
