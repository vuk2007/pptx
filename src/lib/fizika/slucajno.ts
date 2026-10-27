/*
  Slučajni brojevi sa sjemenom (mulberry32).

  Simulacije sa nabojima ne koriste Math.random: isto sjeme daje isto
  kretanje, pa provjere mogu da broje naboje i porede ih sa formulom,
  a ekran poslije „Počni ispočetka" izgleda isto kao prvi put.
*/

export type Slucajno = () => number;

export function slucajno(sjeme: number): Slucajno {
  let a = sjeme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
