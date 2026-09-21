import { KosturStrane } from '@/components/KosturStrane';

export default function Strana() {
  return (
    <KosturStrane
      oznaka="XGO / DEMONSTRACIJA"
      naslov="Put komande"
      opis="Od izgovorene riječi do pokreta noge."
      faza="4"
      veze={[
        { putanja: '/xgo', naziv: 'Nazad na XGO psi' },
      ]}
    />
  );
}
