import { mkdirSync, writeFileSync } from 'node:fs';
import { Platno } from './png.mjs';

/*
  Ikona je ploča sa tri LED pada u bojama petlje osjeti-odluči-djeluj,
  spojena bakarnim vodom koji se vraća u krug. Crta se pri buildu,
  da u repozitorijumu ne stoje binarni fajlovi.
*/

const BOJE = {
  pozadina: '#061a13',
  maska: '#0a2b1f',
  bakar: '#c98b3a',
  osjeti: '#3fb6e8',
  odluci: '#f0b429',
  djeluj: '#e2574c',
};

function nacrtajIkonu(velicina, { sigurnaZona = 1 } = {}) {
  const p = new Platno(velicina);
  const S = velicina;
  p.pravougaonik(0, 0, S, S, BOJE.pozadina);

  // Sve što nosi značenje staje unutar sigurne zone (maskable ikone se sijeku).
  const k = sigurnaZona;
  const c = S / 2;
  const u = (v) => c + (v - 0.5) * S * k; // normalizovano 0..1 -> piksel

  const ivica = 0.055;
  p.pravougaonik(
    u(ivica),
    u(ivica),
    (1 - 2 * ivica) * S * k,
    (1 - 2 * ivica) * S * k,
    BOJE.maska,
    0.11 * S * k,
  );

  const padY = 0.4;
  const padX = [0.265, 0.5, 0.735];
  const rPad = 0.082 * S * k;
  const debljinaVoda = Math.max(2, 0.038 * S * k);

  // Vod koji spaja tri pada i vraća se nazad: petlja, ne linija.
  p.vod(
    [
      [u(padX[0]), u(padY)],
      [u(padX[2]), u(padY)],
    ],
    debljinaVoda,
    BOJE.bakar,
  );
  p.vod(
    [
      [u(padX[2]), u(padY)],
      [u(0.845), u(padY)],
      [u(0.845), u(0.74)],
      [u(0.155), u(0.74)],
      [u(0.155), u(padY)],
      [u(padX[0]), u(padY)],
    ],
    debljinaVoda,
    BOJE.bakar,
  );

  [BOJE.osjeti, BOJE.odluci, BOJE.djeluj].forEach((boja, i) => {
    const x = u(padX[i]);
    const y = u(padY);
    p.krug(x, y, rPad, BOJE.maska);
    p.prsten(x, y, rPad, Math.max(2, 0.022 * S * k), BOJE.bakar);
    p.krug(x, y, rPad * 0.62, boja);
  });

  return p.uPng();
}

mkdirSync('public/icons', { recursive: true });

const zadaci = [
  ['public/icons/ikona-192.png', 192, {}],
  ['public/icons/ikona-512.png', 512, {}],
  ['public/icons/ikona-180.png', 180, {}],
  ['public/icons/ikona-maskable-512.png', 512, { sigurnaZona: 0.78 }],
];

for (const [putanja, velicina, opcije] of zadaci) {
  writeFileSync(putanja, nacrtajIkonu(velicina, opcije));
}

console.log(`Ikone: ${zadaci.length} fajla u public/icons/`);
