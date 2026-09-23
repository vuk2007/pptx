/*
  PWM: brzina motora preko popune (duty cycle) signala EN na L298N.

  Ovo nije poseban model. Svaki korak ide kroz isti korak H-mosta u režimu
  čipa, sa IN1 = 1 i IN2 = 0. Zato šiljak struje na startu i efekat rampe
  izlaze iz iste fizike koju H-most pokazuje.
*/

import { MOTOR } from '@/config/cinjenice';
import { broj } from '@/lib/format';
import { korak, POCETNO, type Poruka, type StanjeHMosta, type TrenutnoHMosta } from '@/lib/h-most';

/** Koliko popuna smije da se promijeni u sekundi kad je rampa uključena (0,55 = 55 % u sekundi). */
export const RAMPA_PO_SEKUNDI = 0.55;

/** Najveći napon koji motor može dobiti kroz L298N. */
export const PUN_NAPON = MOTOR.napajanje - MOTOR.padNaDrajveru;

/** Iznad ovoga struja je blizu granice L298N. */
export const BLIZU_GRANICE = 0.95 * MOTOR.granicaL298N;

export type StanjePwm = {
  most: StanjeHMosta;
  /** Popuna koju traži klizač, od 0 do 1. */
  zadato: number;
  rampa: boolean;
  /** Najveća srednja struja od posljednje promjene popune, A. */
  vrh: number;
  /** Kad je popuna posljednji put promijenjena, s. */
  od: number;
};

export const POCETNO_PWM: StanjePwm = {
  most: { ...POCETNO, rezim: 'cip', in1: true, in2: false, popuna: 0 },
  zadato: 0,
  rampa: false,
  vrh: 0,
  od: 0,
};

const ogranici = (x: number) => Math.min(1, Math.max(0, x));

/** Nova popuna sa klizača. Vrh struje se mjeri iznova, od ove promjene. */
export function zadaj(st: StanjePwm, zadato: number): StanjePwm {
  return { ...st, zadato: ogranici(zadato), vrh: Math.abs(st.most.struja), od: st.most.t };
}

export function postaviRampu(st: StanjePwm, rampa: boolean): StanjePwm {
  return { ...st, rampa };
}

export function resetujPwm(st: StanjePwm): StanjePwm {
  return { ...POCETNO_PWM, rampa: st.rampa, most: { ...POCETNO_PWM.most, t: st.most.t } };
}

export function korakPwm(st: StanjePwm, dt: number): { stanje: StanjePwm; trenutno: TrenutnoHMosta } {
  /* Bez rampe popuna odmah stiže na most. Sa rampom se penje ograničenom brzinom. */
  let popuna = st.zadato;
  if (st.rampa) {
    const razlika = st.zadato - st.most.popuna;
    popuna = st.most.popuna + Math.sign(razlika) * Math.min(Math.abs(razlika), RAMPA_PO_SEKUNDI * dt);
  }
  const { stanje: most, trenutno } = korak({ ...st.most, popuna }, dt);
  return {
    stanje: { ...st, most, vrh: Math.max(st.vrh, Math.abs(most.struja)) },
    trenutno,
  };
}

/** Koliko dugo poslije skoka poruka govori o šiljku, s. */
export const PORUKA_SILJKA_S = 3;

/** Iznad ove struje skok se naziva šiljkom, A. */
export const PRAG_SILJKA = 0.9;

/** Rampa još nije stigla do zadate popune. */
export function rampaRadi(st: StanjePwm) {
  return st.rampa && Math.abs(st.zadato - st.most.popuna) > 0.005;
}

export function porukaPwm(st: StanjePwm): Poruka {
  const primijenjeno = Math.round(st.most.popuna * 100);
  const zadato = Math.round(st.zadato * 100);
  const brzina = Math.abs(st.most.brzina);

  if (st.zadato === 0 && st.most.popuna === 0) {
    if (brzina > 3) {
      return {
        sta: 'Popuna je 0 %: most je isključen, a točak se zaustavlja sam, od trenja.',
        zasto: 'Kroz motor ne teče struja, pa ga ništa ne koči, za razliku od kočenja u H-mostu.',
      };
    }
    return {
      sta: 'Popuna je 0 %: most je stalno isključen i motor stoji.',
      zasto: 'Dodirni 100 % bez rampe i gledaj struju na CH2, pa isto ponovi sa rampom.',
    };
  }

  if (rampaRadi(st)) {
    return {
      sta: `Rampa podiže popunu postepeno: sad je ${primijenjeno} %, cilj je ${zadato} %.`,
      zasto: 'Motor stigne da se zaleti i proizvede kontra-napon, pa struja ostaje daleko od granice.',
    };
  }

  /* Šiljak traje djelić sekunde, pa poruka pamti vrh izmjeren poslije skoka. */
  if (st.vrh > PRAG_SILJKA && st.most.t - st.od < PORUKA_SILJKA_S) {
    return {
      sta: `Šiljak struje: ${broj(st.vrh, 2)} A odmah poslije skoka na ${zadato} %.`,
      zasto: 'Motor koji miruje nema kontra-napon, pa struju ograničava samo otpor namotaja; rampa mu daje vremena da se zaleti.',
    };
  }

  const prosjek = broj(st.most.popuna * PUN_NAPON, 1);
  if (primijenjeno >= 100) {
    return {
      sta: `Most je stalno uključen i motor dobija ${prosjek} V.`,
      zasto: `Ne punih ${broj(MOTOR.napajanje, 1)} V: oko ${broj(MOTOR.padNaDrajveru, 0)} V ostaje na tranzistorima L298N i odlazi u toplotu.`,
    };
  }
  return {
    sta: `Most je uključen ${primijenjeno} % vremena, pa motor u prosjeku dobija ${prosjek} V.`,
    zasto: 'Namotaj i masa točka izravnaju paljenje i gašenje, pa motor osjeća samo srednju vrijednost.',
  };
}
