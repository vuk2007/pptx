/*
  Prijem radio paketa kroz vrijeme.

  Palica šalje istu komandu svakih 40 ms. Prijemnik svaki paket provjeri
  XOR-om: ako se ne slaže, paket baci i komandu ignoriše. Failsafe broji
  vrijeme od posljednjeg paketa koji je prošao provjeru; kad pređe granicu,
  rover sam stane.

  Vrijeme je ovdje pravo, u milisekundama. Usporavanje za ekran radi
  demonstracija, ne ovaj modul.
*/

import { FAILSAFE_MS } from '@/config/cinjenice';
import { dvijeMunje, jednaMunja, napraviPaket, provjeraProlazi, type Udar } from '@/lib/paket';

/** Razmak između dva paketa: 25 paketa u sekundi. */
export const RAZMAK_MS = 40;

/** Koliko dugo tabela drži pogođen paket da se stigne pročitati, ms pravog vremena. */
export const DRZI_POGODJEN_MS = 320;

/** Koliko prošlosti pamti vremenska linija, ms. */
export const ISTORIJA_MS = 1000;

export type Ishod = 'prihvacen' | 'odbacen' | 'pokvarenProsao';

export type Prijem = {
  t: number;
  poslati: number[];
  primljeni: number[];
  udar: Udar | null;
  ishod: Ishod;
};

export type StanjeRadija = {
  t: number;
  sljedeci: number;
  signal: boolean;
  /** Munja čeka sljedeći paket. */
  munja: 'nema' | 'jedna' | 'dvije';
  posljednjiIspravan: number;
  prijemi: Prijem[];
  prikazan: Prijem | null;
  prikazanDo: number;
  gas: number;
  skretanje: number;
  brojac: Record<Ishod, number>;
};

export const POCETNO_RADIO: StanjeRadija = {
  t: 0,
  sljedeci: RAZMAK_MS,
  signal: true,
  munja: 'nema',
  posljednjiIspravan: 0,
  prijemi: [],
  prikazan: null,
  prikazanDo: 0,
  gas: 150,
  skretanje: 128,
  brojac: { prihvacen: 0, odbacen: 0, pokvarenProsao: 0 },
};

/** Rover stoji kad od posljednjeg ispravnog paketa prođe više od granice. */
export function roverStao(st: StanjeRadija) {
  return st.t - st.posljednjiIspravan >= FAILSAFE_MS;
}

export function odPosljednjeg(st: StanjeRadija) {
  return st.t - st.posljednjiIspravan;
}

export function udariMunjom(st: StanjeRadija, dvije: boolean): StanjeRadija {
  if (!st.signal || st.munja !== 'nema') return st;
  return { ...st, munja: dvije ? 'dvije' : 'jedna' };
}

export function postaviSignal(st: StanjeRadija, signal: boolean): StanjeRadija {
  /* Kad se signal vrati, sljedeći paket stiže na svom mjestu u ritmu od 40 ms. */
  const sljedeci = signal ? Math.ceil((st.t + 1e-9) / RAZMAK_MS) * RAZMAK_MS : st.sljedeci;
  return { ...st, signal, sljedeci, munja: signal ? st.munja : 'nema' };
}

export function korakRadija(st: StanjeRadija, dtMs: number, nasumicno: () => number): StanjeRadija {
  const t = st.t + dtMs;
  let s: StanjeRadija = { ...st, t };

  while (s.signal && s.sljedeci <= t) {
    const poslati = napraviPaket(s.gas, s.skretanje);
    let primljeni = poslati;
    let udar: Udar | null = null;
    if (s.munja !== 'nema') {
      const r = s.munja === 'dvije' ? dvijeMunje(poslati, nasumicno) : jednaMunja(poslati, nasumicno);
      primljeni = r.paket;
      udar = r.udar;
    }
    const prolazi = provjeraProlazi(primljeni);
    const ishod: Ishod = prolazi ? (udar ? 'pokvarenProsao' : 'prihvacen') : 'odbacen';
    const prijem: Prijem = { t: s.sljedeci, poslati, primljeni, udar, ishod };

    const prijemi = [...s.prijemi, prijem].filter((p) => p.t > t - ISTORIJA_MS);
    /* Tabela drži pogođen paket, a obične pokazuje čim stignu. */
    const prikazi = udar !== null || s.sljedeci >= s.prikazanDo;

    s = {
      ...s,
      sljedeci: s.sljedeci + RAZMAK_MS,
      munja: 'nema',
      /* Prijemnik ne zna da je paket pokvaren ako provjera prođe: i on resetuje failsafe. */
      posljednjiIspravan: prolazi ? prijem.t : s.posljednjiIspravan,
      prijemi,
      prikazan: prikazi ? prijem : s.prikazan,
      prikazanDo: udar ? prijem.t + DRZI_POGODJEN_MS : s.prikazanDo,
      brojac: { ...s.brojac, [ishod]: s.brojac[ishod] + 1 },
    };
  }

  if (!s.signal) s = { ...s, prijemi: s.prijemi.filter((p) => p.t > t - ISTORIJA_MS) };
  return s;
}
