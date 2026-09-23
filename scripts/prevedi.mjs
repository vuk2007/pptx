import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

/*
  Prevodi čiste module iz src/ da ih provjere mogu uvesti u Node-u.

  Moduli se uvoze preko „@/..." kao u aplikaciji. tsc tu putanju ostavlja
  netaknutu, a Node je ne zna, pa se svaki fajl prvo kopira u privremeni
  folder sa istim rasporedom i „@/x" se prepiše u relativno „./x.js".
*/

export async function prevedi(fajlovi, prefiks = 'provjera-') {
  const radni = mkdtempSync(join(tmpdir(), prefiks));
  const izvori = join(radni, 'src');

  for (const fajl of fajlovi) {
    const cilj = join(izvori, relative('src', fajl));
    mkdirSync(dirname(cilj), { recursive: true });
    const tekst = readFileSync(fajl, 'utf8').replace(/from '@\/([^']+)'/g, (_, putanja) => {
      let rel = posix.relative(posix.dirname(relative('src', fajl).replaceAll('\\', '/')), putanja);
      if (!rel.startsWith('.')) rel = `./${rel}`;
      return `from '${rel}.js'`;
    });
    writeFileSync(cilj, tekst);
  }

  execFileSync(
    process.execPath,
    [
      join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'),
      ...fajlovi.map((f) => join(izvori, relative('src', f))),
      '--outDir', join(radni, 'out'),
      '--rootDir', izvori,
      '--module', 'esnext',
      '--target', 'es2022',
      '--moduleResolution', 'bundler',
      '--strict',
      '--skipLibCheck',
    ],
    { stdio: 'inherit' },
  );

  return {
    uvezi: (fajl) => import(pathToFileURL(join(radni, 'out', relative('src', fajl).replace(/\.ts$/, '.js'))).href),
    pocisti: () => rmSync(radni, { recursive: true, force: true }),
  };
}
