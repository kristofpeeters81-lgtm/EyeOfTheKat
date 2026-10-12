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

## Blok 4 — Kleurbandjes  (2026-10-11 → wacht op test door Kristof)

**Doel:** de optionele bandjes-modus (#18, #33, #40): twee fel gekleurde voorwerpen om de polsen,
gevolgd op kleur, zodat slagen en reiken preciezer worden.

**Gebouwd:**
- Instelscherm **Kleurbandjes** (vanuit het Testlab, knop "Bandjes uit/aan"). Het kind komt
  dichterbij en houdt het voorwerp in het vak (kleine camerapreview). Is de kleur ±0,4 s stabiel,
  dan verschijnen een stalen en de opdracht "Doe het om je polsen en ga terug in de schaduw-ninja
  staan". De preview toont dan enkel nog de gevonden kleurpixels (magenta) met witte cirkels rond
  de 2 markers. Vindt de app 2 bandjes zonder storende kleur, dan staat de modus aan. Zit dezelfde
  kleur ook elders in beeld, dan vraagt de Geest om een ander voorwerp.
- In het Testlab: knop "Bandjes aan/uit", "Kleur opnieuw", markers als roze bolletjes. In de
  bandjes-modus tellen slagen en reiken enkel als een **hand** in het doelvlak is.

**Hoe het werkt (src/vision/color.ts):**
1. **Kleur leren** (`learnColor`): alle pixels in het vak naar HSV. Pixels met verzadiging ≥ 0,35
   en helderheid ≥ 0,25 tellen als "fel" (minstens 25 % van het vak, anders `not-colorful`).
   Een histogram van 36 vakjes van 10° levert de piek. Piek + buren moeten ≥ 50 % van de felle
   pixels zijn (anders `mixed`). Resultaat: gemiddelde tint (circulair), tolerantie ±16°, min.
   verzadiging = max(0,3; 15e percentiel × 0,75), min. helderheid = max(0,18; 15e percentiel × 0,6).
2. **Zoeken** (`ColorTracker.find`, op het 320 px-beeld): snelle uitsluiting van te donkere of
   grijze pixels, dan tint vergelijken. Masker openen (3×3), vlekken zoeken. De 2 grootste vlekken
   die niet groter zijn dan een polsbandje (`maxMarkerArea`: vierkant van 18 % van de
   lichaamslengte) zijn de markers. Al de rest is "storende kleur" (`stray`).
3. **Links/rechts** (`MarkerPairing`): volgt de markers op de dichtstbijzijnde vorige positie.
   Zonder geschiedenis: positie tegenover het lichaamsmidden. Voor de games maakt een wissel bij
   kruisende handen niet uit.
4. **Instelverloop** (`src/runtime/bandFlow.ts`): hold (12 stabiele beelden, tint ±12°) → check
   (20 goede beelden: in beeld, ruimte ok, 2 markers, storende kleur < 50 % van de markers) →
   done. Storende kleur ≥ max(30 px, markeroppervlak) gedurende 40 beelden → conflict.
5. **Runtime:** in de bandjes-modus wordt de camera op 320 px uitgelezen. De silhouetmotor
   halveert dat zelf naar 160 px, dus de kalibratie blijft geldig.

**Bestanden:** `src/vision/color.ts` (+ test), `src/runtime/bandFlow.ts` (+ test),
`src/render/bands.ts`, `src/app/BandSetup.tsx`, aanpassingen in `src/vision/moves.ts`
(markers-parameter), `src/runtime/vision.ts`, `src/app/Testlab.tsx`,
`src/vision/testing/scene.ts` (bandjes in de synthetische scène).

**Getest:**
- 9 nieuwe unit tests (45 in totaal): HSV, kleur leren (geel ok, grijs geweigerd), beide handen
  vinden in 3 armhoudingen, storende kleur bij een trui in dezelfde kleur, links/rechts bij
  kruisen, slag enkel met de hand echt in het vlak. Het volledige instelverloop: leren → 2 bandjes
  → aan, en conflict bij een gele trui.
- E2E Testlab opnieuw groen (geen regressie).
- **Op het toestel: nog niet getest.** Kristof: probeer 2 felle sokken (geel, roze of groen). Werkt
  het kleur leren bij gewoon kamerlicht? Ziet de app beide handen op 2,5 m, liggend en staand?

**Problemen en oplossingen:**
- Een trui in dezelfde kleur als de bandjes smolt samen met de bandjes tot één grote "marker" en
  gaf zo geen conflictmelding. Oplossing: een maximale bandjesgrootte tegenover de lichaamslengte.

**Les voor B-world:**
- `color.ts` is los overneembaar. De kleurkeuze gebeurt op het toestel zelf, er is geen vaste kleur.
- Bandjes zijn een **opt-in** voor precisie. Alle etappes werken zonder (#40).

## Blok 5 — Stijl, helden en wereld  (2026-10-11 → wacht op beoordeling door Kristof)

**Doel:** de visuele stijl (#23), de vier helden met kleurkeuze (#24), de wereld met het Oog
(#35) en de Geest (#38). Normaal eerst als voorbeeld voorgelegd; door #49 meteen gebouwd, maar
**voorlopig** (#51).

**Gebouwd:**
- Scherm **Stijl** (startscherm): de wereld met parallax-bergen, het Oog op de top, de vier
  helden in wisselende poses en kleuren, en een held in zijaanzicht die loopt, springt, duikt en
  een kikkersprong maakt.
- De Geest van de Berg als zwevend lichtje (SVG, al in blok 2).

**Hoe het werkt:**
- **Skelet** (`src/render/hero.ts`): 11 punten (hoofd, nek, heup, 2 ellebogen, 2 handen,
  2 knieën, 2 voeten), in eenheden van de lengte van de held. Voor elk van de 19 acties is er een
  pose in vooraanzicht en/of zijaanzicht. Lopen is een berekende cyclus (sinus) waarvan de pas en
  de armzwaai meegroeien met de intensiteit. `HeroAnimator` laat de pose vloeiend naar het doel
  gaan (exponentieel, snelheid 14/s), zodat een wisselende detectie geen schokken geeft.
- **Tekenen:** eerst het hele silhouet in de accentkleur met `shadowBlur` (gloed), daarna het pak
  erover. Ledematen zijn dikke lijnen met ronde uiteinden, de romp is een trapezium. Daarna komen
  gordel, hoofdband met 2 linten (sinusgolf, wapperen naar achter), oogspleet met knipperende ogen,
  en de kap/haar/oortjes per held.
- **Wereld** (`src/render/world.ts`): lucht met een kleurverloop, 140 vaste sterren (eigen
  toevalsgenerator met zaadje) die twinkelen, en een maan met kraters. Bergen: elke laag is een
  som van sinussen (oneindig doorlopend), en de verste laag heeft een vaste top met sneeuw
  (geknipt op de bergvorm) en het Oog erboven. `drawGround` tekent het pad met meeschuivende
  naden.
- **Canvas** (`src/render/canvas.ts`): scherp op hoge-resolutieschermen, maar max. 2× (oude
  tablets).

**Bestanden:** `src/render/{theme,hero,world,canvas}.ts`, `src/app/StylePreview.tsx`.

**Beslissingen:** #51 (voorlopig).

**Getest:** e2e-scenario `stijl` maakt screenshots liggend en staand (`e2e-output/stijl-*.png`).
Daarop zijn twee fouten gezien en hersteld: een zwevende sneeuwkap en "0 fps" in het debugbalkje
zonder camera.

**Les voor B-world:** de held en de wereld zijn puur Canvas2D zonder afbeeldingen. Een andere
B-world-stijl betekent enkel `drawHero`/`drawMountains` vervangen. Het skelet en de poses
(acties) blijven bruikbaar.

## Blok 6 — Etappemotor + Bridge Sprint  (2026-10-11 → wacht op test door Kristof)

**Doel:** het gemeenschappelijke verloop van elke etappe, en de eerste etappe end-to-end.

**Gebouwd:**
- **Etappemotor** (`src/game/stageBase.ts`): intro (4 s uitleg door de Geest) → aftellen 3-2-1 →
  actief ⇄ rust → klaar. De spelklok stopt bij uit beeld / tweede persoon / veranderd beeld
  (#26), met een pauzescherm en een zin van de Geest. Er worden meetgegevens bijgehouden
  (actieve tijd, tijd in hoog/piek, gemiddelde/piek-Power, pauzes) en per opdracht hoe ze gehaald
  is: `detected` / `auto` / `manual` (#31).
- **Leeftijdsschaling en sterren** (`src/game/scaling.ts`, #43/#45): factor 0,6 → 1,0 (6 → 12 jaar),
  aantallen volledig geschaald, tempo half. Sterren zoals in #45, met een uitzondering voor
  vasthouden (Shadow Wall: geen intensiteitseis).
- **Bridge Sprint** (`src/game/stages/bridgeSprint.ts`): 4 sprints van 15 s (min. 10 s, tempo
  geschaald), met 20 s actieve rust ertussen. De snelheid van de held volgt de benen-power
  (1,5 → 9 m/s, vol bij 70). De brug stort achter de held in aan 5,8 m/s × tempofactor. Haalt
  ze hem in, dan struikelt hij en wordt ze 3 m teruggezet: nooit vallen. Per seconde sprint wordt
  genoteerd of er echt gelopen werd (benen-power ≥ 30). Sterren op basis van tijd in hoog/piek.
- **Spelscherm** (`src/app/StageScreen.tsx`): canvas met de wereld en de etappe, een HUD
  (naam, opdracht, voortgang, teller, aftelklok, Power-balk), ondertitels van de Geest, een
  pauzescherm, begeleider-knoppen "✓ Gehaald" (#31) en "■ Stop", en daarna het
  **resultaatscherm** (sterren met animatie, punten, actieve tijd, % hoog/piek, gemiddelde Power,
  "gezien door de camera" x/y, vanzelf/begeleider).
- **Tekening van de brug** (`src/render/stages/bridge.ts`): kloof met mist, planken die achter de
  instorting naar beneden tuimelen en vervagen, leuning met staanders, stof aan de rand en een
  rode gloed als de instorting dichtbij komt. Tijdens de rust: vaste rots.
- Tijdelijke **etappekeuze** met leeftijdskeuze en "korte etappes (test)" (tot blok 10). `?snel=1`
  in de link maakt alles 4× korter (voor tests).

**Bestanden:** `src/game/{types,scaling,stageBase,catalog,testing}.ts`,
`src/game/stages/bridgeSprint.ts` (+ test), `src/render/stages/{layout,bridge,index}.ts`,
`src/app/{StageScreen,ResultScreen,StagePicker}.tsx`.

**Getest:**
- 6 unit tests: leeftijdsfactor en sterren; het volledige verloop met 4 sprints (3 sterren bij
  volle inzet); wie niet loopt, struikelt maar eindigt met 1 ster; de klok stopt uit beeld
  (+ zin van de Geest + pauzeteller); kortere sprints voor 6-jarigen.
- E2E-scenario `bridge` (headless Chrome, synthetisch filmpje, `?snel=1`): kalibreren → etappe →
  sprint → rust → resultaat met ≥ 1 ster, plus screenshots liggend/staand. Omdat het filmpje in
  een lus speelt, loopt de figuur tussendoor uit beeld, en dan pauzeert het spel zoals bedoeld.
- **Op het toestel: nog niet getest.** Kristof: speel Bridge Sprint volledig. Voelt de snelheid
  van de held "eerlijk" bij hard lopen? Lukt het om de instorting voor te blijven? Zijn de
  sprints niet te lang of te kort?

**Les voor B-world:** een etappe is een klasse met `update(input) → events`, `hud()`, `hero()` en
`result()`. Het scherm is een dunne laag. Nieuwe etappes erven van `StageBase` en schrijven enkel
`step()`.

## Blok 7 — Geluid  (2026-10-11 → 2026-10-12, wacht op beluisteren door Kristof)

**Doel:** geluidseffecten, muziek die meegaat met de inspanning, en de stem van de Geest (#20, #38).

**Gebouwd:**
- De geluidsmotor is **overgenomen uit Idol Academy** (`src/audio/{synth,music,speech,director}.ts`)
  en aangepast:
  - **Muziek:** een eigen "ninja-beat" in d-klein (Dm–B♭–C–Am) met een taiko-ritme (trommel op
    stap 0, 6, 8, 12) en een pentatonische melodie (d f g a c). Er komen lagen bij per Ninja
    Power-zone: rust = taiko + bas, matig + handklap/shaker, hoog + akkoorden, piek + snelle shaker +
    melodie. Het tempo gaat van 100 naar 130 BPM, met hoogstens 4 BPM per maat.
  - **Effecten:** eigen namen (go, tick, hit, miss, stumble, step, success, land, whoosh, pause,
    star, win), allemaal gesynthetiseerd, zonder geluidsbestanden.
  - **Stem van de Geest:** enkel een lokale Nederlandse stem (Vlaams eerst). Online stemmen worden
    genegeerd, want die sturen de tekst naar een server (#3). De stem is iets trager (0,95) en
    lager (0,85) dan normaal. Zonder lokale stem staat alles enkel op het scherm.
- **Koppeling** (`src/app/useStageAudio.ts`):
  - de gebeurtenissen van een etappe worden geluid: `say` wordt de stem, `sfx` een effect, en de
    fase actief/rust start de muziek;
  - het niveau van de muziek volgt per camerabeeld de Ninja Power-zone;
  - bij een pauze gaat de muziek zacht, net als terwijl de Geest spreekt;
  - bij het verlaten van het scherm wordt het stil.
- Kalibratie en bandjes: de Geest spreekt de aanwijzingen uit, met een tik bij het aftellen en
  een succesgeluid als het klaar is.
- Startscherm: knoppen "Muziek & geluid" en "Stem van de Geest" (onthouden op het toestel).
  Het geluid wordt ontgrendeld bij de eerste tik (een browserregel).

**Bestanden:** `src/audio/*` (+ `audio.test.ts`), `src/app/{useStageAudio.ts,SoundSettings.tsx,storage.ts}`,
aanpassingen in `App.tsx`, `StageScreen.tsx` en `Calibrate.tsx`.

**Getest:**
- 11 unit tests (lagen per zone, taiko-ritme, akkoorden, melodie enkel pentatonisch, tempo,
  stemkeuze: Vlaams > Nederlands, online stemmen geweigerd, `nl_BE`-schrijfwijze, dosering van
  zinnen, uitspreekbare tekst).
- E2E `bridge` opnieuw groen met geluid erbij (geen consolefouten). Headless Chrome heeft geen
  stemmen, dus de stem zelf is niet automatisch getest.
- **Op het toestel: nog niet beluisterd.** Kristof: klinkt de muziek goed, is de Geest
  verstaanbaar, en is het niet te luid?

**Problemen en oplossingen:** het werk werd onderbroken (Kristof zette de pc af) en de volgende dag
afgewerkt. Halve stukken zijn bewust niet gepusht, omdat een push naar main meteen live gaat.

**Les voor B-world:** de geluidsmotor is nu in twee apps gebruikt. In B-world kan hij één gedeelde
module worden, met per game enkel andere muziek (`music.ts`) en een andere effectenlijst.

## Blok 8 — Etappes A: Duck Beams, Log Roll, Frog Leap, Stone Hop  (2026-10-12 → wacht op test door Kristof)

**Doel:** vier etappes erbij, zodat cardio en kracht elkaar afwisselen (#9, #15, #16).

**Gebouwd:**
- **`SetStage`** (`src/game/setStage.ts`): etappes in reeksen met 20 s rust ertussen, een teller per
  reeks, en zinnen van de Geest bij het begin van elke reeks en de rust.
- **`TimedObstacleStage`** (`src/game/stages/timed.ts`): obstakels die op een vast moment
  aankomen. De tijd ertussen gaat binnen een reeks van "start" naar "eind" (steeds sneller) en
  wordt gedeeld door de tempofactor (jonge kinderen = meer tijd). Geteld wordt in een venster rond
  de aankomst. Te laat = struikelen + `auto`. De begeleider-knop telt het eerstvolgende obstakel
  (binnen 1,5 s) als `manual`.
- **Log Roll:** 3 golven × 8 stammen (5 voor 6-jarigen), tussentijd 2,4 → 1,6 s. Een sprong telt
  van 0,65 s vóór tot 0,2 s na de aankomst, of als je op dat moment in de lucht bent.
- **Duck Beams:** 3 reeksen × 8 balken, tussentijd 2,6 → 2,1 s. Je moet laag zijn van 0,35 s
  vóór tot 0,3 s na de aankomst. Zo moet je tussen twee balken weer recht komen: echte squats.
- **Frog Leap:** in eigen tempo, 3 reeksen × 6 kikkersprongen (detector uit blok 3: sprong binnen
  1,3 s na het laagste punt van een hurk). De held springt van pilaar naar pilaar. Na 8 s zonder
  sprong springt hij toch (`auto`).
- **Stone Hop:** in vooraanzicht, 3 golven × 10 stenen. Links en rechts lichten om beurt op (met
  een pijl). Telt zodra de zijbaan van het kind die kant is. De held volgt live de zijbaan. Na 5 s
  hopt hij toch (`auto`).
- **Tekeningen** (`src/render/stages/setA.ts`): rollende stammen met jaarringen, balken aan
  touwen met rood-witte strepen die zachtjes zwaaien, stenen pilaren boven golvend water (het
  volgende platform gloeit), en een rivier in perspectief met drie stenen (de doelsteen pulseert in
  jade). Een fonkeling bij een gehaald obstakel.
- **Demomodus** (#52) en een vaste vooraankondiging van obstakels (#53).

**Bestanden:** `src/game/{setStage,demo}.ts`, `src/game/stages/{timed,logRoll,duckBeams,frogLeap,stoneHop}.ts`
(+ `stagesA.test.ts`), `src/render/stages/setA.ts`, aanpassingen in `catalog.ts`,
`render/stages/index.ts`, `StageScreen.tsx`, `StagePicker.tsx`, `App.tsx`,
`scripts/e2e-scenarios.mjs` (scenario `demo`).

**Getest:**
- 8 unit tests: Log Roll perfect (24/24) en zonder springen (24 auto, 1 ster, struikelgeluid),
  6-jarigen (5 per golf, meer tijd ertussen). Duck Beams perfect, en de begeleider-knop. Frog Leap
  18/18 met 18 platformen, en het vangnet na 8 s. Stone Hop 30/30, om beurt links/rechts.
- E2E-scenario `demo` (headless Chrome, bot, `?demo=1&snel=1`): alle vier spelen, met
  screenshots liggend en staand en zonder consolefouten. Daarop gezien en verbeterd: een balk was
  maar ±1,1 s zichtbaar (#53).
- **Op het toestel: nog niet getest.** Kristof: zijn de vensters eerlijk (stammen, balken)?
  Telt Frog Leap jouw kikkersprongen? Is Stone Hop ook staand haalbaar zonder uit beeld te stappen?

**Les voor B-world:** `SetStage` en `TimedObstacleStage` maken een nieuwe etappe klein (± 60 regels
spellogica). De bot in `demo.ts` is handig voor elke game: als "attract mode" en voor tests.

## Blok 9 — Etappes B: Shadow Wall, Shadow Strike, Wall Climb, The Eye  (2026-10-12 → wacht op test door Kristof)

**Doel:** de laatste vier etappes, waaronder de finale. Daarmee zijn alle 9 etappes speelbaar.

**Gebouwd:**
- **Shadow Wall** (statische kracht): 4 muren (hurkzit, ster, armen omhoog, hurkzit). Elke houding
  15 s vasthouden (9 s voor 6-jarigen), met 10 s rust ertussen. Vasthouden telt enkel als de
  houding klopt **en** de Ninja Power ≤ 45 is (stilstaan). Ten laatste na vasthoudtijd + 8 s breekt
  de muur (`auto`). Geen intensiteitseis voor ★★★ (#45).
  *Tekening:* de muur staat **vóór** de held en heeft een gat met een jade rand, in de vorm van de
  houding, precies op de plek van de held. Klopt je houding, dan zie je de held door het gat; zo
  niet, dan bedekt de muur een deel van hem. De muur wordt groter en minder doorzichtig naarmate
  ze nadert. Onder de held vult een balk zich tijdens het vasthouden (jade = houding klopt).
- **Shadow Strike** (cardio): 4 rondes × 9 schaduwdoelen (links, rechts, boven, in een vaste
  gemengde volgorde), 20 s rust. Een doel blijft 1,5 s staan (langer voor jongere kinderen), met
  een aftelring. Een slag naar de verkeerde kant telt niet. In de bandjes-modus moet de hand zelf in
  het doelvlak (#40).
- **Wall Climb** (kracht): 3 klimmen × 12 grepen, en enkel de juiste kant telt (afwisselend
  links/rechts). De wand schuift mee naar onder, en de volgende greep licht op. Vangnet na 8 s.
  Bandjes-modus: de hand zelf moet boven het hoofd komen (#40).
- **The Eye** (finale, continu): sprint 15 s → 5 stammen → 5 balken → sprint 15 s → 8 gemengd →
  sprint 12 s → 12 gemengd (sneller) → **"Reik naar het Oog"**: armen omhoog vasthouden (4 s). Dan
  gaat het Oog open met een lichtbundel naar de held. ±2 min voor 12 jaar. Sprintseconden,
  obstakels en het slot tellen allemaal mee voor de sterren.
- Een pose "armen omhoog" in zijaanzicht voor de held (finale).
- De demobot (#52) kan nu alle 9 etappes spelen.

**Bestanden:** `src/game/stages/{shadowWall,shadowStrike,wallClimb,theEye}.ts` (+ `stagesB.test.ts`),
`src/render/stages/setB.ts`, stam en balk herbruikbaar gemaakt in `setA.ts`, aanpassingen in
`catalog.ts`, `render/stages/index.ts` (tekenen vóór en na de held), `demo.ts`, `hero.ts`,
`stageBase.ts` (`clockMs`).

**Getest:**
- 10 unit tests: Shadow Wall (4/4 en 3 sterren bij vasthouden; wiebelen telt niet; korter voor
  6-jarigen), Shadow Strike (verkeerde kant telt niet; perfect = alles + 3 sterren), Wall Climb
  (enkel afwisselend; vangnet), The Eye (opbouw, perfect gespeeld met het Oog open en 3 sterren;
  niets doen = toch uitgespeeld met 1 ster).
- E2E `demo` voor de 4 etappes, met screenshots liggend en staand. Daarop gezien en verbeterd:
  het gat in de Shadow Wall was onzichtbaar (de held stond ervoor), en de rotsstructuur van de
  klimwand vormde een vreemd patroon.
- **Op het toestel: nog niet getest.** Kristof: herkent de app je hurkzit, ster en armen omhoog
  (Shadow Wall)? Zijn slagen naar boven haalbaar voor kleinere kinderen? Klimmen met en zonder
  bandjes vergelijken.

**Problemen en oplossingen:**
- Finale: de laatste seconde van elke sprint werd niet geteld (60/63). Nu telt een halve laatste
  seconde mee, zoals bij Bridge Sprint.

**Les voor B-world:** tekenen in twee lagen (vóór en na de held) maakt "door een gat passen"
mogelijk zonder echte 3D. Nuttig voor meer games in die stijl.
