import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Ploču stanjiš deset puta, a naboj na njoj ostane isti. Šta se desi sa površinskom gustinom <M tex="\sigma" />?
      </>
    ),
    opcije: ['Ostane ista', 'Poraste deset puta', 'Opadne deset puta', 'Postane nula'],
    tacna: 0,
    objasnjenje: (
      <>
        Ostane ista. <M tex="\sigma" /> je naboj po površini ploče, a površina se nije promijenila. Deset puta poraste{' '}
        <M tex="\rho" />, jer je isti naboj u deset puta manjoj zapremini; zato se za tanku ploču računa sa{' '}
        <M tex="\sigma = \rho\,c" />, koja ostaje konačna i kad <M tex="\rho" /> više nije.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Isti kvadar sa istim nabojem <M tex="Q" />, stanjen u ploču, žicu ili tačku. Što je tijelo tamnije, to je{' '}
      <M tex="\rho" /> veće. Tanke ivice su nacrtane deblje nego što jesu; prave dimenzije su u kotama.
    </>,
    <>
      Istaknuti komadić je element: <M tex="dv" /> u zapremini, <M tex="da" /> na ploči, <M tex="dl" /> na žici. Naboj
      elementa je <M tex="dQ = \rho\,dv" />, <M tex="\sigma\,da" /> ili <M tex="q\,dl" />.
    </>,
    <>
      Tačka je „debela tačka“: tijelo koje je veliko u odnosu na atome, a malo u odnosu na udaljenost sa koje ga gledamo.
      Od njegovog rasporeda ostaje samo <M tex="Q" />.
    </>,
    <>
      U režimu „Od atoma do kontinuuma“ prozor broji pojedinačne naboje. Za mali prozor procjena gustine skače, a za veliki
      se smiri oko prosjeka: tek tada ima smisla govoriti o gustini.
    </>,
  ],
  formula: {
    tex: String.raw`dQ = \rho\,dv = \sigma\,da = q\,dl \qquad \sigma = \rho\,c \qquad q = \rho\,b\,c \qquad Q = \int_v \rho\,dv`,
    veze: [
      { simbol: String.raw`\rho`, opis: 'zapremina: naboj po cm³' },
      { simbol: String.raw`\sigma`, opis: 'ploča: naboj po cm² velike strane' },
      { simbol: String.raw`q`, opis: 'žica: naboj po cm dužine' },
      { simbol: String.raw`c,\ b\,c`, opis: 'klizač stanjivanja: debljina ploče, presjek žice' },
      { simbol: String.raw`Q`, opis: 'klizač naboja; isti u sva četiri oblika' },
    ],
  },
  greska: (
    <>
      Površinska gustina se piše <M tex="\sigma" /> (sigma), a ne <M tex="\delta" />. Delta u ovom kursu znači mali konačan
      komadić, kao <M tex="\delta a" /> ili <M tex="\delta t" />, pa <M tex="\delta" /> umjesto <M tex="\sigma" /> pretvori
      gustinu u komadić.
    </>
  ),
};

export default sadrzaj;
