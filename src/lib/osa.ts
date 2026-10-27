/*
  Podioci na osi grafa: okrugli koraci 1, 2 ili 5 puta stepen desetke,
  tako da na osi stane otprilike traženi broj oznaka.
*/

export function korakOse(min: number, max: number, ciljBroj = 5): number {
  const raspon = Math.abs(max - min) || 1;
  const grubo = raspon / Math.max(1, ciljBroj);
  const stepen = 10 ** Math.floor(Math.log10(grubo));
  const ostatak = grubo / stepen;
  const mnozilac = ostatak < 1.5 ? 1 : ostatak < 3.5 ? 2 : ostatak < 7.5 ? 5 : 10;
  return mnozilac * stepen;
}

/** Vrijednosti podioka unutar [min, max], uključujući nulu kad je u rasponu. */
export function podioci(min: number, max: number, ciljBroj = 5): number[] {
  const korak = korakOse(min, max, ciljBroj);
  const prvi = Math.ceil(min / korak - 1e-9) * korak;
  const izlaz: number[] = [];
  for (let v = prvi; v <= max + korak * 1e-9; v += korak) {
    /* Bez ovoga se 0,1 + 0,2 pojavi kao 0,30000000000000004. */
    izlaz.push(Math.abs(v) < korak * 1e-9 ? 0 : Number(v.toPrecision(12)));
  }
  return izlaz;
}

/** Koliko decimala treba da se podioci sa ovim korakom razlikuju. */
export function decimaleZaKorak(korak: number): number {
  return Math.max(0, -Math.floor(Math.log10(korak) + 1e-9));
}
