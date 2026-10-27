import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Za <M tex="Q(t) = t^2" /> u <M tex="t_0 = 1\ \mathrm{s}" /> računaš <M tex="\delta Q/\delta t" />. Koliko je odstupanje od{' '}
        <M tex="dQ/dt" /> kad je <M tex="\delta t = 0{,}01\ \mathrm{s}" />?
      </>
    ),
    opcije: ['0,01 A', '0,0001 A', 'Nula, već je tačno', '0,1 A'],
    tacna: 0,
    objasnjenje: (
      <>
        0,01 A. Za <M tex="t^2" /> je <M tex="\delta Q/\delta t = 2t_0 + \delta t" />, pa je odstupanje baš <M tex="\delta t" />{' '}
        (u amperima, jer je <M tex="Q" /> u kulonima). Nikad nije nula za konačan komadić, ali ide ka nuli zajedno sa njim: to
        znači granica.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Lijevo je cijela kriva <M tex="Q(t)" />; mali okvir je komadić <M tex="\delta t" />. Desno je isti komadić pod lupom,
      razvučen na cijeli kvadrat.
    </>,
    <>
      Narandžasta duž pod lupom je sječica. Dok je <M tex="\delta t" /> velik, kriva se od nje vidno odvaja; kad je mali, kriva
      je pod lupom prava.
    </>,
    <>
      Tabela ispod računa <M tex="\delta Q/\delta t" /> za sve manje komadiće; zadnji red je granica, <M tex="dQ/dt" />. Red
      najbliži klizaču je istaknut.
    </>,
  ],
  formula: {
    tex: String.raw`\frac{dQ}{dt} = \lim_{\delta t \to 0} \frac{\delta Q}{\delta t} \qquad \delta Q = Q(t_0 + \delta t) - Q(t_0) \qquad dQ \approx i\,\delta t`,
    veze: [
      { simbol: String.raw`\delta t`, opis: 'klizač komadića, od 2 s do 0,01 s; tabela ide do 0,001 s' },
      { simbol: String.raw`\delta Q`, opis: 'promjena naboja na komadiću; očitavanje i druga kolona tabele' },
      { simbol: String.raw`\frac{dQ}{dt}`, opis: 'zadnji red tabele i očitavanje „dQ/dt“' },
    ],
  },
  greska: (
    <>
      <M tex="\delta" /> i <M tex="d" /> se koriste kao isto. <M tex="\delta t" /> je konačan komadić koji se može izmjeriti, a{' '}
      <M tex="dt" /> je ono čemu on teži; jednačine sa <M tex="d" /> važe tačno, a sa <M tex="\delta" /> samo približno.
    </>
  ),
};

export default sadrzaj;
