import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Naboji <M tex="+Q" /> i <M tex="-Q" /> stoje na istom rastojanju lijevo i desno od tačke <M tex="T" />. Kakvo je polje u{' '}
        <M tex="T" />?
      </>
    ),
    opcije: ['Nula, jer se poništavaju', 'Dvostruko polje jednog naboja, prema −Q', 'Kao polje jednog naboja', 'Dvostruko, prema +Q'],
    tacna: 1,
    objasnjenje: (
      <>
        Dvostruko, prema <M tex="-Q" />. Polje od <M tex="+Q" /> u <M tex="T" /> gleda od njega, dakle prema <M tex="-Q" />;
        polje od <M tex="-Q" /> gleda ka njemu, dakle opet prema <M tex="-Q" />. Isti smjer, pa se sabiraju. Poništavaju se
        tek dva naboja istog predznaka: probaj primjer „+Q i +Q“.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Tanke zelene linije su linije polja: izlaze iz pozitivnih naboja, ulaze u negativne, a gušće su tamo gdje je polje jače.
    </>,
    <>
      Tačka <M tex="T" /> se prevlači. Puna zelena strelica je ukupno polje <M tex="\mathbf{E}" />, a tanke isprekidane linije
      uz nju njene komponente <M tex="E_x" /> i <M tex="E_y" />.
    </>,
    <>
      Isprekidane sive strelice sa indeksom su doprinosi pojedinih naboja. Ukupno polje je njihov vektorski zbir.
    </>,
  ],
  formula: {
    tex: String.raw`\mathbf{E}(T) = \sum_k \frac{Q_k}{4\pi\varepsilon_0 R_k^2}\,\frac{\mathbf{R}_k}{R_k} \qquad \mathbf{R}_k = T - T'_k`,
    veze: [
      { simbol: String.raw`Q_k`, opis: 'klizači naboja; do četiri naboja' },
      { simbol: String.raw`T'_k`, opis: 'položaj naboja k; prevlači se' },
      { simbol: String.raw`T`, opis: 'tačka u kojoj se računa polje; prevlači se' },
      { simbol: String.raw`\mathbf{R}_k`, opis: 'od naboja ka tački T: zato polje pozitivnog naboja gleda od njega' },
      { simbol: String.raw`\mathbf{E}_k`, opis: 'isprekidane strelice doprinosa, dugme „Doprinosi“' },
    ],
  },
  greska: (
    <>
      Sabiraju se iznosi umjesto vektora, ili se „+Q i −Q“ proglasi nulom jer su naboji suprotni. Superpozicija sabira
      strelice: kod <M tex="+Q" /> i <M tex="-Q" /> u sredini obje gledaju na istu stranu.
    </>
  ),
};

export default sadrzaj;
