import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="JARVIS / DEMONSTRACIJA"
      naslov="Tri radija na štandu"
      opis="Duži talas prolazi, kraći nosi više."
      faza="5"
      veze={[
        { putanja: '/jarvis', naziv: 'Nazad na Jarvis' },
      ]}
    />
  );
}
