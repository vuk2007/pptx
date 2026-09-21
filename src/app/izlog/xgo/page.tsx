import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="IZLOG / XGO"
      naslov="Izlog: XGO psi"
      opis="Petlja slajdova samo za robote pse."
      faza="1"
      veze={[
        { putanja: '/izlog', naziv: 'Cio izlog' },
        { putanja: '/xgo', naziv: 'Blok XGO' },
      ]}
    />
  );
}
