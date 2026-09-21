import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="JARVIS / DEMONSTRACIJA"
      naslov="Tvoj glas uživo"
      opis="Talas i spektrogram tvog glasa."
      faza="5"
      veze={[
        { putanja: '/jarvis', naziv: 'Nazad na Jarvis' },
      ]}
    />
  );
}
