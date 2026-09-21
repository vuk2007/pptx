import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="XGO"
      naslov="XGO psi"
      opis="Dva robota psa koji sami drže ravnotežu."
      faza="1"
      veze={[
        { putanja: '/', naziv: 'Početna' },
        { putanja: '/izlog/xgo', naziv: 'Izlog' },
        { putanja: '/xgo/ravnoteza', naziv: 'Povratna sprega' },
        { putanja: '/xgo/noga', naziv: 'Inverzna kinematika noge' },
        { putanja: '/xgo/komanda', naziv: 'Put komande' },
      ]}
    />
  );
}
