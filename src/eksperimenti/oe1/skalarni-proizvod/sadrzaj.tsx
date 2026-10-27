import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Sila od 5 N djeluje pod uglom od 120° prema pomaku od 2 m. Koliko je <M tex="\mathbf{F}\cdot\mathbf{s}" />?
      </>
    ),
    opcije: ['−5 J', '5 J', '10 J', '0 J'],
    tacna: 0,
    objasnjenje: (
      <>
        −5 J: <M tex="5 \cdot 2 \cdot \cos 120^\circ = 10 \cdot (-0{,}5)" />. Preko 90° projekcija sile gleda suprotno od
        pomaka, pa je proizvod negativan. Skalarni proizvod nije „proizvod dužina“, nego dužina puta projekcija.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>Siva strelica je pomak <M tex="\mathbf{s}" />, crna sila <M tex="\mathbf{F}" />. Vrhove možeš prevlačiti.</>,
    <>
      Isprekidana linija spušta vrh sile okomito na pravac pomaka. Debela duž na pravcu je projekcija <M tex="F\cos\alpha" />,
      isprekidana kad je negativna.
    </>,
    <>
      <M tex="\mathbf{F}\cdot\mathbf{s}" /> je ta projekcija puta <M tex="s" />. Isti broj daje i zbir proizvoda komponenti,
      bez ijednog ugla.
    </>,
  ],
  formula: {
    tex: String.raw`\mathbf{F}\cdot\mathbf{s} = F\,s\cos\alpha = F_x s_x + F_y s_y + F_z s_z`,
    veze: [
      { simbol: String.raw`\mathbf{F}, \mathbf{s}`, opis: 'strelice; vrhovi se prevlače' },
      { simbol: String.raw`\alpha`, opis: 'luk između strelica; očitavanje ugla' },
      { simbol: String.raw`F\cos\alpha`, opis: 'debela duž na pravcu pomaka' },
    ],
  },
  greska: (
    <>
      Ugao se uzme do 90° i rezultat je uvijek pozitivan. <M tex="\alpha" /> ide od 0° do 180°, a preko 90° skalarni proizvod
      je negativan: zato je fluks kroz stranu gdje polje ulazi negativan.
    </>
  ),
};

export default sadrzaj;
