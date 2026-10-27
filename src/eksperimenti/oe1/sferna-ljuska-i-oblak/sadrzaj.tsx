import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: <>Naboj je jednoliko raspoređen po zapremini kugle (oblak). Kako se polje mijenja od centra do ruba kugle?</>,
    opcije: ['Raste linearno sa r', 'Opada kao 1/r²', 'Nula je svuda unutra', 'Stalno je'],
    tacna: 0,
    objasnjenje: (
      <>
        Raste linearno. Gaussova sfera poluprečnika <M tex="r" /> obuhvata <M tex="Q\,(r/R)^3" />, a površina joj je{' '}
        <M tex="4\pi r^2" />, pa je <M tex="E = Q r/(4\pi\varepsilon_0 R^3)" />. Nula unutra je slučaj ljuske, gdje je sav naboj
        na površini.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Presjek: ljuska je naboj po površini kugle, oblak po cijeloj zapremini, a sferni kondenzator su dvije ljuske, unutrašnja
      sa <M tex="+Q" /> i spoljašnja sa <M tex="-Q" />.
    </>,
    <>
      Isprekidani krug je Gaussova sfera; klizač je širi. Strelice na njoj su polje, iste dužine svuda: simetrija kaže da je{' '}
      <M tex="E" /> na sferi stalno i okomito.
    </>,
    <>
      Graf desno je <M tex="E(r)" />. Očitavanja <M tex="E\cdot 4\pi r^2" /> i <M tex="Q_\mathrm{not}/\varepsilon_0" /> su uvijek
      jednaka: to je Gaussov zakon, a iz njega polje.
    </>,
  ],
  formula: {
    tex: String.raw`E \cdot 4\pi r^2 = \frac{Q_\mathrm{not}(r)}{\varepsilon_0} \qquad E_\text{oblak} = \frac{Q\,r}{4\pi\varepsilon_0 R^3}\ \ (r < R) \qquad E = \frac{Q}{4\pi\varepsilon_0 r^2}\ \ (r > R)`,
    veze: [
      { simbol: String.raw`r`, opis: 'klizač poluprečnika Gaussove sfere' },
      { simbol: String.raw`Q_\mathrm{not}(r)`, opis: 'očitavanje obuhvaćenog naboja' },
      { simbol: String.raw`R`, opis: 'poluprečnik ljuske ili oblaka, 5 cm; kod kondenzatora a = 5 cm, b = 10 cm' },
      { simbol: String.raw`Q`, opis: 'ukupan naboj, 4 nC' },
    ],
  },
  greska: (
    <>
      U <M tex="E\cdot 4\pi r^2 = Q/\varepsilon_0" /> se stavi ukupan naboj i unutar oblaka. Stavlja se samo obuhvaćeni{' '}
      <M tex="Q_\mathrm{not}(r)" />; zato polje unutra raste umjesto da eksplodira kao <M tex="1/r^2" />.
    </>
  ),
};

export default sadrzaj;
