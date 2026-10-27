import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Komadić površine odmakneš dvostruko dalje od naboja i istovremeno mu udvostručiš stranicu. Šta se desi sa fluksom kroz
        njega?
      </>
    ),
    opcije: ['Ostane isti', 'Poraste četiri puta', 'Opadne četiri puta', 'Prepolovi se'],
    tacna: 0,
    objasnjenje: (
      <>
        Ostane isti. Polje je dvostruko dalje četiri puta slabije, a površina je četiri puta veća. Komadić se vidi iz naboja pod
        istim prostornim uglom <M tex="\Omega" />, a fluks je <M tex="Q\,\Omega/(4\pi\varepsilon_0)" />: zavisi samo od ugla.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Bočni pogled. Naboj je lijevo, debela duž je kvadratni komadić <M tex="a \times a" /> sa normalom <M tex="\mathbf{n}" />.
      Osjenčeni konus je prostorni ugao pod kojim se komadić vidi.
    </>,
    <>
      Zelene linije su linije polja u ravni crteža; istaknute su one koje prolaze kroz komadić. U režimu „Isti ugao“ broj im
      se ne mijenja dok pomjeraš komadić.
    </>,
    <>
      Nagib <M tex="\theta" /> smanjuje fluks sa <M tex="\cos\theta" />: nagnut komadić se vidi uže. Pri 90° polje klizi uz
      njega.
    </>,
  ],
  formula: {
    tex: String.raw`d\Phi = \mathbf{E}\cdot d\mathbf{a} = \frac{Q}{4\pi\varepsilon_0}\,d\Omega \qquad d\Omega = \frac{da\cos\theta}{r^2} \qquad \Phi_\text{sfera} = \frac{Q}{4\pi\varepsilon_0}\,4\pi = \frac{Q}{\varepsilon_0}`,
    veze: [
      { simbol: String.raw`r`, opis: 'klizač udaljenosti komadića od naboja' },
      { simbol: String.raw`da`, opis: 'površina komadića; u režimu „Isti ugao“ raste sa r²' },
      { simbol: String.raw`\theta`, opis: 'klizač nagiba normale prema konusu' },
      { simbol: String.raw`d\Omega`, opis: 'osjenčeni konus; očitavanje prostornog ugla' },
      { simbol: String.raw`Q`, opis: 'naboj, stalno 2 nC' },
    ],
  },
  greska: (
    <>
      Misli se da je fluks manji kroz dalju površinu jer je polje tamo slabije. Kroz površinu istog prostornog ugla fluks je
      isti na svakoj udaljenosti; zato je fluks kroz zatvorenu površinu oko naboja uvijek <M tex="Q/\varepsilon_0" />.
    </>
  ),
};

export default sadrzaj;
