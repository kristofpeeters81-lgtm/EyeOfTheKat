# The Eye of the Kat (map `KinectZonderAI`)

Kinect-achtige avonturen-webapp voor gsm/tablet. Een getekende ninja doorloopt een parcours van 9
etappes naar het Oog van de Kat, aangestuurd door de bewegingen van een kind (6–12 jaar) voor de
camera. De oefeningen activeren myokines. Het is een haalbaarheidstest, het tegenstuk van Idol
Academy (map `Kinect`), maar dan **zonder enig AI-model**. Gebruik "Kinect" nooit publiek
(merknaam).

Live: https://kristofpeeters81-lgtm.github.io/EyeOfTheKat/ (publieke repo
`kristofpeeters81-lgtm/EyeOfTheKat`; push naar `main` = meteen live).

## Eerst lezen
1. `PLANNING.md`: waar staan we (blokken, 🧪 = wacht op toesteltest)
2. `BESLISSINGEN.md`: korte index; uitleg per nummer in `BESLISSINGEN-UITLEG.md`
3. `docs/BOUWLOG.md`: per blok hoe het gebouwd is
4. `docs/HERBOUW-BWORLD.md` (overname in B-world) en `docs/TESTPROTOCOL.md` (toesteltests)

## Structuur
- `src/vision/`: detectiemotor (silhouet, beweging, kleur, detectoren). Puur TS, geen DOM.
- `src/game/`: etappes, spellogica, profielen, logboek, demobot. Puur TS.
- `src/render/`: Canvas2D-tekeningen (held, wereld, scènes per etappe).
- `src/audio/`: muziek, effecten, stem (gedeeld met Idol Academy).
- `src/runtime/`: camera-sessie, motor + detectoren koppelen, kalibratie-/bandjesverloop.
- `src/app/`: React-schermen (dunne laag).
- `scripts/`: privacycontrole, testfilmpje, e2e-tests.

## Documentatieregels (verplicht, #13)
- **Nieuwe of gewijzigde beslissing** → een regel in `BESLISSINGEN.md` + een entry `## <nr>.` in
  `BESLISSINGEN-UITLEG.md`. Nummers nooit hergebruiken. Bij een wijziging krijgt de oude
  beslissing status `vervangen door #x`.
- **Na elk blok** → `PLANNING.md`, `docs/BOUWLOG.md` (sjabloon volgen) en
  `docs/HERBOUW-BWORLD.md` bijwerken. Een blok is niet af zolang de documentatie achterloopt.
- Voorstellen van Claude krijgen status `voorlopig` tot Kristof ze bevestigt.

## Harde eisen
- **Geen AI (#2):** geen ML-model of ML-bibliotheek (geen MediaPipe, TensorFlow, ONNX, ...).
- **Privacy (#3, #4):** camerabeelden verlaten het toestel nooit en worden nooit opgeslagen; CSP
  `connect-src 'none'`; enkel lokale stemmen.
- Vóór elke push: `npm test` + `npm run build` (beide met privacycontrole), en bij grotere
  wijzigingen `npm run e2e:all`. Halve stukken niet pushen (push = live).
- Werkwijze (#12): kleine blokken; visuele keuzes eerst voorleggen. (#49 was een uitzondering.)
- Taal: Nederlands (Vlaams) in de UI en de documentatie; etappenamen in het Engels (#37).
- TypeScript strict, geen `any`.
- Lange teksten (docs) via een Python-script in de scratchpad schrijven: bash-heredocs met
  aanhalingstekens lopen vast in deze omgeving.
