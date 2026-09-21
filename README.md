# Praktikum elektronike

Sajt koji na sajmu nauke zamjenjuje PowerPoint. Tri eksponata — Perjanik (rover),
XGO psi i Jarvis — kroz petlju **osjeti → odluči → djeluj**.

Radi na TV-u (1920×1080, klikerom ili tastaturom) i na iPadu (dodir), i mora raditi
**potpuno offline** poslije prvog učitavanja.

## Komande

| Komanda | Šta radi |
| --- | --- |
| `npm run dev` | Razvojni server |
| `npm run build` | Lint, statički izvoz u `out/`, ikone, service worker |
| `npm start` | Servira `out/` na http://localhost:4173 |
| `npm run provjeri-offline` | Digne server, pusti Chrome, isključi mrežu i provjeri da sve i dalje radi |
| `npm run typecheck` | TypeScript bez emitovanja |

`npm run build` pada ako postoji ijedno lint upozorenje. To je namjerno.

## Pravila projekta

- **Nula runtime mrežnih zahtjeva.** Fontovi idu kroz `next/font` (self-hosted pri
  buildu), ikone se crtaju pri buildu, ništa se ne učitava sa CDN-a.
- **Sve nepoznate činjenice žive u [`src/config/cinjenice.ts`](src/config/cinjenice.ts).**
  Ako je vrijednost `null` ili prazan string, strana prikazuje neutralnu verziju bez
  tog detalja. Nikad izmišljen broj.
- **Perjanik ima četiri točka**, suspenzija je rocker sa diferencijalom. Ne
  „rocker-bogie", ne šest točkova.
- Animacije: SVG + React state + `requestAnimationFrame`. Bez teških biblioteka.

## Kako radi offline

`scripts/generate-sw.mjs` se izvršava poslije `next build`, prošeta kroz `out/`
i upiše spisak svih fajlova u `out/sw.js`. Service worker ih prekešira pri
instalaciji, pa služi iz keša prije mreže. Verzija keša je otisak sadržaja, pa
svaki novi build donosi nov keš i briše stari.

`npm run provjeri-offline` to stvarno provjerava: vozi Chrome preko DevTools
protokola (bez ijedne biblioteke — Node 24 ima ugrađen WebSocket), učita sajt,
isključi mrežu, osvježi i prošeta kroz duboke rute.

## Faze

0. ✅ Kostur: rute, statički izvoz, service worker, manifest, offline dokazan
1. Dizajn sistem, početna strana, izlog sa slajdovima i bilješkama
2. H-most i PWM
3. Radio paket, suspenzija, dvostruki servo
4. XGO demonstracije
5. Jarvis demonstracije i tri radija
6. Završna provjera na TV-u i iPadu
