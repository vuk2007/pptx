import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EKSPERIMENTI, POGLAVLJA, gotoviPredmeta, poglavlje, predmet as nadjiPredmet } from '@/sadrzaj/eksperimenti';
import { Eksperiment } from '@/components/faks/Eksperiment';

type Parametri = { params: Promise<{ predmet: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return EKSPERIMENTI.filter((e) => e.status === 'gotovo').map((e) => ({ predmet: e.predmet, slug: e.slug }));
}

function nadji(predmetId: string, slug: string) {
  return EKSPERIMENTI.find((e) => e.predmet === predmetId && e.slug === slug);
}

export async function generateMetadata({ params }: Parametri): Promise<Metadata> {
  const { predmet, slug } = await params;
  const e = nadji(predmet, slug);
  if (!e) return {};
  const oznaka = e.poglavlje === 'alati' ? '' : `${e.poglavlje} `;
  return { title: `${oznaka}${e.naslov}`, description: e.opis };
}

export default async function Strana({ params }: Parametri) {
  const { predmet: predmetId, slug } = await params;
  const zapis = nadji(predmetId, slug);
  const p = nadjiPredmet(predmetId);
  if (!zapis || zapis.status !== 'gotovo' || !p) notFound();

  const { default: sadrzaj } = await zapis.ucitaj();
  /* Susjedi su gotovi eksperimenti istog predmeta, po poglavljima, pa redom iz registra. */
  const redPoglavlja = POGLAVLJA[p.id].map((x) => x.oznaka);
  const gotovi = gotoviPredmeta(p.id).sort((a, b) => redPoglavlja.indexOf(a.poglavlje) - redPoglavlja.indexOf(b.poglavlje));
  const i = gotovi.findIndex((e) => e.slug === slug);

  return (
    <Eksperiment
      zapis={zapis}
      predmet={p}
      poglavlje={poglavlje(p.id, zapis.poglavlje)}
      sadrzaj={sadrzaj}
      prethodni={gotovi[i - 1]}
      sljedeci={gotovi[i + 1]}
    />
  );
}
