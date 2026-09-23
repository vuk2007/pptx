/*
  Model motora sa reduktorom, isti kao u referenci. Dijele ga H-most i PWM,
  pa se šiljak struje na startu i efekat rampe vide iz iste fizike.

    kontra-napon = brzina / Kv
    struja       = (napon − kontra-napon) / otpor
    ubrzanje     = pojačanje · struja − trenje · brzina

  Brzina je u o/min točka, napon u V, struja u A, vrijeme u sekundama.
*/

import { MOTOR } from '@/config/cinjenice';

export type ParametriMotora = {
  otpor: number;
  kv: number;
  pojacanje: number;
  trenje: number;
};

export const PARAMETRI: ParametriMotora = MOTOR;

export function kontraNapon(brzina: number, p: ParametriMotora = PARAMETRI) {
  return brzina / p.kv;
}

/** Struja kroz namotaj kad je na krajevima motora dati napon. */
export function strujaMotora(napon: number, brzina: number, p: ParametriMotora = PARAMETRI) {
  return (napon - kontraNapon(brzina, p)) / p.otpor;
}

/** Jedan korak brzine. Struja je ono što motor stvarno dobija u ovom trenutku. */
export function sljedecaBrzina(brzina: number, struja: number, dt: number, p: ParametriMotora = PARAMETRI) {
  return brzina + (p.pojacanje * struja - p.trenje * brzina) * dt;
}

/**
  Brzina na kojoj se motor ustali pri stalnom naponu: tu struja taman
  savladava trenje. Izvedeno iz iste tri jednačine, pa služi i kao provjera.
*/
export function ustaljenaBrzina(napon: number, p: ParametriMotora = PARAMETRI) {
  return (p.pojacanje * napon) / (p.otpor * p.trenje + p.pojacanje / p.kv);
}
