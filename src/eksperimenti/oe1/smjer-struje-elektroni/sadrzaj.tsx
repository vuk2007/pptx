import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: <>U metalnoj žici elektroni se kreću ulijevo. Na koju stranu pokazuje strelica struje?</>,
    opcije: ['Udesno', 'Ulijevo', 'Nema struje, jer su elektroni negativni', 'Zavisi od broja elektrona'],
    tacna: 0,
    objasnjenje: (
      <>
        Udesno. Smjer struje je po dogovoru smjer kretanja pozitivnog naboja. Elektroni koji idu ulijevo nose negativan naboj
        na lijevu stranu, pa lijeva strana ima manje naboja, a desna više: isto kao da je pozitivan naboj otišao udesno.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Kružići su nosioci, svaki od 1 nC: veći sa plusom su pozitivni ioni, manji sa minusom elektroni. Isprekidana linija je
      presjek kroz koji se broji naboj.
    </>,
    <>
      Strelica <M tex="i" /> iznad žice je smjer struje. Strelice ispod su brzine nosilaca: pozitivni idu niz polje{' '}
      <M tex="\mathbf{E}" />, elektroni protiv njega.
    </>,
    <>
      Tabela broji naboj koji je prešao presjek i kako se zbog toga promijenio naboj lijevo i desno. Red pozitivnih i red
      elektrona daju isti bilans, iako se kreću na suprotne strane.
    </>,
    <>
      U elektrolitu se kreću i jedni i drugi, u suprotnim smjerovima, a struje im se sabiraju, ne poništavaju.
    </>,
  ],
  formula: {
    tex: String.raw`i = \frac{dQ}{dt} \qquad \mathbf{J} = \rho\,\mathbf{w}`,
    veze: [
      { simbol: String.raw`dQ`, opis: 'naboj koji pređe presjek u smjeru strelice struje; red „ukupno“ u tabeli' },
      { simbol: String.raw`\rho`, opis: 'izbor nosilaca: ρ > 0 za ione, ρ < 0 za elektrone' },
      { simbol: String.raw`\mathbf{w}`, opis: 'klizač brzine i strelice ispod žice' },
      { simbol: String.raw`\mathbf{J}`, opis: 'za elektrone ρ < 0 i w ulijevo, pa ρw pokazuje udesno' },
    ],
  },
  greska: (
    <>
      Strelica struje se nacrta u smjeru kretanja elektrona. Struja ide suprotno od elektrona: u{' '}
      <M tex="\mathbf{J} = \rho\,\mathbf{w}" /> negativan <M tex="\rho" /> okreće smjer.
    </>
  ),
};

export default sadrzaj;
