/*
  Logika H-mosta, odvojena od crtanja da se može čitati i provjeriti sama za sebe.
  Ponašanje je prenijeto iz referenca-h-most.html bez izmjena.

  Raspored je standardni: S1 gore lijevo, S2 gore desno, S3 dolje lijevo,
  S4 dolje desno. Motor visi između lijevog čvora (S1-S3) i desnog (S2-S4).
*/

import { MOTOR } from '@/config/cinjenice';
import { broj } from '@/lib/format';
import { kontraNapon, sljedecaBrzina } from '@/lib/motor';

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

export function zatvorenih(p: Prekidaci) {
  return [p.s1, p.s2, p.s3, p.s4].filter(Boolean).length;
}

const koci = (r: Rezim) => r === 'kocenjeGore' || r === 'kocenjeDolje';

/**
  Kako L298N postavlja četiri sklopke.

  Jedan ulaz drži obje sklopke na svojoj nozi, i drži ih uvijek suprotne.
  Zato kratak spoj nije stvar dobre volje — po ovoj vezi jednostavno nije moguć.
*/
export function prekidaciZaL298N(in1: boolean, in2: boolean, en: boolean): Prekidaci {
  if (!en) return SVI_UGASENI;
  return { s1: in1, s3: !in1, s2: in2, s4: !in2 };
}

/** Redovi tabele istine L298N, redom kao u referenci. */
export const TABELA_L298N = [
  { kljuc: 'en0', en: false, in1: null, in2: null, ishod: 'slobodno staje' },
  { kljuc: 'fw', en: true, in1: true, in2: false, ishod: 'naprijed' },
  { kljuc: 'bw', en: true, in1: false, in2: true, ishod: 'nazad' },
  { kljuc: 'b1', en: true, in1: true, in2: true, ishod: 'kočenje' },
  { kljuc: 'b0', en: true, in1: false, in2: false, ishod: 'kočenje' },
] as const;

export function redTabele(in1: boolean, in2: boolean, en: boolean) {
  if (!en) return 0;
  return TABELA_L298N.findIndex((r) => r.en && r.in1 === in1 && r.in2 === in2);
}

/* ------------------------------------------------------------ simulacija */

/** Koliko dugo kratak spoj traje prije nego zaštita otvori prekidače, s. */
export const TRAJANJE_KVARA = 1.6;
/** Koliko dugo poslije toga poruka objašnjava zaštitu, s. */
export const TRAJANJE_ZASTITE = 4;
/** PWM je usporen da bi se vidio: 3,5 puta u sekundi umjesto oko 490. */
export const PWM_USPORENO_HZ = 3.5;
/** Koliko sekundi stane na osciloskop. */
export const PROZOR = 4;

export type StanjeHMosta = {
  rezim: 'prekidaci' | 'cip';
  prekidaci: Prekidaci;
  in1: boolean;
  in2: boolean;
  /** EN kao PWM, od 0 do 1. */
  popuna: number;
  /** Brzina točka, o/min; znak je smjer. */
  brzina: number;
  /** Srednja struja kroz motor, A. */
  struja: number;
  kvar: { noga: 'lijeva' | 'desna'; t0: number } | null;
  zastitaDo: number;
  t: number;
};

export const POCETNO: StanjeHMosta = {
  rezim: 'prekidaci',
  prekidaci: SVI_UGASENI,
  in1: true,
  in2: false,
  popuna: 0,
  brzina: 0,
  struja: 0,
  kvar: null,
  zastitaDo: -1,
  t: 0,
};

/** Ono što se u ovom trenutku vidi: položaj sklopki, trenutna struja i naponi. */
export type TrenutnoHMosta = {
  /** Režim koji vozi motor u prosjeku (za čip: ono što ulazi traže). */
  komanda: Rezim;
  /** Režim trenutnog položaja sklopki (za čip: u ovoj fazi PWM-a). */
  trenutni: Rezim;
  sklopke: Prekidaci;
  /** Trenutna struja, sa talasanjem od PWM-a. */
  strujaTrenutna: number;
  /** Trenutni napon na motoru. */
  naponTrenutni: number;
  /** Srednji napon na motoru. */
  naponSrednji: number;
  kontraNapon: number;
  pwmUkljucen: boolean;
  kratak: boolean;
};

/** Prebacuje jednu sklopku. Kratak spoj odmah pokreće sat zaštite. */
export function prebaci(st: StanjeHMosta, koja: keyof Prekidaci): StanjeHMosta {
  if (st.rezim !== 'prekidaci') return st;
  const prekidaci = { ...st.prekidaci, [koja]: !st.prekidaci[koja] };
  const noga = kratkaNoga(prekidaci);
  return { ...st, prekidaci, kvar: noga && !st.kvar ? { noga, t0: st.t } : st.kvar };
}

export function postaviRezim(st: StanjeHMosta, rezim: StanjeHMosta['rezim']): StanjeHMosta {
  return { ...st, rezim, kvar: null, prekidaci: SVI_UGASENI };
}

export function resetuj(st: StanjeHMosta): StanjeHMosta {
  return { ...POCETNO, rezim: st.rezim, t: st.t };
}

/** Jedan korak simulacije. dt je u sekundama. */
export function korak(st: StanjeHMosta, dt: number): { stanje: StanjeHMosta; trenutno: TrenutnoHMosta } {
  const t = st.t + dt;
  const cip = st.rezim === 'cip';
  const E = kontraNapon(st.brzina);
  const vPogon = cip ? MOTOR.napajanje - MOTOR.padNaDrajveru : MOTOR.napajanje;
  const udio = cip ? st.popuna : 1;
  const komanda: Rezim = cip
    ? st.popuna > 0
      ? rezimZa(prekidaciZaL298N(st.in1, st.in2, true))
      : 'nista'
    : rezimZa(st.prekidaci);
  const smjer = smjerZa(komanda);

  let struja = 0;
  if (smjer !== 0) struja = (smjer * vPogon * udio - E) / MOTOR.otpor;
  else if (koci(komanda)) struja = (-E / MOTOR.otpor) * udio;

  let brzina = sljedecaBrzina(st.brzina, struja, dt);
  if (smjer === 0 && Math.abs(brzina) < 0.3) brzina = 0;

  /* Faza PWM-a: most je uključen prvi dio svake periode. */
  const faza = (t * PWM_USPORENO_HZ) % 1;
  const pwmUkljucen = !cip || st.popuna >= 0.999 || (st.popuna > 0 && faza < st.popuna);
  const sklopke = cip ? prekidaciZaL298N(st.in1, st.in2, pwmUkljucen && st.popuna > 0) : st.prekidaci;
  const trenutni = rezimZa(sklopke);

  /* Induktivnost namotaja: struja raste dok je most uključen, pada dok je isključen. */
  let strujaTrenutna = struja;
  if (cip && smjer !== 0 && st.popuna > 0 && st.popuna < 0.999) {
    const A = Math.min(0.55, 0.9 * (vPogon / MOTOR.otpor) * st.popuna * (1 - st.popuna)) * smjer;
    strujaTrenutna = pwmUkljucen
      ? struja - A / 2 + A * (faza / st.popuna)
      : struja + A / 2 - A * ((faza - st.popuna) / (1 - st.popuna));
  }

  const smjerTrenutno = smjerZa(trenutni);
  let naponTrenutni: number;
  if (smjerTrenutno !== 0) naponTrenutni = smjerTrenutno * vPogon;
  else if (trenutni === 'nista') naponTrenutni = E;
  else naponTrenutni = 0;

  let naponSrednji: number;
  if (!cip) naponSrednji = naponTrenutni;
  else if (smjer !== 0) naponSrednji = st.popuna * smjer * vPogon + (1 - st.popuna) * E;
  else if (koci(komanda)) naponSrednji = (1 - st.popuna) * E;
  else naponSrednji = E;

  let prekidaci = st.prekidaci;
  let kvar = st.kvar;
  let zastitaDo = st.zastitaDo;
  if (kvar && t - kvar.t0 > TRAJANJE_KVARA) {
    prekidaci =
      kvar.noga === 'lijeva' ? { ...prekidaci, s1: false, s3: false } : { ...prekidaci, s2: false, s4: false };
    kvar = null;
    zastitaDo = t + TRAJANJE_ZASTITE;
  }

  return {
    stanje: { ...st, t, brzina, struja, prekidaci, kvar, zastitaDo },
    trenutno: {
      komanda,
      trenutni,
      sklopke,
      strujaTrenutna,
      naponTrenutni,
      naponSrednji,
      kontraNapon: E,
      pwmUkljucen,
      kratak: trenutni === 'kratakSpoj',
    },
  };
}

/* ---------------------------------------------------------------- poruke */

export type Poruka = { sta: string; zasto: string; greska?: boolean };

/** Dvije rečenice ispod šeme: šta se upravo dešava i zašto. */
export function porukaZa(st: StanjeHMosta, tr: TrenutnoHMosta): Poruka {
  const c = tr.komanda;
  const w = Math.abs(st.brzina);

  if (st.rezim === 'prekidaci') {
    if (c === 'kratakSpoj') {
      const par = kratkaNoga(st.prekidaci) === 'lijeva' ? 'S1 i S3' : 'S2 i S4';
      return {
        sta: `Kratak spoj! ${par} spajaju plus direktno sa masom, a struja zaobilazi motor.`,
        zasto: 'Pravi drajver ovo nikad ne smije dozvoliti. Za trenutak će zaštita otvoriti prekidače.',
        greska: true,
      };
    }
    if (c === 'naprijed' || c === 'nazad') {
      const sta =
        c === 'naprijed'
          ? 'S1 i S4 su zatvoreni: struja ide kroz motor s lijeva na desno i točak se vrti naprijed.'
          : 'S2 i S3 su zatvoreni: struja ide kroz motor s desna na lijevo. Isti motor, obrnut smjer.';
      const zasto =
        w < 0.55 * MOTOR.bezOpterecenja && Math.abs(st.struja) > 0.9
          ? 'Šiljak struje na startu: motor koji miruje ne proizvodi kontra-napon, pa struju ograničava samo otpor namotaja.'
          : 'Kako se točak vrti brže, motor proizvodi kontra-napon, pa struja pada na onoliko koliko treba za savladavanje trenja.';
      return { sta, zasto };
    }
    if (koci(c)) {
      if (w > 3) {
        return {
          sta: 'Oba kraja motora su spojena zajedno. Motor koji se vrti postaje generator, a ta struja ga koči.',
          zasto: 'Uporedi: ovako se točak zaustavi mnogo brže nego kad samo otvoriš kolo.',
        };
      }
      return {
        sta: 'Oba kraja motora su na istom naponu, pa kroz motor ne teče struja.',
        zasto: 'Kad se motor vrti, ovaj spoj ga koči. Probaj: pokreni ga, pa zatvori S1 i S2.',
      };
    }
    if (st.t < st.zastitaDo) {
      return {
        sta: 'Zaštita je otvorila prekidače.',
        zasto: 'Bez zaštite bi tranzistori na toj strani pregorjeli za djelić sekunde.',
      };
    }
    if (zatvorenih(st.prekidaci) === 1) {
      return {
        sta: 'Jedan zatvoren prekidač nije dovoljan: struja nema zatvoren put od plusa do mase.',
        zasto:
          w > 3
            ? 'Točak se i dalje zaustavlja sam, od trenja.'
            : 'Treba ti zatvoren put: gore na jednoj strani, dolje na drugoj.',
      };
    }
    if (w > 3) {
      return {
        sta: 'Kolo je otvoreno. Nema struje, a točak se zaustavlja sam, od trenja.',
        zasto: 'Napon na motoru ipak nije nula: motor koji se vrti je generator. Pogledaj CH1.',
      };
    }
    return {
      sta: 'Zatvori dva prekidača i gledaj kuda teče struja.',
      zasto: 'Dodirni prekidač da ga zatvoriš. Na tastaturi: 1, 2, 3 i 4.',
    };
  }

  const posto = Math.round(st.popuna * 100);
  if (st.popuna === 0) {
    return {
      sta: 'EN = 0: čip drži sve prekidače otvorene i motor slobodno staje.',
      zasto: 'Povuci klizač EN. On određuje koliki dio vremena je most uključen.',
    };
  }
  if (c === 'naprijed' || c === 'nazad') {
    const prosjek = broj(st.popuna * (MOTOR.napajanje - MOTOR.padNaDrajveru), 1);
    return {
      sta: `IN1 = ${+st.in1}, IN2 = ${+st.in2}: čip zatvara ${c === 'naprijed' ? 'S1 i S4' : 'S2 i S3'}, a EN ih pali ${posto} % vremena. Motor u prosjeku dobija ${prosjek} V.`,
      zasto:
        st.popuna > 0.85
          ? `Čak i na 100 % motor ne dobija punih ${broj(MOTOR.napajanje, 1)} V: oko ${broj(MOTOR.padNaDrajveru, 0)} V ostaje na tranzistorima L298N i odlazi u toplotu.`
          : 'Svaki ulaz bira gornji ili donji prekidač svoje strane, nikad oba. Zato unutar čipa kratak spoj nije moguć.',
    };
  }
  return {
    sta: `IN1 = IN2 = ${+st.in1}: obje strane motora su na istom potencijalu i motor koči.`,
    zasto: 'Ovo je „brzo zaustavljanje" iz tabele. Za lagano zaustavljanje, spusti EN na nulu.',
  };
}

/* ------------------------------------------------------------ očitavanja */

export type OcitavanjaHMosta = {
  obrtaja: number;
  smjer: 'stoji' | 'naprijed' | 'nazad';
  napon: string;
  naponPod: string;
  struja: string;
  strujaPod: string;
  strujaVruca: boolean;
  kontraNapon: string;
  toplota: string;
  toplotaPod: string;
};

export function ocitavanjaZa(st: StanjeHMosta, tr: TrenutnoHMosta): OcitavanjaHMosta {
  const cip = st.rezim === 'cip';
  const obrtaja = Math.abs(st.brzina);
  const vozi = tr.komanda === 'naprijed' || tr.komanda === 'nazad';
  const toplota = cip && vozi ? MOTOR.padNaDrajveru * Math.abs(st.struja) : 0;

  return {
    obrtaja: Math.round(obrtaja),
    smjer: obrtaja < 1 ? 'stoji' : st.brzina > 0 ? 'naprijed' : 'nazad',
    napon: broj(tr.naponSrednji, 1),
    naponPod: cip && vozi ? 'srednja vrijednost' : '',
    struja: tr.kratak ? '> 20' : broj(st.struja, 2),
    strujaPod: tr.kratak
      ? 'kratak spoj, zaobilazi motor'
      : Math.abs(st.struja) > 0.95 * MOTOR.granicaL298N
        ? `blizu granice L298N (${broj(MOTOR.granicaL298N, 0)} A)`
        : '',
    strujaVruca: tr.kratak,
    kontraNapon: broj(tr.kontraNapon, 1),
    toplota: broj(toplota, 1),
    toplotaPod: cip ? `oko ${broj(MOTOR.padNaDrajveru, 0)} V pada na tranzistorima` : 'idealni prekidači',
  };
}
