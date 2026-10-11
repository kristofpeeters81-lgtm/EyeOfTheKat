# The Eye of the Kat (map `KinectZonderAI`)

Kinect-achtige avonturen-webapp voor gsm/tablet. Een getekende held doorloopt een
ninja-obstakelparcours, aangestuurd door de bewegingen van een kind (6–12 jaar) voor de camera.
De oefeningen activeren myokines. Het is een haalbaarheidstest, het tegenstuk van Idol Academy
(map `Kinect`), maar dan **zonder enig AI-model**. Gebruik "Kinect" nooit publiek (merknaam).

## Eerst lezen
1. `PLANNING.md`: waar staan we, wat is het volgende blok
2. `BESLISSINGEN.md`: korte index; uitleg per nummer in `BESLISSINGEN-UITLEG.md`
3. `docs/BOUWLOG.md`: wat al gebouwd is en hoe

## Documentatieregels (verplicht, #13)
- **Nieuwe of gewijzigde beslissing** → een regel in `BESLISSINGEN.md` + een entry `## <nr>.` in
  `BESLISSINGEN-UITLEG.md`. Nummers nooit hergebruiken. Bij een wijziging krijgt de oude
  beslissing status `vervangen door #x`.
- **Na elk blok** → `PLANNING.md`, `docs/BOUWLOG.md` (sjabloon volgen) en
  `docs/HERBOUW-BWORLD.md` bijwerken. Een blok is niet af zolang de documentatie achterloopt.
- Voorstellen van Claude krijgen status `voorlopig` tot Kristof ze bevestigt.

## Harde eisen
- **Geen AI (#2):** geen ML-model of ML-bibliotheek (geen MediaPipe, TensorFlow, ONNX, ...).
- **Privacy (#3):** camerabeelden verlaten het toestel nooit en worden nooit opgeslagen.
- Werkwijze (#12): één blok tegelijk, testen op het toestel, visuele keuzes eerst voorleggen.
- Taal: Nederlands (Vlaams) in de UI en de documentatie.
