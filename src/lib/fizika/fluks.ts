import { EPS0, K } from '@/lib/fizika/elektrostatika';

/*
  §9 Fluks i prostorni ugao.

  Tačkasti naboj Q u ishodištu, ravan pravougaoni komadić a × b na
  udaljenosti d, centriran na osi x i nagnut za ugao θ oko svoje ose y.
  Fluks kroz komadić je K·Q·Ω, gdje je Ω prostorni ugao pod kojim se
  komadić vidi iz naboja. Ne zavisi od udaljenosti, nego samo od Ω:
  dvostruko dalji komadić dvostruke stranice ima isti fluks.
  Cijela sfera ima Ω = 4π, pa fluks Q/ε₀.
*/

/** Tačan prostorni ugao pravougaonika a × b, okomitog na osu, centriranog, na udaljenosti d. */
export function prostorniUgao(a: number, b: number, d: number): number {
  return 4 * Math.asin((a * b) / Math.sqrt((a * a + 4 * d * d) * (b * b + 4 * d * d)));
}

/** Za mali komadić: Ω ≈ da·cos θ / r². */
export function prostorniUgaoMali(da: number, r: number, theta: number): number {
  return (da * Math.cos(theta)) / (r * r);
}

/**
  Fluks ∫ E·da kroz nagnut pravougaonik, brojčano na mreži n × n.
  Normala komadića gleda od naboja (za θ = 0 duž +x).
*/
export function fluksKrozKomadic(Q: number, a: number, b: number, d: number, theta: number, n = 120): number {
  const nx = Math.cos(theta);
  const nz = Math.sin(theta);
  /* Osa u ravni komadića koja se naginje: okomita na normalu, u ravni xz. */
  const ux = -Math.sin(theta);
  const uz = Math.cos(theta);
  const da = (a / n) * (b / n);
  let fluks = 0;
  for (let i = 0; i < n; i++) {
    const s = -a / 2 + (i + 0.5) * (a / n);
    for (let j = 0; j < n; j++) {
      const t = -b / 2 + (j + 0.5) * (b / n);
      /* Tačka komadića: centar (d, 0, 0) + s·u + t·ŷ. */
      const x = d + s * ux;
      const y = t;
      const z = s * uz;
      const R2 = x * x + y * y + z * z;
      const R3 = R2 * Math.sqrt(R2);
      fluks += ((K * Q) / R3) * (x * nx + z * nz) * da;
    }
  }
  return fluks;
}

/** Fluks kroz prostorni ugao Ω: K·Q·Ω, a za Ω = 4π to je Q/ε₀. */
export function fluksKrozUgao(Q: number, omega: number) {
  return K * Q * omega;
}

export function fluksSfere(Q: number) {
  return Q / EPS0;
}
