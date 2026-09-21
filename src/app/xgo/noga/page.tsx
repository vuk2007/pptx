import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="XGO / DEMONSTRACIJA"
      naslov="Inverzna kinematika noge"
      opis="Gdje treba da budu uglovi da stopalo stigne gdje hoćeš."
      faza="4"
      veze={[
        { putanja: '/xgo', naziv: 'Nazad na XGO psi' },
      ]}
    />
  );
}
