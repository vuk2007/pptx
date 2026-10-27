import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Duž je već mnogo duža od rastojanja <M tex="\rho" /> do tačke <M tex="T" />. Produžiš je još deset puta, sa istim{' '}
        <M tex="q" />. Šta se desi sa poljem u <M tex="T" />?
      </>
    ),
    opcije: ['Skoro se ne promijeni', 'Poraste deset puta', 'Opadne', 'Postane beskonačno'],
    tacna: 0,
    objasnjenje: (
      <>
        Skoro se ne promijeni. Novi komadi su daleko od <M tex="T" /> i vide se jako koso: polje im opada sa kvadratom
        rastojanja, a i od toga u smjeru <M tex="\rho" /> ostaje samo mali dio. Zato polje stane na{' '}
        <M tex="q/(2\pi\varepsilon_0\rho)" /> i ne raste dalje.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Uspravna duž ima naboj <M tex="q" /> po dužini; tačke na njoj su 16 komada od kojih se crtaju doprinosi. Kad je duž
      duža od crteža, nastavlja se van njega.
    </>,
    <>
      Iz <M tex="T" /> izlaze sive linije: doprinos svakog komada (uvećano 2,5 puta). Uspravni dijelovi se poništavaju u
      parovima, kao kod prstena, pa zbir gleda vodoravno.
    </>,
    <>
      Zelena strelica je polje duži, a isprekidana linija iznad nje polje beskonačne prave. Graf desno pokazuje kako se
      odnos primiče 1 dok <M tex="l" /> raste.
    </>,
  ],
  formula: {
    tex: String.raw`E = \frac{q}{2\pi\varepsilon_0\rho}\,\frac{l}{\sqrt{l^2 + \rho^2}} \qquad \lim_{l \to \infty} E = \frac{q}{2\pi\varepsilon_0\rho}`,
    veze: [
      { simbol: String.raw`l`, opis: 'klizač pola dužine, od 1 cm do 10 m, po logaritamskoj skali' },
      { simbol: String.raw`\rho`, opis: 'klizač rastojanja tačke T od duži' },
      { simbol: String.raw`q`, opis: 'naboj po dužini, stalno 10 nC/m' },
      { simbol: String.raw`\frac{l}{\sqrt{l^2+\rho^2}}`, opis: 'očitavanje „Duž / prava“ i kriva na grafu' },
    ],
  },
  greska: (
    <>
      Polje prave se piše sa <M tex="4\pi\varepsilon_0" /> kao kod tačke. Kod prave stoji <M tex="2\pi\varepsilon_0" />, i
      opada sa <M tex="1/\rho" />, ne sa <M tex="1/\rho^2" />.
    </>
  ),
};

export default sadrzaj;
