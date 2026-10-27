import { M } from '@/components/faks/Formula';
import type { SadrzajEksperimenta } from '@/components/faks/tipovi';
import Simulacija from './Simulacija';

const sadrzaj: SadrzajEksperimenta = {
  predvidi: {
    pitanje: (
      <>
        Struja raste, <M tex="i = 6t" />. Ako visinu svakog pravougaonika uzmeš na lijevom kraju njegovog intervala, da li je zbir
        veći ili manji od pravog naboja?
      </>
    ),
    opcije: ['Manji', 'Veći', 'Tačno jednak', 'Zavisi od broja pravougaonika'],
    tacna: 0,
    objasnjenje: (
      <>
        Manji. Kad struja raste, vrijednost na lijevom kraju je najmanja na intervalu, pa je svaki pravougaonik malo ispod krive.
        Sa više pravougaonika razlika se smanjuje, ali predznak ostaje; desni kraj daje višak, a sredina skoro tačno.
      </>
    ),
  },
  Simulacija,
  staGledas: [
    <>
      Narandžasta kriva je struja <M tex="i(t)" />. Pravougaonici idu od <M tex="t_1" /> do <M tex="t_2" />, svaki širine{' '}
      <M tex="\delta t" />; tačka na vrhu pokazuje gdje je uzeta visina.
    </>,
    <>
      Zbir površina pravougaonika je približni naboj, <M tex="\sum i\,\delta t" />. Kad <M tex="m" /> raste, pravougaonici
      popune površinu ispod krive i zbir postaje integral.
    </>,
    <>
      Ispod ose su pravougaonici sa negativnom strujom (kod <M tex="4\cos t" />): oni oduzimaju naboj.
    </>,
  ],
  formula: {
    tex: String.raw`\Delta Q \approx \sum_{k=1}^{m} i(t_k)\,\delta t \qquad \Delta Q = \lim_{m \to \infty} \sum_{k=1}^{m} i(t_k)\,\delta t = \int_{t_1}^{t_2} i\,dt`,
    veze: [
      { simbol: String.raw`m`, opis: 'klizač broja pravougaonika, od 1 do 200' },
      { simbol: String.raw`\delta t`, opis: '(t₂ − t₁)/m, širina jednog pravougaonika' },
      { simbol: String.raw`t_k`, opis: 'dugmad: lijevi kraj, sredina ili desni kraj komada' },
      { simbol: String.raw`t_1, t_2`, opis: 'klizači granica' },
    ],
  },
  greska: (
    <>
      Integral se shvati kao „površina ispod krive“ bez predznaka. Dio ispod ose ulazi sa minusom, jer tamo struja nosi naboj
      u suprotnom smjeru.
    </>
  ),
};

export default sadrzaj;
