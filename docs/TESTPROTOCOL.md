# The Eye of the Kat — Testprotocol op toestellen

Voor wie: Kristof en andere begeleiders die de app op echte toestellen testen.
Doel: de testdoelen uit #28 beantwoorden (detectie, prestaties, fun en intensiteit) en de
voorlopige beslissingen bevestigen of bijsturen.

**Link:** https://kristofpeeters81-lgtm.github.io/EyeOfTheKat/
**Toestellen (#22):** recente Android-gsm, oude Android-tablet, laptop-webcam.

---

## 0. Voorbereiding (5 min)

- [ ] Ruimte van ±3 × 3 m vrij, zonder spullen om over te struikelen.
- [ ] Liefst een rustige achtergrond: geen tv die speelt, en geen raam met bewegende bomen of
      mensen achter het kind.
- [ ] Toestel **stevig** neerzetten op ±heuphoogte (tegen boeken, op een stoel, of in een houder).
      Het mag tijdens het spelen niet bewegen.
- [ ] Geluid aan. Werkt de stem van de Geest? Zie de knop "Stem van de Geest" op het startscherm.
      Grijs = geen lokale Nederlandse stem op dit toestel.

## 1. Snelle technische check (elk toestel, liggend én staand)

Startscherm → **Voor begeleiders** → **Cameratest**, en tik rechtsonder op het balkje.

| Toestel | Stand | fps | ms/beeld | Camera | Opmerking |
|---|---|---|---|---|---|
| gsm | liggend | | | | |
| gsm | staand | | | | |
| tablet | liggend | | | | |
| tablet | staand | | | | |
| laptop | liggend | | | | |

Goed = ≥ 20 fps en < 15 ms per beeld.

## 2. Kalibratie en silhouet (volwassene)

**Voor begeleiders → Kalibreren.** Volg de Geest: stap opzij, wacht, kom terug in de schaduw-ninja.

- [ ] Lukt de kalibratie in één keer? Zo niet: wat zegt de Geest?
- [ ] Tik op het balkje rechtsonder. Is het silhouet een mooie, volle vorm, zonder grote gaten
      en zonder "spookvlekken" naast je?
- [ ] Doe een lamp aan of uit. Wat gebeurt er? (verwacht: pauze "beeld veranderd" bij een grote
      wissel)
- [ ] Laat iemand achter je doorlopen. Verwacht: pauze "tweede persoon".

## 3. Testlab: elke beweging 10× (volwassene, daarna een kind)

**Voor begeleiders → Testlab.** Doe elke beweging 10 keer en noteer wat de teller zegt.

| Beweging | Teller na 10× (volwassene) | Kind (leeftijd …) | Opmerking |
|---|---|---|---|
| Sprongen | | | |
| Hurken | | | |
| Kikkersprongen (hurken + springen) | | | |
| Zijstappen (rechts–midden–links–midden = 4) | | | |
| Passen (10 s lopen ter plaatse) | | | |
| Slag links / rechts / omhoog | | | |
| Reik links / rechts (armen boven het hoofd) | | | |
| Ster vasthouden 10 s | | | |
| Hurkzit vasthouden 10 s | | | |

Let op valse tellingen (iets geteld terwijl je niets deed), zoals een "sprong" bij op de tenen
staan of een "zijstap" als je je armen spreidt.

**Kleurbandjes** (twee felle sokken om de polsen): in het Testlab → **Bandjes uit** → volg de
stappen. Ziet de app twee roze bolletjes op je handen? Herhaal de slagen en het reiken.

## 4. Een echte sessie (2 kinderen, om de beurt)

Startscherm → **Spelen** → elk kind maakt een **Nieuwe ninja** (bijnaam, leeftijd, held, kleuren).

- [ ] Kind 1 speelt etappe 1 (opwarming + Bridge Sprint). Daarna de rust, dan "Andere ninja" →
      kind 2.
- [ ] Na elke etappe: laat het kind zelf "Hoe leuk?" en "Hoe zwaar?" kiezen.
- [ ] Noteer per etappe: begrijpt het kind wat het moet doen? Was het te snel of te traag? Werd er
      vaak struikelen/"vanzelf" getoond terwijl het kind het goed deed?
- [ ] Probeer zoveel mogelijk etappes: Bridge Sprint, Duck Beams, Log Roll, Frog Leap, Stone Hop,
      Shadow Wall, Shadow Strike, Wall Climb, The Eye.
- [ ] Gebruik de begeleider-knop **✓ Gehaald** als de app een goede beweging mist. Dat wordt
      apart geteld en is waardevolle informatie.

**Snel alles bekijken zonder te bewegen:** Voor begeleiders → vinkje **demo** → Spelen. Dan speelt
een bot (er wordt niets bewaard).

## 5. Gegevens exporteren

Voor begeleiders → **Meetgegevens** → **Export CSV (Excel)**. Het bestand komt in Downloads. Open
het in Excel (`;` en decimale komma's zijn al goed voor Belgische instellingen).

Nuttige kolommen: `gezien_pct` (hoe vaak zag de camera de beweging), `hoog_piek_pct`
(intensiteit), `leuk`, `zwaar`, `fps`, `stand` en `toestel`.

## 6. Wat terugkoppelen aan Claude

Plak de ingevulde tabellen uit §1–§3, de opmerkingen uit §4, en (als je wil) het CSV-bestand in de
conversatie. Concreet nuttig:
- welke bewegingen te vaak of te weinig geteld worden (dan pas ik `MOVE_THRESHOLDS` aan);
- etappes die te snel/te traag/te lang zijn (`#43`);
- of de stijl, de helden en de namen goed zijn (`#41`, `#51`);
- de fps op de oude tablet (go/no-go voor prestaties).
