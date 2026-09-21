import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="PERJANIK"
      naslov="Perjanik"
      opis="Rover na četiri točka, napravljen od nule."
      faza="1"
      veze={[
        { putanja: '/', naziv: 'Početna' },
        { putanja: '/izlog/perjanik', naziv: 'Izlog' },
        { putanja: '/perjanik/h-most', naziv: 'H-most' },
        { putanja: '/perjanik/pwm', naziv: 'PWM' },
        { putanja: '/perjanik/radio', naziv: 'Radio paket i failsafe' },
        { putanja: '/perjanik/suspenzija', naziv: 'Rocker sa diferencijalom' },
        { putanja: '/perjanik/servo', naziv: 'Dvostruki servo' },
      ]}
    />
  );
}
