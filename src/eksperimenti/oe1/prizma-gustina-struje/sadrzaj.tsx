import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Ugao <M tex="\alpha" /> se poveća sa 0° na 60°, a <M tex="\rho" />, <M tex="w" /> i <M tex="\delta t" /> ostanu isti.
        Koliko naboja sada prođe kroz prozorčić za <M tex="\delta t" />?
      </>
    ),
    opcije: ['Isto kao pri 0°', 'Upola manje', 'Dvostruko više', 'Nijedan'],
    tacna: 1,
    objasnjenje: (
      <>
        Upola manje, jer je <M tex="\cos 60^\circ = 0{,}5" />. Prizma ima iste stranice, ali je nagnuta: u smjeru normale
        visoka je samo <M tex="w\,\delta t\cos\alpha" />, pa joj je i površina toliko manja, a s njom i broj naboja u njoj.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Tačke su naboji, svaki od 1 nC, i svi se kreću istom brzinom <M tex="\mathbf{w}" />. Crtež je presjek, pa je
      prozorčić <M tex="\delta a" /> duž od 4 cm, a <M tex="\rho" /> se broji po cm² presjeka.
    </>,
    <>
      Ljubičasta strelica je normala <M tex="\mathbf{n}" /> prozorčića. Gore lijevo je isti ugao <M tex="\alpha" /> između{' '}
      <M tex="\mathbf{n}" /> i <M tex="\mathbf{w}" />, nacrtan izdvojeno.
    </>,
    <>
      Isprekidani paralelogram je prizma: naboji koji su sada u njoj su tačno oni koji će za <M tex="\delta t" /> proći kroz
      prozorčić. Oni su istaknuti i prebrojani.
    </>,
    <>
      Prebrojani broj titra oko formule, jer naboji nisu u savršenoj mreži. U prosjeku se slaže sa{' '}
      <M tex="\rho\,\delta a\,w\,\delta t\cos\alpha" />.
    </>,
  ],
  formula: {
    tex: String.raw`\delta Q = \rho\,\delta a\,w\,\delta t\cos\alpha \qquad \delta i = \frac{\delta Q}{\delta t} = \rho\,\mathbf{w}\cdot\mathbf{n}\,\delta a = \mathbf{J}\cdot\delta\mathbf{a}`,
    veze: [
      { simbol: String.raw`\rho`, opis: 'klizač gustine: koliko naboja ima u cm² presjeka' },
      { simbol: String.raw`w`, opis: 'klizač brzine: iznos brzine nosilaca' },
      { simbol: String.raw`\alpha`, opis: 'klizač ugla između w i normale n' },
      { simbol: String.raw`\delta t`, opis: 'klizač vremena: koliko dugo brojimo; određuje dužinu prizme w·δt' },
      { simbol: String.raw`\delta a`, opis: 'prozorčić, stalno 4 cm' },
      { simbol: String.raw`\mathbf{J}`, opis: 'očitavanje gustine struje: J = ρw' },
    ],
  },
  greska: (
    <>
      Zaboravi se <M tex="\cos\alpha" />, pa se računa kao da je prizma pravougaona. Kroz prozorčić prolazi samo ono što se
      kreće duž normale: pri <M tex="\alpha = 90^\circ" /> naboji klize uz prozorčić i struje kroz njega nema.
    </>
  ),
};

export default sadrzaj;
