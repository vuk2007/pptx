import type { Slucajno } from './slucajno';

/*
  §3 i §4: smjer struje i smjer nosilaca.

  Struja kroz presjek je naboj koji pređe udesno (u smjeru strelice) u
  sekundi. Pozitivan naboj koji ide udesno i negativan koji ide ulijevo
  doprinose istom predznaku: +1 nC udesno i −1 nC ulijevo ostave lijevu
  stranu sa 1 nC manje, a desnu sa 1 nC više.

  Žica je dio zatvorenog kola: nosilac koji izađe na jednom kraju vraća se
  na drugi kroz izvor, pa se broji samo prelaz preko presjeka u sredini.
*/

export type Vrsta = 'elektroni' | 'ioni' | 'oba';
export type Nosilac = { x: number; y: number; q: 1 | -1 };

export function napraviNosioce(vrsta: Vrsta, broj: number, duzina: number, visina: number, rnd: Slucajno): Nosilac[] {
  const izlaz: Nosilac[] = [];
  for (let k = 0; k < broj; k++) {
    const q: 1 | -1 = vrsta === 'elektroni' ? -1 : vrsta === 'ioni' ? 1 : k % 2 === 0 ? 1 : -1;
    izlaz.push({ x: rnd() * duzina, y: rnd() * visina, q });
  }
  return izlaz;
}

/** Brzina nosioca: pozitivan ide niz polje, negativan protiv njega. */
export function brzina(q: 1 | -1, smjerPolja: 1 | -1, w: number) {
  return q * smjerPolja * w;
}

export type Prelazi = {
  /** Broj pozitivnih koji su prešli presjek udesno i ulijevo. */
  plusDesno: number;
  plusLijevo: number;
  minusDesno: number;
  minusLijevo: number;
};

export const NULA: Prelazi = { plusDesno: 0, plusLijevo: 0, minusDesno: 0, minusLijevo: 0 };

/** Naboj koji je prešao presjek udesno, u jedinicama naboja jednog nosioca. */
export function prenesenoUdesno(p: Prelazi) {
  return p.plusDesno - p.plusLijevo - (p.minusDesno - p.minusLijevo);
}

export function saberi(a: Prelazi, b: Prelazi): Prelazi {
  return {
    plusDesno: a.plusDesno + b.plusDesno,
    plusLijevo: a.plusLijevo + b.plusLijevo,
    minusDesno: a.minusDesno + b.minusDesno,
    minusLijevo: a.minusLijevo + b.minusLijevo,
  };
}

/** Pomjera nosioce za dt i broji prelaze preko presjeka na x = presjek. */
export function korak(nosioci: Nosilac[], smjerPolja: 1 | -1, w: number, dt: number, presjek: number, duzina: number): Prelazi {
  const p = { ...NULA };
  for (const n of nosioci) {
    const prije = n.x;
    let poslije = prije + brzina(n.q, smjerPolja, w) * dt;
    if (prije < presjek && poslije >= presjek) {
      if (n.q > 0) p.plusDesno++;
      else p.minusDesno++;
    } else if (prije >= presjek && poslije < presjek) {
      if (n.q > 0) p.plusLijevo++;
      else p.minusLijevo++;
    }
    /* Kroz izvor nazad na drugi kraj; taj skok nije prelaz preko presjeka. */
    if (poslije >= duzina) poslije -= duzina;
    if (poslije < 0) poslije += duzina;
    n.x = poslije;
  }
  return p;
}

/** Promjena naboja lijevo i desno od presjeka zbog prelaza. */
export function bilans(p: Prelazi) {
  const udesno = prenesenoUdesno(p);
  return { lijevo: -udesno, desno: udesno };
}
