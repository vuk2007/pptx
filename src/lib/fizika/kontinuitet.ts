import type { Slucajno } from './slucajno';

/*
  §5 Jednačina kontinuiteta.

  Naboji lutaju oko zatvorene površine. Svaki prelaz preko površine se
  broji: izlazak je +1, ulazak −1 (normala gleda prema van). Zbir tih
  prelaza za vrijeme dt je struja van puta dt, a promjena broja naboja
  unutra je isti broj sa suprotnim predznakom. To nije aproksimacija,
  nego brojanje: naboj ne nestaje i ne nastaje, pa Q_not + Q_zun ostaje isto.

  Sa otvorenom ravni nema „unutra" i „vani"; broji se samo prelaz sa
  lijeve strane na desnu (normala udesno) i obrnuto.
*/

export type Oblik = 'zatvorena' | 'ravan';
export type Rezim = 'izlazi' | 'ulazi' | 'prolazi';

export type Polje = {
  sirina: number;
  visina: number;
  /** Središte kruga, ili tačka kroz koju prolazi uspravna ravan. */
  cx: number;
  cy: number;
  r: number;
};

export type Naboj = { x: number; y: number; unutra: boolean };

export type Stanje = {
  oblik: Oblik;
  rezim: Rezim;
  polje: Polje;
  naboji: Naboj[];
};

/**
  Brzina nasumičnog lutanja i usmjerenog pomaka, piksela u sekundi.
  Pomak je spor da se pražnjenje gleda desetak sekundi, a ne dvije.
*/
export const LUTANJE = 80;
export const POMAK = 14;
export const PROLAZ = 40;
/** Pomak prema van djeluje samo do ove udaljenosti od površine; dalje naboj samo luta. */
export const DOSEG = 60;
const IVICA = 4;

/** „Unutra" za ravan znači lijevo od nje. */
export function unutra(x: number, y: number, oblik: Oblik, p: Polje): boolean {
  if (oblik === 'ravan') return x < p.cx;
  return (x - p.cx) ** 2 + (y - p.cy) ** 2 < p.r * p.r;
}

export function napraviStanje(oblik: Oblik, rezim: Rezim, polje: Polje, broj: number, rnd: Slucajno): Stanje {
  const naboji: Naboj[] = [];
  const efektivni: Rezim = oblik === 'ravan' ? 'prolazi' : rezim;
  while (naboji.length < broj) {
    const x = 10 + rnd() * (polje.sirina - 20);
    const y = 10 + rnd() * (polje.visina - 20);
    const d = Math.hypot(x - polje.cx, y - polje.cy);
    let uzmi = true;
    if (efektivni === 'izlazi') uzmi = d < polje.r - 5 || rnd() < 0.08;
    else if (efektivni === 'ulazi') uzmi = (d > polje.r + 5 && d < polje.r + 150) || rnd() < 0.05;
    if (uzmi) naboji.push({ x, y, unutra: unutra(x, y, oblik, polje) });
  }
  return { oblik, rezim: efektivni, polje, naboji };
}

export type Prelazi = { izaslo: number; uslo: number };

/**
  Jedan korak simulacije. Vraća koliko je naboja prešlo površinu prema van
  i prema unutra. Kroz ravan: „izašlo" je prelaz sa lijeve na desnu stranu.
*/
export function korak(s: Stanje, dt: number, rnd: Slucajno): Prelazi {
  const { polje: p } = s;
  let izaslo = 0;
  let uslo = 0;
  for (const n of s.naboji) {
    let vx = (rnd() - 0.5) * LUTANJE;
    let vy = (rnd() - 0.5) * LUTANJE;
    const dx = n.x - p.cx;
    const dy = n.y - p.cy;
    const d = Math.hypot(dx, dy) || 1;
    if (s.rezim === 'izlazi' && d < p.r + DOSEG) {
      vx += (POMAK * dx) / d;
      vy += (POMAK * dy) / d;
    } else if (s.rezim === 'ulazi' && d > 8) {
      vx -= (POMAK * dx) / d;
      vy -= (POMAK * dy) / d;
    } else if (s.rezim === 'prolazi') {
      vx += PROLAZ;
    }

    n.x += vx * dt;
    n.y += vy * dt;
    if (s.rezim === 'prolazi' && n.x > p.sirina - IVICA) {
      /* Naboj koji izađe desno vraća se lijevo kao nov: taj skok nije prelaz. */
      n.x -= p.sirina - 2 * IVICA;
      n.unutra = unutra(n.x, n.y, s.oblik, p);
    }
    n.x = Math.min(p.sirina - IVICA, Math.max(IVICA, n.x));
    n.y = Math.min(p.visina - IVICA, Math.max(IVICA, n.y));

    const sad = unutra(n.x, n.y, s.oblik, p);
    if (n.unutra && !sad) izaslo++;
    if (!n.unutra && sad) uslo++;
    n.unutra = sad;
  }
  return { izaslo, uslo };
}

export function brojUnutra(s: Stanje) {
  let n = 0;
  for (const x of s.naboji) if (x.unutra) n++;
  return n;
}

/**
  Struja van iz prelaza za vrijeme dt, sa normalom prema van (+1) ili
  prema unutra (−1). Okretanje normale mijenja samo predznak.
*/
export function strujaVan(prelazi: Prelazi, dt: number, normala: 1 | -1) {
  return (normala * (prelazi.izaslo - prelazi.uslo)) / dt;
}

/** Klizni prosjek koji ne zavisi od broja kadrova u sekundi. */
export function izgladi(staro: number, novo: number, dt: number, brzina = 1.5) {
  return staro + (novo - staro) * (1 - Math.exp(-brzina * dt));
}
