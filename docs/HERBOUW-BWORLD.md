# The Eye of the Kat → B-world: herbouwgids

> **Status:** afgewerkt na blok 12 (2026-10-12). De app is volledig gebouwd en automatisch getest,
> maar **nog niet getest op echte toestellen met kinderen**. Drempels en tijden kunnen na die tests
> nog veranderen; die wijzigingen komen als nieuwe beslissingen in `BESLISSINGEN.md`.
> **Doel (#14):** als de test goed bevonden wordt, gaat de app op dezelfde manier naar B-world
> als Idol Academy. Deze gids is geschreven voor wie (mens of AI-tool) dat doet, op een ander
> toestel en zonder toegang tot deze conversatie.

## 1. Overzicht: overnemen of opnieuw bouwen

| Onderdeel | Map / bestanden | Wat doen in B-world | Waarom |
|---|---|---|---|
| Detectiemotor (silhouet, beweging, Ninja Power, aanwezigheid) | `src/vision/` | **Letterlijk overnemen** + tests | Puur TS, geen DOM/React, geen afhankelijkheden; het hart van de test |
| Bewegingsdetectoren | `src/vision/moves.ts` | **Letterlijk overnemen** + tests | Games kennen enkel `MoveEvent`s |
| Kleurbandjes | `src/vision/color.ts`, `src/runtime/bandFlow.ts` | **Letterlijk overnemen** (optioneel) | Opt-in precisie (#40) |
| Kalibratieverloop | `src/runtime/calibrationFlow.ts` | **Overnemen**, scherm opnieuw | Toestandsmachine zonder UI |
| Camera + beeldlus | `src/camera/`, `src/runtime/session.ts` | **Overnemen** (of B-world-camera gebruiken) | Klein en getest |
| Etappes + spellogica | `src/game/` (`stageBase`, `setStage`, `stages/*`, `scaling`, `catalog`) | **Letterlijk overnemen** + tests | Puur TS; leeftijd, sterren, vangnetten |
| Profielen + logboek | `src/game/profiles.ts`, `src/game/sessionLog.ts` | **Logica overnemen**, opslag koppelen aan B-world | Opslag zit achter een interface |
| Demobot | `src/game/demo.ts` | **Overnemen** | Tests, screenshots, "attract mode" |
| Held: skelet + poses | `src/render/hero.ts` (`targetPose`, `HeroAnimator`) | **Overnemen** | Stijlonafhankelijk |
| Held: tekenen, wereld, scènes | `src/render/hero.ts` (`drawHero`), `world.ts`, `stages/*.ts` | **Visuals naar B-world-stijl** (of overnemen) | Puur Canvas2D, geen afbeeldingen |
| Geluid | `src/audio/` | **Delen met Idol Academy** (één module) | Zelfde motor, enkel muziek/effecten anders |
| Schermen (HUD, kaart, profielen, resultaat, rust, testlab, meetgegevens) | `src/app/*.tsx` | **Opnieuw bouwen** in B-world | Dunne React-laag, B-world heeft eigen UI |
| Privacycontrole | `scripts/check-privacy.mjs` | **Overnemen** in de B-world-build | Bewijst "geen AI, geen netwerk" |
| Testfilmpje + e2e | `scripts/make-test-video.mjs`, `scripts/e2e*.mjs` | **Overnemen** | Synthetisch filmpje, geen echte beelden |

### Stappenplan voor de herbouw
1. `src/vision/` + tests overnemen → `npm test` groen in B-world.
2. Camera + beeldlus + kalibratieverloop → een eenvoudig kalibratiescherm in B-world-stijl.
3. Het Testlab (of een eenvoudige versie) als verborgen begeleidersscherm, om de detectie op
   B-world-toestellen te controleren.
4. `src/game/` + tests overnemen → één etappe (bv. Bridge Sprint) met een B-world-HUD.
5. De overige etappes, de held en de wereld (eigen stijl of overgenomen).
6. Profielen/logboek koppelen aan de B-world-opslag, geluid via de gedeelde module.
7. Privacycontrole in de B-world-build, en de CSP-keuze uit §2.

## 2. Vereisten in B-world *(blok 1, ingevuld)*

**Afhankelijkheden:** geen. De detectiemotor gebruikt enkel standaard-JavaScript (typed arrays).
Er mag **nooit** een ML-pakket bijkomen (#2). Neem `scripts/check-privacy.mjs` over in de
B-world-build (pas `ML_PACKAGES`/`NETWORK_API` aan als B-world zelf netwerk nodig heeft voor
andere modules).

**CSP:** deze app gebruikt `connect-src 'none'` (#4). B-world heeft waarschijnlijk wel verbindingen
nodig (sync, login, ...). Er zijn twee opties:
1. *Sterkst:* de bewegingsgames in B-world in een eigen pagina of iframe met een eigen CSP
   `connect-src 'none'` laten draaien. Communicatie met de rest van B-world dan via
   `postMessage` (enkel scores, nooit beelden).
2. *Eenvoudiger:* in de gewone B-world-pagina, met de bestaande CSP. Dan steunt de garantie
   "geen beeld verlaat het toestel" op de code-controle (#48) in plaats van op de browser.

Verder: `media-src 'self' blob: mediastream:`, `worker-src 'self'` (service worker), https
(camera). Geen `wasm-unsafe-eval` nodig (geen WebAssembly).

**Camera:** `src/camera/camera.ts` (voorcamera, 640×480 ideaal, 30 fps) en
`src/camera/frameGrabber.ts` (gespiegeld verkleinen naar 160 px lange zijde). De beeldlus in
`src/runtime/session.ts` gebruikt `requestVideoFrameCallback`, met `requestAnimationFrame` als
terugval.

**PWA:** de service worker wordt bij de build gegenereerd (`vite.config.ts`, plugin `kat-sw`). In
B-world (vite-plugin-pwa) gewoon de standaard precache gebruiken: er zijn geen grote modelbestanden.

## 3. Detectiemotor (silhouet, beweging, kleurbandjes)

### 3.1 Silhouet *(blok 2, ingevuld)*
**Letterlijk overnemen:** `src/vision/` (types, background, morph, components, silhouette,
calibration, presence, power, motion, engine) + `src/vision/testing/scene.ts` + de tests. De
werking per stap staat in `docs/BOUWLOG.md`, blok 2.

**Gebruik:**
```ts
const engine = new VisionEngine();
engine.startLearning();             // kind is uit beeld
// per camerabeeld (RGBA, ~160×120):
const r = engine.process(frame, performance.now());
// r.phase === 'running' → engine.calibrateBody() en wachten tot r.calibration gezet is
// daarna: r.pose (heightRatio, widthRatio, topRise, feetRise, shift), r.power, r.zone,
//         r.legPower, r.presence ('ok' | 'missing' | 'two' | 'scene')
```
Het kalibratieverloop zelf (stappen, teksten, aftellen) staat los van de UI in
`src/runtime/calibrationFlow.ts`. In B-world enkel een nieuw scherm eromheen bouwen.

**Afstellen:** alle drempels staan als opties/constanten bovenaan de bestanden
(`DEFAULT_BACKGROUND_OPTIONS`, `SPACE_LIMITS`, `POWER_REFERENCE`, `ZONE_LIMITS`,
`DEFAULT_ENGINE_OPTIONS`). Pas ze aan op basis van de toesteltests en leg elke wijziging vast als
beslissing.

### 3.2 Detectoren *(blok 3, ingevuld)*
**Letterlijk overnemen:** `src/vision/moves.ts` (+ `moves.test.ts`, `testing/harness.ts`).
```ts
const tracker = new MoveTracker();
const events = tracker.update(visionResult);  // MoveEvent[]: jump, land, squat-down, squat,
                                              // frogleap, lane, strike, reach, step
tracker.state;                                // airborne, low, lane, zones, armUp, poses, holdMs
```
Regels en drempels: `docs/BOUWLOG.md` blok 3 (tabel) en `MOVE_THRESHOLDS`. Het Testlab
(`src/app/Testlab.tsx` + `src/render/lab.ts`) is in B-world handig als verborgen
begeleidersscherm.

### 3.3 Kleurbandjes *(blok 4, ingevuld)*
**Letterlijk overnemen:** `src/vision/color.ts`, `src/runtime/bandFlow.ts` (+ tests).
```ts
const model = learnColor(bigFrame, boxFor(w, h));       // ColorModel of 'not-colorful' | 'mixed'
const tracker = new ColorTracker(model);
tracker.maxArea = maxMarkerArea(bodyHeightOnBigFrame);  // grotere vlekken = storende kleur
const { markers, stray } = tracker.find(bigFrame);      // ≤ 2 markers, grootste eerst
moveTracker.update(visionResult, markersInSilhouetteCoords);  // slagen/reiken via de handen
```
Camera in de bandjes-modus op 320 px lange zijde; de silhouetmotor halveert zelf.

## 4. Etappes en spellogica *(vanaf blok 6)*
**Letterlijk overnemen:** `src/game/` (geen DOM/React): `stageBase.ts` (verloop, pauze, meetgegevens),
`scaling.ts` (leeftijd, sterren), `catalog.ts`, `stages/*.ts` + tests (`testing.ts` = nep-invoer).
```ts
const stage = createStage('bridge-sprint', { age: 9 });
const events = stage.update(gameInput);   // per camerabeeld; events: say / sfx / phase / done
stage.hud(); stage.hero(); stage.result();
stage.manualPass();                       // begeleider-knop (#31)
```
`GameInput` = VisionResult + MoveTracker-uitvoer (zie `src/app/StageScreen.tsx`).
Basisklassen: `setStage.ts` (reeksen + rust) en `stages/timed.ts` (getimede obstakels). Een bot
(`demo.ts`) speelt elke etappe zonder camera, voor tests en een demo.
**Opnieuw bouwen in B-world-stijl:** `src/app/StageScreen.tsx` (HUD) en `ResultScreen.tsx`.
**Tekeningen:** `src/render/stages/*.ts` (per etappe), te vervangen of over te nemen.

## 5. Held en wereld (visuals, animaties) *(blok 5, ingevuld)*
**Logica overnemen, visuals naar keuze:** `src/render/hero.ts` scheidt het **skelet + poses**
(`targetPose`, `HeroAnimator`, overneembaar) van het **tekenen** (`drawHero`, B-world-stijl). De
games vragen enkel een `HeroAction` op (bv. `'jump'`, `'strikeLeft'`). Wereld:
`src/render/world.ts`. Kleuren: `src/render/theme.ts`.

## 6. Audio, veiligheid, opslag
### 6.1 Audio *(blok 7, ingevuld)*
**Letterlijk overnemen:** `src/audio/` (komt uit Idol Academy, dus in B-world best één gedeelde
module). Enkel `music.ts` (noten/ritme) en de lijst effecten in `synth.ts` zijn per app anders.
Koppeling met een etappe: `src/app/useStageAudio.ts` (`handleStageEvent`). Privacy: enkel lokale
stemmen (`pickVoice`).

### 6.2 Veiligheid en spelverloop *(blok 10, ingevuld)*
- **Veiligheid:** ruimte-check en kalibratie (blok 2), pauze bij uit beeld (`stageBase.ts`),
  opwarming (`stages/warmUp.ts`), rustpauzes (`RestScreen.tsx`, duur in `catalog.ts`: `restAfterMs`).
- **Profielen en voortgang:** `src/game/profiles.ts` (puur, met een opslag-interface). In B-world:
  koppelen aan de B-world-gebruikers/opslag via `ProfileStorage`.
- **Opnieuw bouwen in B-world-stijl:** `ProfileSelect`, `ProfileEditor`, `WorldMap`, `RestScreen` en
  het verloop in `App.tsx` (een eenvoudige toestandsmachine met schermen).

### 6.3 Opslag en export *(blok 11, ingevuld)*
**Letterlijk overnemen:** `src/game/sessionLog.ts` (logboek + CSV). App-laag: `src/app/logStore.ts`
(localStorage + download) en `DataScreen.tsx` (begeleidersscherm, opnieuw te bouwen). Het
CSV-formaat (28 kolommen, `;`, decimale komma, BOM) is gemaakt voor Excel met Belgische instellingen.

## 7. Observaties naast Idol Academy

Geen formeel vergelijkend rapport (#28), enkel wat al zichtbaar is uit de bouw. Wat de
toesteltests zeggen, wordt hier na de test aangevuld.

| Punt | Idol Academy (MediaPipe, AI) | The Eye of the Kat (geen AI) |
|---|---|---|
| Grootte van de app | ±34 MB (modellen + WASM) | ±0,5 MB (enkel code en lettertypes) |
| Netwerk | `connect-src 'self'` (model laden) | `connect-src 'none'`: technisch onmogelijk om iets te versturen |
| Wat de app "ziet" | 33 lichaamspunten, gewrichtshoeken | silhouet (kader, zwaartepunt, hoogte/breedte), beweging, optioneel 2 handen via kleur |
| Opstelling | kind mag direct starten | **lege kamer leren** (stap opzij) en een stilstaande camera; kalibratie per beurt |
| Gevoeligheid | weinig last van achtergrond/licht | gevoelig voor bewegende achtergrond (tv, raam, voorbijlopers) en plotse lichtwissels; opgevangen met schaduwonderdrukking, belichtingscorrectie, langzame aanpassing en pauze bij "beeld veranderd" |
| Uitlegbaarheid | model = zwarte doos | elke regel staat in de code met een drempel in lichaamslengtes |
| Bewegingen | ook fijne houdingen (bv. één been, knie-hoek) | grote, duidelijke bewegingen: springen, hurken, opzij, armen boven/opzij, lopen, houding vasthouden |
| Rekenkracht (verwachting) | zwaar op oude tablets (model) | licht: ± enkele ms per beeld op 160×120 (te bevestigen in de toesteltest) |

**Voorlopige conclusie (vóór de toesteltest):** voor een parcours met grote bewegingen lijkt
"zonder AI" haalbaar. De prijs is de opstelling: een stilstaande camera, een rustige achtergrond en
een korte kalibratie per beurt. Waar fijne houdingen nodig zijn, blijft de AI-aanpak sterker. Voor
B-world kan dus per game gekozen worden: AI waar het moet, zonder AI waar het kan.

## 8. Wat nog open is
- **Toesteltests** volgens `docs/TESTPROTOCOL.md` (alle blokken staan op 🧪 in `PLANNING.md`).
- **Voorlopige beslissingen** #41–#48 en #50–#55 (o.a. de drempels, de stijl en de bonus-etappe).
- iOS is voorzien maar ongetest (#22).
