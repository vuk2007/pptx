import type { Slucajno } from './slucajno';

/*
  §4 Gustina struje: koliko naboja prođe kroz prozorčić δa za vrijeme δt.

  Naboji se kreću brzinom w pod uglom α prema normali prozorčića. Kroz
  prozorčić za δt prođu tačno oni koji su sada u kosoj prizmi iza njega:
  osnovica je δa, a ivica w·δt ide unazad, suprotno od kretanja. Zapremina
  te prizme je δa·w·δt·cos α, pa je naboj u njoj ρ·δa·w·δt·cos α.

  Crtež je presjek, pa je prozorčić duž, a ρ se broji po površini presjeka.
  Koordinate su pikseli crteža, y raste naniže kao u SVG-u.
*/

/** Razmjera crteža: koliko piksela je jedan centimetar. */
export const PX_PO_CM = 40;

export type Tacka = { x: number; y: number };

/** Prozorčić je uspravna duž na x, od y1 do y2; normala gleda udesno (+x). */
export type Prozor = { x: number; y1: number; y2: number };

/** Smjer kretanja: ugao α od normale, naboji idu udesno i naviše. */
export function smjer(alfa: number): Tacka {
  return { x: Math.cos(alfa), y: -Math.sin(alfa) };
}

/** δQ = ρ·δa·w·δt·cos α. Jedinice su na pozivaocu, samo moraju biti dosljedne. */
export function nabojPoFormuli(rho: number, da: number, w: number, dt: number, alfa: number) {
  return rho * da * w * dt * Math.cos(alfa);
}

/** Četiri ugla prizme: prozorčić, pa isti prozorčić pomjeren za −w·δt. */
export function vrhoviPrizme(prozor: Prozor, duzina: number, alfa: number): Tacka[] {
  const u = smjer(alfa);
  const dx = -duzina * u.x;
  const dy = -duzina * u.y;
  return [
    { x: prozor.x, y: prozor.y1 },
    { x: prozor.x, y: prozor.y2 },
    { x: prozor.x + dx, y: prozor.y2 + dy },
    { x: prozor.x + dx, y: prozor.y1 + dy },
  ];
}

/**
  Da li naboj u tački p stigne do prozorčića za vrijeme za koje pređe put
  `duzina`. Tačka iz prizme je prozor − s·duzina·u, za s od 0 do 1.
*/
export function uPrizmi(p: Tacka, prozor: Prozor, duzina: number, alfa: number): boolean {
  const u = smjer(alfa);
  if (duzina <= 0 || u.x <= 0) return false;
  const s = (prozor.x - p.x) / (duzina * u.x);
  if (s < 0 || s > 1) return false;
  const y = p.y + s * duzina * u.y;
  return y >= prozor.y1 && y <= prozor.y2;
}

export type Mreza = { tacke: Tacka[]; perioda: Tacka; razmak: number };

/**
  Naboji raspoređeni u mrežu sa malo nereda. Gustina je broj naboja po
  kvadratnom pikselu; razmak mreže je 1/√gustina. Mreža se ponavlja sa
  periodom koja pokriva bar zadati pravougaonik, pa naboj koji izađe na
  jednu ivicu uđe na suprotnu i gustina ostaje ista.
*/
export function napraviMrezu(gustina: number, sirina: number, visina: number, rnd: Slucajno): Mreza {
  const razmak = 1 / Math.sqrt(gustina);
  const kolone = Math.ceil(sirina / razmak);
  const redovi = Math.ceil(visina / razmak);
  const tacke: Tacka[] = [];
  for (let i = 0; i < kolone; i++) {
    for (let j = 0; j < redovi; j++) {
      tacke.push({
        x: (i + 0.5 + (rnd() - 0.5) * 0.5) * razmak,
        y: (j + 0.5 + (rnd() - 0.5) * 0.5) * razmak,
      });
    }
  }
  return { tacke, perioda: { x: kolone * razmak, y: redovi * razmak }, razmak };
}

/** Pomjera sve naboje za (dx, dy) i vraća ih u period mreže. */
export function pomjeri(mreza: Mreza, dx: number, dy: number) {
  const { x: px, y: py } = mreza.perioda;
  for (const t of mreza.tacke) {
    t.x = (((t.x + dx) % px) + px) % px;
    t.y = (((t.y + dy) % py) + py) % py;
  }
}

export function prebroj(tacke: readonly Tacka[], prozor: Prozor, duzina: number, alfa: number) {
  let n = 0;
  for (const t of tacke) if (uPrizmi(t, prozor, duzina, alfa)) n++;
  return n;
}
