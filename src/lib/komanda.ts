/*
  Put komande „sjedi" od Jarvisa do nogu XGO psa.

  Šest blokova, pet veza. Na svakoj vezi poruka ima drugi oblik, i to je
  ono što se prikazuje: bajtovi koji stvarno idu tom vezom.

    Jarvis → hub → micro:bit (most) → radio → micro:bit u psu → ESP32 → servoi
            tekst      tekst            tekst     serijski paket   uglovi

  Na prve tri veze putuje sama riječ, slovo po bajt (ASCII); okvir oko nje
  (USB, radio) se ne prikazuje. Na serijskoj vezi je paket iz xgo-paket.ts,
  čiji su okvir i checksum pravi. ESP32 provjeri checksum i pokvaren paket
  baci, pa pas ništa ne radi.
*/

import { XGO_RADIO } from '@/config/cinjenice';
import {
  BAJTOVI_SJEDI,
  napraviSerijskiPaket,
  serijskiPaketJeIspravan,
  uHeks,
} from '@/lib/xgo-paket';

export const RIJEC = 'sjedi';

/** Riječ kao bajtovi, slovo po bajt. */
export const TEKST = Array.from(RIJEC, (c) => c.charCodeAt(0));

export const PAKET = napraviSerijskiPaket(BAJTOVI_SJEDI.komanda, BAJTOVI_SJEDI.adresa, BAJTOVI_SJEDI.podaci);

/** Mjesto bajta komande u paketu: poslije zaglavlja (2) i dužine (1). */
export const MJESTO_KOMANDE = 3;

/** Isti paket sa jednim promijenjenim bitom u bajtu komande, kao smetnja na žici. */
export const POKVAREN_PAKET = PAKET.map((b, i) => (i === MJESTO_KOMANDE ? b ^ 0x01 : b));

export type Blok = { naziv: string; oznaka: string; uloga: 'osjeti' | 'odluci' | 'djeluj' | null };

export const BLOKOVI: readonly Blok[] = [
  { naziv: 'Jarvis', oznaka: 'čuje riječ', uloga: 'osjeti' },
  { naziv: 'hub', oznaka: 'laptop', uloga: 'odluci' },
  { naziv: 'micro:bit', oznaka: 'most', uloga: null },
  { naziv: 'micro:bit', oznaka: 'u psu', uloga: null },
  { naziv: 'ESP32', oznaka: 'u psu', uloga: 'odluci' },
  { naziv: 'servoi', oznaka: '12 zglobova', uloga: 'djeluj' },
];

export type Veza = {
  naziv: string;
  /** Bajtovi koji idu vezom; null kad ih ne znamo, pa se ne prikazuju. */
  bajtovi: readonly number[] | null;
  /** Ispod svakog bajta: slovo ili uloga u paketu. */
  ispod: readonly string[];
  opis: string;
};

const ULOGE_PAKETA = PAKET.map((_, i) => {
  if (i < 2) return 'zagl';
  if (i === 2) return 'duž';
  if (i === 3) return 'kom';
  if (i === 4) return 'adr';
  if (i >= PAKET.length - 2) return 'rep';
  if (i === PAKET.length - 3) return 'chk';
  return 'pod';
});

export const VEZE: readonly Veza[] = [
  { naziv: 'tekst', bajtovi: TEKST, ispod: Array.from(RIJEC), opis: `„${RIJEC}”, ${TEKST.length} bajtova` },
  { naziv: 'USB', bajtovi: TEKST, ispod: Array.from(RIJEC), opis: 'ista riječ' },
  { naziv: `radio ${XGO_RADIO.mhz} MHz, grupa ${XGO_RADIO.grupa}`, bajtovi: TEKST, ispod: Array.from(RIJEC), opis: 'ista riječ, kroz vazduh' },
  { naziv: 'serijska veza', bajtovi: PAKET, ispod: ULOGE_PAKETA, opis: `paket od ${PAKET.length} bajtova` },
  { naziv: 'uglovi zglobova', bajtovi: null, ispod: [], opis: 'po tri za svaku nogu' },
];

/** Sekundi po vezi na ekranu. Usporeno da se svaka veza vidi. */
export const PO_VEZI_S = 1.1;

export type StanjeKomande = {
  /** Koliko je veza poruka prešla; cijeli broj znači da je u bloku. */
  napredak: number;
  ide: boolean;
  poslata: boolean;
  pokvaren: boolean;
};

export const POCETNO_KOMANDA: StanjeKomande = { napredak: 0, ide: false, poslata: false, pokvaren: false };

/** Paket koji ESP32 stvarno primi. */
export function primljeniPaket(st: StanjeKomande) {
  return st.pokvaren ? POKVAREN_PAKET : PAKET;
}

/** Dokle poruka stigne: do servoa, ili samo do ESP32 kad ga checksum odbije. */
export function kraj(st: StanjeKomande) {
  return serijskiPaketJeIspravan(primljeniPaket(st)) ? VEZE.length : VEZE.length - 1;
}

export function posalji(st: StanjeKomande): StanjeKomande {
  return { ...st, napredak: 0, ide: true, poslata: true };
}

export function korakKomande(st: StanjeKomande, dt: number): StanjeKomande {
  if (!st.ide) return st;
  const napredak = Math.min(kraj(st), st.napredak + dt / PO_VEZI_S);
  return { ...st, napredak, ide: napredak < kraj(st) };
}

/** Veza kojom poruka upravo ide, ili null. */
export function aktivnaVeza(st: StanjeKomande) {
  return st.ide ? Math.floor(st.napredak) : null;
}

export function odbacen(st: StanjeKomande) {
  return st.poslata && !st.ide && kraj(st) < VEZE.length;
}

export function sjeo(st: StanjeKomande) {
  return st.poslata && !st.ide && st.napredak >= VEZE.length;
}

export type PorukaKomande = { sta: string; zasto: string; greska?: boolean };

export function porukaKomande(st: StanjeKomande): PorukaKomande {
  if (!st.poslata) {
    return {
      sta: `Jedna riječ pređe ${VEZE.length} veza dok ne postane pokret.`,
      zasto: `Pošalji „${RIJEC}” i gledaj kako se na svakoj vezi mijenja oblik poruke.`,
    };
  }
  if (sjeo(st)) {
    return {
      sta: 'Pas je sjeo: riječ je postala pokret.',
      zasto: 'Usput se ništa nije izgubilo; poruka je samo mijenjala oblik.',
    };
  }
  if (odbacen(st)) {
    return {
      sta: 'ESP32 je izračunao checksum, on se ne slaže, i paket je odbačen!',
      zasto: 'Bolje nikakav pokret nego pogrešan: pas čeka sljedeću ispravnu komandu.',
      greska: true,
    };
  }
  switch (aktivnaVeza(st)) {
    case 0:
      return {
        sta: `Jarvis je prepoznao riječ i šalje je hubu kao tekst od ${TEKST.length} bajtova.`,
        zasto: `Svako slovo je jedan bajt: s je ${uHeks(TEKST[0])}, j je ${uHeks(TEKST[1])}.`,
      };
    case 1:
      return {
        sta: 'Hub šalje istu riječ micro:bitu preko USB-a.',
        zasto: 'micro:bit na laptopu je most: prima preko USB-a, a šalje radiom.',
      };
    case 2:
      return {
        sta: `Riječ ide kroz vazduh na ${XGO_RADIO.mhz} MHz, u radio grupi ${XGO_RADIO.grupa}.`,
        zasto: 'Pas sluša samo svoju grupu, pa poruke drugih grupa ne vidi.',
      };
    case 3:
      return st.pokvaren
        ? {
            sta: `Na serijskoj vezi promijenio se jedan bit komande: ${uHeks(PAKET[MJESTO_KOMANDE])} je postao ${uHeks(POKVAREN_PAKET[MJESTO_KOMANDE])}.`,
            zasto: 'Checksum je izračunat za ispravnu komandu, pa ESP32 može da primijeti promjenu.',
          }
        : {
            sta: `micro:bit u psu pakuje komandu u serijski paket od ${PAKET.length} bajtova.`,
            zasto: 'ESP32 ne čita tekst, nego paket sa zaglavljem, komandom i checksumom.',
          };
    default:
      return {
        sta: 'ESP32 je prihvatio paket i računa uglove za 12 zglobova.',
        zasto: 'Iz jedne komande nastaje dvanaest uglova, po tri za svaku nogu.',
      };
  }
}
