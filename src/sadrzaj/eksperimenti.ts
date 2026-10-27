import type { SadrzajEksperimenta } from '@/components/faks/tipovi';

/*
  Registar eksperimenata za faks. Liste na /faks i /faks/<predmet> se
  prave iz ovog fajla, a strana /faks/<predmet>/<slug> učitava sadržaj
  preko `ucitaj`.

  Nov eksperiment: folder src/eksperimenti/<predmet>/<slug>/ sa sadrzaj.tsx
  i Simulacija.tsx, pa jedan red ovdje. Uputstvo je u README-u.

  Nazivi poglavlja su opisni, napisani našim riječima; oznake (§4) prate
  udžbenik, a slovenski termin stoji u zagradi.
*/

export type PredmetId = 'oe1' | 'mtt' | 'mat';

export type Predmet = {
  id: PredmetId;
  naziv: string;
  slovenski?: string;
  opis: string;
};

export const PREDMETI: Predmet[] = [
  {
    id: 'oe1',
    naziv: 'Osnove elektrotehnike I',
    slovenski: 'Osnove elektrotehnike I',
    opis: 'Naboj, struja, kontinuitet, Kirchhoff, Coulomb, električno polje i Gauss.',
  },
  {
    id: 'mtt',
    naziv: 'Mehanika i termodinamika',
    slovenski: 'Mehanika in termodinamika',
    opis: 'Kasnije.',
  },
  {
    id: 'mat',
    naziv: 'Matematika',
    slovenski: 'Matematika',
    opis: 'Kasnije.',
  },
];

export type Poglavlje = { oznaka: string; naziv: string; slovenski?: string };

export const POGLAVLJA: Record<PredmetId, Poglavlje[]> = {
  oe1: [
    { oznaka: '§2', naziv: 'Gustine naboja', slovenski: 'gostote naboja' },
    { oznaka: '§3', naziv: 'Električna struja', slovenski: 'električni tok' },
    { oznaka: '§4', naziv: 'Gustina struje', slovenski: 'gostota toka' },
    { oznaka: '§5', naziv: 'Jednačina kontinuiteta', slovenski: 'kontinuitetna enačba' },
    { oznaka: '§6', naziv: 'Kirchhoffov zakon za struje', slovenski: '1. Kirchhoffov zakon' },
    { oznaka: '§7', naziv: 'Coulombov zakon', slovenski: 'Coulombov zakon' },
    { oznaka: '§8', naziv: 'Električno polje', slovenski: 'električna poljska jakost' },
    { oznaka: '§9', naziv: 'Gaussov zakon', slovenski: 'Gaussov zakon' },
    { oznaka: '§10', naziv: 'Napon i potencijal', slovenski: 'napetost in potencial' },
    { oznaka: '§11', naziv: 'Gradijent i dipol', slovenski: 'gradient in dipol' },
    { oznaka: 'alati', naziv: 'Matematički alati' },
  ],
  mtt: [],
  mat: [],
};

type Ucitaj = () => Promise<{ default: SadrzajEksperimenta }>;

export type Eksperiment = {
  slug: string;
  predmet: PredmetId;
  /** Oznaka poglavlja iz POGLAVLJA, npr. „§4". */
  poglavlje: string;
  naslov: string;
  /** Jedna rečenica. */
  opis: string;
} & ({ status: 'gotovo'; ucitaj: Ucitaj } | { status: 'u izradi' });

export const EKSPERIMENTI: Eksperiment[] = [
  /* --- grupa A --- */
  { slug: 'prizma-gustina-struje', predmet: 'oe1', poglavlje: '§4', naslov: 'Prizma i gustina struje', opis: 'Prebroj naboje u kosoj prizmi iza prozorčića i uporedi sa ρ·δa·w·δt·cos α.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/prizma-gustina-struje/sadrzaj') },
  { slug: 'kontinuitet-q-noter-zunaj', predmet: 'oe1', poglavlje: '§5', naslov: 'Naboj unutra i vani', opis: 'Naboji prelaze zatvorenu površinu: struja van je tačno brzina kojom naboj unutra opada.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/kontinuitet-q-noter-zunaj/sadrzaj') },
  { slug: 'kirchhoff-cvor', predmet: 'oe1', poglavlje: '§6', naslov: 'Čvor sa tri žice', opis: 'Kad ulaz nije jednak izlazu, naboj u čvoru raste ili opada bez kraja.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/kirchhoff-cvor/sadrzaj') },

  /* --- grupa B --- */
  { slug: 'q-i-izvod-integral', predmet: 'oe1', poglavlje: '§3', naslov: 'Q(t), izvod i integral', opis: 'Sječica se okreće u tangentu: iz Q izvodom dobiješ i, a iz i integralom ΔQ.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/q-i-izvod-integral/sadrzaj') },
  { slug: 'smjer-struje-elektroni', predmet: 'oe1', poglavlje: '§3', naslov: 'Smjer struje i elektroni', opis: 'Elektroni ulijevo i pozitivni ioni udesno daju istu struju.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/smjer-struje-elektroni/sadrzaj') },
  { slug: 'predznaci-5-koraka', predmet: 'oe1', poglavlje: '§5', naslov: 'Predznaci u pet koraka', opis: 'Od strelice na žici do Q(t), korak po korak, sa normalom koja mijenja samo predznake.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/predznaci-5-koraka/sadrzaj') },
  { slug: 'gustine-naboja', predmet: 'oe1', poglavlje: '§2', naslov: 'Gustine naboja', opis: 'Isto tijelo kao zapremina, ploča, žica i tačka: ρ, σ, q i Q.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/gustine-naboja/sadrzaj') },

  /* --- grupa C --- */
  { slug: 'coulomb-sila', predmet: 'oe1', poglavlje: '§7', naslov: 'Coulombova sila', opis: 'Dva naboja koja prevlačiš, sile jednake po iznosu i suprotne po smjeru.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/coulomb-sila/sadrzaj') },
  { slug: 'polje-tackastih-naboja', predmet: 'oe1', poglavlje: '§8', naslov: 'Polje tačkastih naboja', opis: 'Do četiri naboja, linije polja i doprinos svakog naboja posebno.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/polje-tackastih-naboja/sadrzaj') },
  { slug: 'probni-naboj-mali', predmet: 'oe1', poglavlje: '§8', naslov: 'Zašto probni naboj mora biti mali', opis: 'Veliki probni naboj pomjera naboje koje mjeri.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/probni-naboj-mali/sadrzaj') },
  { slug: 'prsten-polje-na-osi', predmet: 'oe1', poglavlje: '§8', naslov: 'Polje prstena na osi', opis: 'Poprečne komponente se poništavaju u parovima, ostaje samo komponenta duž ose.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/prsten-polje-na-osi/sadrzaj') },
  { slug: 'duz-u-pravu', predmet: 'oe1', poglavlje: '§8', naslov: 'Od duži do prave', opis: 'Kad duž postane beskonačna, polje prelazi u q/(2πε₀ρ).', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/duz-u-pravu/sadrzaj') },
  { slug: 'ravan-i-kondenzator', predmet: 'oe1', poglavlje: '§8', naslov: 'Ravan i kondenzator', opis: 'Ravan daje σ/(2ε₀), dvije suprotne ravni σ/ε₀ između i nulu van.', status: 'gotovo', ucitaj: () => import('@/eksperimenti/oe1/ravan-i-kondenzator/sadrzaj') },
  { slug: 'cijev-koaks', predmet: 'oe1', poglavlje: '§8', naslov: 'Cijev i koaksijalni kabel', opis: 'Unutra nula, vani kao prava u osi.', status: 'u izradi' },

  /* --- grupa D --- */
  { slug: 'fluks-i-prostorni-ugao', predmet: 'oe1', poglavlje: '§9', naslov: 'Fluks i prostorni ugao', opis: 'Fluks kroz komadić površine zavisi od prostornog ugla, ne od udaljenosti.', status: 'u izradi' },
  { slug: 'gauss-zatvorena-povrsina', predmet: 'oe1', poglavlje: '§9', naslov: 'Gaussova površina', opis: 'Fluks je Q_not/ε₀, a naboj vani daje nulu.', status: 'u izradi' },
  { slug: 'sferna-ljuska-i-oblak', predmet: 'oe1', poglavlje: '§9', naslov: 'Ljuska, oblak i sferni kondenzator', opis: 'E(r) iz obuhvaćenog naboja, dok širiš Gaussovu sferu.', status: 'u izradi' },
  { slug: 'izbor-gaussove-povrsine', predmet: 'oe1', poglavlje: '§9', naslov: 'Izbor Gaussove površine', opis: 'Valjak za pravu, kutija za ravan, i gdje je fluks nula.', status: 'u izradi' },

  /* --- kasnije --- */
  { slug: 'napon-nezavisnost-od-puta', predmet: 'oe1', poglavlje: '§10', naslov: 'Napon ne zavisi od puta', opis: 'Dva puta između istih tačaka daju isti napon.', status: 'u izradi' },
  { slug: 'ekvipotencijalne-povrsine', predmet: 'oe1', poglavlje: '§10', naslov: 'Ekvipotencijalne površine', opis: 'Površine istog potencijala i polje okomito na njih.', status: 'u izradi' },
  { slug: 'potencijal-nula-polje-nije', predmet: 'oe1', poglavlje: '§10', naslov: 'V = 0, a E ≠ 0', opis: 'Tačka nultog potencijala u kojoj polje nije nula.', status: 'u izradi' },
  { slug: 'gradijent', predmet: 'oe1', poglavlje: '§11', naslov: 'Gradijent', opis: 'Polje kao strmina potencijala.', status: 'u izradi' },
  { slug: 'dipol', predmet: 'oe1', poglavlje: '§11', naslov: 'Dipol', opis: 'Polje i potencijal dva bliska suprotna naboja.', status: 'u izradi' },

  /* --- grupa E --- */
  { slug: 'delta-i-d', predmet: 'oe1', poglavlje: 'alati', naslov: 'Od δ do d', opis: 'Konačan komadić δt se smanjuje, a δQ/δt teži limesu.', status: 'u izradi' },
  { slug: 'riemann-u-integral', predmet: 'oe1', poglavlje: 'alati', naslov: 'Od sume do integrala', opis: 'Suma m pravougaonika prelazi u integral kad m raste.', status: 'u izradi' },
  { slug: 'skalarni-proizvod', predmet: 'oe1', poglavlje: 'alati', naslov: 'Skalarni proizvod', opis: 'Projekcija i a·b = ab cos α: nula pri 90°, negativno preko 90°.', status: 'u izradi' },
  { slug: 'vektorski-proizvod', predmet: 'oe1', poglavlje: 'alati', naslov: 'Vektorski proizvod', opis: 'w × B i B × w imaju suprotne smjerove.', status: 'u izradi' },
];

export function predmet(id: string): Predmet | undefined {
  return PREDMETI.find((p) => p.id === id);
}

export function eksperimentiPredmeta(id: PredmetId) {
  return EKSPERIMENTI.filter((e) => e.predmet === id);
}

export function gotoviPredmeta(id: PredmetId) {
  return EKSPERIMENTI.filter((e) => e.predmet === id && e.status === 'gotovo');
}

export function poglavlje(predmetId: PredmetId, oznaka: string): Poglavlje | undefined {
  return POGLAVLJA[predmetId].find((p) => p.oznaka === oznaka);
}

/* 1 eksperiment, 2–4 eksperimenta, 5 i više eksperimenata; 11–14 kao 5. */
export function rijecEksperimenata(broj: number) {
  const desetice = broj % 100;
  const jedinica = broj % 10;
  if (desetice >= 11 && desetice <= 14) return 'eksperimenata';
  if (jedinica === 1) return 'eksperiment';
  if (jedinica >= 2 && jedinica <= 4) return 'eksperimenta';
  return 'eksperimenata';
}
