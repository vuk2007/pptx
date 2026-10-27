import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Naboj je <M tex="Q(t) = t^2 + C" />. Ako konstantu <M tex="C" /> povećaš sa 0 na 5 C, šta se desi sa strujom{' '}
        <M tex="i(t)" />?
      </>
    ),
    opcije: ['Ne mijenja se', 'Poveća se za 5 A', 'Poveća se 5 puta', 'Postane 5 A'],
    tacna: 0,
    objasnjenje: (
      <>
        Ne mijenja se. Konstanta pomjeri cijeli graf <M tex="Q(t)" /> naviše, ali mu ne mijenja nagib, a struja je baš nagib:{' '}
        <M tex="i = dQ/dt" />, a izvod konstante je nula. Zato iz same struje ne možeš saznati koliko naboja ima, nego samo
        koliko se promijenio.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Gore je naboj <M tex="Q(t)" />. Narandžasta prava je sječica kroz <M tex="t_0" /> i <M tex="t_0 + \delta t" />, a
      isprekidana tangenta u <M tex="t_0" />. Kad smanjiš <M tex="\delta t" />, sječica se okreće u tangentu.
    </>,
    <>
      Dolje je struja <M tex="i(t)" />. Tačka u <M tex="t_0" /> je nagib tangente, a kratka narandžasta crta nagib sječice:
      prosječna struja na intervalu <M tex="\delta t" />.
    </>,
    <>
      Osjenčena površina ispod <M tex="i(t)" /> od <M tex="t_1" /> do <M tex="t_2" /> jednaka je promjeni{' '}
      <M tex="\Delta Q" /> koju gore pokazuje kota uz desnu ivicu.
    </>,
    <>
      Konstanta <M tex="C" /> pomjera samo gornji graf. Donji ostaje isti, kao i površina ispod njega.
    </>,
  ],
  formula: {
    tex: String.raw`i(t) = \frac{dQ}{dt} = \lim_{\delta t \to 0} \frac{\delta Q}{\delta t} \qquad \Delta Q = Q(t_2) - Q(t_1) = \int_{t_1}^{t_2} i\,dt`,
    veze: [
      { simbol: String.raw`t_0`, opis: 'klizač trenutka u kojem se gleda nagib' },
      { simbol: String.raw`\delta t`, opis: 'klizač intervala sječice, od 2 s do 0,01 s' },
      { simbol: String.raw`\frac{\delta Q}{\delta t}`, opis: 'očitavanje „Sječica“: prosječna struja' },
      { simbol: String.raw`t_1, t_2`, opis: 'klizači granica integrala' },
      { simbol: String.raw`C`, opis: 'klizač konstante u Q(t) + C' },
    ],
  },
  greska: (
    <>
      Iz struje se integralom dobija promjena naboja <M tex="\Delta Q" />, a ne sam naboj <M tex="Q(t)" />. Za to treba znati
      i naboj u nekom trenutku, jer konstanta iz <M tex="Q(t)" /> u struji ne ostavlja traga.
    </>
  ),
};

export default sadrzaj;
