/*
  Brojevi na ekranu: decimalni zarez i pravi minus (U+2212), nikad crtica.
  Nula se nikad ne ispisuje kao „−0,0" — mali negativan šum se zaokruži na nulu
  bez znaka.
*/

export const MINUS = '−';

export function broj(n: number, decimala: number) {
  const apsolutno = Math.abs(n).toFixed(decimala);
  const nula = (0).toFixed(decimala);
  const znak = n < 0 && apsolutno !== nula ? MINUS : '';
  return znak + apsolutno.replace('.', ',');
}

/*
  Broj i jedinica se nikad ne razdvajaju na dva reda („72 °C", „180° − A"),
  pa se razmak između njih zamijeni neprelomnim.
*/
const JEDINICE = /(\d°?) (?=(?:V|A|W|ms|s|°C|%|MHz|o\/min)(?!\p{L}))/gu;
const OKO_MINUSA = / − (?=[\p{L}\d])/gu;
export const NBSP = '\u00a0';

export function neprelomno(tekst: string) {
  return tekst.replace(JEDINICE, `$1${NBSP}`).replace(OKO_MINUSA, `${NBSP}${MINUS}${NBSP}`);
}
