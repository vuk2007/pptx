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
