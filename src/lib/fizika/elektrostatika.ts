/*
  §7 i §8: Coulombov zakon i polje tačkastih naboja, u SI jedinicama.

  Naboji leže u ravni crteža, ali fizika je prostorna: sila i polje
  opadaju sa 1/R². Oznake kao u udžbeniku: T je tačka u kojoj se računa
  polje, T' tačka izvora, a R = T − T' vektor od izvora do tačke.
*/

export const EPS0 = 8.8541878128e-12;
/** 1/(4πε₀), u N·m²/C². */
export const K = 1 / (4 * Math.PI * EPS0);

export type V2 = { x: number; y: number };
export type Naboj = { Q: number; x: number; y: number };

export const duzina = (v: V2) => Math.hypot(v.x, v.y);
export const zbir = (a: V2, b: V2): V2 => ({ x: a.x + b.x, y: a.y + b.y });
export const puta = (v: V2, k: number): V2 => ({ x: v.x * k, y: v.y * k });

/** Polje jednog naboja u tački T: K·Q·R/R³, R = T − T'. */
export function poljeOd(n: Naboj, T: V2): V2 {
  const Rx = T.x - n.x;
  const Ry = T.y - n.y;
  const R2 = Rx * Rx + Ry * Ry;
  if (R2 === 0) return { x: 0, y: 0 };
  const k = (K * n.Q) / (R2 * Math.sqrt(R2));
  return { x: k * Rx, y: k * Ry };
}

/** Superpozicija: zbir polja svih naboja. */
export function polje(naboji: readonly Naboj[], T: V2): V2 {
  let x = 0;
  let y = 0;
  for (const n of naboji) {
    const e = poljeOd(n, T);
    x += e.x;
    y += e.y;
  }
  return { x, y };
}

/** Sila na naboj `na` od naboja `od`: Q_na · E_od(na). */
export function sila(od: Naboj, na: Naboj): V2 {
  return puta(poljeOd(od, na), na.Q);
}

export type Granice = { x0: number; y0: number; x1: number; y1: number };

/**
  Linije polja. Počinju na malom krugu oko pozitivnih naboja (broj linija
  srazmjeran naboju) i idu u smjeru polja dok ne stignu do negativnog
  naboja ili ne izađu iz granica. Ako pozitivnih nema, kreće se od
  negativnih, suprotno od polja. Korak je fiksne dužine (RK2).
*/
export function linijePolja(
  naboji: readonly Naboj[],
  { poJedinici, jedinica, poluprecnik, korak, granice, maxKoraka = 900 }: {
    poJedinici: number;
    jedinica: number;
    poluprecnik: number;
    korak: number;
    granice: Granice;
    maxKoraka?: number;
  },
): V2[][] {
  const pozitivni = naboji.filter((n) => n.Q > 0);
  const izvori = pozitivni.length > 0 ? pozitivni : naboji.filter((n) => n.Q < 0);
  const smjer = pozitivni.length > 0 ? 1 : -1;
  const ponori = naboji.filter((n) => Math.sign(n.Q) === -smjer);
  const linije: V2[][] = [];

  const pravac = (p: V2): V2 | null => {
    const e = polje(naboji, p);
    const d = duzina(e);
    return d === 0 ? null : { x: (smjer * e.x) / d, y: (smjer * e.y) / d };
  };

  for (const izvor of izvori) {
    const broj = Math.max(4, Math.round((poJedinici * Math.abs(izvor.Q)) / jedinica));
    for (let k = 0; k < broj; k++) {
      const ugao = (2 * Math.PI * (k + 0.5)) / broj;
      let p = { x: izvor.x + poluprecnik * Math.cos(ugao), y: izvor.y + poluprecnik * Math.sin(ugao) };
      const linija = [p];
      for (let s = 0; s < maxKoraka; s++) {
        const a = pravac(p);
        if (!a) break;
        const sredina = { x: p.x + (a.x * korak) / 2, y: p.y + (a.y * korak) / 2 };
        const b = pravac(sredina);
        if (!b) break;
        p = { x: p.x + b.x * korak, y: p.y + b.y * korak };
        linija.push(p);
        if (p.x < granice.x0 || p.x > granice.x1 || p.y < granice.y0 || p.y > granice.y1) break;
        if (ponori.some((n) => Math.hypot(p.x - n.x, p.y - n.y) < poluprecnik)) break;
      }
      linije.push(linija);
    }
  }
  return linije;
}
