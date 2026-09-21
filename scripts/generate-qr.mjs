import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { qrUSvg } from './qr.mjs';

/*
  QR kod se pravi pri buildu i završava kao statički SVG u public/qr/.
  Dok je QR_URL prazan, ne pravi se ništa i strana /pocni prikazuje
  verziju bez QR koda, umjesto koda koji ne vodi nigdje.
*/

const izvor = readFileSync('src/config/cinjenice.ts', 'utf8');
const poklapanje = izvor.match(/export const QR_URL:\s*string\s*=\s*'([^']*)'/);
const url = poklapanje ? poklapanje[1].trim() : '';

mkdirSync('public/qr', { recursive: true });

if (!url) {
  rmSync('public/qr/pocni.svg', { force: true });
  console.log('QR: QR_URL je prazan, preskačem (strana /pocni ide bez koda).');
  process.exit(0);
}

const svg = qrUSvg(url);
writeFileSync('public/qr/pocni.svg', svg, 'utf8');
console.log(`QR: pocni.svg za ${url} (${svg.length} bajtova)`);
