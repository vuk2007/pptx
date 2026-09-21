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
| `npm run provjeri-qr` | Kodira pa dekodira QR nazad, uključujući Reed-Solomon sindrome |
| `npm run provjeri-h-most` | Iscrpno provjerava tabelu istinitosti H-mosta |
| `npm run provjeri-paket` | Provjerava šta XOR hvata, a šta mu promakne |
| `npm run snimi-demo <folder>` | Vozi demonstracije kroz stvarna stanja i snima svako |
| `npm run snimi <folder> [š] [v]` | Snima strane u zadatoj rezoluciji, onako kako ih vidi TV |
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

## QR kod

`scripts/qr.mjs` je sopstveni QR enkoder (bajt režim, nivo ispravke M, verzije
1–10), pa ni build nema zavisnosti. QR koji se ne skenira gori je nego nikakav,
zato `scripts/provjeri-qr.mjs` svaki kod pročita nazad istim putem kojim ga čita
telefon — format, maska, redosljed modula, raspletanje blokova i Reed-Solomon
sindromi — i pada ako round-trip ne vrati polazni tekst. Build ga pokreće.

Kod se pravi samo kad `QR_URL` nije prazan. Dok jeste, `/pocni` ide bez koda.

## Demonstracije

Logika koja nosi objašnjenje stoji odvojeno od crteža, da se može provjeriti sama
za sebe. [`src/lib/h-most.ts`](src/lib/h-most.ts) zna samo za četiri prekidača i
šest režima, a `npm run provjeri-h-most` prođe kroz **svih 16 kombinacija
prekidača i svih 8 ulaza L298N** i potvrdi da nijedan ulaz čipa ne može da
napravi kratak spoj. Build pada ako neki od tih 24 slučaja promijeni ponašanje.

[`src/lib/paket.ts`](src/lib/paket.ts) nosi drugu tvrdnju koja mora biti tačna:
jedna pokvarena bit-pozicija uvijek obori XOR provjeru, a ista bit-pozicija
pokvarena u dva bajta uvijek prođe. Druga je cijela poenta demonstracije
(„zato postoje jače provjere, kao CRC"), pa se ne vjeruje na riječ —
`npm run provjeri-paket` prođe kroz 43 512 slučajeva.

Animacije idu kroz [`src/lib/animacija.ts`](src/lib/animacija.ts) i pišu direktno
u DOM atribute, a ne u React state — SVG se ne prerenderuje šezdeset puta u
sekundi zbog jednog ugla.

## Dizajn

Paleta, tipografska skala i pokret žive u [`src/app/globals.css`](src/app/globals.css).
Tri boje petlje (`--osjeti`, `--odluci`, `--djeluj`) su razmaknute po nijansi i od
zelene ploče i od bakra, i nigdje ne nose značenje same — uz njih uvijek stoji
riječ, pa daltonizam ništa ne odnosi.

PCB primitivi (vod sa strujom, pad, via, LED, obris komponente, silkscreen tekst)
su u [`src/components/ploca/primitivi.tsx`](src/components/ploca/primitivi.tsx),
a ilustracije slajdova u [`src/components/ilustracije/`](src/components/ilustracije/).

## Faze

0. ✅ Kostur: rute, statički izvoz, service worker, manifest, offline dokazan
1. ✅ Dizajn sistem, početna strana, izlog sa 21 slajdom i bilješkama, `/pocni`, QR enkoder
2. ✅ H-most i PWM
3. ✅ Radio paket, suspenzija, dvostruki servo
4. XGO demonstracije
5. Jarvis demonstracije i tri radija
6. Završna provjera na TV-u i iPadu
