# The Eye of the Kat — Bouwlog

Logboek per bouwblok, nieuwste onderaan. Dit is de bron voor "hoe is de app gebouwd". Elk
blok gebruikt het sjabloon hieronder. Verwijs naar beslissingen met hun nummer (bv. #5).

## Sjabloon

```markdown
## Blok N — <titel>  (datum start → datum afgetekend)

**Doel:** wat dit blok moest opleveren.
**Gebouwd:** wat er effectief staat, in gewone taal.
**Hoe het werkt:** de technische aanpak, inclusief kern-algoritmes en drempelwaarden.
**Bestanden:** nieuw/gewijzigd, met één regel uitleg per bestand (vermeld "overgenomen uit Idol Academy, <pad>" waar van toepassing).
**Beslissingen:** nieuwe of gewijzigde beslissingen (#...).
**Getest:** automatische tests + resultaten van Kristofs test op het toestel (toestel, oriëntatie, licht, fps, bevindingen).
**Problemen en oplossingen:** wat misliep en hoe het opgelost is.
**Les voor B-world:** wat je bij de overname moet weten of overnemen.
```

---

## Blok 1 — Fundament  (2026-10-11 → wacht op test door Kristof)

**Doel:** de basis neerzetten: een webapp die de camera opent, elk beeld verkleint naar een
klein analysebeeld, meet hoe snel dat gaat, en technisch niets kan versturen.

**Gebouwd:**
- Projectopzet met React + Vite + TypeScript (strict) + Vitest (#27).
- Publieke repo `kristofpeeters81-lgtm/EyeOfTheKat` met een GitHub Actions-workflow die test,
  bouwt en publiceert op https://kristofpeeters81-lgtm.github.io/EyeOfTheKat/ (#21, #36).
- Offline: een service worker die bij de build gegenereerd wordt en alle app-bestanden in de
  cache bewaart.
- **CSP `connect-src 'none'`** (#4) als meta-tag in de gebouwde pagina. De pagina kan geen enkele
  verbinding openen, ook niet naar de eigen server.
- **Privacycontrole** `scripts/check-privacy.mjs` (#48). Die draait vóór elke test, vóór elke
  build en nog eens op de gebouwde bestanden.
- Een startscherm en een **cameratest**: een grofkorrelige preview van wat de app ziet
  (160×120) en het debugbalkje (fps + later Ninja Power). Tik je op het balkje, dan zie je het
  bewegingsmasker, de camera-resolutie, de analysegrootte, de verwerkingstijd en de versie (#39).

**Hoe het werkt:**
- `CameraSession` (src/runtime/session.ts) start de camera (640×480, voorcamera) in een
  onzichtbaar `<video>`-element. Per nieuw camerabeeld (`requestVideoFrameCallback`, met
  `requestAnimationFrame` als terugval) tekent `FrameGrabber` het beeld gespiegeld op een
  canvas in het geheugen, met een lange zijde van 160 px (#46). Daarna leest hij de pixels uit.
  Bij een staande camera wordt dat 120×160 (#11).
- `MotionMeter` (src/vision/motion.ts) zet elk beeld om naar helderheid en telt de pixels die
  meer dan 22 (op 255) veranderden tegenover het vorige beeld. Twee buffers wisselen elkaar af,
  zodat er per beeld geen nieuw geheugen nodig is.
- Spiegelen gebeurt al bij het ophalen. Daardoor is "links" in alle verdere berekeningen ook
  links voor het kind dat naar het scherm kijkt.

**Bestanden:**
| Bestand | Uitleg |
|---|---|
| `vite.config.ts` | CSP-plugin, service-worker-plugin, versienummer, `base: './'` |
| `scripts/check-privacy.mjs` | controle: geen ML-pakketten/imports, geen netwerk-API's, CSP aanwezig |
| `scripts/e2e.mjs` + `scripts/e2e-scenarios.mjs` | eind-tot-eind-test in headless Chrome met nep-camera; scenario's per blok |
| `src/camera/camera.ts` | camera starten/stoppen, foutcodes (overgenomen uit Idol Academy, `src/motor/camera.ts`) |
| `src/camera/frameGrabber.ts` | camerabeeld → klein gespiegeld analysebeeld |
| `src/runtime/session.ts` | de beeldlus + fps/verwerkingstijd |
| `src/runtime/debug.ts` | gedeelde debuggegevens (lus schrijft, paneel leest) |
| `src/vision/types.ts` | basistypes van de detectiemotor |
| `src/vision/motion.ts` | bewegingsmeting (verschil tussen beelden) |
| `src/render/mask.ts` | maskers en preview tekenen |
| `src/app/*` | React-schil: App, CameraCheck, DebugBar, stijl |
| `src/app/fonts/` | Unbounded + Outfit (OFL, overgenomen uit Idol Academy) |

**Beslissingen:** #4 en #48 uitgevoerd, #49 (doorbouwen).

**Getest:**
- Unit tests: `MotionMeter` (stilstand, echte verandering, ruis onder de drempel).
- E2E (headless Chrome, Chromes eigen testbeeld als camera): de camera start, de beelden worden
  verwerkt (160×120), er gaan geen verzoeken naar buiten, en ook na het laden geen enkel
  netwerkverzoek. De CSP staat erin, en een bewuste `fetch`-poging wordt geblokkeerd. Geen
  consolefouten.
- **Op het toestel: nog niet getest** (#49). Kristof: open de link op de gsm, de oude tablet en
  de laptop, tik "Cameratest" en noteer de fps en ms/beeld uit het debugpaneel.

**Problemen en oplossingen:**
- TypeScript kent `requestVideoFrameCallback` al als verplicht. Een eigen interface met een
  optionele variant botste daarmee, dus nu wordt er gecontroleerd met `'requestVideoFrameCallback' in video`.

**Les voor B-world:**
- `connect-src 'none'` werkt enkel als de app niets hoeft te laden na de start. B-world zelf
  heeft wellicht wel verbindingen nodig. Dan kan de module enkel in een eigen pagina of iframe
  met een eigen CSP draaien, of moet de CSP van B-world `connect-src 'self'` worden (dan is de
  garantie zwakker; zie de herbouwgids).
- De privacycontrole is een los Node-script en is in elke repo bruikbaar.

## Blok 2 — Silhouetmotor + kalibratie  (2026-10-11 → wacht op test door Kristof)

**Doel:** zonder AI het kind in beeld vinden, de lichaamsmaten vastleggen en elk beeld uitdrukken
als een "houding" tegenover die maten. Ook meten hoe hard het kind beweegt (Ninja Power) en
nagaan of het (alleen) in beeld staat.

**Gebouwd:**
- Een kalibratiescherm (#30): toestel klaarzetten (met tips en een kleine grofkorrelige
  camerapreview), dan "Stap opzij!" met een aftelling 5-4-3-2-1. De app leert de lege kamer,
  en daarna "Kom terug en ga in de schaduw-ninja staan". De Geest geeft aanwijzingen
  (achteruit, naar links, ...) en de schaduw-ninja loopt vol terwijl het kind stilstaat. De
  preview toont na het klaarzetten enkel nog het silhouet als effen vorm (#10).
- Het debugpaneel toont nu het silhouetmasker en live waarden: fase, voorgrond-%, belichting,
  silhouetmaat, ruimte-check, hoogte, breedte, voeten los, top omhoog, verschuiving,
  aanwezigheid, benen-power en zone.

**Hoe het werkt (src/vision/):**
1. **Achtergrondmodel** (`background.ts`): tijdens het leren wordt per pixel de gemiddelde kleur
   en de schommeling (ruis) bijgehouden over 24 stilstaande beelden. Beweegt er meer dan 0,6 %
   van het beeld tussen twee beelden, dan begint het leren opnieuw. Een pixel is voorgrond als
   |ΔR|+|ΔG|+|ΔB| > max(48, 4 × ruis), behalve:
   - **schaduw/licht:** de pixel is een veelvoud α ∈ [0,55; 1,3] van de achtergrondkleur, met
     een kleurafwijking < 10 % van de achtergrondhelderheid + 6;
   - **bijregelende camera:** een globale "gain" (som helderheid / som achtergrond, op elke 3e
     pixel die vorige keer achtergrond was, afgevlakt met factor 0,35) wordt meegerekend.
   - Bijwerken: achtergrondpixels 1 %/beeld, voorgrond die niet de speler is (een verschoven
     stoel) 0,3 %/beeld, de speler + 3 pixels marge nooit.
2. **Opruimen** (`morph.ts`): openen (3×3) tegen ruis, dan 2× sluiten tegen gaatjes.
3. **Vlekken** (`components.ts`): samenhangende vlekken (4-buren), de grootste is de speler.
   Vlekken die horizontaal binnen 12 % van de lichaamshoogte liggen, worden erbij gerekend (een
   hoofd dat door een gat los kwam). Grote vlekken (≥15 % van de speler) die verder liggen, zijn
   "anderen".
4. **Silhouet** (`silhouette.ts`): kader, zwaartepunt, bovenkant/onderkant (eerste/laatste rij
   met ≥2 pixels), en `cxLow` = zwaartepunt van het onderste 40 % (benen), dat niet verschuift
   als je je armen spreidt.
5. **Ruimte-check + kalibratie** (`calibration.ts`): voeten in beeld, lichaam 35–80 % van de
   beeldhoogte, ≥8 % ruimte boven het hoofd, midden binnen ±14 % van de breedte. Bij een goede
   positie en stilstand (Power < 12) worden 20 beelden verzameld. Van elke maat wordt de
   mediaan genomen.
6. **Houding** (`toPose`): heightRatio, widthRatio, topRise, feetRise en shift, alles in
   lichaamslengtes, dus onafhankelijk van afstand, lengte en liggend/staand (#11).
7. **Ninja Power** (`power.ts`, #44): bewegende pixels (Δhelderheid > 22) binnen het spelerkader
   + 15 % marge, gedeeld door de gekalibreerde oppervlakte, omgerekend naar per 1/30 s.
   0,5 = 100 Power. Afgevlakt met een tijdconstante van 600 ms. Zones: <20, <45, <70, ≥70.
   Benen-power = hetzelfde voor het onderste 45 %.
8. **Aanwezigheid** (`presence.ts`): `missing` (silhouet < 30 % van de oppervlakte of < 35 % van
   de hoogte), `two` (andere vlek ≥ 35 % oppervlakte en ≥ 40 % hoogte), `scene` (> 55 % van het
   beeld is voorgrond). Een probleem telt na 450 ms, herstel na 350 ms.
9. **Motor** (`engine.ts`): één `process(frame, t)` per beeld voert alles uit. Beelden groter dan
   160 px worden eerst gehalveerd.
10. **Kalibratieverloop** (`src/runtime/calibrationFlow.ts`): toestandsmachine aim → countdown →
    learning → enter → done, zonder UI en dus testbaar. Na 9 s zonder stilstaande kamer begint
    ze opnieuw.

**Bestanden:** `src/vision/{background,morph,components,silhouette,calibration,presence,power,engine}.ts`,
`src/vision/testing/scene.ts` (synthetische testbeelden), `src/runtime/{vision,calibrationFlow}.ts`,
`src/render/preview.ts`, `src/app/{Calibrate,Spirit}.tsx`, `scripts/make-test-video.mjs`.

**Getest:**
- 22 unit tests op synthetische beelden (een getekende kamer + "persoon" uit rechthoeken, met
  ruis): leren, opnieuw leren bij beweging, juiste silhouetmaten, lege kamer, schaduw genegeerd,
  bijregelende camera, ruimte-check-aanwijzingen, kalibratie, hurken/springen/zijstap/armen,
  tweede persoon, uit beeld + terug, en Ninja Power bij stilstaan versus snel bewegen.
- Een test van het volledige kalibratieverloop (aftellen → leren → aanwijzing "naar links" → klaar).
- E2E in headless Chrome met een synthetisch filmpje (`npm run testvideo`, 320×240 @ 20 fps,
  draaiboek in het script): de kalibratie is klaar na 14 s, hoogte = 1, speler in beeld. Geen
  netwerkverkeer, CSP actief.
- **Op het toestel: nog niet getest.** Kristof: kalibreer in de echte ruimte, liggend en
  staand. Staat het silhouet stabiel in het debugpaneel? Wat gebeurt er bij een lamp aan/uit,
  of als iemand achter je loopt?

**Problemen en oplossingen:**
- Node leest TypeScript rechtstreeks (type stripping), maar enkel "wisbare" syntax: een
  `constructor(private s)` werkte niet en is herschreven, zodat het filmpjesscript de scène
  uit de tests kan hergebruiken.
- Lettertypes laden pas bij gebruik. De e2e-controle "geen netwerk na het laden" laat daarom
  eigen bestanden onder `/assets/` toe. Het gaat om de browser die eigen bestanden laadt, niet
  om app-code die verbindt.

**Les voor B-world:**
- `src/vision/` is los overneembaar (geen DOM, geen React). Alle drempels staan als benoemde
  constanten of opties bovenaan elk bestand.
- De kalibratie hoort bij een **beurt**: een nieuwe speler = opnieuw "lichaam kalibreren". De
  achtergrond blijft geldig zolang het toestel niet verplaatst wordt.

## Blok 3 — Detectoren + Testlab  (2026-10-11 → wacht op test door Kristof)

**Doel:** de houding (blok 2) omzetten in bewegingen die de etappes nodig hebben, en een scherm om
elke beweging los te testen.

**Gebouwd:**
- `MoveTracker` (src/vision/moves.ts) met detectoren voor: **sprong** (+ landing), **hurken**,
  **kikkersprong**, **zijbaan** (links/midden/rechts), **slag** (links/rechts/omhoog), **reiken**
  boven het hoofd (links/rechts, voor klimmen), **passen** (lopen ter plaatse) en **houdingen
  vasthouden** (hurkzit, ster, armen omhoog).
- **Testlab**: live silhouet (effen vorm) met de gekalibreerde lijnen en alle doelvlakken
  (rood = slagzones, oranje = reikzones, ze lichten op bij een raak). Daarnaast tellers die
  oppoppen, houdtijden, een Ninja Power-balk en een waarschuwing bij uit beeld / tweede persoon.
  Knoppen: tellers op 0, opnieuw kalibreren.
- Startscherm: "Testlab" (kalibreert eerst als dat nog niet gebeurd is), "Kalibreren", "Cameratest".

**Hoe het werkt** (drempels in `MOVE_THRESHOLDS`, alles in lichaamslengtes):
| Beweging | Regel |
|---|---|
| Sprong | voeten > 0,06 én bovenkant > 0,03 omhoog, lichaam niet gehurkt (> 0,75); geland bij voeten < 0,025; min. 250 ms tussen sprongen |
| Hurken | voeten op de grond en (hoogte < 0,8 of zwaartepunt > 0,1 lager); rechtop bij hoogte > 0,9 en zwaartepunt < 0,04; telt bij het rechtkomen |
| Kikkersprong | sprong binnen 1,3 s na het laagste moment van een hurk |
| Zijbaan | benen (`cxLow`) > 0,18 verschoven = zijbaan; < 0,1 = terug in het midden. Armen spreiden verschuift `cxLow` niet |
| Slag | ≥ 8 % van een doelvlak naast (0,26–0,7 opzij, hoogte 0,08–0,45 onder de kruin) of boven het hoofd bedekt; vrij bij < 3 %. Vlakken bewegen mee met het lichaam, dus opzij stappen telt niet als slag |
| Reiken | ≥ 8 % van een vlak boven het hoofd (0,08–0,34 naast het midden, het hoofd zelf niet), niet tijdens een sprong |
| Houding | hurkzit (hoogte 0,45–0,85), ster (breedte ≥ 1,6×), armen omhoog (bovenkant ≥ 0,12 hoger, breedte < 1,6×); telt enkel bij Power ≤ 45, mag 300 ms wankelen |
| Passen | beweging in de benen links vs. rechts van het midden; een pas = de kant met de meeste beweging wisselt (verschil ≥ 25 %) |

Uit beeld (`presence` ≠ ok) = niets tellen.

**Bestanden:** `src/vision/moves.ts` (+ test), `src/vision/testing/harness.ts` (testhulp + clips),
`src/render/lab.ts`, `src/app/Testlab.tsx`, `src/runtime/vision.ts` (MoveTracker ingebouwd),
`scripts/e2e-scenarios.mjs` (scenario `testlab`), `scripts/make-test-video.mjs` (draaiboek
verlengd).

**Beslissingen:** #50 (synthetisch testfilmpje).

**Getest:**
- 13 unit tests voor de detectoren (36 in totaal): sprongen, kleine sprong telt niet, hurken,
  kikkersprong, een late sprong is geen kikkersprong, zijbaan, armen spreiden ≠ zijstap, slagen in
  3 richtingen, afwisselend reiken, springen ≠ reiken, ster vasthouden, passen, niets tellen uit
  beeld.
- **E2E** (headless Chrome, synthetisch filmpje): het Testlab telt **exact** 4 sprongen, 3 keer
  hurken, 4 zijbaanwissels, 21 passen (= 6/s × 3,5 s) en 0 kikkersprongen.
- **Op het toestel: nog niet getest.** Kristof: doe in het Testlab elke beweging 10× (liggend en
  staand) en noteer per teller wat hij aangeeft. Let vooral op: kleine sprongjes, hurken met de
  armen vooruit, en slagen met een korte arm (kinderen).

**Problemen en oplossingen:**
- Het Commons-filmpje (Idol Academy) is onbruikbaar voor achtergrondaftrek: de figuur verlaat het
  beeld nooit (#50).
- In de eerste versie van de testclip zat in de "kleine sprong" toch een sprong van 9 px. Nu
  schalen de clips mee met de gevraagde hoogte.

**Les voor B-world:**
- Games gebruiken enkel `MoveEvent`s en `MoveState`. Ze weten niet hoe een sprong gemeten wordt,
  dus de detectoren kunnen later verbeterd of vervangen worden zonder dat er een game moet
  veranderen.
