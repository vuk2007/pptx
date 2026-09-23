/*
  Kinematika Perjanikove suspenzije: četiri točka, po jedna poluga sa dva
  točka na svakoj strani, i diferencijal koji drži tijelo na prosjeku dvije
  poluge. Nema „rocker-bogie": nema treće osovine ni šest točkova.

  Ugao poluge nije zadat rukom. Točak je krug koji leži na tlu; poluga se
  okrene tačno toliko da oba njena točka dodiruju tlo, a osovina poluge
  sjedne na prosjek njihovih visina. Kad nema diferencijala, obje strane
  su zavarene za tijelo i nose isti ugao.

  Mjere su u jedinicama crteža, ne u milimetrima: uglovi su tačni za ovu
  geometriju, a geometrija je ilustrativna.
*/

export const GEOMETRIJA = {
  /** Od osovine poluge do osovine točka. */
  polaPoluge: 118,
  rTocka: 44,
  visinaKamena: 56,
  polaKamena: 76,
  /** Širina kosih ivica kamena. */
  kosina: 18,
} as const;

type Geometrija = typeof GEOMETRIJA;

/** Visina tla na mjestu x: nula svuda osim ispod kamena. */
export function visinaTla(x: number, xKamena: number, g: Geometrija = GEOMETRIJA) {
  const d = Math.abs(x - xKamena);
  if (d >= g.polaKamena) return 0;
  if (d > g.polaKamena - g.kosina) return (g.visinaKamena * (g.polaKamena - d)) / g.kosina;
  return g.visinaKamena;
}

/**
  Koliko je osovina točka podignuta kad točak leži na tlu oko x.
  Krug dodiruje tlo u tački gdje je (visina tla + dio kruga iznad nje) najveći.
*/
export function podignutostTocka(x: number, xKamena: number | null, g: Geometrija = GEOMETRIJA) {
  if (xKamena === null) return 0;
  const r = g.rTocka;
  let najvise = 0;
  const koraka = 240;
  for (let i = 0; i <= koraka; i++) {
    const u = -r + (2 * r * i) / koraka;
    const h = visinaTla(x + u, xKamena, g);
    if (h === 0) continue;
    najvise = Math.max(najvise, h + Math.sqrt(r * r - u * u) - r);
  }
  return najvise;
}

export type Poluga = {
  /** Nagib poluge u radijanima; pozitivno znači prednji točak gore. */
  ugao: number;
  /** Podignutost osovine poluge iznad visine na ravnom. */
  podignutost: number;
  /** Osovine točkova: pozicija i podignutost. */
  nazad: { x: number; y: number };
  naprijed: { x: number; y: number };
};

/** Poluga koja slobodno leži na tlu: oba točka dodiruju. */
export function polugaNaTlu(xOsovine: number, xKamena: number | null, g: Geometrija = GEOMETRIJA): Poluga {
  const L = g.polaPoluge;
  let ugao = 0;
  let hNazad = 0;
  let hNaprijed = 0;
  /* Točkovi se pomjere vodoravno kad se poluga okrene, pa se rješava u nekoliko prolaza. */
  for (let prolaz = 0; prolaz < 30; prolaz++) {
    hNazad = podignutostTocka(xOsovine - L * Math.cos(ugao), xKamena, g);
    hNaprijed = podignutostTocka(xOsovine + L * Math.cos(ugao), xKamena, g);
    const novi = Math.asin(Math.max(-1, Math.min(1, (hNaprijed - hNazad) / (2 * L))));
    if (Math.abs(novi - ugao) < 1e-9) break;
    ugao = novi;
  }
  const podignutost = (hNazad + hNaprijed) / 2;
  return {
    ugao,
    podignutost,
    nazad: { x: xOsovine - L * Math.cos(ugao), y: podignutost - L * Math.sin(ugao) },
    naprijed: { x: xOsovine + L * Math.cos(ugao), y: podignutost + L * Math.sin(ugao) },
  };
}

/**
  Poluga zavarena za tijelo pod zadatim uglom, na ravnom tlu: spusti se
  dok njen niži točak ne dodirne tlo. Onaj drugi ostane gore.
*/
export function polugaKruta(xOsovine: number, ugao: number, g: Geometrija = GEOMETRIJA): Poluga {
  const L = g.polaPoluge;
  const podignutost = L * Math.abs(Math.sin(ugao));
  return {
    ugao,
    podignutost,
    nazad: { x: xOsovine - L * Math.cos(ugao), y: podignutost - L * Math.sin(ugao) },
    naprijed: { x: xOsovine + L * Math.cos(ugao), y: podignutost + L * Math.sin(ugao) },
  };
}

export type Tocak = { strana: 'lijeva' | 'desna'; polozaj: 'nazad' | 'naprijed'; x: number; y: number; zazor: number };

export type Suspenzija = {
  lijeva: Poluga;
  desna: Poluga;
  /** Nagib tijela, radijani. */
  tijelo: number;
  tockovi: Tocak[];
};

/** Zazor iznad kojeg se smatra da točak visi (jedinice crteža). */
export const PRAG_VISI = 1;

/**
  Kamen je ispod lijeve strane; desna je na ravnom.
  Sa diferencijalom svaka strana leži slobodno, a tijelo je na prosjeku.
  Bez njega je sve jedno kruto tijelo i obje strane nose ugao lijeve.
*/
export function rijesi(xOsovine: number, xKamena: number, kruto: boolean, g: Geometrija = GEOMETRIJA): Suspenzija {
  const lijeva = polugaNaTlu(xOsovine, xKamena, g);
  const desna = kruto ? polugaKruta(xOsovine, lijeva.ugao, g) : polugaNaTlu(xOsovine, null, g);
  const tijelo = kruto ? lijeva.ugao : (lijeva.ugao + desna.ugao) / 2;

  const tockovi: Tocak[] = [];
  for (const [strana, p, kamen] of [
    ['lijeva', lijeva, xKamena],
    ['desna', desna, null],
  ] as const) {
    for (const polozaj of ['nazad', 'naprijed'] as const) {
      const t = p[polozaj];
      tockovi.push({ strana, polozaj, x: t.x, y: t.y, zazor: t.y - podignutostTocka(t.x, kamen, g) });
    }
  }
  return { lijeva, desna, tijelo, tockovi };
}

export const stepeni = (rad: number) => (rad * 180) / Math.PI;
