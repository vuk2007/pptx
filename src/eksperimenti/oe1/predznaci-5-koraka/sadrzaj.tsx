import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Iz tijela kroz jednu žicu izlazi 3 A, a kroz drugu ulazi 5 A. Šta se dešava sa nabojem unutra,{' '}
        <M tex="Q_\mathrm{not}" />?
      </>
    ),
    opcije: ['Raste', 'Opada', 'Ne mijenja se', 'Zavisi od toga kuda gleda normala'],
    tacna: 0,
    objasnjenje: (
      <>
        Raste, za 2 C svake sekunde. Struja van je <M tex="+3 - 5 = -2\ \mathrm{A}" />, tijelo je ponor, a{' '}
        <M tex="dQ_\mathrm{not}/dt = -i_\mathrm{van} = +2\ \mathrm{A}" />. Normala mijenja samo predznake u računu, ne i to
        šta se stvarno dešava sa nabojem.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Isprekidana elipsa je površina tijela, a ljubičaste strelice njene normale. Narandžasta strelica na žici je
      orijentacija struje: klikni na nju da je okreneš.
    </>,
    <>
      Pet koraka ispod crteža idu redom: smjer, struja van sa predznakom, izvor ili ponor, raste ili opada, pa{' '}
      <M tex="Q_\mathrm{not}(t)" />. U četvrtom prvo ti odgovaraš.
    </>,
    <>
      Dugme „Okreni normalu“ mijenja predznak u drugom koraku. Treći, četvrti i peti korak ostaju isti, jer se tijelo nije
      promijenilo, samo dogovor o tome šta je plus.
    </>,
  ],
  formula: {
    tex: String.raw`i_\mathrm{van} = \oint_a \mathbf{J}\cdot d\mathbf{a} = \sum_k (\pm)\, i_k \qquad \frac{dQ_\mathrm{not}}{dt} = -i_\mathrm{van} \qquad Q_\mathrm{not}(t) = Q_\mathrm{not}(0) - i_\mathrm{van}\,t`,
    veze: [
      { simbol: String.raw`i_k`, opis: 'klizači struja na žicama' },
      { simbol: String.raw`(\pm)`, opis: 'strelica na žici: + kad gleda iz tijela, − kad gleda u tijelo' },
      { simbol: String.raw`d\mathbf{a}`, opis: 'normala; dugme „Okreni normalu“' },
      { simbol: String.raw`Q_\mathrm{not}(t)`, opis: 'graf u petom koraku, od 10 C na početku' },
    ],
  },
  greska: (
    <>
      Predznak se veže za to da li struja „ulazi“ ili „izlazi“, umjesto za strelicu i normalu. Pravilo je jedno: plus kad
      strelica gleda u smjeru normale, a normala zatvorene površine gleda van.
    </>
  ),
};

export default sadrzaj;
