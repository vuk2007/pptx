/*
  Jarvisov put od glasa do odgovora, kao raspored u vremenu.

  Dvije trake, iste faze, ista ukupna količina posla. Razlika je samo
  u tome kad zvučnik smije da progovori:

    Čeka se sve  — govor kreće tek kad mozak smisli cijeli odgovor.
    Streaming    — govor kreće čim je gotova prva rečenica, a mozak
                   nastavlja da radi dok se ona već čuje.

  Zato je ušteda tačno onoliko koliko mozgu treba od prve rečenice do
  kraja odgovora. To je invarijanta koju provjerava skripta.
*/

export type Vremena = {
  /** Koliko treba da prepozna riječ „Jarvis". */
  budjenje: number;
  /** Koliko treba da tvoj glas pretvori u tekst. */
  glasUTekst: number;
  /** Koliko mozgu treba do prve rečenice. */
  mozakPrvaRijec: number;
  /** Koliko mozgu treba do cijelog odgovora. */
  mozakCijelo: number;
  /** Koliko treba da tekst pretvori u glas. */
  tekstUGlas: number;
};

/** Gdje se faza izvršava. null znači da to nije provjereno, pa se ništa ne tvrdi. */
export type Gdje = 'lokalno' | 'oblak' | null;

export type Faza = {
  id: string;
  naziv: string;
  pocetak: number;
  kraj: number;
  /** Boja iz petlje osjeti-odluči-djeluj. */
  boja: 'osjeti' | 'odluci' | 'djeluj';
  /** Faza koja radi u pozadini dok se nešto drugo već dešava. */
  upozadini?: boolean;
};

export type Traka = {
  id: 'cekanje' | 'streaming';
  naziv: string;
  faze: Faza[];
  /** Trenutak kad se iz zvučnika čuje prva riječ. */
  prviZvuk: number;
  /** Trenutak kad mozak završi cio odgovor. */
  mozakGotov: number;
};

export type Raspored = {
  cekanje: Traka;
  streaming: Traka;
  /** Koliko sekundi ranije streaming progovori. */
  ustedjeno: number;
  /** Dokle ide vremenska osa. */
  ukupno: number;
};

export function napraviRaspored(v: Vremena): Raspored {
  const kraj = {
    budjenje: v.budjenje,
    glasUTekst: v.budjenje + v.glasUTekst,
  };

  /* --- Čeka se sve: sve u nizu, ništa se ne preklapa. --- */
  const cekanjeMozakKraj = kraj.glasUTekst + v.mozakCijelo;
  const cekanjePrviZvuk = cekanjeMozakKraj + v.tekstUGlas;

  const cekanje: Traka = {
    id: 'cekanje',
    naziv: 'Čeka se sve',
    faze: [
      { id: 'budjenje', naziv: 'budi se', pocetak: 0, kraj: kraj.budjenje, boja: 'osjeti' },
      { id: 'glas-u-tekst', naziv: 'glas → tekst', pocetak: kraj.budjenje, kraj: kraj.glasUTekst, boja: 'osjeti' },
      { id: 'mozak', naziv: 'mozak piše cio odgovor', pocetak: kraj.glasUTekst, kraj: cekanjeMozakKraj, boja: 'odluci' },
      { id: 'tekst-u-glas', naziv: 'tekst → glas', pocetak: cekanjeMozakKraj, kraj: cekanjePrviZvuk, boja: 'djeluj' },
    ],
    prviZvuk: cekanjePrviZvuk,
    mozakGotov: cekanjeMozakKraj,
  };

  /* --- Streaming: govor kreće poslije prve rečenice. --- */
  const prvaRijecGotova = kraj.glasUTekst + v.mozakPrvaRijec;
  const streamingMozakKraj = kraj.glasUTekst + v.mozakCijelo;
  const streamingPrviZvuk = prvaRijecGotova + v.tekstUGlas;

  const streaming: Traka = {
    id: 'streaming',
    naziv: 'Streaming',
    faze: [
      { id: 'budjenje', naziv: 'budi se', pocetak: 0, kraj: kraj.budjenje, boja: 'osjeti' },
      { id: 'glas-u-tekst', naziv: 'glas → tekst', pocetak: kraj.budjenje, kraj: kraj.glasUTekst, boja: 'osjeti' },
      { id: 'mozak', naziv: 'prva rečenica', pocetak: kraj.glasUTekst, kraj: prvaRijecGotova, boja: 'odluci' },
      {
        id: 'mozak-ostatak',
        naziv: 'mozak piše dalje',
        pocetak: prvaRijecGotova,
        kraj: streamingMozakKraj,
        boja: 'odluci',
        upozadini: true,
      },
      { id: 'tekst-u-glas', naziv: 'tekst → glas', pocetak: prvaRijecGotova, kraj: streamingPrviZvuk, boja: 'djeluj' },
    ],
    prviZvuk: streamingPrviZvuk,
    mozakGotov: streamingMozakKraj,
  };

  return {
    cekanje,
    streaming,
    ustedjeno: cekanjePrviZvuk - streamingPrviZvuk,
    ukupno: Math.max(cekanjePrviZvuk, streamingMozakKraj),
  };
}

/** Faza koja u datom trenutku radi. Pozadinske se preskaču — vodi ona glavna. */
export function fazaU(traka: Traka, t: number): Faza | null {
  const glavne = traka.faze.filter((f) => !f.upozadini);
  return glavne.find((f) => t >= f.pocetak && t < f.kraj) ?? null;
}

/** Sekunde u milisekunde za ekran, cijeli broj. */
export function ms(s: number): string {
  return `${Math.round(s * 1000)} ms`;
}

const OPIS_FAZE: Record<string, string> = {
  budjenje: 'Prvi program čeka samo riječ „Jarvis”.',
  'glas-u-tekst': 'Tvoj glas se pretvara u tekst.',
  mozak: 'Mozak piše odgovor, a streaming čeka samo prvu rečenicu.',
  'tekst-u-glas': 'Prva rečenica se pretvara nazad u glas.',
};

export type PorukaPipelinea = { sta: string; zasto: string };

/** Dvije linije ispod crteža: šta se sada dešava i zašto. `t` je vrijeme od početka, s; null znači da nije pokrenuto. */
export function porukaPipelinea(r: Raspored, t: number | null): PorukaPipelinea {
  if (t === null) {
    return {
      sta: 'Obje trake rade isti posao; razlika je samo kad zvučnik smije da progovori.',
      zasto: 'Pritisni Pokreni i gledaj kad se u kojoj traci čuje prva riječ.',
    };
  }
  if (t >= r.cekanje.prviZvuk) {
    return {
      sta: `Streaming je progovorio ${ms(r.ustedjeno)} ranije, a mozak je u obje trake radio isto.`,
      zasto: 'Ušteda je tačno vrijeme koje mozgu treba od prve rečenice do kraja odgovora.',
    };
  }
  if (t >= r.streaming.prviZvuk) {
    return {
      sta: 'Streaming već govori, a mozak još piše ostatak odgovora.',
      zasto: 'U gornjoj traci zvučnik i dalje ćuti, jer čeka cio odgovor.',
    };
  }
  const faza = fazaU(r.streaming, t);
  return {
    sta: faza ? (OPIS_FAZE[faza.id] ?? faza.naziv) : OPIS_FAZE.budjenje,
    zasto: 'Streaming ne čeka cio odgovor: govor kreće čim je gotova prva rečenica.',
  };
}
