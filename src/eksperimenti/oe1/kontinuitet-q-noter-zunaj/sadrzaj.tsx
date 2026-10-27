import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Pozitivan naboj izlazi iz zatvorene površine, a normala gleda prema van. Kakva je struja van{' '}
        <M tex="\oint \mathbf{J}\cdot d\mathbf{a}" /> i šta se dešava sa <M tex="Q_\mathrm{not}" />?
      </>
    ),
    opcije: [
      <>
        Pozitivna, a <M tex="Q_\mathrm{not}" /> opada
      </>,
      <>
        Pozitivna, a <M tex="Q_\mathrm{not}" /> raste
      </>,
      <>
        Negativna, a <M tex="Q_\mathrm{not}" /> opada
      </>,
      'Nula, jer naboj ne nestaje',
    ],
    tacna: 0,
    objasnjenje: (
      <>
        Pozitivna, a <M tex="Q_\mathrm{not}" /> opada. Izlazak je struja u smjeru normale, pa je pozitivna; naboj koji izađe
        više nije unutra. Zato u jednačini stoji minus: <M tex="\oint \mathbf{J}\cdot d\mathbf{a} = -dQ_\mathrm{not}/dt" />.
        Ukupan naboj se ne mijenja, samo prelazi iz <M tex="Q_\mathrm{not}" /> u <M tex="Q_\mathrm{zun}" />.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Isprekidani krug je zatvorena površina, gledana u presjeku. Puna tačka je naboj unutra (<M tex="Q_\mathrm{not}" />),
      prazan kružić naboj vani (<M tex="Q_\mathrm{zun}" />); svaka tačka je 1 nC pozitivnog naboja.
    </>,
    <>Ljubičaste strelice su normale. Po dogovoru gledaju prema van; dugme ih okreće da se vidi šta se tada mijenja.</>,
    <>
      Struja van broji svaki prelaz preko površine: izlazak sa plusom, ulazak sa minusom. Ispod crteža je isti broj
      izračunat kao <M tex="-dQ_\mathrm{not}/dt" />, i dva broja se slažu jer se naboj samo premješta.
    </>,
    <>Otvorena ravan nema unutra ni vani. Kroz nju postoji struja, ali nema naboja koji bi rastao ili opadao.</>,
  ],
  formula: {
    tex: String.raw`\oint_a \mathbf{J}\cdot d\mathbf{a} = -\frac{dQ_\mathrm{not}}{dt} \qquad Q_\mathrm{not} + Q_\mathrm{zun} = \text{konst.}`,
    veze: [
      { simbol: String.raw`\oint_a \mathbf{J}\cdot d\mathbf{a}`, opis: 'očitavanje „Struja van“: izlasci minus ulasci, u sekundi' },
      { simbol: String.raw`Q_\mathrm{not}`, opis: 'pune tačke, unutra' },
      { simbol: String.raw`Q_\mathrm{zun}`, opis: 'prazni kružići, vani' },
      { simbol: String.raw`d\mathbf{a}`, opis: 'normala; dugme „Okreni normalu“ joj mijenja smjer' },
    ],
  },
  greska: (
    <>
      Minus se izgubi. Struja van je pozitivna baš kad <M tex="Q_\mathrm{not}" /> opada; jednačina bez minusa važi samo kad
      normala gleda unutra, a to je protiv dogovora.
    </>
  ),
};

export default sadrzaj;
