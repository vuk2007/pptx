import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="JARVIS / DEMONSTRACIJA"
      naslov="Pipeline i brzina"
      opis="Zašto odgovara za dvije sekunde, a ne za deset."
      faza="5"
      veze={[
        { putanja: '/jarvis', naziv: 'Nazad na Jarvis' },
      ]}
    />
  );
}
