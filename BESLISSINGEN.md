# The Eye of the Kat — Beslissingen

Korte index van alle beslissingen. Elk nummer heeft een uitgebreide toelichting in
[`BESLISSINGEN-UITLEG.md`](BESLISSINGEN-UITLEG.md) onder dezelfde kop (`## <nr>.`).

**Statussen:** `beslist` (vast, enkel wijzigen met een nieuwe beslissing) · `voorlopig` (voorstel
van Claude, nog niet expliciet bevestigd) · `open` (nog te beslissen) · `vervangen door #x`.

**Regels:** nummers worden nooit hergebruikt of hernummerd. Een gewijzigde beslissing krijgt een
nieuw nummer; de oude krijgt status `vervangen door #x` en blijft staan.

| # | Datum | Beslissing | Status |
|---|-------|------------|--------|
| 1 | 2026-10-11 | Doel: haalbaarheidstest van een Kinect-achtige avonturen-webapp op gsm/tablet die myokines activeert, **zonder AI** | beslist |
| 2 | 2026-10-11 | "Geen AI" = geen enkel ML-model, ook niet lokaal; enkel klassieke, uitlegbare beeldverwerking | beslist |
| 3 | 2026-10-11 | Privacy: camerabeelden verlaten het toestel nooit en worden nergens opgeslagen | beslist |
| 4 | 2026-10-11 | Privacy technisch afgedwongen: CSP `connect-src 'none'`, geen netwerkcode, frames enkel in het geheugen | voorlopig |
| 5 | 2026-10-11 | Detectie: silhouet + beweging als basis, kleurbandjes als optionele extra modus | beslist |
| 6 | 2026-10-11 | Aparte app in map `KinectZonderAI`; onderdelen van Idol Academy mogen hergebruikt worden | beslist |
| 7 | 2026-10-11 | Doelgroep kinderen 6–12 jaar, één speler tegelijk in beeld | beslist |
| 8 | 2026-10-11 | Thema: origineel ninja-obstakelparcours (geen bestaande tv-show of merk) | beslist |
| 9 | 2026-10-11 | Structuur: wereldkaart met etappes van 2–4 min, sprint en kracht wisselen af | beslist |
| 10 | 2026-10-11 | Weergave: getekende held in een getekende wereld; camerabeeld enkel als kleine preview bij het instellen | beslist |
| 11 | 2026-10-11 | Opstelling: toestel liggend én staand moeten werken | beslist |
| 12 | 2026-10-11 | Werkwijze: vraagrondes tot ≥99% zekerheid, daarna kleine testbare blokken; visuele keuzes eerst voorleggen | beslist |
| 13 | 2026-10-11 | Documentatie: beslissingen (index), uitleg, planning, bouwlog en B-world-herbouwgids | beslist |
| 14 | 2026-10-11 | Als de test goed bevonden wordt: in B-world op dezelfde manier overnemen als Idol Academy | beslist |
| 15 | 2026-10-11 | Vier cardio/explosieve obstakels: Sprintbrug, Rollende stammen, Springstenen, Ninja-slagen | beslist |
| 16 | 2026-10-11 | Vier kracht-obstakels: Duikbalken, Kikkersprongen, Schaduwmuur, Muurklim | beslist |
| 17 | 2026-10-11 | Inspanningsritme per etappe: sprint = intervallen, kracht = herhalingen, finale = continu | beslist |
| 18 | 2026-10-11 | Kleurbandjes-modus: vrij te kiezen fel voorwerp, kleur wordt bij de start gekalibreerd | beslist |
| 19 | 2026-10-11 | Spelersprofielen (bijnaam + leeftijd, geen foto), om de beurt spelen, leeftijdsgeschaalde doelen, gedeeld scorebord | beslist |
| 20 | 2026-10-11 | Audio: geluidseffecten + zelf gesynthetiseerde muziek die meegaat met de inspanning + NL-coach via lokale toestelstem | beslist |
| 21 | 2026-10-11 | Levering: PWA op GitHub Pages, publieke repo onder kristofpeeters81-lgtm, push naar main = live | beslist |
| 22 | 2026-10-11 | Testtoestellen zoals Idol Academy: recente Android-gsm, oude Android-tablet, laptop-webcam; iOS voorzien maar ongetest | beslist |
| 23 | 2026-10-11 | Uitstraling: stoer/sportief (tiener-look), niet kinderachtig | beslist |
| 24 | 2026-10-11 | Held: kiezen uit 3–4 ninja-helden + kleur van pak/hoofdband aanpassen, hoort bij het profiel | beslist |
| 25 | 2026-10-11 | Beloning: 1–3 sterren per etappe (leeftijdsgeschaald), volgende etappe gaat open, sterren ontgrendelen extra's | beslist |
| 26 | 2026-10-11 | Veiligheid: ruimte-check bij start, korte opwarming, automatische rustpauzes, pauze bij uit beeld of tweede persoon | beslist |
| 27 | 2026-10-11 | Stack: React + Vite + TypeScript (strict) + Vitest; detectiemotor en spellogica puur TS zonder React; games in Canvas2D | beslist |
| 28 | 2026-10-11 | Testdoelen: detectie-nauwkeurigheid, prestaties (fps), fun + intensiteit; geen formele vergelijking met Idol Academy | beslist |
| 29 | 2026-10-11 | Opslag lokaal (profielen, voortgang, meetgegevens, nooit beelden) + export naar CSV/JSON | beslist |
| 30 | 2026-10-11 | Kalibratie: held zegt "stap opzij", aftellen 3-2-1, app leert de lege achtergrond, kind gaat terug in de voetstappen staan | beslist |
| 31 | 2026-10-11 | Als detectie faalt: obstakel gaat na een tijd vanzelf voorbij én een begeleider kan tikken; beide worden gelogd | beslist |
| 32 | 2026-10-11 | Testfilmpjes: eerst gratis filmpjes van volwassenen (bv. Wikimedia Commons), later eigen opnames van Kristof die enkel lokaal blijven; nooit kinderen | beslist |
| 33 | 2026-10-11 | Kleurbandjes: twee markers van dezelfde kleur (beide polsen), links/rechts op basis van positie | beslist |
| 34 | 2026-10-11 | Naam: "The Eye of the Kat" | beslist |
| 35 | 2026-10-11 | Verhaal: "Het Oog van de Kat" is een legendarisch kattenoog-juweel bovenaan het parcours; de finale = het Oog bereiken | beslist |
| 36 | 2026-10-11 | Repo `kristofpeeters81-lgtm/EyeOfTheKat`, URL `kristofpeeters81-lgtm.github.io/EyeOfTheKat` | beslist |
| 37 | 2026-10-11 | Namen van obstakels/etappes in het Engels; uitleg, UI-teksten en coach in het Nederlands | beslist |
| 38 | 2026-10-11 | Coach: "de Geest van de Berg", een mysterieuze stem met een lichtje dat het Oog bewaakt en het kind uitdaagt | beslist |
| 39 | 2026-10-11 | Meetgegevens: klein balkje (fps + intensiteit) altijd zichtbaar, tik voor het volledige debugpaneel; apart Testlab-scherm | beslist |
| 40 | 2026-10-11 | Kleurbandjes-modus werkt in elke etappe; Wall Climb en Shadow Strike worden er nauwkeuriger door | beslist |
| 41 | 2026-10-11 | Engelse namen: Bridge Sprint, Log Roll, Stone Hop, Shadow Strike, Duck Beams, Frog Leap, Shadow Wall, Wall Climb, finale The Eye | voorlopig |
| 42 | 2026-10-11 | Volgorde op de wereldkaart: cardio en kracht wisselen af, van makkelijk naar moeilijk, finale bovenaan | voorlopig |
| 43 | 2026-10-11 | Parameters per etappe + leeftijdsschaling (factor 0,6 op 6 jaar → 1,0 op 12 jaar) | voorlopig |
| 44 | 2026-10-11 | Intensiteitsmaat "Ninja Power" 0–100 uit bewegingsenergie, 4 zones | voorlopig |
| 45 | 2026-10-11 | Sterren: 1 = uitgespeeld, 2 = ≥60 % echt gedetecteerd, 3 = ≥85 % + genoeg tijd in de hoge zone | voorlopig |
| 46 | 2026-10-11 | Beeldverwerking op een klein analysecanvas (160×120), doel 30 fps | voorlopig |
| 47 | 2026-10-11 | Opwarming 60 s; rustpauze 30 s na elke etappe, 45 s na sprint-etappes | voorlopig |
| 48 | 2026-10-11 | Controle bij elke build: geen ML-pakketten en geen netwerk-API's in de code, CSP `connect-src 'none'` aanwezig | voorlopig |
| 49 | 2026-10-11 | Kristof gaf groen licht om zonder tussentijdse goedkeuring door te bouwen ("verras me"); stijl en voorstellen blijven voorlopig tot hij ze bekijkt | beslist |
