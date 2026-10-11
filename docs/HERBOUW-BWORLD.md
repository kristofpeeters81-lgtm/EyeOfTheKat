# The Eye of the Kat → B-world: herbouwgids

> **Status:** skelet. Wordt na elk blok aangevuld en in het laatste blok afgewerkt.
> **Doel (#14):** als de test goed bevonden wordt, gaat de app op dezelfde manier naar B-world
> als Idol Academy. Deze gids is geschreven voor wie (mens of AI-tool) dat doet, op een ander
> toestel en zonder toegang tot deze conversatie.

## 1. Overzicht: overnemen of opnieuw bouwen
*(Laatste blok)* Een tabel per onderdeel: letterlijk overnemen (detectiemotor, spellogica,
tests) · logica overnemen met nieuwe visuals (etappes, held) · opnieuw bouwen (app-schil, menu's).

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

## 4. Etappes en spellogica
*(Game-blokken)*

## 5. Held en wereld (visuals, animaties)
*(Stijlblok)*

## 6. Audio, veiligheid, opslag
*(Latere blokken)*

## 7. Observaties naast Idol Academy
*(Laatste blok)* Geen formeel vergelijkend rapport (#28), enkel korte observaties die helpen
kiezen tussen beide aanpakken in B-world.
