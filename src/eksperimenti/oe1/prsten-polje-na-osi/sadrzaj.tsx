import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: <>Gdje na osi nabijenog prstena je polje najjače?</>,
    opcije: ['U centru prstena', 'Na nekoj udaljenosti od centra', 'Što dalje, to jače', 'Svuda je isto'],
    tacna: 1,
    objasnjenje: (
      <>
        Na udaljenosti <M tex="z = a/\sqrt{2}" />. U centru je nula, jer svaki komad ima par sa suprotne strane, a duž ose nema
        komponente. Daleko opada kao <M tex="1/z^2" />. Između ta dva kraja mora postojati najjača tačka.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Prsten je podijeljen na <M tex="n" /> komada, svaki sa <M tex="Q/n" />. Prsten leži u ravni okomitoj na osu, nacrtan
      ukoso, pa izgleda kao uska elipsa.
    </>,
    <>
      Iz tačke <M tex="T" /> izlazi <M tex="d\mathbf{E}" /> svakog komada. Istaknuti par suprotnih komada ima poprečne dijelove
      (isprekidano) koji gledaju na suprotne strane, pa se poništavaju.
    </>,
    <>
      Zelena strelica je zbir. Za <M tex="n \ge 2" /> uvijek leži na osi, i ne zavisi od <M tex="n" />: svaki komad daje istu
      komponentu duž ose.
    </>,
    <>
      Graf ispod je <M tex="E_z(z)" />; isprekidano je polje tačkastog naboja <M tex="Q" /> u centru. Daleko se krive
      poklapaju, a blizu prstena ne.
    </>,
  ],
  formula: {
    tex: String.raw`d\mathbf{E} = \frac{dQ}{4\pi\varepsilon_0 R^2}\,\frac{\mathbf{R}}{R} \qquad E_z = \frac{Q\,z}{4\pi\varepsilon_0\,(a^2 + z^2)^{3/2}} \qquad E_z \approx \frac{Q}{4\pi\varepsilon_0 z^2}\ \ (z \gg a)`,
    veze: [
      { simbol: String.raw`z`, opis: 'klizač položaja tačke T na osi' },
      { simbol: String.raw`a`, opis: 'klizač poluprečnika prstena' },
      { simbol: String.raw`dQ`, opis: 'Q/n: klizač broja komada n; Q = 10 nC' },
      { simbol: String.raw`\mathbf{R}`, opis: 'tanke linije od svakog komada T′ do tačke T' },
    ],
  },
  greska: (
    <>
      Integrali se iznos <M tex="dE" /> umjesto komponente duž ose. Poprečni dijelovi se poništavaju, pa se sabira samo{' '}
      <M tex="dE_z = dE \cdot z/R" />; bez faktora <M tex="z/R" /> ispadne da polje u centru nije nula.
    </>
  ),
};

export default sadrzaj;
