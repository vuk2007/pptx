import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: <>Unutar dugačke nabijene cijevi, van ose, polje je:</>,
    opcije: ['nula', 'isto kao od prave u osi', 'najjače uz zid', 'usmjereno ka bližem zidu'],
    tacna: 0,
    objasnjenje: (
      <>
        Nula, svuda unutra. Bliži dio zida je jači jer je blizu, ali u istom uglu ima manje naboja; dalji dio je slabiji, ali
        ga je više. Ta dva efekta se tačno ponište. Zato i koaksijalni kabel vani nema polja: unutrašnji{' '}
        <M tex="+q" /> i spoljašnji <M tex="-q" /> se poništavaju.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Crtež je presjek dugačke cijevi. Tačke na obodu su prave od kojih je plašt sastavljen; zelene strelice su polje, dužine
      srazmjerne jačini.
    </>,
    <>
      Tačka <M tex="T" /> se prevlači. Polje u njoj se računa po formuli i kao zbir 60 pravih po obodu: unutra je i zbir
      nula, a ne samo formula.
    </>,
    <>
      Graf desno je <M tex="E(\rho)" />: unutra nula, vani opada kao <M tex="1/\rho" />, isto kao polje prave u osi. Kod
      koaksijalnog kabla polje postoji samo između vodiča.
    </>,
  ],
  formula: {
    tex: String.raw`E(\rho) = \begin{cases} 0, & \rho < a \\[2pt] \dfrac{q}{2\pi\varepsilon_0\rho}, & \rho > a \end{cases} \qquad E_\text{koaks}(\rho) = \begin{cases} \dfrac{q}{2\pi\varepsilon_0\rho}, & a < \rho < b \\[2pt] 0, & \text{ostalo} \end{cases}`,
    veze: [
      { simbol: String.raw`\rho`, opis: 'rastojanje tačke T od ose; prevlačenjem' },
      { simbol: String.raw`a,\ b`, opis: 'poluprečnik cijevi i plašta kabla, 5 cm i 11 cm' },
      { simbol: String.raw`q`, opis: 'naboj po dužini, 5 nC/m; kod kabla −q na plaštu' },
    ],
  },
  greska: (
    <>
      Misli se da je unutar cijevi polje najjače uz zid, jer je zid blizu. Unutra je polje nula svuda, i kod kabla vani isto
      nula: polje vidi samo naboj koji je bliže osi od tačke.
    </>
  ),
};

export default sadrzaj;
