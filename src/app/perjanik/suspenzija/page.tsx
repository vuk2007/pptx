import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="PERJANIK / DEMONSTRACIJA"
      naslov="Rocker sa diferencijalom"
      opis="Poluge koje drže sva četiri točka na zemlji."
      faza="3"
      veze={[
        { putanja: '/perjanik', naziv: 'Nazad na Perjanik' },
      ]}
    />
  );
}
