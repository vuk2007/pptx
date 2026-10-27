import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        <M tex="\mathbf{w}" /> gleda udesno, <M tex="\mathbf{B}" /> u dubinu, oba u vodoravnoj ravni. Kuda gleda{' '}
        <M tex="\mathbf{B}\times\mathbf{w}" />?
      </>
    ),
    opcije: ['Naniže', 'Naviše', 'Udesno', 'Isto kao w × B'],
    tacna: 0,
    objasnjenje: (
      <>
        Naniže. Po pravilu desne ruke <M tex="\mathbf{w}\times\mathbf{B}" /> gleda naviše (kao <M tex="x \times y = z" />), a
        zamjena redoslijeda okreće smjer: <M tex="\mathbf{B}\times\mathbf{w} = -(\mathbf{w}\times\mathbf{B})" />.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Plava strelica je brzina <M tex="\mathbf{w}" />, ljubičasta indukcija <M tex="\mathbf{B}" />; obje leže u vodoravnoj
      ravni, nacrtanoj ukoso.
    </>,
    <>
      Crna strelica je proizvod, okomit na tu ravan. Osjenčeni paralelogram ima površinu <M tex="|\mathbf{w}\times\mathbf{B}|" />:
      najveći je kad su vektori okomiti, nula kad su paralelni.
    </>,
    <>
      Dugme „B × w“ okreće redoslijed, a „Negativan naboj“ predznak naboja: oba okreću silu{' '}
      <M tex="\mathbf{F} = Q(\mathbf{w}\times\mathbf{B})" /> na suprotnu stranu.
    </>,
  ],
  formula: {
    tex: String.raw`|\mathbf{w}\times\mathbf{B}| = w\,B\sin\alpha \qquad \mathbf{B}\times\mathbf{w} = -(\mathbf{w}\times\mathbf{B}) \qquad \mathbf{F} = Q(\mathbf{w}\times\mathbf{B})`,
    veze: [
      { simbol: String.raw`\mathbf{w}`, opis: 'klizači iznosa i smjera brzine' },
      { simbol: String.raw`\mathbf{B}`, opis: 'klizači iznosa i smjera indukcije' },
      { simbol: String.raw`\alpha`, opis: 'ugao između w i B; očitavanje' },
      { simbol: String.raw`Q`, opis: 'dugme „Negativan naboj“' },
    ],
  },
  greska: (
    <>
      U Lorentzovoj sili se napiše <M tex="\mathbf{B}\times\mathbf{w}" />. Redoslijed je <M tex="\mathbf{w}" /> pa{' '}
      <M tex="\mathbf{B}" />; obrnut daje silu tačno na suprotnu stranu, a za elektron se smjer okreće još jednom.
    </>
  ),
};

export default sadrzaj;
