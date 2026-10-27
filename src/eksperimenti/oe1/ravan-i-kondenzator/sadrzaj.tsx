import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Između ploča kondenzatora (<M tex="+\sigma" /> i <M tex="-\sigma" />) polje je <M tex="\sigma/\varepsilon_0" />. Koliko je
        polje vani, iza jedne ploče, daleko od rubova?
      </>
    ),
    opcije: ['Nula', 'σ/(2ε₀)', 'σ/ε₀', 'Zavisi od udaljenosti od ploče'],
    tacna: 0,
    objasnjenje: (
      <>
        Nula. Svaka ploča sama daje <M tex="\sigma/(2\varepsilon_0)" /> sa obje strane: pozitivna od sebe, negativna ka sebi.
        Između ploča ta dva polja gledaju na istu stranu i sabiraju se u <M tex="\sigma/\varepsilon_0" />; vani gledaju
        suprotno i poništavaju se.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Crtež je presjek. Ravan okomita na crtež vidi se kao uspravna duž, a tačke na njoj su beskonačne prave od kojih je
      ravan sastavljena.
    </>,
    <>
      Zelene strelice su polje u mreži tačaka; dužina je srazmjerna jačini, do <M tex="\sigma/\varepsilon_0" />. Gdje
      strelice nema, polje je skoro nula.
    </>,
    <>
      Klizač širine pokazuje šta znači „beskonačna“ ravan: kad su ploče široke, polje između je ravnomjerno, a kad su uske,
      na rubu se savija i viri van.
    </>,
  ],
  formula: {
    tex: String.raw`E_\text{ravan} = \frac{\sigma}{2\varepsilon_0} \qquad E_\text{unutra} = \frac{\sigma}{2\varepsilon_0} + \frac{\sigma}{2\varepsilon_0} = \frac{\sigma}{\varepsilon_0} \qquad E_\text{vani} = 0`,
    veze: [
      { simbol: String.raw`\sigma`, opis: 'površinska gustina ploča, stalno 10 nC/m²' },
      { simbol: String.raw`T`, opis: 'tačka koja se prevlači; očitavanje |E| u njoj' },
      { simbol: String.raw`\frac{\sigma}{2\varepsilon_0}`, opis: 'dugme „Jedna ravan“, daleko od ruba' },
      { simbol: String.raw`\frac{\sigma}{\varepsilon_0}`, opis: 'dugme „Kondenzator“, između ploča' },
    ],
  },
  greska: (
    <>
      Za jednu ravan se uzme <M tex="\sigma/\varepsilon_0" />, a za kondenzator <M tex="2\sigma/\varepsilon_0" />. Jedna
      ravan daje pola toga, jer njeno polje ide na obje strane; tek dvije ploče daju <M tex="\sigma/\varepsilon_0" />, i to
      samo između njih.
    </>
  ),
};

export default sadrzaj;
