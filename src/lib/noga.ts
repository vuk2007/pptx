/*
  Noga sa dva zgloba, gledana sa strane.

  Direktno: znaš uglove, tražiš gdje je stopalo.
  Inverzno: znaš gdje hoćeš stopalo, tražiš uglove. To je zakon kosinusa.

  Koordinate: kuk je u nuli, x je naprijed, y nadolje.
*/

/** Dužine segmenata. Ilustrativne — prava noga ima svoje mjere. */
export const BEDRO = 135;
export const POTKOLJENICA = 135;

export const NAJDALJE = BEDRO + POTKOLJENICA;
export const NAJBLIZE = Math.abs(BEDRO - POTKOLJENICA);

export type Uglovi = {
  /** Ugao bedra, mjeren od nadolje, pozitivno naprijed. */
  kuk: number;
  /** Unutrašnji ugao u koljenu. 180° znači ispružena noga. */
  koljeno: number;
};

export type Tacka = { x: number; y: number };

const uStepene = (rad: number) => (rad * 180) / Math.PI;
const uRadijane = (st: number) => (st * Math.PI) / 180;

/** Gdje završi stopalo za date uglove. */
export function direktno({ kuk, koljeno }: Uglovi): Tacka {
  const a = uRadijane(kuk);
  const koljenoTacka = { x: Math.sin(a) * BEDRO, y: Math.cos(a) * BEDRO };

  /*
    Koljeno se savija unazad: ugao potkoljenice je ugao bedra umanjen
    za koliko je koljeno savijeno u odnosu na ispruženu nogu.
  */
  const b = a - uRadijane(180 - koljeno);
  return {
    x: koljenoTacka.x + Math.sin(b) * POTKOLJENICA,
    y: koljenoTacka.y + Math.cos(b) * POTKOLJENICA,
  };
}

/** Gdje je koljeno za date uglove — treba za crtanje. */
export function koljenoZa({ kuk }: Uglovi): Tacka {
  const a = uRadijane(kuk);
  return { x: Math.sin(a) * BEDRO, y: Math.cos(a) * BEDRO };
}

export type Rjesenje = {
  uglovi: Uglovi;
  /** Tačka do koje noga stvarno stiže — na ivici dometa ako je cilj predaleko. */
  stopalo: Tacka;
  uDometu: boolean;
};

/**
  Inverzno: koji uglovi stavljaju stopalo tu gdje je traženo.

  Van dometa se cilj povlači na ivicu, pa noga stane tamo umjesto da
  odustane — tako se na ekranu vidi dokle noga može.
*/
export function inverzno(cilj: Tacka): Rjesenje {
  let { x, y } = cilj;
  let d = Math.hypot(x, y);
  const uDometu = d <= NAJDALJE && d >= NAJBLIZE;

  if (d > NAJDALJE) {
    const k = NAJDALJE / d;
    x *= k;
    y *= k;
    d = NAJDALJE;
  } else if (d < NAJBLIZE) {
    /* Kad su segmenti jednaki, NAJBLIZE je nula i ovdje se ne ulazi. */
    const k = d === 0 ? 0 : NAJBLIZE / d;
    x *= k;
    y *= k;
    d = NAJBLIZE;
  }

  /*
    Stopalo tačno u kuku: noga je skroz sklopljena i ugao kuka nije određen,
    jer svaki daje isti rezultat. Biramo nadolje.
  */
  if (d < 1e-6) {
    return { uglovi: { kuk: 0, koljeno: 0 }, stopalo: { x: 0, y: 0 }, uDometu: true };
  }

  const stisni = (v: number) => Math.max(-1, Math.min(1, v));

  /* Unutrašnji ugao u koljenu, direktno iz zakona kosinusa. */
  const cosKoljeno = stisni(
    (BEDRO * BEDRO + POTKOLJENICA * POTKOLJENICA - d * d) / (2 * BEDRO * POTKOLJENICA),
  );
  const koljeno = uStepene(Math.acos(cosKoljeno));

  /* Ugao između pravca kuk-stopalo i bedra. */
  const cosAlfa = stisni((BEDRO * BEDRO + d * d - POTKOLJENICA * POTKOLJENICA) / (2 * BEDRO * d));
  const alfa = uStepene(Math.acos(cosAlfa));

  /* Pravac ka stopalu, mjeren od nadolje kao i ugao kuka. */
  const pravac = uStepene(Math.atan2(x, y));

  return {
    uglovi: { kuk: pravac + alfa, koljeno },
    stopalo: { x, y },
    uDometu,
  };
}
