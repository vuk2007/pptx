# Faks i sajam

Jedan statički sajt sa dvije cjeline:

| Adresa | Šta je |
| --- | --- |
| `/` | Početna: izbor između Faksa i Sajma |
| `/faks` | Interaktivni eksperimenti za prvu godinu elektrotehnike, po predmetima |
| `/faks/oe1` | Osnove elektrotehnike I, eksperimenti po poglavljima (§2, §3, …) |
| `/faks/oe1/<slug>` | Jedan eksperiment |
| `/sajam/...` | Praktikum elektronike za sajam nauke |

**Sajam** zamjenjuje PowerPoint na štandu. Tri eksponata — Perjanik (rover),
XGO psi i Jarvis — kroz petlju **osjeti → odluči → djeluj**. Radi na TV-u
(1920×1080, klikerom ili tastaturom) i na iPadu (dodir), i mora raditi
**potpuno offline** poslije prvog učitavanja. Stare adrese (`/izlog`, `/xgo`, …)
preusmjerava `vercel.json` na `/sajam/...`.

**Faks** radi na laptopu, iPadu, telefonu i TV-u, takođe offline, bez naloga
i bez ikakvog praćenja. Opis je u sekciji [Faks](#faks).

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
| `npm run provjeri-xgo` | Povratni test kinematike noge i serijskog paketa za psa |
| `npm run provjeri-pipeline` | Provjerava raspored faza i tvrdnju o uštedi koju streaming donosi |
| `npm run provjeri-talasi` | Mjeri brjegove nacrtanih talasa i poredi ih sa λ = c / f |
| `npm run provjeri-glas` | Paleta spektrograma i ilustrativni govor kroz 30 000 kadrova |
| `npm run provjeri-fizika` | Fizika eksperimenata za faks: formule naspram brojanja, kadar po kadar |
| `npm run provjeri-raspored` | Otvara svaku rutu u četiri veličine i mjeri viri li išta van ekrana |
| `npm run provjeri-vercel` | Provjerava da `vercel.json` ima samo ključeve koje Vercel priznaje |
| `npm run provjeri-analitiku` | Provjerava da se analitika javlja samo na pravoj adresi |
| `npm run provjeri-modele` | Provjerava da 3D modeli stvarno uđu u keš i rade bez mreže |
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

## Faks

Svaka strana eksperimenta ima isti raspored, istim redom: naslov i poglavlje,
**predvidi prije nego što pomjeriš**, interaktivni dio, šta gledaš, veza s
formulom i česta greška. Raspored je u
[`src/components/faks/Eksperiment.tsx`](src/components/faks/Eksperiment.tsx);
eksperiment donosi samo sadržaj.

Predviđanje nije ukras: dok se ne izabere odgovor, interaktivni dio je
zaključan (`inert`), a tačan odgovor se otkriva tek na poseban klik, kad je
već bilo vremena da se proba. „Preskoči predviđanje" otključa bez odgovora.

Oznake prate udžbenik (Humar, Bulić, Sinigoj, *Osnove elektrotehnike I*):
`Q`, `ρ`, `σ`, `q`, `a` za površinu, `i` i `I`, `J`, `w` za brzinu nosilaca,
`Q_not` i `Q_zun`, `E`, `T` i `T'`, `R`; vektori podebljani. Tekst, slike i
zadaci iz knjige se **ne kopiraju**; sva objašnjenja su naša.

Formule slaže KaTeX **pri buildu**, u server komponenti
([`Formula.tsx`](src/components/faks/Formula.tsx)): u pregledač ide gotov HTML,
bez KaTeX-ovog JavaScripta. Pogrešan TeX obara build. KaTeX stilove pravi
[`scripts/pripremi-katex.mjs`](scripts/pripremi-katex.mjs) iz `node_modules`, samo
sa woff2 fontovima, pa ih service worker kešira kao i sve ostalo.

Boje na crtežima nose fizičko značenje: `--naboj-plus` i `--naboj-minus` samo
predznak, `--normala`, `--brzina`, `--polje`, a struja ide kroz `--current`.
Mjesto (unutra, vani) se crta oblikom, ne bojom.

Simulacije sa nabojima ne koriste `Math.random`, nego
[`slucajno.ts`](src/lib/fizika/slucajno.ts) sa sjemenom: isto sjeme daje isto
kretanje, pa provjera može brojati naboje. Sa `prefers-reduced-motion`
simulacije počinju zaustavljene i pokreću se dugmetom.

Analitika postoji samo pod `/sajam`
([`src/app/sajam/layout.tsx`](src/app/sajam/layout.tsx)); faks i početna se ne
broje, što `npm run provjeri-analitiku` i provjerava.

### Kako dodati eksperiment

1. **Fizika.** Ako eksperiment nešto računa, čista funkcija ide u
   `src/lib/fizika/<tema>.ts`, bez ijednog pomena crtanja. Test ide u
   [`scripts/provjeri-fizika.mjs`](scripts/provjeri-fizika.mjs): najbolje
   nezavisnim putem do istog broja (formula naspram brojanja, analitički
   naspram numeričkog), ne samo „funkcija vrati ono što vrati". Provjeri test
   tako što namjerno pokvariš funkciju i vidiš da pada.
2. **Folder** `src/eksperimenti/<predmet>/<slug>/` sa dva fajla:
   - `Simulacija.tsx` — klijentska komponenta (`'use client'`) bez propsa.
     Slaže se kroz `Laboratorija` (crtež, kontrole, očitavanja, statusna
     linija), sa `Klizac`, `Taster` i `Ocitavanje` iz `components/instrument`.
     Animacija ide kroz `useAnimacija`, brojevi kroz `broj()` iz `lib/format`
     (decimalni zarez, pravi minus), uvijek sa jedinicom.
   - `sadrzaj.tsx` — server modul koji izvozi `SadrzajEksperimenta`
     ([`tipovi.ts`](src/components/faks/tipovi.ts)): pitanje sa opcijama i
     objašnjenjem, 2–4 stavke „Šta gledaš", formulu u TeX-u sa vezama
     simbol → kontrola, i jednu rečenicu o čestoj grešci. Formula u rečenici
     ide kroz `<M tex="..." />`.
3. **Jedan red** u [`src/sadrzaj/eksperimenti.ts`](src/sadrzaj/eksperimenti.ts):
   `slug`, `predmet`, `poglavlje` (npr. `'§4'`), `naslov`, `opis` (jedna
   rečenica), `status: 'gotovo'` i
   `ucitaj: () => import('@/eksperimenti/<predmet>/<slug>/sadrzaj')`.
   Ako red već postoji sa `'u izradi'`, samo mu promijeni status i dodaj `ucitaj`.
4. Ruta u [`provjeri-raspored.mjs`](scripts/provjeri-raspored.mjs) i
   [`provjeri-offline.mjs`](scripts/provjeri-offline.mjs), pa `npm run build`,
   `npm run provjeri-raspored` i `npm run provjeri-offline`.

Lista na `/faks/<predmet>` i strelice „prethodni / sljedeći" prave se same iz
registra. Nov predmet je red u `PREDMETI` i spisak u `POGLAVLJA`; njegova
strana nastane čim ima prvi gotov eksperiment.

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

Kod [`src/lib/noga.ts`](src/lib/noga.ts) jedini pošten test je povratni: uzmi
tačku, izračunaj uglove, pa iz tih uglova vrati stopalo i vidi je li stiglo
odakle si krenuo. `npm run provjeri-xgo` to radi na mreži tačaka, zajedno sa
serijskim paketom za psa, gdje je checksum invertovan najniži bajt zbira.

[`src/lib/pipeline.ts`](src/lib/pipeline.ts) pravi raspored Jarvisovih faza, a
`npm run provjeri-pipeline` ga prolazi kroz mrežu mogućih vremena i drži jednu
invarijantu: ušteda koju streaming donosi jednaka je tačno onome što mozgu treba
od prve rečenice do kraja odgovora. Ako neko promijeni broj u `cinjenice.ts`,
crtež i rečenica ispod njega ostaju u skladu — ili build pada.

Kod [`src/lib/talasi.ts`](src/lib/talasi.ts) jedina fizika je λ = c / f, ali
crtež tvrdi da su tri talasa u razmjeri. To se ne provjerava gledanjem:
`npm run provjeri-talasi` iz nacrtanih tačaka izmjeri razmak između brjegova i
uporedi ga sa traženom talasnom dužinom. Faktor 2π na pogrešnom mjestu oku bi
i dalje izgledao uredno.

Spektrogram u [`src/components/demo/Glas.tsx`](src/components/demo/Glas.tsx) je
jedina slika na sajtu koja se crta na `<canvas>`, a ne u SVG-u — drži nekoliko
stotina kolona istorije, što bi u SVG-u bilo na desetine hiljada pravougaonika
po kadru. Mikrofon se čita preko `AnalyserNode`-a i nigdje se ne spaja na
zvučnik, pa nema zavijanja u sali; nema ni `MediaRecorder`-a ni ijednog mrežnog
poziva, tako da tvrdnja „ništa se ne snima" stoji u kodu, ne samo na ekranu.

## Tri dimenzije i granica sa bibliotekama

Sajt nema nijednu biblioteku za crtanje — sve je SVG i `requestAnimationFrame`.
Jedan izuzetak je [`/sajam/simulator`](src/components/simulator/Simulator.tsx), gdje
se prikazuje GLB model Ka-50 kolektiva: GLB se ne može prikazati bez 3D motora.
Tu stoji Googleov `<model-viewer>`, instaliran preko npm-a i serviran iz našeg
izvoza, bez CDN-a. Uvozi se tek u browseru, jer se pri uvozu registruje kao
web komponenta.

Modeli su krupni (16 MB u tri fajla), pa je service worker podijeljen u dva
koraka. `cache.addAll` je sve-ili-ništa: da su modeli u istom spisku, jedan
prekid na lošem sajamskom wifiju ostavio bi sajt bez **ijednog** keširanog
fajla — dakle bez elektronike, zbog helikoptera. Zato sve ispod 1,5 MB ide
atomično i odmah (3,3 MB), a krupno se dovlači poslije, jedan po jedan, i
svaki fajl smije da padne za sebe.

Krupno se dovlači **na poruku sa strane**, a ne u `activate` događaju. Dok
`waitUntil` u `activate` ne završi, worker stoji u stanju „activating", a
tada offline navigacija nema ko da posluži — browser pokaže svoju stranu o
grešci umjesto sajta. Sa šesnaest megabajta taj prozor traje koliko i
preuzimanje.

Poruka ide na `registracija.active`, ne na `navigator.serviceWorker.controller`:
pri prvoj posjeti strana je učitana bez kontrolera, pa se `controller` popuni
tek poslije `clients.claim()`. Sa kontrolerom upit tiho promaši i modeli nikad
ne uđu u keš, a nijedna druga provjera to ne vidi — offline provjera gleda
strane, ne modele. Zato postoji `npm run provjeri-modele`.

Logo na ulaznoj strani je [`public/prona.svg`](public/prona.svg). Trenutno je
**privremen** — zamijeni fajl pravim logotipom, kod se ne dira. Strana ga
svakako prikazuje kao bijeli silkscreen, pa boja u fajlu nije bitna.

## Objavljivanje

Sajt je čist statički izvoz, pa na Vercelu namjerno **nema** Next.js preseta:
`"framework": null` u [`vercel.json`](vercel.json). Sa Next.js presetom Vercel
traži `routes-manifest.json` u izlaznom folderu, a taj fajl živi u `.next/`,
dok mi objavljujemo `out/` — deploy tada pada prije nego što išta počne.
`trailingSlash` mora da se slaže sa `next.config.mjs`, inače svaka unutrašnja
veza ide kroz preusmjeravanje.

### Analitika i pravilo o mreži

Sajt inače ne pravi nijedan mrežni poziv u runtime-u — sve ide iz keša
service workera. Vercel Analytics je **jedini izuzetak** i uveden je svjesno:
dovlači `/_vercel/insights/script.js` i za svaku posjetu šalje jedan signal.

Zato je ograničen na pravu adresu i na sajam ([`src/components/Analitika.tsx`](src/components/Analitika.tsx)).
Lokalno te putanje nema, pa bi se svaka strana javljala greškom u konzoli i
oborila provjeru koja traži nula grešaka — a ta provjera je jedino što čuva
pravilo da sajt ništa ne vuče sa mreže. `npm run provjeri-analitiku` drži oba
slučaja: lokalno mora da ćuti, na pravom domenu mora da se ubaci.

Service worker namjerno ne dira `/_vercel/` putanje: nema ih u izvozu, nema
šta da se kešira, a bez mreže poziv padne i sajt to ne osjeti — samo se ta
posjeta ne izbroji. Na sajmu, gdje mreža i jeste nepouzdana, većina posjeta
se neće izbrojati. To je cijena koju analitika ovdje plaća, i zato sajt na
nju ni u čemu ne računa.

Ovo objašnjenje stoji ovdje jer JSON nema komentare, a ključ `"//"` Vercel
odbija: njegova šema ne prima nijedan nepoznat ključ i obara deploy prije
build-a. `npm run provjeri-vercel` to hvata lokalno i ide prvi u build lancu,
prije svega skupog.

Raspored se provjerava mjerenjem, ne gledanjem. `npm run provjeri-raspored`
otvori svaku rutu na 1080p, 4K i u dvije veličine iPada, a faks i na širini
telefona, pa izmjeri svaki natpis: mora cio da stoji na ekranu (na faksu, koji
se skroluje, bar po širini), i mora da stane u viewBox svog SVG-a.
Ono što je nacrtano izvan viewBox-a preživi na širokom ekranu, a na uskom ga
ivica ploče odsiječe — zato se to na 16:9 ne primijeti.

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
4. ✅ XGO demonstracije
5. ✅ Jarvis demonstracije i tri radija
6. ✅ Završna provjera na TV-u; ostaje probati na iPadu (spisak ispod)

## Šta treba probati na iPadu

Safari se ne može voziti iz komandne linije, a dvije stvari traže HTTPS i
pravi uređaj. Ovo je spisak za provjeru na sajmu, preko Vercel adrese:

- `/jarvis/glas` — „Uključi mikrofon", pa provjeriti da se talas miče i da
  se iz zvučnika **ništa** ne čuje (mikrofon namjerno nije spojen na izlaz).
- `/xgo/ravnoteza` — mora se pojaviti dugme „Koristi nagib iPada"; poslije
  dozvole nagni uređaj. Ako se senzor ne javi za sekundu i po, demonstracija
  to kaže i vrati se na klizač.
- Izlog: prevlačenje prstom mijenja slajd i pauzira auto-prelaz; savjet dolje
  desno mora pisati „prevuci za sljedeći slajd", a ne spisak tastera.
- Bilo koja demonstracija: dupli dodir ne smije da zumira stranu, i strana ne
  smije da se gumeno vuče gore-dolje.
- Avionski režim poslije prve posjete: sve rute i dalje rade.
- `/simulator` — model se okreće prstom i zumira štipanjem, a strana se pri
  tome ne pomjera.

## Šta još čeka

- `public/prona.svg` je privremen logo.
- Četiri TODO-a u [`src/config/cinjenice.ts`](src/config/cinjenice.ts).
- Dio „Simulator letenja" zasad ima samo model; sadržaj dolazi od drugog mentora.
