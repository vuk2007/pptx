import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Naboj <M tex="Q_1 = 2\ \mathrm{nC}" /> i naboj <M tex="Q_2 = 8\ \mathrm{nC}" /> stoje na nekom rastojanju. Na koji naboj
        djeluje veća sila?
      </>
    ),
    opcije: ['Iste su po iznosu', 'Na Q₁, jer je manji', 'Na Q₂, jer je veći', 'Zavisi od rastojanja'],
    tacna: 0,
    objasnjenje: (
      <>
        Iste su po iznosu. U <M tex="F = Q_1 Q_2 / (4\pi\varepsilon_0 R^2)" /> oba naboja ulaze isto, pa ne postoji „sila
        većeg“ i „sila manjeg“ naboja. Smjerovi su suprotni: <M tex="\mathbf{F}_1 + \mathbf{F}_2 = 0" />. Manji naboj se samo
        lakše pomjeri ako mu je i masa manja.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>Krugovi su naboji u boji predznaka; prevuci ih po crtežu. Isprekidana linija je rastojanje R.</>,
    <>
      Strelice <M tex="\mathbf{F}_1" /> i <M tex="\mathbf{F}_2" /> su sile na svaki naboj, u istoj razmjeri. Isti predznaci se
      odbijaju, suprotni privlače, a strelice su uvijek jednako duge i suprotne.
    </>,
    <>
      Graf ispod je <M tex="|F|" /> u zavisnosti od <M tex="R" /> za ova dva naboja, a tačka je trenutno rastojanje.
      Očitavanje „Sila puta R²“ se ne mijenja dok prevlačiš: to je zakon <M tex="1/R^2" />.
    </>,
  ],
  formula: {
    tex: String.raw`\mathbf{F}_2 = \frac{Q_1 Q_2}{4\pi\varepsilon_0 R^2}\,\frac{\mathbf{R}}{R} \qquad \mathbf{R} = T_2 - T_1 \qquad \mathbf{F}_1 = -\mathbf{F}_2`,
    veze: [
      { simbol: String.raw`Q_1, Q_2`, opis: 'klizači naboja, sa predznakom' },
      { simbol: String.raw`\mathbf{R}`, opis: 'isprekidana linija: od Q₁ ka Q₂, pa je F₂ u smjeru R kad se odbijaju' },
      { simbol: String.raw`R`, opis: 'očitavanje rastojanja; mijenja se prevlačenjem' },
      { simbol: String.raw`\mathbf{F}_1 + \mathbf{F}_2`, opis: 'očitavanje zbira sila: uvijek nula' },
    ],
  },
  greska: (
    <>
      Misli se da veći naboj „jače vuče“, pa da na manji naboj djeluje veća sila. Sile su jednake po iznosu; predznak{' '}
      <M tex="Q_1 Q_2" /> određuje samo da li se odbijaju ili privlače.
    </>
  ),
};

export default sadrzaj;
