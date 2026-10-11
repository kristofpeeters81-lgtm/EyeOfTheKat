# The Eye of the Kat

Een ninja-obstakelparcours voor kinderen (6–12 jaar), waarin je eigen lichaam de controller is,
zoals bij een Kinect. Het werkt op gsm, tablet of laptop met de gewone camera, en **zonder AI**.

**Spelen:** https://kristofpeeters81-lgtm.github.io/EyeOfTheKat/

## Hoe ziet de app je, zonder AI?

Met klassieke beeldverwerking, volledig uitlegbaar:

- **Silhouet:** de app leert eerst de lege kamer (je stapt even opzij). Alles wat daarna anders
  is, ben jij. Zo ziet ze of je springt, hurkt, opzij stapt of je armen spreidt.
- **Beweging:** hoeveel pixels er van beeld tot beeld veranderen, voor de "Ninja Power".
- **Kleurbandjes (optioneel):** een fel gekleurd voorwerp om je polsen, dat de app op kleur
  volgt.

Er zit geen enkel getraind model in de app (geen MediaPipe, TensorFlow, ...). Dat wordt bij
elke build gecontroleerd met `scripts/check-privacy.mjs`.

## Privacy

- Camerabeelden blijven in het geheugen van het toestel. Ze worden nooit opgeslagen of
  verstuurd.
- De pagina heeft een Content-Security-Policy `connect-src 'none'`: de browser verbiedt de app
  élke netwerkverbinding.
- Tijdens het spelen is het camerabeeld niet te zien. Je ziet enkel een getekende ninja.

## Ontwikkelen

```bash
npm install
npm run dev      # ontwikkelserver
npm test         # privacycontrole + unit tests
npm run build    # privacycontrole + typecheck + build
npm run e2e      # eind-tot-eind-test in headless Chrome met een nep-camera
```

Documentatie (Nederlands): `PLANNING.md`, `BESLISSINGEN.md` (+ `BESLISSINGEN-UITLEG.md`),
`docs/BOUWLOG.md`, `docs/HERBOUW-BWORLD.md`.

Lettertypes: Unbounded en Outfit (SIL Open Font License 1.1, zie `src/app/fonts/LICENSE.txt`).
