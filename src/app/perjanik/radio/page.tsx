import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="PERJANIK / DEMONSTRACIJA"
      naslov="Radio paket i failsafe"
      opis="Kako rover provjerava komandu i šta radi kad signal nestane."
      faza="3"
      veze={[
        { putanja: '/perjanik', naziv: 'Nazad na Perjanik' },
      ]}
    />
  );
}
