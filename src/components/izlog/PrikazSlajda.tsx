import Link from 'next/link';
import { Ilustracija } from '@/components/ilustracije/registar';
import type { Slajd } from '@/sadrzaj/slajdovi';
import stil from './izlog.module.css';

/**
 * Jedan slajd: jedna rečenica lijevo, velika ilustracija desno.
 * Duža rečenica dobija manji stepen skale, da nikad ne pređe u zid teksta.
 */
export function PrikazSlajda({ slajd, demoVidljiv = true }: { slajd: Slajd; demoVidljiv?: boolean }) {
  const duzina = slajd.recenica.length;
  const velicina = duzina > 62 ? '6.2vh' : duzina > 46 ? '7vh' : '8vh';

  return (
    <div className={stil.slajd}>
      <div className={stil.kolonaTeksta}>
        <h2 className={stil.recenica} style={{ fontSize: velicina }}>
          {slajd.recenica}
        </h2>

        {demoVidljiv && slajd.demo && (
          <Link href={slajd.demo.putanja} className={stil.dugmeDemo}>
            <span aria-hidden="true">▶</span>
            {slajd.demo.naziv}
          </Link>
        )}
      </div>

      <div className={stil.kolonaCrteza}>
        <Ilustracija kljuc={slajd.ilustracija} />
      </div>
    </div>
  );
}
