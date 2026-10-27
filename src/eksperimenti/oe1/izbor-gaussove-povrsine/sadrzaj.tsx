import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: <>Oko beskonačne nabijene prave postaviš kocku umjesto valjka. Šta Gaussov zakon tada daje?</>,
    opcije: ['Isti ukupan fluks, ali polje iz njega ne izlazi', 'Drugačiji ukupan fluks', 'Pogrešan rezultat', 'Isti fluks i isto polje, samo teži račun'],
    tacna: 0,
    objasnjenje: (
      <>
        Isti ukupan fluks <M tex="qL/\varepsilon_0" />, jer zakon važi za svaku zatvorenu površinu. Ali na strani kocke{' '}
        <M tex="\mathbf{E}\cdot\mathbf{n}" /> nije stalno (u uglu je dva puta manje nego na sredini), pa se fluks ne može
        napisati kao <M tex="E \cdot a" /> i podijeliti površinom. Valjak je izbor u kojem to može.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Valjak oko prave: na plaštu polje probija površinu okomito i svuda isto; na osnovicama leži u njihovoj ravni, pa kroz
      njih nema fluksa.
    </>,
    <>
      Kocka oko prave, gledano odozgo: trake desno su <M tex="\mathbf{E}\cdot\mathbf{n}" /> duž jedne strane. Nisu iste dužine,
      i tu je cijela razlika.
    </>,
    <>
      Kutija oko ravni: fluks ide kroz gornju i donju osnovicu, bočne strane su paralelne sa poljem. Visina kutije ne mijenja
      ništa.
    </>,
  ],
  formula: {
    tex: String.raw`E\cdot 2\pi\rho L = \frac{qL}{\varepsilon_0} \qquad E = \frac{q}{2\pi\varepsilon_0\rho} \qquad 2EA = \frac{\sigma A}{\varepsilon_0} \qquad E = \frac{\sigma}{2\varepsilon_0}`,
    veze: [
      { simbol: String.raw`\rho, L`, opis: 'klizači poluprečnika i visine valjka' },
      { simbol: String.raw`A`, opis: 'površina osnovice kutije, klizač stranice' },
      { simbol: String.raw`q,\ \sigma`, opis: 'gustine naboja prave i ravni, 5 nC/m i 10 nC/m²' },
      { simbol: String.raw`\mathbf{E}\cdot\mathbf{n} = 0`, opis: 'osnovice valjka i bočne strane kutije' },
    ],
  },
  greska: (
    <>
      Gaussov zakon se smatra „netačnim“ za nesimetričnu površinu. Tačan je za svaku zatvorenu površinu; simetrija treba samo
      da bi <M tex="E" /> moglo da izađe ispred integrala.
    </>
  ),
};

export default sadrzaj;
