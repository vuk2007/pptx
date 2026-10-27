import katex from 'katex';
import stil from './faks.module.css';

/*
  Formule se slažu pri buildu, u server komponenti. U pregledač ide gotov
  HTML i KaTeX stilovi, bez ijednog bajta KaTeX-ovog JavaScripta.

  Pogrešan TeX obara build (throwOnError, strict), umjesto da na strani
  osvane crveni tekst greške.
*/

function napravi(tex: string, blok: boolean) {
  return katex.renderToString(tex, {
    displayMode: blok,
    throwOnError: true,
    strict: 'error',
    output: 'htmlAndMathml',
  });
}

/**
  Formula u svom redu. Jednačine razdvojene sa \qquad se slažu jedna do
  druge, a na uskom ekranu prelome u novi red umjesto da se skroluju.
*/
export function Formula({ tex }: { tex: string }) {
  const dijelovi = tex.split(String.raw`\qquad`).map((d) => d.trim());
  return (
    <div className={stil.formula}>
      {dijelovi.map((d, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: napravi(d, true) }} />
      ))}
    </div>
  );
}

/** Formula u rečenici. */
export function M({ tex }: { tex: string }) {
  return <span className={stil.m} dangerouslySetInnerHTML={{ __html: napravi(tex, false) }} />;
}
