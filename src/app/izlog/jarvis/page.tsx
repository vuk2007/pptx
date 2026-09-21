import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="IZLOG / JARVIS"
      naslov="Izlog: Jarvis"
      opis="Petlja slajdova samo za glasovnog asistenta."
      faza="1"
      veze={[
        { putanja: '/izlog', naziv: 'Cio izlog' },
        { putanja: '/jarvis', naziv: 'Blok Jarvis' },
      ]}
    />
  );
}
