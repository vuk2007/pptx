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

/** Bajtovi komande „sjedi" za XGO psa. Format i račun checksuma su poznati, same vrijednosti nisu. */
export const XGO_BAJTOVI_SJEDI: { komanda: number; adresa: number; podaci: number[] } | null = null; // TODO: očitati iz micro:bit koda

/** Koristi se dok XGO_BAJTOVI_SJEDI nije popunjen. Označeno na ekranu kao ilustrativno. */
export const XGO_BAJTOVI_SJEDI_ILUSTRATIVNI = { komanda: 0x3e, adresa: 0x01, podaci: [0x02] };

/** micro:bit radio veza sa psima. */
export const XGO_RADIO = { grupa: 42, mhz: 2483 } as const;

/** Sigurnosni slojevi na putu komande, u milisekundama. */
export const XGO_SIGURNOST = {
  pasStajeBezKomande: 500,
  mostSaljeStopAkoLaptopCuti: 2000,
} as const;

/**
 * Model motora sa reduktorom, preuzet iz referenca-h-most.html.
 * Ilustrativni parametri: ponašanje je fizički tačno, a same vrijednosti
 * nijesu izmjerene na Perjaniku. Ne mijenjati bez dogovora.
 */
export const MOTOR = {
  /** Napon baterije (3S LiPo), V. */
  napajanje: 11.1,
  /** Pad napona na tranzistorima L298N, V. */
  padNaDrajveru: 2.0,
  /** Otpor namotaja, Ω. */
  otpor: 4.5,
  /** Brzina točka po voltu kontra-napona, o/min po V. */
  kv: 27,
  /** Koliko struja ubrzava točak, (o/min)/s po A. */
  pojacanje: 283,
  /** Trenje, 1/s. */
  trenje: 1.0,
  /** Približna brzina bez opterećenja pri punom naponu, o/min. */
  bezOpterecenja: 210,
  /** Granica struje L298N po kanalu, A. */
  granicaL298N: 2,
} as const;

/** Koliko puta u sekundi L298N stvarno pali i gasi most (PWM sa Arduina), iz reference. */
export const PWM_STVARNO_HZ = 490;

/**
 * Jednostavan model servoa za demonstraciju dvostrukog servoa.
 * ILUSTRATIVNO: koji servo pokreće rame ruke nije potvrđeno (vidi RUKA_NA_SAJMU),
 * pa ovo nijesu podaci iz datasheet-a. Kad se servo zna, zamijeniti. Na ekranu piše da je ilustrativno.
 */
export const SERVO_ILUSTRATIVNI = {
  /** Napon napajanja servoa, V. */
  napon: 5,
  /** Otpor namotaja, Ω. Struja zastoja je napon kroz otpor. */
  otpor: 2,
  /** Struja dok servo samo drži položaj, A. */
  strujaMirovanja: 0.1,
  /** Greška ugla iznad koje regulator daje pun napon, stepeni. */
  punaSnagaIznad: 10,
  /** Brzina slobodnog okretanja, stepeni u sekundi. */
  brzina: 300,
  /** Temperatura okoline, °C. */
  okolina: 25,
  /** Koliko se servo zagrije po vatu, °C/W. */
  toplotniOtpor: 6,
  /** Vremenska konstanta zagrijavanja, s. Ubrzana za demonstraciju. */
  vrijemeZagrijavanja: 6,
  /** Iznad ove temperature prikaz je u boji greške, °C. */
  granica: 70,
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

/**
 * Gdje se koja faza Jarvisovog pipeline-a izvršava.
 * null znači da to nije provjereno — tada se na crtežu ne piše ništa.
 */
export const PIPELINE_GDJE: Record<'budjenje' | 'glasUTekst' | 'mozak' | 'tekstUGlas', 'lokalno' | 'oblak' | null> = {
  budjenje: 'lokalno',
  glasUTekst: 'lokalno', // scenario kaže: „drugi program, koji radi ovdje na laptopu"
  mozak: null, // TODO: radi li jezički model na laptopu ili u oblaku
  tekstUGlas: null, // TODO: radi li sinteza glasa na laptopu ili u oblaku
};
