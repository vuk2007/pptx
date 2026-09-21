import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="POČNI"
      naslov="Kako da počneš"
      opis="Sve ovo je počelo sa jednim micro:bitom ili Arduinom i nekoliko žica."
      faza="1"
      veze={[
        { putanja: '/', naziv: 'Početna' },
      ]}
    />
  );
}
