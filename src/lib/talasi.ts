/*
  Radio talasi na štandu, nacrtani u razmjeri.

  Jedina prava fizika ovdje je λ = c / f. Sva tri talasa putuju istom
  brzinom, pa se razlikuju samo po dužini — to je ono što crtež treba
  da pokaže, i zato se sve tri talasne dužine mjere istim lenjirom.
*/

/** Brzina svjetlosti u vakuumu, m/s. */
export const C = 299792458;

/** Talasna dužina u metrima za frekvenciju u megahercima. */
export function talasnaDuzina(mhz: number): number {
  return C / (mhz * 1e6);
}

/** Talasna dužina u centimetrima. */
export function duzinaUCm(mhz: number): number {
  return talasnaDuzina(mhz) * 100;
}

/**
  Koliko talasa prođe kroz prepreku, kao broj između 0 i 1.

  Ovo je namjerno grub model: raste sa talasnom dužinom i ništa više.
  Služi samo da se na crtežu vidi smjer — duži talas prolazi lakše.
  Pravi iznos zavisi od zida i nigdje se ne tvrdi brojem.
*/
export function prolazKrozZid(duzinaCm: number): number {
  const K = 30;
  return duzinaCm / (duzinaCm + K);
}

export type Tacka = { x: number; y: number };

export type TalasOpis = {
  x0: number;
  x1: number;
  /** Nulta linija talasa. */
  y: number;
  /** Amplituda u pikselima; funkcija dozvoljava da se talas prigusi usput. */
  amplituda: number | ((x: number) => number);
  /** Talasna dužina, u pikselima. */
  duzinaPx: number;
  /** Pomak faze u radijanima; mijenja se u vremenu da talas putuje. */
  faza?: number;
  /** Razmak uzoraka u pikselima. */
  korak?: number;
};

/** Uzorkovan sinusni talas. Odvojeno od crtanja, da se može provjeriti. */
export function uzorkujTalas({
  x0,
  x1,
  y,
  amplituda,
  duzinaPx,
  faza = 0,
  korak = 4,
}: TalasOpis): Tacka[] {
  if (!(duzinaPx > 0)) throw new Error('Talasna dužina mora biti veća od nule');
  if (!(korak > 0)) throw new Error('Korak mora biti veći od nule');

  const k = (2 * Math.PI) / duzinaPx;
  const tacke: Tacka[] = [];

  for (let x = x0; x < x1; x += korak) {
    const a = typeof amplituda === 'function' ? amplituda(x) : amplituda;
    tacke.push({ x, y: y - a * Math.sin(k * (x - x0) - faza) });
  }

  /* Posljednja tačka se uvijek dodaje, da talas stigne do kraja. */
  const a = typeof amplituda === 'function' ? amplituda(x1) : amplituda;
  tacke.push({ x: x1, y: y - a * Math.sin(k * (x1 - x0) - faza) });

  return tacke;
}

/** Tačke u oblik koji SVG polyline razumije. */
export function uTacke(tacke: Tacka[]): string {
  return tacke.map((t) => `${t.x.toFixed(1)},${t.y.toFixed(1)}`).join(' ');
}
