import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="IZLOG / PERJANIK"
      naslov="Izlog: Perjanik"
      opis="Petlja slajdova samo za rover."
      faza="1"
      veze={[
        { putanja: '/izlog', naziv: 'Cio izlog' },
        { putanja: '/perjanik', naziv: 'Blok Perjanik' },
      ]}
    />
  );
}
