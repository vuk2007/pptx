import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="XGO / DEMONSTRACIJA"
      naslov="Povratna sprega"
      opis="Mjeri, ispravi, pa opet mjeri."
      faza="4"
      veze={[
        { putanja: '/xgo', naziv: 'Nazad na XGO psi' },
      ]}
    />
  );
}
