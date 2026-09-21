import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="PERJANIK / DEMONSTRACIJA"
      naslov="PWM"
      opis="Kako se brzina motora podešava paljenjem i gašenjem."
      faza="2"
      veze={[
        { putanja: '/perjanik', naziv: 'Nazad na Perjanik' },
      ]}
    />
  );
}
