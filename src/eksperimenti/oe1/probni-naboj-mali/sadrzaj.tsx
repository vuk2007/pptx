import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Polje pored nabijene metalne kugle mjeriš kao <M tex="F/\delta Q" />. Šta se desi sa izmjerenim poljem ako probni naboj{' '}
        <M tex="\delta Q" /> povećaš sto puta?
      </>
    ),
    opcije: ['Ostane isto, jer se δQ skrati', 'Promijeni se, jer δQ pomjeri naboje na kugli', 'Poraste sto puta', 'Opadne sto puta'],
    tacna: 1,
    objasnjenje: (
      <>
        Promijeni se. Sila raste sa <M tex="\delta Q" />, pa bi se u <M tex="F/\delta Q" /> skratila, ali samo dok naboji na
        kugli stoje gdje su bili. Na provodniku se oni slobodno kreću: veliki probni naboj ih odgurne, pa mjeri polje
        pokvarenog rasporeda. Zato se polje definiše granicom <M tex="\delta Q \to 0" />.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Krug je metalna kugla u presjeku, sa 24 slobodna naboja. Prazni kružići su raspored bez probnog naboja, pune tačke
      raspored uz njega.
    </>,
    <>
      Puna zelena strelica je izmjereno <M tex="F/\delta Q" />, a isprekidana linija ispod nje pravo polje, u istoj razmjeri.
    </>,
    <>
      Graf desno je odstupanje u procentima za svaki <M tex="\delta Q" />, po logaritamskoj skali: svaki podiok je deset puta
      veći probni naboj. Lijevo kriva pada na nulu.
    </>,
  ],
  formula: {
    tex: String.raw`\mathbf{E}(T) = \lim_{\delta Q \to 0} \frac{\mathbf{F}}{\delta Q}`,
    veze: [
      { simbol: String.raw`\delta Q`, opis: 'klizač probnog naboja, od 0,001 nC do 20 nC' },
      { simbol: String.raw`\mathbf{F}`, opis: 'sila na probni naboj od naboja kugle, u njihovom novom rasporedu' },
      { simbol: String.raw`T`, opis: 'mjesto probnog naboja; klizač rastojanja' },
    ],
  },
  greska: (
    <>
      Misli se da je <M tex="\delta Q \to 0" /> samo matematička formalnost, jer se <M tex="\delta Q" /> u{' '}
      <M tex="F/\delta Q" /> ionako skrati. Skrati se tek kad probni naboj ne mijenja izvor polja, a to važi samo za mali{' '}
      <M tex="\delta Q" />.
    </>
  ),
};

export default sadrzaj;
