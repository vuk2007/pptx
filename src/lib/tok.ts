/*
  Tok struje kroz šemu: putanja kao izlomljena linija i čestice na njoj.

  Brzina čestica je proporcionalna struji, smjer prati znak. Ispod praga
  čestice se ne crtaju uopšte — kad nema struje, nema pokreta.
  Brojevi su iz reference.
*/

export type Tacka = readonly [number, number];

type Segment = { x1: number; y1: number; dx: number; dy: number; duzina: number; pocetak: number };

export type Putanja = {
  segmenti: Segment[];
  duzina: number;
  /** Tačke u formatu za SVG atribut points. */
  tacke: string;
};

export function napraviPutanju(tacke: readonly Tacka[]): Putanja {
  const segmenti: Segment[] = [];
  let duzina = 0;
  for (let i = 0; i < tacke.length - 1; i++) {
    const [x1, y1] = tacke[i];
    const [x2, y2] = tacke[i + 1];
    const d = Math.hypot(x2 - x1, y2 - y1);
    segmenti.push({ x1, y1, dx: x2 - x1, dy: y2 - y1, duzina: d, pocetak: duzina });
    duzina += d;
  }
  return { segmenti, duzina, tacke: tacke.map((t) => t.join(',')).join(' ') };
}

/** Tačka na udaljenosti d od početka, u krug. */
export function tackaNa(p: Putanja, d: number): [number, number] {
  const u = ((d % p.duzina) + p.duzina) % p.duzina;
  for (const s of p.segmenti) {
    if (u <= s.pocetak + s.duzina) {
      const f = s.duzina === 0 ? 0 : (u - s.pocetak) / s.duzina;
      return [s.x1 + s.dx * f, s.y1 + s.dy * f];
    }
  }
  return [0, 0];
}

/** Piksela u sekundi po amperu. */
export const PIKSELA_PO_AMPERU = 125;
/** Gornja granica, da čestice ne postanu mrlja. */
export const NAJBRZE = 600;
/** Kratak spoj: brže od svega, i to je poenta. */
export const BRZINA_KRATKOG = 720;
/** Ispod ove brzine (px/s) čestice se ne crtaju. */
export const PRAG_KRETANJA = 4;
/** Razmak između čestica na putanji, px. */
export const RAZMAK_CESTICA = 26;

export function brzinaCestica(struja: number) {
  return Math.min(NAJBRZE, Math.abs(struja) * PIKSELA_PO_AMPERU);
}

/** Koliko je vidljiva široka traka ispod čestica: jača struja, jača traka. */
export function jacinaToka(struja: number) {
  return 0.12 + 0.22 * Math.min(1, Math.abs(struja) / 2);
}
