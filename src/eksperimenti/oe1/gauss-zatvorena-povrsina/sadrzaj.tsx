import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Pored zatvorene površine, ali vani, stoji veliki naboj od 4 nC. Koliko on doprinosi fluksu{' '}
        <M tex="\oint \mathbf{E}\cdot d\mathbf{a}" /> kroz tu površinu?
      </>
    ),
    opcije: ['Ništa', 'Malo, jer je daleko', 'Mnogo, jer je velik', '4 nC/ε₀'],
    tacna: 0,
    objasnjenje: (
      <>
        Ništa, ma koliko bio velik i blizu. Njegovo polje uđe kroz stranu površine okrenutu ka njemu, gdje je{' '}
        <M tex="\mathbf{E}\cdot d\mathbf{a} < 0" />, i izađe kroz suprotnu, sa istim iznosom. Polje u tačkama površine on
        mijenja, ali ukupan fluks ne.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Elipsa je presjek zatvorene površine, obrtnog elipsoida. Fluks se računa po cijeloj prostornoj površini, a ne samo po
      presjeku.
    </>,
    <>
      Obod je pun gdje polje izlazi (<M tex="\mathbf{E}\cdot\mathbf{n} > 0" />) i isprekidan gdje ulazi. Podrazumijevano
      pokazuje samo polje naboja vani: strana okrenuta ka njemu je isprekidana, suprotna puna.
    </>,
    <>
      Očitavanje „Od naboja vani“ je zbir doprinosa naboja izvan površine: blizu nule, koliko god ih pomjerao. Mala razlika je
      greška brojčanog računa.
    </>,
  ],
  formula: {
    tex: String.raw`\oint_a \mathbf{E}\cdot d\mathbf{a} = \frac{Q_\mathrm{not}}{\varepsilon_0}`,
    veze: [
      { simbol: String.raw`a`, opis: 'zatvorena površina; klizači poluosa i prevlačenje središta' },
      { simbol: String.raw`d\mathbf{a}`, opis: 'gleda prema van: pun obod je pozitivan doprinos' },
      { simbol: String.raw`Q_\mathrm{not}`, opis: 'zbir naboja unutra; naboji se prevlače, klizači im mijenjaju vrijednost' },
    ],
  },
  greska: (
    <>
      Misli se da naboj vani ne utiče ni na polje na površini. Utiče, i to jako; ali ukupan fluks kroz zatvorenu površinu
      zavisi samo od <M tex="Q_\mathrm{not}" />. Zato iz Gaussa polje izlazi samo kad simetrija kaže da je ono na površini
      stalno.
    </>
  ),
};

export default sadrzaj;
