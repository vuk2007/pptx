/*
  Logika H-mosta, odvojena od crteža da se može čitati i provjeriti sama za sebe.

  Raspored je standardni: S1 gore lijevo, S2 gore desno, S3 dolje lijevo,
  S4 dolje desno. Motor visi između lijevog čvora (S1-S3) i desnog (S2-S4).
*/

export type Prekidaci = { s1: boolean; s2: boolean; s3: boolean; s4: boolean };

export type Rezim =
  | 'nista'
  | 'naprijed'
  | 'nazad'
  | 'kocenjeGore'
  | 'kocenjeDolje'
  | 'kratakSpoj';

export const SVI_UGASENI: Prekidaci = { s1: false, s2: false, s3: false, s4: false };

/**
  Dvije sklopke na istoj nozi spajaju plus pravo na masu, mimo motora.
  To je kratak spoj i ima prednost nad svime ostalim — ako je noga spojena,
  nije važno šta radi druga strana.
*/
export function kratkaNoga(p: Prekidaci): 'lijeva' | 'desna' | null {
  if (p.s1 && p.s3) return 'lijeva';
  if (p.s2 && p.s4) return 'desna';
  return null;
}

export function rezimZa(p: Prekidaci): Rezim {
  if (kratkaNoga(p)) return 'kratakSpoj';
  if (p.s1 && p.s4) return 'naprijed';
  if (p.s2 && p.s3) return 'nazad';
  if (p.s1 && p.s2) return 'kocenjeGore';
  if (p.s3 && p.s4) return 'kocenjeDolje';
  return 'nista';
}

/** Smjer okretanja točka: 1 naprijed, -1 nazad, 0 stoji. */
export function smjerZa(rezim: Rezim): -1 | 0 | 1 {
  if (rezim === 'naprijed') return 1;
  if (rezim === 'nazad') return -1;
  return 0;
}

/**
  Kako L298N postavlja četiri sklopke.

  Jedan ulaz drži obje sklopke na svojoj nozi, i drži ih uvijek suprotne.
  Zato kratak spoj nije stvar dobre volje — po ovoj vezi jednostavno nije moguć.
*/
export function prekidaciZaL298N(in1: boolean, in2: boolean, en: boolean): Prekidaci {
  if (!en) return SVI_UGASENI;
  return {
    s1: in1,
    s3: !in1,
    s2: in2,
    s4: !in2,
  };
}

export const PORUKE: Record<Rezim, string> = {
  nista: 'Nijedan prekidač nije upaljen. Kroz motor ne teče ništa.',
  naprijed: 'S1 i S4: struja ide kroz motor s lijeva na desno i točak se vrti naprijed.',
  nazad: 'S2 i S3: struja ide obrnuto i točak se vrti nazad.',
  kocenjeGore: 'Oba kraja motora su na plusu. Nema struje kroz motor, motor koči.',
  kocenjeDolje: 'Oba kraja motora su na masi. Nema struje kroz motor, motor koči.',
  kratakSpoj:
    'Kratak spoj! Struja ide pored motora direktno u masu. Zato drajver nikad ne dozvoljava da se oba prekidača na istoj strani upale.',
};

export function porukaZa(p: Prekidaci): string {
  const rezim = rezimZa(p);
  if (rezim !== 'nista') return PORUKE[rezim];
  const upaljenih = [p.s1, p.s2, p.s3, p.s4].filter(Boolean).length;
  return upaljenih === 1
    ? 'Jedan prekidač nije dovoljno. Struji treba put od plusa do mase.'
    : PORUKE.nista;
}

/** Redovi tabele za režim L298N. Onaj koji odgovara ulazima se ističe. */
export const TABELA_L298N = [
  { en: true, in1: true, in2: false, ishod: 'naprijed' },
  { en: true, in1: false, in2: true, ishod: 'nazad' },
  { en: true, in1: true, in2: true, ishod: 'kočenje' },
  { en: true, in1: false, in2: false, ishod: 'kočenje' },
  { en: false, in1: null, in2: null, ishod: 'slobodno staje' },
] as const;

export function redTabele(in1: boolean, in2: boolean, en: boolean) {
  if (!en) return TABELA_L298N.length - 1;
  return TABELA_L298N.findIndex((r) => r.en && r.in1 === in1 && r.in2 === in2);
}
