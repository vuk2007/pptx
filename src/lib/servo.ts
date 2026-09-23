/*
  Dva servoa kao ogledalo, sa zajedničkom osovinom.

  Servo B je okrenut suprotno, pa isti broj stepeni kod njega znači suprotan
  smjer. Da bi obojica vukla osovinu na istu stranu, B mora dobiti 180 − A.
  Ako obojica dobiju isti ugao, svaki hoće osovinu na drugo mjesto: guraju
  jedan protiv drugog punom snagom, osovina stoji, a struja i toplota rastu.

  Model je jednostavan: svaki servo je proporcionalni regulator koji iznad
  male greške daje pun napon; struja raste sa tim naponom, toplota sa
  kvadratom struje. Parametri su ilustrativni (SERVO_ILUSTRATIVNI).
*/

import { SERVO_ILUSTRATIVNI } from '@/config/cinjenice';

export const S = SERVO_ILUSTRATIVNI;

/** Struja kad servo gura punim naponom, a osovina se ne pomjera, A. */
export const STRUJA_ZASTOJA = S.napon / S.otpor;

/** Period signala servoa, ms: impuls stiže svakih 20 ms. */
export const PERIOD_MS = 20;

/** Širina impulsa za ugao: 0° je 1 ms, 180° je 2 ms. */
export function sirinaImpulsa(ugao: number) {
  return 1 + ugao / 180;
}

export type StanjeServa = {
  ugaoA: number;
  greska: boolean;
  /** Ugao osovine, stepeni. */
  osovina: number;
  /** Temperatura svakog servoa, °C (isti su po simetriji). */
  temperatura: number;
};

export const POCETNO_SERVO: StanjeServa = {
  ugaoA: 40,
  greska: false,
  osovina: 40,
  temperatura: S.okolina,
};

/** Ugao koji dobija servo B: ispravno 180 − A, a greška je isti ugao. */
export function ugaoB(st: StanjeServa) {
  return st.greska ? st.ugaoA : 180 - st.ugaoA;
}

/** Gdje koji servo hoće osovinu, u uglu osovine. B je okrenut, pa se njegov ugao ogleda. */
export function zelje(st: StanjeServa) {
  return { a: st.ugaoA, b: 180 - ugaoB(st) };
}

const zasicenje = (x: number) => Math.max(-1, Math.min(1, x));

/** Koliki dio punog napona daje svaki regulator, sa znakom. */
export function pogon(st: StanjeServa) {
  const z = zelje(st);
  return {
    a: zasicenje((z.a - st.osovina) / S.punaSnagaIznad),
    b: zasicenje((z.b - st.osovina) / S.punaSnagaIznad),
  };
}

export function strujaServa(udio: number) {
  return S.strujaMirovanja + Math.abs(udio) * (STRUJA_ZASTOJA - S.strujaMirovanja);
}

export function korakServa(st: StanjeServa, dt: number): StanjeServa {
  const u = pogon(st);
  /* Osovina ide kamo je guraju zajedno; kad se guraju suprotno, stoji. */
  const osovina = st.osovina + S.brzina * ((u.a + u.b) / 2) * dt;
  const I = Math.max(strujaServa(u.a), strujaServa(u.b));
  const cilj = S.okolina + I * I * S.otpor * S.toplotniOtpor;
  const temperatura = st.temperatura + ((cilj - st.temperatura) * dt) / S.vrijemeZagrijavanja;
  return { ...st, osovina, temperatura };
}

/** Temperatura na kojoj se servo ustali kad gura punom snagom. */
export const TEMPERATURA_ZASTOJA = S.okolina + STRUJA_ZASTOJA * STRUJA_ZASTOJA * S.otpor * S.toplotniOtpor;
