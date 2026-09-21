import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="JARVIS"
      naslov="Jarvis"
      opis="Glasovni asistent koji sluša, misli i odgovara."
      faza="1"
      veze={[
        { putanja: '/', naziv: 'Početna' },
        { putanja: '/izlog/jarvis', naziv: 'Izlog' },
        { putanja: '/jarvis/glas', naziv: 'Tvoj glas uživo' },
        { putanja: '/jarvis/pipeline', naziv: 'Pipeline i brzina' },
        { putanja: '/jarvis/frekvencije', naziv: 'Tri radija na štandu' },
      ]}
    />
  );
}
