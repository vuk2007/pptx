import type { ComponentType, ReactNode } from 'react';

/*
  Sve što jedan eksperiment donosi na svoju stranu, osim naslova i
  poglavlja (oni su u registru). Raspored strane je uvijek isti, pa se
  eksperiment ne bavi izgledom, samo sadržajem.
*/
export type SadrzajEksperimenta = {
  /** Pitanje prije interakcije. Kontrole su zaključane dok se ne izabere odgovor. */
  predvidi: {
    pitanje: ReactNode;
    opcije: ReactNode[];
    /** Indeks tačne opcije. */
    tacna: number;
    objasnjenje: ReactNode;
  };
  /** Interaktivni dio: klijentska komponenta bez propsa. */
  Simulacija: ComponentType;
  /** Dvije do četiri kratke stavke: šta je šta na crtežu. */
  staGledas: ReactNode[];
  formula: {
    /** Ključna jednačina, u TeX-u. */
    tex: string;
    /** Koja kontrola odgovara kojem simbolu. Simbol je TeX. */
    veze: { simbol: string; opis: ReactNode }[];
  };
  /** Jedna rečenica o tipičnoj grešci koju eksperiment gađa. */
  greska: ReactNode;
};
