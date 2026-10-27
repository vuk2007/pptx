import { readFileSync, writeFileSync } from 'node:fs';

/*
  KaTeX stilovi za faks, bez ijednog fonta sa mreže.

  katex.min.css svaki font nudi u tri formata (woff2, woff, ttf), a Next bi
  u izvoz kopirao sva tri, pa bi ih service worker sve prekeširao. Svaki
  pregledač koji ovaj sajt podržava čita woff2, pa ostaje samo on: 20
  fajlova umjesto 60. Putanje se prepišu da pokazuju u node_modules, a
  Next ih pri buildu prebaci u _next/static i servira sa našeg domena.

  Izlaz nije u gitu; pravi se prije `next dev` i `next build`.
*/

const IZVOR = 'node_modules/katex/dist/katex.min.css';
const CILJ = 'src/app/faks/katex.css';

const css = readFileSync(IZVOR, 'utf8');
const izlaz = css
  .replace(/,url\(fonts\/[^)]+\.(?:woff|ttf)\) format\("(?:woff|truetype)"\)/g, '')
  .replaceAll('url(fonts/', 'url(../../../node_modules/katex/dist/fonts/');

const fontova = (izlaz.match(/\.woff2\)/g) ?? []).length;
const ostalo = (izlaz.match(/\.(?:woff|ttf)\)/g) ?? []).length;
if (fontova === 0 || ostalo > 0) {
  console.error(`  GREŠKA  KaTeX stilovi: ${fontova} woff2, ${ostalo} drugih formata`);
  process.exit(1);
}

writeFileSync(CILJ, `/* Napravljeno iz ${IZVOR} (scripts/pripremi-katex.mjs). Ne mijenjaj ručno. */\n${izlaz}\n`);
console.log(`  OK   KaTeX stilovi: ${fontova} fontova, samo woff2`);
