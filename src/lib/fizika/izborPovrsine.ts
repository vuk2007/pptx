import { EPS0 } from '@/lib/fizika/elektrostatika';

/*
  §9 Izbor Gaussove površine.

  Gaussov zakon važi za svaku zatvorenu površinu, ali polje iz njega
  izlazi samo kad je na dijelovima površine E ili okomito i stalno, ili
  paralelno sa površinom (pa je fluks tu nula).
    prava, koaksijalni valjak ρ × L:  plašt E·2πρL, osnovice 0
    prava, kocka stranice 2s:         ukupno isto, ali E·n po strani nije stalno
    ravan, kutija površine A:         dvije osnovice po E·A, bočne strane 0
*/

/** Polje beskonačne prave, q po dužini, na rastojanju ρ. */
export const poljePrave = (q: number, rho: number) => q / (2 * Math.PI * EPS0 * rho);

/** Polje beskonačne ravni sa obje strane. */
export const poljeRavni = (sigma: number) => sigma / (2 * EPS0);

/**
  Fluks polja prave (u osi z) kroz plašt valjka, brojčano: n komada po
  obimu, svaki sa E·n·da. Osnovice imaju normalu duž z, a polje prave
  nema z-komponentu, pa kroz njih ide tačno nula.
*/
export function valjak(q: number, rho: number, L: number, n = 360) {
  let plast = 0;
  const da = ((2 * Math.PI * rho) / n) * L;
  for (let k = 0; k < n; k++) {
    /* Polje prave kao vektor u tački plašta, puta normala plašta u toj tački. */
    const fi = (2 * Math.PI * (k + 0.5)) / n;
    const x = rho * Math.cos(fi);
    const y = rho * Math.sin(fi);
    const r2 = x * x + y * y;
    const Ex = (q / (2 * Math.PI * EPS0)) * (x / r2);
    const Ey = (q / (2 * Math.PI * EPS0)) * (y / r2);
    plast += (Ex * Math.cos(fi) + Ey * Math.sin(fi)) * da;
  }
  return { plast, osnovice: 0, ukupno: plast };
}

/**
  Kocka stranice 2s oko prave u osi z, visine L: četiri bočne strane,
  na svakoj E·n zavisi od mjesta. Vraća fluks po strani i odnos najveće
  i najmanje gustine E·n na strani.
*/
export function kocka(q: number, s: number, L: number, n = 2000) {
  let strana = 0;
  let najvise = 0;
  let najmanje = Infinity;
  const dy = (2 * s) / n;
  for (let k = 0; k < n; k++) {
    const y = -s + (k + 0.5) * dy;
    /* Strana x = s: ρ = √(s² + y²), normala +x, E_x = E·s/ρ. */
    const rho = Math.hypot(s, y);
    const En = (poljePrave(q, rho) * s) / rho;
    strana += En * dy * L;
    najvise = Math.max(najvise, En);
    najmanje = Math.min(najmanje, En);
  }
  return { strana, ukupno: 4 * strana, osnovice: 0, odnos: najvise / najmanje };
}

/** Kutija površine A oko ravni: dvije osnovice, svaka E·A, bočne strane nula. */
export function kutija(sigma: number, A: number) {
  const osnovica = poljeRavni(sigma) * A;
  return { osnovica, ukupno: 2 * osnovica, bocno: 0 };
}
