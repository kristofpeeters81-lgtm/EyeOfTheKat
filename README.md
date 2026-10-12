# The Eye of the Kat

Een ninja-obstakelparcours voor kinderen (6–12 jaar), waarin je eigen lichaam de controller is,
zoals bij een Kinect. Het werkt op gsm, tablet of laptop met de gewone camera, en **zonder AI**.
De oefeningen zijn gekozen om myokines te activeren: korte explosieve sprints, kracht in
spelvorm, en cardio en kracht door elkaar.

**Spelen:** https://kristofpeeters81-lgtm.github.io/EyeOfTheKat/
(zonder camera bekijken: https://kristofpeeters81-lgtm.github.io/EyeOfTheKat/?demo=1)

## Het spel

Kies je ninja (Kage, Riku, Mei of Neko), kalibreer, en klim langs 9 etappes naar het **Oog van de
Kat** op de top van de berg. De Geest van de Berg legt uit en moedigt aan.

| # | Etappe | Beweging |
|---|---|---|
| 1 | Bridge Sprint | sprinten ter plaatse (4 × 15 s) |
| 2 | Duck Beams | hurken onder balken |
| 3 | Log Roll | springen over stammen |
| 4 | Frog Leap | kikkersprongen (hurken + springen) |
| 5 | Stone Hop | zijwaarts hoppen |
| 6 | Shadow Wall | een houding vasthouden |
| 7 | Shadow Strike | slagen links/rechts/boven |
| 8 | Wall Climb | om beurt een arm hoog (klimmen) |
| 9 | The Eye | finale: alles door elkaar |

Met opwarming, rustpauzes, sterren, kleuren om vrij te spelen, beurten voor meerdere kinderen en
een scorebord (doelen geschaald per leeftijd).

## Hoe ziet de app je, zonder AI?

Met klassieke beeldverwerking, volledig uitlegbaar:

- **Silhouet:** de app leert eerst de lege kamer (je stapt even opzij). Alles wat daarna anders
  is, ben jij. Zo ziet ze of je springt, hurkt, opzij stapt of je armen spreidt.
- **Beweging:** hoeveel pixels er van beeld tot beeld veranderen, voor de "Ninja Power".
- **Kleurbandjes (optioneel):** een fel gekleurd voorwerp om je polsen, dat de app op kleur volgt.

Er zit geen enkel getraind model in de app (geen MediaPipe, TensorFlow, ...). Dat wordt bij elke
build gecontroleerd met `scripts/check-privacy.mjs`.

## Privacy

- Camerabeelden blijven in het geheugen van het toestel. Ze worden nooit opgeslagen of verstuurd.
- De pagina heeft een Content-Security-Policy `connect-src 'none'`: de browser verbiedt de app
  élke netwerkverbinding.
- Tijdens het spelen is het camerabeeld niet te zien. Je ziet enkel een getekende ninja.
- Bewaard op het toestel: bijnaam, leeftijd, held en scores. Nooit een foto.
- De stem gebruikt enkel een lokale stem van het toestel (geen online spraakdienst).

## Ontwikkelen

```bash
npm install
npm run dev        # ontwikkelserver
npm test           # privacycontrole + unit tests (vision, game, audio)
npm run build      # privacycontrole + typecheck + build (+ privacycontrole op de build)
npm run testvideo  # synthetisch testfilmpje (y4m) voor de e2e-tests
npm run e2e:all    # alle eind-tot-eind-tests in headless Chrome (na npm run build)
```

Documentatie (Nederlands): `PLANNING.md`, `BESLISSINGEN.md` (+ `BESLISSINGEN-UITLEG.md`),
`docs/BOUWLOG.md`, `docs/HERBOUW-BWORLD.md`, `docs/TESTPROTOCOL.md`.

Lettertypes: Unbounded en Outfit (SIL Open Font License 1.1, zie `src/app/fonts/LICENSE.txt`).
Alle beelden en geluiden worden door de code zelf gemaakt (geen bestanden van derden).
