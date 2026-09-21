import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="POČETNA"
      naslov="Praktikum elektronike"
      opis="Svaki robot radi tri stvari: osjeti, odluči i djeluje."
      faza="1"
      veze={[
        { putanja: '/izlog', naziv: 'Izlog' },
        { putanja: '/perjanik', naziv: 'Perjanik' },
        { putanja: '/xgo', naziv: 'XGO psi' },
        { putanja: '/jarvis', naziv: 'Jarvis' },
        { putanja: '/pocni', naziv: 'Kako da počneš' },
      ]}
    />
  );
}
