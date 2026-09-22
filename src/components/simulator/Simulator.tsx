'use client';

import { useEffect, useRef, useState } from 'react';
import { OkvirDemonstracije, PrekidacRezima } from '@/components/demo/OkvirDemonstracije';
import type { ElementModela } from '@/types/model-viewer';
import stil from './simulator.module.css';

/*
  Ka-50 kolektiv u tri dimenzije.

  Ovo je jedina strana koja koristi tuđu biblioteku za crtanje: GLB model se
  ne može prikazati bez 3D motora. <model-viewer> se uvozi tek u browseru,
  jer se pri uvozu registruje kao web komponenta, a toga na serveru nema.

  Biblioteka i model idu iz našeg izvoza, ne sa CDN-a, pa strana radi offline
  kao i sve ostalo.
*/

const MODEL = '/modeli/ka-50-collective.glb';

/** Početni pogled: malo sa strane i blago odozgo, da se vidi hod ručice. */
const POGLED = '35deg 72deg 105%';

type Stanje = 'ucitava' | 'spreman' | 'greska';

export function Simulator() {
  const [stanje, postaviStanje] = useState<Stanje>('ucitava');
  const [napredak, postaviNapredak] = useState(0);
  const [okrece, postaviOkrece] = useState(true);
  const [spremna, postaviSpremna] = useState(false);

  const modelRef = useRef<ElementModela | null>(null);

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
  }, [spremna]);

  function resetuj() {
    const el = modelRef.current;
    if (!el) return;
    el.resetTurntableRotation?.();
    el.setAttribute('camera-orbit', POGLED);
    el.setAttribute('field-of-view', 'auto');
    postaviOkrece(true);
  }

  const postotak = Math.round(napredak * 100);
  const poruka =
    stanje === 'greska'
      ? 'Model se nije učitao. Osvježi stranu ili je otvori ponovo kad budeš na mreži.'
      : stanje === 'ucitava'
        ? `Učitavam model… ${postotak} %`
        : 'Vuci prstom da okreneš, štipni da priđeš bliže. Ručica je kolektiv — njome pilot podiže i spušta helikopter.';

  return (
    <OkvirDemonstracije
      naslov="Simulator letenja"
      oznaka="PRONA · komande helikoptera izbliza"
      nazadPutanja="/"
      nazadNaziv="Prona"
      poruka={poruka}
      alarm={stanje === 'greska'}
      napomena="Model je Ka-50 kolektiv. Prvi put se učitava sa mreže, poslije toga radi i bez nje."
      onResetuj={resetuj}
      kontrole={
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
      }
    >
      <div className={stil.okvir}>
        {spremna ? (
          <model-viewer
            ref={modelRef}
            src={MODEL}
            alt="Kolektiv helikoptera Ka-50, trodimenzionalni model"
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
