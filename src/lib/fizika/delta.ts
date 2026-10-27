import { sjecica } from '@/lib/fizika/racun';

/*
  Od δ do d: konačan komadić δt i granica δQ/δt kad δt → 0.

  δ je mali, ali konačan komadić: može se izmjeriti i nacrtati. d je ono
  čemu δ teži. Za Q(t) = t² je δQ/δt = 2t₀ + δt tačno, pa je razlika od
  izvoda baš δt: što je komadić manji, to je prosjek bliži trenutnom.
*/

export const KORACI_TABELE = [1, 0.5, 0.1, 0.05, 0.01, 0.001];

export type Red = { dt: number; dQ: number; kolicnik: number; razlika: number };

export function tabela(Q: (t: number) => number, izvod: number, t0: number, koraci: readonly number[] = KORACI_TABELE): Red[] {
  return koraci.map((dt) => {
    const kolicnik = sjecica(Q, t0, dt);
    return { dt, dQ: Q(t0 + dt) - Q(t0), kolicnik, razlika: kolicnik - izvod };
  });
}

/**
  Koliko kriva odstupa od svoje sječice na intervalu δt, u odnosu na δQ:
  mjera „koliko je komadić još zakrivljen". Za mali δt teži nuli, pa se
  komadić pod lupom vidi kao prava.
*/
export function zakrivljenost(Q: (t: number) => number, t0: number, dt: number, n = 50) {
  const dQ = Q(t0 + dt) - Q(t0);
  let najvise = 0;
  for (let k = 1; k < n; k++) {
    const t = t0 + (dt * k) / n;
    const naPravoj = Q(t0) + (dQ * k) / n;
    najvise = Math.max(najvise, Math.abs(Q(t) - naPravoj));
  }
  return Math.abs(dQ) === 0 ? 0 : najvise / Math.abs(dQ);
}
