# The Eye of the Kat — Planning

Laatst bijgewerkt: 2026-10-11

**Statussen:** ⏳ gepland · 🔨 bezig · 🧪 gebouwd, wacht op test door Kristof · ✅ afgetekend · ⛔ geblokkeerd

**Werkwijze (#12, #49):** normaal één blok tegelijk, met een test door Kristof na elk blok.
Sinds #49 bouwt Claude door zonder op die tests te wachten. Elk blok wordt automatisch getest en
apart gecommit (makkelijk terug te draaien). De testmomenten blijven staan en worden achteraf
afgewerkt. Een blok is pas af als `docs/BOUWLOG.md` en `docs/HERBOUW-BWORLD.md` bijgewerkt zijn
(#13).

## Huidige stand

- ✅ **Interview** afgerond: 10 vraagrondes, beslissingen #1–#40
- ✅ Voorstellen van Claude vastgelegd als `voorlopig`: #41–#48, #50–#55
- 🧪 **Alle 12 blokken gebouwd** en automatisch getest (93 unit tests, 8 e2e-scenario's), live op
  https://kristofpeeters81-lgtm.github.io/EyeOfTheKat/ (2026-10-12). Kristof gaf groen licht om
  zonder tussentijdse tests door te bouwen (#49).
- ⏭️ **Volgende stap: toesteltests** volgens [`docs/TESTPROTOCOL.md`](docs/TESTPROTOCOL.md), daarna
  de drempels en voorlopige beslissingen bijsturen, en go/no-go voor B-world.

## Bouwblokken

| Blok | Inhoud | Testmoment voor Kristof | Status |
|---|---|---|---|
| 1 | **Fundament**: projectopzet (React + Vite + TS, #27), publieke repo + GitHub Pages (#36), PWA/offline, CSP `connect-src 'none'` (#4), privacycontrole (#48), camera, klein analysecanvas (#46), fps-balkje + debugpaneel (#39), liggend/staand (#11) | Link openen op gsm, oude tablet, laptop: start de camera, hoeveel fps? | 🧪 |
| 2 | **Silhouetmotor**: achtergrondmodel met schaduwonderdrukking, kalibratie "stap opzij 3-2-1" (#30), silhouetkenmerken, ruimte-check, uit beeld / tweede persoon (#26), Ninja Power (#44) + tests met synthetische beelden | Kalibreren in je eigen ruimte: staat het masker stabiel? Liggend en staand | 🧪 |
| 3 | **Detectoren + Testlab**: sprong, hurk, zijstap, slag per zone, houding vasthouden, kikkersprong, sprint-intensiteit; Testlab-scherm met tellers; tests op synthetische beelden en een synthetisch testfilmpje (#32, #50) | In het Testlab elke beweging 10× doen: klopt de teller? | 🧪 |
| 4 | **Kleurbandjes-motor** (#18, #33, #40): kleurkalibratie, 2 markers volgen, controle op storende kleur | Met 2 felle sokken om de polsen: volgt de app je handen? | 🧪 |
| 5 | **Stijl, held en wereld** (#23, #24, #35, #38): stijlvoorbeeld, 4 helden met kleurkeuze, de Geest, de berg met het Oog | Stijl bekijken: goedkeuren of bijsturen | 🧪 |
| 6 | **Etappemotor + eerste etappe**: Bridge Sprint end-to-end, met vangnetten (#31), sterren (#45) en resultaatscherm | Bridge Sprint volledig spelen | 🧪 |
| 7 | **Geluid** (#20): effecten, muziek die meegaat met de Ninja Power, stem van de Geest | Beluisteren op het toestel | 🧪 |
| 8 | **Etappes A**: Duck Beams, Log Roll, Frog Leap, Stone Hop | Elke etappe spelen | 🧪 |
| 9 | **Etappes B**: Shadow Wall, Shadow Strike, Wall Climb, The Eye (finale) | Elke etappe spelen, ook in de bandjes-modus | 🧪 |
| 10 | **Spelverloop**: profielen (#19), held kiezen (#24), wereldkaart (#42), opwarming en rust (#47), ontgrendelen, scorebord | Een volledige sessie met 2 kinderen om de beurt | 🧪 |
| 11 | **Opslag en extra's**: export CSV/JSON (#29), korte evaluatie na de sessie (#28), iOS-voorzieningen (ongetest, #22) | Export openen in Excel | 🧪 |
| 12 | **Herbouwgids B-world** (#14) afwerken + eindevaluatie van de testdoelen (#28) | Gids nalezen, go/no-go voor B-world | 🧪 |

## Open punten

- Alle `voorlopige` beslissingen (#41–#48, #50–#55) en de stijl (blok 5) moeten nog door Kristof bekeken worden.
- Testmomenten op het toestel van alle blokken (#49): zie `docs/TESTPROTOCOL.md`.
- Bonus-etappe (#25) uitgesteld (#54).
- iOS ongetest (#22).
- Idee (nog niet gebouwd): camera uitzetten op het startscherm (privacy/batterij); nu blijft ze aan zolang de app open is.

## Risico's

| Risico | Impact | Maatregel |
|---|---|---|
| Achtergrondaftrek faalt bij wisselend licht of een bewegende achtergrond | Valse sprongen/hurken | Langzaam bijwerkende achtergrond, herkalibratie-knop, waarschuwing bij plotse lichtwijziging |
| Camera regelt zelf belichting/witbalans bij | Silhouet "flakkert" | Schaduwonderdrukking, drempels relatief, waar mogelijk belichting vastzetten |
| Kleding met dezelfde kleur als de bandjes | Valse handposities | Controle na de kleurkalibratie (#18) |
| Tweede persoon in beeld | Verkeerde detectie | Silhouet in twee delen of te groot → pauze + melding (#26) |
| Kind draagt kleren in dezelfde kleur als de muur | Silhouet heeft gaten | Opruimstap (dilatatie), kader i.p.v. exacte vorm voor de meeste detectoren; tip bij de kalibratie |
| Sterke beweging door de camerastand (toestel valt of schuift) | Alles fout | Plotse verandering van >60 % van het beeld → herkalibreren |
