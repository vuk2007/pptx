'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OkvirDemonstracije, PrekidacRezima } from '@/components/demo/OkvirDemonstracije';
import type { ElementModela } from '@/types/model-viewer';
import okvirStil from '@/components/demo/demo.module.css';
import stil from './simulator.module.css';

/*
  Ka-50 kolektiv u tri dimenzije.

  Ovo je jedina strana koja koristi tuđu biblioteku za crtanje: GLB model se
  ne može prikazati bez 3D motora. <model-viewer> se uvozi tek u browseru,
  jer se pri uvozu registruje kao web komponenta, a toga na serveru nema.

  Biblioteka i model idu iz našeg izvoza, ne sa CDN-a, pa strana radi offline
  kao i sve ostalo.
*/

/*
  Modeli koje posjetilac bira. Opisi su pročitani iz samih fajlova — imena
  mreža kažu šta je unutra — pa ih slobodno ispravi ako nešto zoveš drugačije.
*/
const MODELI = [
  {
    id: 'kolektiv',
    naziv: 'Kolektiv',
    putanja: '/modeli/ka-50-collective.glb',
    opis: 'Ručica je kolektiv — njome pilot podiže i spušta helikopter.',
    alt: 'Kolektiv helikoptera Ka-50, trodimenzionalni model',
  },
  {
    id: 'abris',
    naziv: 'ABRIS kontrole',
    putanja: '/modeli/abris-kontrole.glb',
    opis: 'Panel ABRIS kontrola: Arduino, prekidač i nosači.',
    alt: 'Panel ABRIS kontrola, trodimenzionalni model',
  },
  {
    id: 'kontroler',
    naziv: 'Prona kontroler',
    putanja: '/modeli/prona-kontroler.glb',
    opis: 'Kontroler i pločice u njemu: palice, d-pad i dugmad.',
    alt: 'Prona kontroler, trodimenzionalni model',
  },
] as const;

/** Kadar sa kojim se model prvi put pojavi. Odatle se čita pravo početno stanje. */
const POGLED = '35deg 72deg 105%';

/** Koliko traje glatki povratak na početni kadar. */
const TRAJANJE_RESETA = 400;

type Stanje = 'ucitava' | 'spreman' | 'greska';

/*
  Sve što posjetilac može da promijeni gledajući model:
  pravac i razdaljinu kamere, tačku u koju kamera gleda (to mijenja pan)
  i ugao objektiva (to mijenja zum).
*/
type Kadar = {
  theta: number;
  phi: number;
  radius: number;
  x: number;
  y: number;
  z: number;
  fov: number;
};

/** Čita živo stanje kamere. Atributi to ne znaju — oni ostaju kakvi su zapisani. */
function ocitajKadar(el: ElementModela): Kadar | null {
  if (!el.getCameraOrbit || !el.getCameraTarget || !el.getFieldOfView) return null;
  const orbit = el.getCameraOrbit();
  const cilj = el.getCameraTarget();
  return {
    theta: orbit.theta,
    phi: orbit.phi,
    radius: orbit.radius,
    x: cilj.x,
    y: cilj.y,
    z: cilj.z,
    fov: el.getFieldOfView(),
  };
}

function primijeniKadar(el: ElementModela, k: Kadar) {
  el.cameraOrbit = `${k.theta}rad ${k.phi}rad ${k.radius}m`;
  el.cameraTarget = `${k.x}m ${k.y}m ${k.z}m`;
  el.fieldOfView = `${k.fov}deg`;
}

/**
  Najkraći put do istog ugla.

  Theta se vrti u krug: ako je posjetilac okrenuo model za 350°, povratak
  treba da ide 10° unazad, a ne 350° unaprijed.
*/
function najkraciUgao(razlika: number): number {
  const pun = Math.PI * 2;
  return ((((razlika + Math.PI) % pun) + pun) % pun) - Math.PI;
}

const usporeno = (t: number) => 1 - Math.pow(1 - t, 3);

export function Simulator() {
  const [stanje, postaviStanje] = useState<Stanje>('ucitava');
  const [napredak, postaviNapredak] = useState(0);
  const [okrece, postaviOkrece] = useState(true);
  const [spremna, postaviSpremna] = useState(false);
  const [izabrani, postaviIzabrani] = useState(0);

  const modelRef = useRef<ElementModela | null>(null);
  /* Početni kadar se ne pogađa nego pamti, i to pri svakom učitavanju modela. */
  const pocetniKadar = useRef<Kadar | null>(null);
  const animacijaRef = useRef(0);

  const prekiniAnimaciju = useCallback(() => {
    if (animacijaRef.current) {
      cancelAnimationFrame(animacijaRef.current);
      animacijaRef.current = 0;
    }
  }, []);

  /* Biblioteka se uvozi tek ovdje: pri uvozu dira customElements. */
  useEffect(() => {
    let ziv = true;
    import('@google/model-viewer')
      .then(() => {
        if (ziv) postaviSpremna(true);
      })
      .catch(() => {
        if (ziv) postaviStanje('greska');
      });
    return () => {
      ziv = false;
    };
  }, []);

  useEffect(() => prekiniAnimaciju, [prekiniAnimaciju]);

  /* Događaji stižu sa web komponente, pa se slušaju ručno. */
  useEffect(() => {
    const el = modelRef.current;
    if (!el) return;

    function naNapredak(dogadjaj: Event) {
      const koliko = (dogadjaj as CustomEvent<{ totalProgress: number }>).detail?.totalProgress ?? 0;
      postaviNapredak(koliko);
    }

    function naUcitano() {
      postaviStanje('spreman');
      postaviNapredak(1);

      const model = modelRef.current;
      if (!model) return;

      /*
        Svaki model kreće iz istog neutralnog kadra. Bez ovoga bi se poslije
        promjene modela zapamtio ugao na kom je posjetilac slučajno stao, pa
        bi Reset vraćao na njega umjesto na početak.
      */
      model.cameraOrbit = POGLED;
      model.cameraTarget = 'auto';
      model.fieldOfView = 'auto';
      model.jumpCameraToGoal?.();

      /*
        Tek sada je kadar stvarno poznat: camera-target i field-of-view su
        „auto", pa ih model-viewer računa iz granica učitanog modela.
      */
      pocetniKadar.current = ocitajKadar(model);
    }

    function naGresku() {
      postaviStanje('greska');
    }

    el.addEventListener('progress', naNapredak);
    el.addEventListener('load', naUcitano);
    el.addEventListener('error', naGresku);
    return () => {
      el.removeEventListener('progress', naNapredak);
      el.removeEventListener('load', naUcitano);
      el.removeEventListener('error', naGresku);
    };
  }, [spremna, izabrani]);

  function resetuj() {
    const el = modelRef.current;
    const cilj = pocetniKadar.current;
    if (!el) return;

    prekiniAnimaciju();

    /* Turntable je jedino okretanje samog modela koje posjetilac može promijeniti. */
    el.resetTurntableRotation?.();
    postaviOkrece(true);

    /* Model još nije učitan: nema zapamćenog kadra, pa nema ni čemu da se vrati. */
    if (!cilj) return;

    const od = ocitajKadar(el);
    if (!od) return;

    const bezPokreta = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (bezPokreta) {
      primijeniKadar(el, cilj);
      el.jumpCameraToGoal?.();
      return;
    }

    const dTheta = najkraciUgao(cilj.theta - od.theta);
    const pocetak = performance.now();

    const korak = (sada: number) => {
      const k = usporeno(Math.min(1, (sada - pocetak) / TRAJANJE_RESETA));
      primijeniKadar(el, {
        theta: od.theta + dTheta * k,
        phi: od.phi + (cilj.phi - od.phi) * k,
        radius: od.radius + (cilj.radius - od.radius) * k,
        x: od.x + (cilj.x - od.x) * k,
        y: od.y + (cilj.y - od.y) * k,
        z: od.z + (cilj.z - od.z) * k,
        fov: od.fov + (cilj.fov - od.fov) * k,
      });

      /*
        Svaki kadar odmah skače na zadato, pa je ova animacija jedino
        prigušenje. Bez ovoga bi se preko nje nakalemilo i unutrašnje
        prigušenje komponente, pa bi model poslije povratka još „doplutao".
      */
      el.jumpCameraToGoal?.();

      if (k < 1) animacijaRef.current = requestAnimationFrame(korak);
      else animacijaRef.current = 0;
    };

    animacijaRef.current = requestAnimationFrame(korak);
  }

  function promijeniModel(indeks: number) {
    if (indeks === izabrani) return;
    prekiniAnimaciju();
    /* Novi model ima svoj početni kadar; stari se ne smije zadržati. */
    pocetniKadar.current = null;
    postaviStanje('ucitava');
    postaviNapredak(0);
    postaviIzabrani(indeks);
  }

  const model = MODELI[izabrani];
  const postotak = Math.round(napredak * 100);
  const poruka =
    stanje === 'greska'
      ? 'Model se nije učitao. Osvježi stranu ili je otvori ponovo kad budeš na mreži.'
      : stanje === 'ucitava'
        ? `Učitavam model… ${postotak} %`
        : `Vuci prstom da okreneš, štipni da priđeš bliže. ${model.opis}`;

  return (
    <OkvirDemonstracije
      naslov="Simulator letenja"
      oznaka="PRONA · komande helikoptera izbliza"
      nazadPutanja="/"
      nazadNaziv="Prona"
      poruka={poruka}
      alarm={stanje === 'greska'}
      napomena="Svaki model se prvi put učitava sa mreže, poslije toga radi i bez nje."
      onResetuj={resetuj}
      kontrole={
        <>
          <div className={stil.izbor} role="group" aria-label="Izbor modela">
            {MODELI.map((m, i) => (
              <button
                key={m.id}
                className={`${okvirStil.dugme} ${stil.izborDugme} ${i === izabrani ? stil.izborAktivan : ''}`}
                aria-pressed={i === izabrani}
                onClick={() => promijeniModel(i)}
              >
                {m.naziv}
              </button>
            ))}
          </div>

          <PrekidacRezima
          ukljucen={okrece}
          onPromjena={(novo) => {
            postaviOkrece(novo);
            /* Prekidač pomjera i sam model, da se vidi da je promjena primljena. */
            if (!novo) modelRef.current?.resetTurntableRotation?.();
          }}
        >
            Sam se okreće
          </PrekidacRezima>
        </>
      }
    >
      <div className={stil.okvir}>
        {spremna ? (
          <model-viewer
            ref={modelRef}
            key={model.id}
            src={model.putanja}
            alt={model.alt}
            className={stil.model}
            camera-controls=""
            touch-action="none"
            auto-rotate={okrece ? '' : undefined}
            auto-rotate-delay={1200}
            rotation-per-second="18deg"
            interaction-prompt="none"
            camera-orbit={POGLED}
            environment-image="neutral"
            shadow-intensity={1}
            shadow-softness={0.8}
            exposure={1.45}
            autoplay=""
          />
        ) : (
          <div className={stil.mjesto} aria-hidden="true" />
        )}

        {stanje === 'ucitava' && (
          <div className={stil.ucitavanje}>
            <div className={stil.traka}>
              <div className={stil.napredak} style={{ width: `${postotak}%` }} />
            </div>
            <span className={stil.postotak}>{postotak} %</span>
          </div>
        )}
      </div>
    </OkvirDemonstracije>
  );
}
