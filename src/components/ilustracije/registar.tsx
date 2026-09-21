import type { ReactNode } from 'react';
import { IlustracijaPetlja, IlustracijaPetljaSiroka, IlustracijaZatvaranje } from './uvod';
import {
  IlustracijaJarvisBudjenje,
  IlustracijaJarvisGlasUTekst,
  IlustracijaJarvisKoJe,
  IlustracijaJarvisMozak,
  IlustracijaJarvisStreaming,
  IlustracijaJarvisTalasi,
  IlustracijaJarvisTekstUGlas,
} from './jarvis';
import {
  IlustracijaXgoImu,
  IlustracijaXgoKomanda,
  IlustracijaXgoMotori,
  IlustracijaXgoPas,
  IlustracijaXgoPetlja,
  IlustracijaXgoSvugdje,
} from './xgo';
import {
  IlustracijaPerjanikArduino,
  IlustracijaPerjanikFailsafe,
  IlustracijaPerjanikRadio,
  IlustracijaPerjanikRover,
  IlustracijaPerjanikStampa,
  IlustracijaPerjanikSuspenzija,
} from './perjanik';

/*
  Skoro sve ilustracije dijele isti koordinatni sistem 1000x620, pa se slajdovi
  crtaju u istoj razmjeri. Izuzetak je široka petlja za početnu stranu, gdje
  crtežu pripada traka preko cijele širine.
*/
const PODRAZUMIJEVANA = { sirina: 1000, visina: 620 };

type Unos = { crtez: () => ReactNode; sirina?: number; visina?: number };

const REGISTAR: Record<string, Unos> = {
  petlja: { crtez: IlustracijaPetlja },
  'petlja-siroka': { crtez: IlustracijaPetljaSiroka, visina: 360 },
  zatvaranje: { crtez: IlustracijaZatvaranje },

  'jarvis-ko-je': { crtez: IlustracijaJarvisKoJe },
  'jarvis-talasi': { crtez: IlustracijaJarvisTalasi },
  'jarvis-budjenje': { crtez: IlustracijaJarvisBudjenje },
  'jarvis-glas-u-tekst': { crtez: IlustracijaJarvisGlasUTekst },
  'jarvis-mozak': { crtez: IlustracijaJarvisMozak },
  'jarvis-tekst-u-glas': { crtez: IlustracijaJarvisTekstUGlas },
  'jarvis-streaming': { crtez: IlustracijaJarvisStreaming },

  'xgo-pas': { crtez: IlustracijaXgoPas },
  'xgo-imu': { crtez: IlustracijaXgoImu },
  'xgo-petlja': { crtez: IlustracijaXgoPetlja },
  'xgo-svugdje': { crtez: IlustracijaXgoSvugdje },
  'xgo-motori': { crtez: IlustracijaXgoMotori },
  'xgo-komanda': { crtez: IlustracijaXgoKomanda },

  'perjanik-rover': { crtez: IlustracijaPerjanikRover },
  'perjanik-stampa': { crtez: IlustracijaPerjanikStampa },
  'perjanik-suspenzija': { crtez: IlustracijaPerjanikSuspenzija },
  'perjanik-arduino': { crtez: IlustracijaPerjanikArduino },
  'perjanik-radio': { crtez: IlustracijaPerjanikRadio },
  'perjanik-failsafe': { crtez: IlustracijaPerjanikFailsafe },
};

/** Crta ilustraciju po ključu iz sadržaja slajda. */
export function Ilustracija({ kljuc }: { kljuc: string }) {
  const unos = REGISTAR[kljuc];
  if (!unos) throw new Error(`Nepoznata ilustracija: ${kljuc}`);

  const Crtez = unos.crtez;
  const sirina = unos.sirina ?? PODRAZUMIJEVANA.sirina;
  const visina = unos.visina ?? PODRAZUMIJEVANA.visina;

  return (
    <svg
      viewBox={`0 0 ${sirina} ${visina}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Crtez />
    </svg>
  );
}

export const KLJUCEVI_ILUSTRACIJA = Object.keys(REGISTAR);
