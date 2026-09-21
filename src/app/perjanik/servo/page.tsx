import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="PERJANIK / DEMONSTRACIJA"
      naslov="Dvostruki servo"
      opis="Dva servoa na istoj osovini, ispravno i pogrešno."
      faza="3"
      veze={[
        { putanja: '/perjanik', naziv: 'Nazad na Perjanik' },
      ]}
    />
  );
}
