import { deflateSync } from 'node:zlib';

/** Minimalni PNG enkoder. Postoji da ikone nastanu pri buildu, bez ijedne zavisnosti. */

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function komad(tip, podaci) {
  const duzina = Buffer.alloc(4);
  duzina.writeUInt32BE(podaci.length, 0);
  const tijelo = Buffer.concat([Buffer.from(tip, 'ascii'), podaci]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tijelo), 0);
  return Buffer.concat([duzina, tijelo, crc]);
}

export class Platno {
  constructor(velicina) {
    this.w = velicina;
    this.h = velicina;
    this.px = new Uint8ClampedArray(velicina * velicina * 4);
  }

  /** boja: '#rrggbb', alfa 0..1. Miješa se preko onog što je već nacrtano. */
  #spoji(x, y, [r, g, b], a) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = (y * this.w + x) * 4;
    const p = this.px;
    const postojeca = p[i + 3] / 255;
    const izlazna = a + postojeca * (1 - a);
    if (izlazna <= 0) return;
    p[i] = (r * a + p[i] * postojeca * (1 - a)) / izlazna;
    p[i + 1] = (g * a + p[i + 1] * postojeca * (1 - a)) / izlazna;
    p[i + 2] = (b * a + p[i + 2] * postojeca * (1 - a)) / izlazna;
    p[i + 3] = izlazna * 255;
  }

  /** Uzorkuje 3x3 po pikselu da ivice ne budu stepenaste. */
  #crtaj(boja, test) {
    const rgb = razloziBoju(boja);
    const uzorci = [0.1667, 0.5, 0.8333];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        let pogodaka = 0;
        for (const dy of uzorci) for (const dx of uzorci) if (test(x + dx, y + dy)) pogodaka++;
        if (pogodaka > 0) this.#spoji(x, y, rgb, pogodaka / 9);
      }
    }
  }

  pravougaonik(x, y, w, h, boja, radijus = 0) {
    const r = Math.min(radijus, w / 2, h / 2);
    this.#crtaj(boja, (px, py) => {
      if (px < x || py < y || px > x + w || py > y + h) return false;
      if (r <= 0) return true;
      const cx = Math.min(Math.max(px, x + r), x + w - r);
      const cy = Math.min(Math.max(py, y + r), y + h - r);
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    });
  }

  krug(cx, cy, r, boja) {
    this.#crtaj(boja, (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r);
  }

  prsten(cx, cy, r, debljina, boja) {
    const unutra = r - debljina;
    this.#crtaj(boja, (px, py) => {
      const d2 = (px - cx) ** 2 + (py - cy) ** 2;
      return d2 <= r * r && d2 >= unutra * unutra;
    });
  }

  /** Debela linija kroz niz tačaka, sa zaobljenim spojevima. */
  vod(tacke, debljina, boja) {
    const pola = debljina / 2;
    this.#crtaj(boja, (px, py) => {
      for (let i = 0; i < tacke.length - 1; i++) {
        const [x1, y1] = tacke[i];
        const [x2, y2] = tacke[i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const duzina2 = dx * dx + dy * dy;
        let t = duzina2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / duzina2;
        t = Math.min(1, Math.max(0, t));
        const rx = px - (x1 + t * dx);
        const ry = py - (y1 + t * dy);
        if (rx * rx + ry * ry <= pola * pola) return true;
      }
      return false;
    });
  }

  uPng() {
    const redovi = Buffer.alloc(this.h * (this.w * 4 + 1));
    for (let y = 0; y < this.h; y++) {
      const pocetak = y * (this.w * 4 + 1);
      redovi[pocetak] = 0; // filter 0 = None
      Buffer.from(this.px.buffer, y * this.w * 4, this.w * 4).copy(redovi, pocetak + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; // dubina
    ihdr[9] = 6; // RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      komad('IHDR', ihdr),
      komad('IDAT', deflateSync(redovi, { level: 9 })),
      komad('IEND', Buffer.alloc(0)),
    ]);
  }
}

function razloziBoju(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
