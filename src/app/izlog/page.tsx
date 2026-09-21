import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="IZLOG / SVE"
      naslov="Izlog"
      opis="Automatska prezentacija svih blokova, u petlji."
      faza="1"
      veze={[
        { putanja: '/', naziv: 'Početna' },
        { putanja: '/izlog/perjanik', naziv: 'Samo Perjanik' },
        { putanja: '/izlog/xgo', naziv: 'Samo psi' },
        { putanja: '/izlog/jarvis', naziv: 'Samo Jarvis' },
      ]}
    />
  );
}
