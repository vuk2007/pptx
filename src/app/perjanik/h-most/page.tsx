import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="PERJANIK / DEMONSTRACIJA"
      naslov="H-most"
      opis="Četiri prekidača koja okreću motor na obje strane."
      faza="2"
      veze={[
        { putanja: '/perjanik', naziv: 'Nazad na Perjanik' },
      ]}
    />
  );
}
