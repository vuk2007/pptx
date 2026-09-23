import Link from 'next/link';
import { Sema } from '@/components/slajdovi/crtezi';
import type { Slajd } from '@/sadrzaj/slajdovi';
import stil from './slajd.module.css';

/**
  Jedan slajd: krupan uzak naslov, jedna rečenica i jedna šema.
  Duži naslov dobija manji stepen, da uvijek stane u dva reda.
*/
export function PrikazSlajda({ slajd, demoVidljiv = true }: { slajd: Slajd; demoVidljiv?: boolean }) {
  const duzina = slajd.naslov.length;
  const stepen = duzina > 16 ? stil.naslovDug : duzina > 10 ? stil.naslovSrednji : stil.naslovKratak;

  return (
    <div className={stil.slajd}>
      <div className={stil.tekst}>
        <h2 className={`${stil.naslov} ${stepen}`}>{slajd.naslov}</h2>
        <p className={stil.recenica}>{slajd.recenica}</p>
        {demoVidljiv && slajd.demo && (
          <Link href={slajd.demo.putanja} className={stil.demo}>
            Demonstracija: {slajd.demo.naziv}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      <figure className={stil.sema}>
        <Sema kljuc={slajd.ilustracija} opis={`Šema: ${slajd.naslov}`} />
      </figure>
    </div>
  );
}
