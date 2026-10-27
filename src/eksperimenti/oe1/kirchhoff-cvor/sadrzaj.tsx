import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Kroz žicu 1 teče 4 A u čvor, kroz žicu 2 teče 1 A u čvor, a strelica žice 3 gleda iz čvora. Koliko mora biti{' '}
        <M tex="i_3" /> da se naboj u čvoru ne mijenja?
      </>
    ),
    opcije: ['3 A', '4 A', '5 A', '−5 A'],
    tacna: 2,
    objasnjenje: (
      <>
        5 A. Sa strelicom iz čvora <M tex="i_3" /> ulazi u zbir sa plusom: <M tex="-4 - 1 + i_3 = 0" />, pa je{' '}
        <M tex="i_3 = 5\ \mathrm{A}" />. Da je strelica žice 3 okrenuta u čvor, ista stvarnost bi se zapisala kao{' '}
        <M tex="i_3 = -5\ \mathrm{A}" />.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>Siva strelica uz žicu je orijentacija: dogovoreni smjer, od kojeg zavisi predznak u zbiru.</>,
    <>Tačkice koje teku pokazuju stvarni smjer pozitivnog naboja. Kad je struja negativna, teku suprotno od strelice.</>,
    <>
      Isprekidani krug je zatvorena površina oko čvora. Krug u sredini je naboj nagomilan u čvoru: raste i dobija boju
      predznaka kad ulaz i izlaz nisu jednaki.
    </>,
  ],
  formula: {
    tex: String.raw`\sum_k (\pm)\, i_k = 0 \qquad \frac{dQ_\mathrm{not}}{dt} = -\sum_k (\pm)\, i_k`,
    veze: [
      { simbol: String.raw`i_1, i_2, i_3`, opis: 'klizači struja, sa predznakom' },
      { simbol: String.raw`(\pm)`, opis: 'dugme strelice: + kad gleda iz čvora, − kad gleda u čvor' },
      { simbol: String.raw`Q_\mathrm{not}`, opis: 'naboj u čvoru, unutar isprekidane površine' },
    ],
  },
  greska: (
    <>
      Predznak se uzima iz strelice, ne iz toga kuda struja „stvarno“ ide: <M tex="-3\ \mathrm{A}" /> sa strelicom iz čvora
      isto je što i <M tex="3\ \mathrm{A}" /> u čvor, i u zbir ulazi kao <M tex="-3" />.
    </>
  ),
};

export default sadrzaj;
