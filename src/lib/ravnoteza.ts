/*
  Povratna sprega na XGO psu: izmjeri nagib, uporedi sa željenim, ispravi.

  Tijelo stoji na platformi nagnutoj za p. Noge ga ispravljaju za „ispravka",
  pa je nagib tijela y = p − ispravka. IMU mjeri y, regulator računa grešku
  e = r − y i traži ispravku srazmjernu grešci (pojačanje K). Noge imaju
  masu i prigušenje, pa ispravka ne dođe trenutno:

    ispravka'' = −K · e − c · ispravka'

  Za tijelo to je sistem drugog reda, y'' + c·y' + K·y = K·r, sa
  prirodnom učestanošću √K i prigušenjem ζ = c / (2√K). Malo K znači
  sporo, veliko K znači preskok i oscilaciju. Pravi pas ima složeniji
  regulator; brojevi ovdje su ilustrativni.
*/

import { broj } from '@/lib/format';
import type { Poruka } from '@/lib/h-most';

/** Prigušenje u nogama, 1/s. */
export const PRIGUSENJE = 3.2;

/** Najveći nagib platforme na klizaču, stepeni. */
export const MAX_NAGIB = 26;
/** Najveći željeni nagib tijela, stepeni. */
export const MAX_ZELJENI = 15;
/** Bez sprege, preko ovog nagiba pas se prevrne (ilustrativno), stepeni. */
export const UGAO_PADA = 21;

export const K_MIN = 1;
export const K_MAX = 30;
export const K_POCETNO = 8;
/** Ispod ovoga ispravka je spora, iznad sljedećeg tijelo oscilira. */
export const K_MALO = 4;
export const K_VELIKO = 20;

/** Greška i brzina ispod kojih se tijelo smatra smirenim. */
export const SMIRENO_STEPENI = 0.3;
export const SMIRENO_BRZINA = 0.5;

export type StanjeRavnoteze = {
  /** Nagib platforme, stepeni; pozitivno je desni kraj dolje. */
  platforma: number;
  /** Željeni nagib tijela, stepeni. */
  zeljeni: number;
  sprega: boolean;
  /** Pojačanje regulatora, 1/s². */
  K: number;
  /** Koliko su noge ispravile, stepeni, i brzina te ispravke, °/s. */
  ispravka: number;
  brzina: number;
};

export const POCETNO_RAVNOTEZA: StanjeRavnoteze = {
  platforma: 0,
  zeljeni: 0,
  sprega: true,
  K: K_POCETNO,
  ispravka: 0,
  brzina: 0,
};

/** Nagib tijela, onaj koji IMU mjeri. */
export function izmjereni(st: StanjeRavnoteze) {
  return st.platforma - st.ispravka;
}

/** Greška regulatora: željeno minus izmjereno. */
export function greska(st: StanjeRavnoteze) {
  return st.zeljeni - izmjereni(st);
}

/** Pas se prevrne samo bez sprege, kad se nagne preko granice. */
export function pao(st: StanjeRavnoteze) {
  return !st.sprega && Math.abs(izmjereni(st)) > UGAO_PADA;
}

export function korakRavnoteze(st: StanjeRavnoteze, dt: number): StanjeRavnoteze {
  if (!st.sprega) return { ...st, ispravka: 0, brzina: 0 };
  const ubrzanje = -st.K * greska(st) - PRIGUSENJE * st.brzina;
  const brzina = st.brzina + ubrzanje * dt;
  return { ...st, brzina, ispravka: st.ispravka + brzina * dt };
}

export function smireno(st: StanjeRavnoteze) {
  return Math.abs(greska(st)) < SMIRENO_STEPENI && Math.abs(st.brzina) < SMIRENO_BRZINA;
}

/** Prigušenje sistema za dato pojačanje: ispod 1 tijelo preskoči cilj. */
export function zeta(K: number) {
  return PRIGUSENJE / (2 * Math.sqrt(K));
}

/** Koliko tijelo preskoči novi željeni nagib, kao udio skoka. */
export function preskok(K: number) {
  const z = zeta(K);
  return z >= 1 ? 0 : Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z));
}

const ugao = (v: number) => `${broj(v, 1)}°`;

export function porukaRavnoteze(st: StanjeRavnoteze): Poruka {
  const y = izmjereni(st);
  if (!st.sprega) {
    if (pao(st)) {
      return {
        sta: `Bez povratne sprege tijelo se nagnulo ${ugao(y)} sa platformom i pas se prevrnuo!`,
        zasto: 'Niko ne mjeri nagib, pa niko ni ne ispravlja: uključi povratnu spregu.',
        greska: true,
      };
    }
    return {
      sta: `Povratna sprega je isključena, pa je tijelo nagnuto ${ugao(y)} kao i platforma.`,
      zasto: `Noge ništa ne ispravljaju; preko ${UGAO_PADA}° pas se prevrne.`,
    };
  }
  if (smireno(st)) {
    return {
      sta: `Tijelo drži ${ugao(st.zeljeni)}, iako je platforma nagnuta ${ugao(st.platforma)}.`,
      zasto: 'Izmjeri, uporedi sa željenim, ispravi, pa opet izmjeri: to je povratna sprega.',
    };
  }
  const K = Math.round(st.K);
  const procenat = Math.round(preskok(st.K) * 100);
  return {
    /* Bez brojeva koji se mijenjaju svaki kadar: njih nose žice na šemi i očitavanja. */
    sta: 'Nagib nije željeni, pa regulator pomjera noge da ispravi grešku.',
    zasto:
      st.K < K_MALO
        ? `Pojačanje K = ${K} je malo, pa ispravka ide sporo, skoro bez preskoka.`
        : st.K > K_VELIKO
          ? `Pojačanje K = ${K} je veliko: noge pretjeraju pa se vraćaju, preskok je oko ${procenat} %.`
          : `Pojačanje K = ${K} ispravi grešku brzo, uz preskok od oko ${procenat} %.`,
  };
}
