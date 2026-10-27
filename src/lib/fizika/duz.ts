import { K, EPS0 } from '@/lib/fizika/elektrostatika';

/*
  §8 Od duži do prave.

  Duž dužine 2l leži na osi z, od −l do l, sa linijskom gustinom q.
  U tački na rastojanju ρ od ose i visini z:
      E_ρ = (K q/ρ) [ (z + l)/√(ρ² + (z + l)²) − (z − l)/√(ρ² + (z − l)²) ]
      E_z = K q [ 1/√(ρ² + (z − l)²) − 1/√(ρ² + (z + l)²) ]
  Na simetrali (z = 0): E = q/(2πε₀ρ) · l/√(l² + ρ²), što za l → ∞
  prelazi u polje beskonačne prave q/(2πε₀ρ).
*/

export function duzPolje(q: number, l: number, rho: number, z: number) {
  const gore = Math.hypot(rho, z - l);
  const dolje = Math.hypot(rho, z + l);
  return {
    rho: ((K * q) / rho) * ((z + l) / dolje - (z - l) / gore),
    z: K * q * (1 / gore - 1 / dolje),
  };
}

/** Isto polje kao zbir n tačkastih komada, za provjeru i za crtanje doprinosa. */
export function duzKomadi(q: number, l: number, rho: number, z: number, n: number) {
  const dz = (2 * l) / n;
  const komadi: { zp: number; dE: { rho: number; z: number } }[] = [];
  let Er = 0;
  let Ez = 0;
  for (let k = 0; k < n; k++) {
    const zp = -l + (k + 0.5) * dz;
    const Rr = rho;
    const Rz = z - zp;
    const R3 = (Rr * Rr + Rz * Rz) ** 1.5;
    const dE = { rho: (K * q * dz * Rr) / R3, z: (K * q * dz * Rz) / R3 };
    Er += dE.rho;
    Ez += dE.z;
    komadi.push({ zp, dE });
  }
  return { komadi, ukupno: { rho: Er, z: Ez } };
}

/** Polje beskonačne prave: q/(2πε₀ρ). */
export function pravaPolje(q: number, rho: number) {
  return q / (2 * Math.PI * EPS0 * rho);
}
