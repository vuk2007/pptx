import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/*
  Najmanji mogući klijent za Chrome DevTools Protocol.
  Node 24 ima ugrađen WebSocket, pa za vožnju browsera ne treba nijedna biblioteka.
*/

const PUTANJE_CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

export function nadjiChrome() {
  const nadjen = PUTANJE_CHROME.find((p) => p && existsSync(p));
  if (!nadjen) throw new Error('Chrome nije nađen. Provjeri PUTANJE_CHROME u scripts/cdp.mjs.');
  return nadjen;
}

const cekaj = (ms) => new Promise((r) => setTimeout(r, ms));

export async function pokreniChrome({ port = 9222, sirina = 1920, visina = 1080, dodatno = [] } = {}) {
  const profil = mkdtempSync(join(tmpdir(), 'praktikum-chrome-'));
  const proces = spawn(
    nadjiChrome(),
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profil}`,
      '--headless=new',
      `--window-size=${sirina},${visina}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--hide-scrollbars',
      ...dodatno,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  for (let pokusaj = 0; pokusaj < 60; pokusaj++) {
    try {
      const odgovor = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (odgovor.ok) {
        return {
          port,
          zatvori: () => {
            proces.kill();
            try {
              rmSync(profil, { recursive: true, force: true });
            } catch {
              /* Windows ponekad drži fajlove profila; nije bitno. */
            }
          },
        };
      }
    } catch {
      /* Browser se još diže. */
    }
    await cekaj(250);
  }
  proces.kill();
  throw new Error('Chrome se nije javio na debug portu.');
}

export async function otvoriKarticu(port) {
  const odgovor = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const meta = await odgovor.json();
  const ws = new WebSocket(meta.webSocketDebuggerUrl);
  await new Promise((rijesi, odbij) => {
    ws.onopen = rijesi;
    ws.onerror = () => odbij(new Error('WebSocket ka kartici nije uspio.'));
  });

  let sljedeciId = 1;
  const cekaoci = new Map();
  const slusaoci = new Map();

  ws.onmessage = (dogadjaj) => {
    const poruka = JSON.parse(dogadjaj.data);
    if (poruka.id && cekaoci.has(poruka.id)) {
      const { rijesi, odbij } = cekaoci.get(poruka.id);
      cekaoci.delete(poruka.id);
      if (poruka.error) odbij(new Error(poruka.error.message));
      else rijesi(poruka.result);
    } else if (poruka.method && slusaoci.has(poruka.method)) {
      for (const f of slusaoci.get(poruka.method)) f(poruka.params);
    }
  };

  return {
    posalji(metod, parametri = {}) {
      const id = sljedeciId++;
      return new Promise((rijesi, odbij) => {
        cekaoci.set(id, { rijesi, odbij });
        ws.send(JSON.stringify({ id, method: metod, params: parametri }));
      });
    },
    na(dogadjaj, funkcija) {
      if (!slusaoci.has(dogadjaj)) slusaoci.set(dogadjaj, []);
      slusaoci.get(dogadjaj).push(funkcija);
    },
    zatvori: () => ws.close(),
  };
}

/** Izvršava izraz u stranici i vraća vrijednost (await se podrazumijeva). */
export async function uStranici(kartica, izraz) {
  const { result, exceptionDetails } = await kartica.posalji('Runtime.evaluate', {
    expression: izraz,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'Greška u stranici');
  return result.value;
}

export { cekaj };
