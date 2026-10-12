# The Eye of the Kat — Beslissingen: uitgebreide uitleg

Bij elk nummer uit [`BESLISSINGEN.md`](BESLISSINGEN.md) staat hier de context: wat er beslist
is, welke alternatieven bekeken zijn, en waarom. Opzoeken: zoek naar `## <nr>.`

Structuur per entry: **Beslissing** · **Alternatieven** · **Waarom** · **Gevolgen** (voor de bouw
en/of voor een latere overname in B-world).

---

## 1. Doel: haalbaarheidstest zonder AI

**Beslissing:** We testen of je op een gewone gsm of tablet, in de browser, een Kinect-achtige
avonturen-app kunt maken waarin een held een parcours aflegt, **zonder AI**. Het inhoudelijke
doel is myokines activeren bij kinderen: korte explosieve inspanningen van 10–20 s,
krachttraining in spelvorm, cardio, en vooral de combinatie van cardio en kracht.

**Alternatieven:** Idol Academy (map `Kinect`) doet hetzelfde, maar met MediaPipe Pose (AI).

**Waarom:** De doelgroep is kinderen. Kristof wil uitsluiten dat kinderen door AI "gezien" of
verwerkt worden, ook niet lokaal. Deze app is het tegenstuk van Idol Academy: samen tonen ze
wat je met en zonder AI kunt.

**Gevolgen:** Zonder AI is er geen skelet (geen gewrichtshoeken). Oefeningen moeten dus
detecteerbaar zijn via silhouet, beweging of kleur (#5). Een formele vergelijking met Idol
Academy is geen testdoel (#28).

## 2. "Geen AI" = geen enkel ML-model

**Beslissing:** Er zit geen enkel getraind model in de app: geen neuraal netwerk, geen
MediaPipe, TensorFlow.js, ONNX of gezichts- of handdetectie van het besturingssysteem. Alleen
klassieke beeldverwerking met vaste, leesbare regels: verschillen tussen pixels,
achtergrondaftrek, kleurdrempels en zwaartepunten.

**Alternatieven:** lokaal ML toelaten zolang er niets het toestel verlaat (dan zou de app
eigenlijk Idol Academy met een ander thema zijn).

**Waarom:** Elk algoritme is volledig uitlegbaar aan ouders en scholen ("de app telt hoeveel
pixels veranderen"), en er komt geen getraind model met onbekende data aan te pas.

**Gevolgen:** Geen afhankelijkheden op ML-bibliotheken. Bij elke build kijkt een controle na dat
er geen ML-pakketten in de bundel zitten (uit te werken in het plan). Detectie is minder
precies dan met een skelet. Dat vangen we op met het spelontwerp: grote, duidelijke
bewegingen.

## 3. Privacy: beelden verlaten het toestel nooit

**Beslissing:** Camerabeelden worden enkel in het werkgeheugen verwerkt, frame per frame, en
nooit opgeslagen (ook niet tijdelijk op schijf), verstuurd of gedeeld.

**Alternatieven:** geen. Dit is een harde eis van Kristof.

**Waarom:** De doelgroep is kinderen (zie #1).

**Gevolgen:** Geen opname-functie voor testbeelden in de app zelf. Testopnames voor
automatische tests komen van volwassenen of uit vrij bruikbare filmpjes, en worden apart
gemaakt (uit te werken).

## 4. Privacy technisch afgedwongen *(voorlopig)*

**Beslissing (voorstel):** De pagina krijgt een Content-Security-Policy met `connect-src 'none'`
(zoals bij SingApp). Daardoor kan de pagina zelf technisch geen enkele netwerkverbinding meer
openen: geen fetch, XHR, WebSocket of beacon. De app bevat geen netwerkcode. Frames gaan van de
camera naar een klein canvas, worden geanalyseerd en daarna overschreven.

**Alternatieven:** `connect-src 'self'` (zoals bij Idol Academy, nodig omdat MediaPipe zijn model
moet laden). Hier is dat niet nodig, want er is geen model.

**Waarom:** "Belofte" wordt "afgedwongen": ook een bug of een kwaadaardige bibliotheek kan niets
versturen.

**Gevolgen:** De offline-cache (service worker) moet zo ingericht worden dat ze binnen deze
CSP werkt (bij SingApp is dat al bewezen). Te bevestigen door Kristof.

## 5. Detectie: silhouet + beweging, kleurbandjes optioneel

**Beslissing:** De basismodus werkt zonder hulpmiddelen:
- **Achtergrondaftrek (silhouet):** het kind stapt kort uit beeld, de app leert de lege
  achtergrond en ziet daarna de vorm van het kind (hoogte, breedte, positie, zwaartepunt).
  Daarmee detecteer je springen, hurken/duiken, links/rechts stappen, armen spreiden en
  stilstaan.
- **Bewegingsdetectie (verschil tussen frames):** hoeveel en waar er beweging is. Daarmee meet
  je ter plaatse lopen, slaan naar zones en de intensiteit.

Daarnaast komt er een optionele **kleurbandjes-modus**: gekleurde polsbandjes, sokken of
handschoenen geven de exacte positie van handen en voeten. Dat maakt preciezere oefeningen
mogelijk, zoals klimmen en grijpen.

**Alternatieven:** enkel silhouet; enkel kleurbandjes.

**Waarom:** Kristof wil beide pistes testen. Silhouet heeft de laagste drempel, kleurbandjes
geven het echte Kinect-gevoel.

**Gevolgen:** Twee detectiemotoren met een gemeenschappelijke uitvoer ("gebeurtenissen" zoals
`jump`, `duck`, `stepLeft`, en een intensiteit), zodat de games niet hoeven te weten welke modus
actief is. Kleurkeuze en kalibratie: zie de open punten.

## 6. Aparte app, hergebruik van Idol Academy toegestaan

**Beslissing:** Nieuwe app in `c:\Users\KrPe\Projects\KinectZonderAI`, met een eigen repo.
Bewezen onderdelen van Idol Academy mogen overgenomen worden: geluidsmotor, PWA/GitHub
Pages-opzet, veiligheidspauzes, scorelogica en documentatieaanpak. Alles wat met MediaPipe te
maken heeft, wordt **niet** overgenomen.

**Alternatieven:** volledig vanaf nul; als modus in Idol Academy.

**Waarom:** Zo is de test zuiver ("bevat aantoonbaar geen AI") en toch snel te bouwen.

**Gevolgen:** Overgenomen bestanden krijgen in de bouwlog de vermelding "overgenomen uit Idol
Academy, `<pad>`".

## 7. Doelgroep 6–12, één speler tegelijk

**Beslissing:** Kinderen van 6 tot 12 jaar, steeds één kind tegelijk voor de camera.

**Alternatieven:** twee kinderen naast elkaar; jongere kinderen (4–7).

**Waarom:** Silhouetdetectie werkt veel betrouwbaarder met één persoon in beeld.

**Gevolgen:** Als er een tweede persoon in beeld komt, moet de app dat herkennen ("te veel
silhouet") en pauzeren of waarschuwen. Of meerdere kinderen om de beurt mogen spelen
(estafette), is nog open.

## 8. Thema: origineel ninja-obstakelparcours

**Beslissing:** De held doorloopt een ninja-obstakelparcours. Het is sportief en competitief,
met minder verhaal. Alles is eigen ontwerp: geen namen, logo's of herkenbare obstakels van een
bestaande tv-show.

**Alternatieven:** jungle-expeditie, ruimte-avontuur, fantasy/ridders.

**Waarom:** Keuze van Kristof. Een obstakelparcours vertaalt ook rechtstreeks naar
detecteerbare bewegingen (springen, duiken, sprinten, klimmen).

**Gevolgen:** Uitstraling en held-ontwerp worden eerst als voorbeeld voorgelegd (#12).

## 9. Structuur: wereldkaart met etappes

**Beslissing:** Een wereldkaart met opeenvolgende etappes. Elke etappe duurt 2–4 minuten, met
één hoofdobstakel en een finale. Sprint- en kracht-etappes wisselen elkaar af (gecombineerde
training, zie #1).

**Alternatieven:** één doorlopende tocht; een endless runner.

**Waarom:** Het kind ziet zijn vooruitgang, en elke etappe is afzonderlijk te bouwen en te testen.

**Gevolgen:** Elke etappe is een losse module met een vaste interface. De invulling van de
etappes volgt in de volgende vraagronde.

## 10. Weergave: getekende held, geen camerabeeld

**Beslissing:** Tijdens het spelen is het camerabeeld verborgen. Een getekende held beweegt mee
(springt, duikt, loopt) in een getekende wereld. Het camerabeeld (of het silhouet) is enkel als
kleine preview zichtbaar tijdens het instellen, om te controleren of het kind goed in beeld
staat.

**Alternatieven:** camerabeeld met spelelementen erover (AR); een schakelaar tussen beide.

**Waarom:** Zo voelt het het meest als een game, en is het extra privacyvriendelijk: ook wie
meekijkt, ziet het kind niet op het scherm.

**Gevolgen:** De held reageert op gebeurtenissen (#5) en niet op ledematen. Animaties moeten dus
ontworpen zijn rond een beperkte set acties.

## 11. Opstelling: liggend én staand

**Beslissing:** Het toestel kan zowel liggend (landscape) als staand (portrait) gebruikt worden.

**Alternatieven:** enkel liggend; enkel staand.

**Waarom:** Keuze van Kristof. Liggend geeft meer ruimte voor zijwaartse bewegingen, staand
krijgt het hele lichaam makkelijker in beeld.

**Gevolgen:** Detectiedrempels worden relatief tot de silhouetgrootte gerekend, niet in pixels.
Spelwereld en HUD moeten in beide richtingen schalen. Beide richtingen moeten op elk
testtoestel getest worden.

## 12. Werkwijze

**Beslissing:** Eerst vraagrondes tot Claude ≥99% zeker is. Daarna een plan dat Kristof
goedkeurt, en dan bouwen in kleine blokken die elk op het toestel te testen zijn. Visuele keuzes
(stijl, held) worden eerst als voorbeeld voorgelegd en pas na een "ja" ingebouwd.

**Waarom:** Werkwijze van Kristof, ook gevolgd bij Idol Academy en SingApp.

## 13. Documentatiestructuur

**Beslissing:** Vijf documenten worden bijgehouden:
- `BESLISSINGEN.md`: korte index met een nummer per beslissing
- `BESLISSINGEN-UITLEG.md`: uitgebreide uitleg per nummer (dit document)
- `PLANNING.md`: blokken, status, open punten en risico's
- `docs/BOUWLOG.md`: per blok hoe het gebouwd is (algoritmes, drempels, bestanden, testresultaten)
- `docs/HERBOUW-BWORLD.md`: gids om de app in B-world over te nemen

**Waarom:** Gevraagd door Kristof, zodat achteraf duidelijk is hoe de app gebouwd is en waarom.

**Gevolgen:** Een blok is pas af als de documentatie bijgewerkt is.

## 14. Overname in B-world zoals bij Idol Academy

**Beslissing:** Als de test goed bevonden wordt, komt de app in B-world (React + Vite + PWA) op
dezelfde manier als Idol Academy. Bij Idol Academy is dat beslissing #33: herbouwen in B-world
volgens een herbouwgids, en de detectiemotor zonder React schrijven zodat je die letterlijk kunt
overnemen.

**Waarom:** Zo hebben beide tests dezelfde vorm, en kan B-world kiezen of combineren.

**Gevolgen:** De detectiemotor en de spellogica zijn pure TypeScript zonder UI-framework. De
herbouwgids wordt na elk blok aangevuld.

## 15. Vier cardio/explosieve obstakels

**Beslissing:** De testversie bevat vier obstakels voor korte, explosieve inspanning en cardio:

| Obstakel | Beweging | Detectie (zonder AI) |
|---|---|---|
| **Sprintbrug** | ter plaatse sprinten met hoge knieën, 10–20 s | hoeveelheid beweging (verschil tussen frames) in de onderste helft van het silhouet |
| **Rollende stammen** | op het juiste moment springen | de onderkant van het silhouet komt los van de geleerde vloerlijn |
| **Springstenen** | links/rechts springen of stappen | het zwaartepunt van het silhouet verschuift horizontaal, relatief tot de breedte van het lichaam |
| **Ninja-slagen** | stoten naar doelen links, rechts of boven | beweging in de zone van het beeld waar het doel oplicht |

**Alternatieven:** een kleinere selectie.

**Waarom:** Keuze van Kristof. Samen dekken ze "korte explosieve inspanningen" (sprint,
sprong) en cardio (slagen, zijwaarts springen) uit de doelstelling (#1).

**Gevolgen:** Er zijn vier basisdetectoren nodig: intensiteit, sprong, zijwaartse verschuiving
en zone-raak. Ninja-slagen werkt in beide richtingen (#11), maar de zones schalen mee.

## 16. Vier kracht-obstakels

**Beslissing:**

| Obstakel | Beweging | Detectie (zonder AI) |
|---|---|---|
| **Duikbalken** | hurken (squat) onder zwaaiende balken | de hoogte van het silhouet daalt tegenover de gekalibreerde staande hoogte |
| **Kikkersprongen** | diep hurken en dan explosief omhoog springen | eerst een hurkfase, daarna een sprong (detectoren uit #15 en Duikbalken samen) |
| **Schaduwmuur** | een houding vasthouden (hurkhouding of ster) terwijl een muur met een uitsparing nadert | de vorm van het silhouet past in een sjabloon, en het lichaam staat stil |
| **Muurklim** | armen afwisselend hoog reiken en knie omhoog | basis: afwisselende beweging links/rechts boven het hoofd; bandjes-modus: hand echt naar een greep brengen |

**Waarom:** Keuze van Kristof. Dit is krachttraining in spelvorm (squats, sprongkracht, een
statische houding vasthouden) uit de doelstelling (#1). Kikkersprongen combineert kracht en
explosiviteit.

**Gevolgen:** Muurklim is het enige obstakel met een duidelijk verschil tussen de basismodus en
de bandjes-modus. Het is daarmee de beste vergelijkingstest voor #5. Schaduwmuur heeft een
vormvergelijking nodig (overlap tussen het silhouet en een sjabloon).

## 17. Inspanningsritme per etappe

**Beslissing:**
- **Sprint-etappes** (Sprintbrug, Ninja-slagen): intervallen van ±10–20 s volle inspanning met
  actieve rust ertussen (de held wandelt verder, korte uitleg).
- **Kracht-etappes** (Duikbalken, Kikkersprongen, Muurklim, Schaduwmuur): een aantal
  herhalingen of een vasthoudtijd.
- **Finale**: continu, de obstakels volgen elkaar op en het tempo stijgt.
- Sprongetappes (Rollende stammen, Springstenen): ritme volgt de obstakels. Concrete aantallen
  en tijden worden in het plan voorgesteld (voorlopig).

**Alternatieven:** overal intervallen; overal continu.

**Waarom:** Keuze van Kristof. Zo past het ritme bij het soort inspanning: sprinten werkt best
kort en intens, kracht best in herhalingen.

**Gevolgen:** De etappemotor ondersteunt drie soorten verloop: interval, herhalingen en continu.

## 18. Kleurbandjes: vrij voorwerp + kalibratie

**Beslissing:** In de bandjes-modus houdt het kind eender welk fel gekleurd voorwerp (een sok,
sjaaltje of scrunchie om de pols) voor de camera, in een kader op het scherm. De app leert die
kleur (tint- en verzadigingsbereik) en volgt ze daarna.

**Alternatieven:** vaste fluo-bandjes kopen; vier markers voor handen en voeten.

**Waarom:** Er moet niets aangekocht worden. Het werkt met wat thuis of op school ligt.

**Gevolgen:** Na de kalibratie volgt een controle: als dezelfde kleur ook elders in beeld veel
voorkomt (kleding, muur), waarschuwt de app en vraagt ze een ander voorwerp. Het aantal
markers (1 of 2 handen) wordt nog bepaald.

## 19. Spelersprofielen en om de beurt spelen

**Beslissing:** Elk kind maakt een profiel met een bijnaam en een leeftijd. Er wordt **geen foto**
gebruikt, dus geen beeld van het kind. Elk profiel heeft een eigen voortgang op de wereldkaart.
Doelen (aantal herhalingen, tempo, vasthoudtijd) worden per leeftijd geschaald, zodat een
6-jarige en een 12-jarige eerlijk kunnen vergelijken. Er is een gedeeld scorebord, en kinderen
kunnen om de beurt spelen.

**Alternatieven:** profielen zonder scorebord; geen profielen.

**Waarom:** Om de beurt spelen is ook de enige manier om met meerdere kinderen te spelen zonder
dat er twee silhouetten in beeld komen (#7). De leeftijdsschaling houdt het eerlijk.

**Gevolgen:** De leeftijdsschaling moet uitgewerkt worden (voorstel in het plan; Idol Academy
#10 dient als vertrekpunt). Bij elke beurt is een korte herkalibratie nodig (andere lengte,
andere kleren).

## 20. Audio

**Beslissing:** Geluidseffecten, zelf gesynthetiseerde muziek (Web Audio, geen opgenomen of
bestaande muziek) waarvan het tempo meegaat met de inspanning, en een Nederlandstalige coach via
de spraakstem die al op het toestel staat (Web Speech API, enkel lokale stemmen).

**Alternatieven:** geen stem; enkel geluidseffecten.

**Waarom:** 6-jarigen lezen nog beperkt, dus de stem en het geluid dragen de uitleg. Kan
overgenomen worden uit Idol Academy (`src/audio`, beslissing #48 daar: enkel lokale stem).

**Gevolgen:** Online stemmen worden uitgefilterd, zodat er geen tekst naar een spraakdienst gaat.
Alle info blijft ook visueel beschikbaar (sommige toestellen hebben geen goede NL-stem).

## 21. Levering: PWA op GitHub Pages, publieke repo

**Beslissing:** Een installeerbare, offline bruikbare webapp (PWA) op GitHub Pages, in een
publieke repo onder `kristofpeeters81-lgtm`. Een push naar `main` zet de nieuwe versie meteen
live.

**Alternatieven:** enkel lokaal testen; andere hosting met een private repo.

**Waarom:** Bewezen aanpak (SingApp, Idol Academy). De camera vereist https, en dat geeft Pages
gratis. Een publieke broncode is een voordeel: iedereen kan nakijken dat er geen AI in zit
(#2) en dat er geen netwerkverkeer is (#4).

**Gevolgen:** De repo-naam volgt uit de appnaam (nog open). Er gaan nooit testbeelden van
kinderen in de repo. Pushen naar `main` gebeurt pas na de lokale tests.

## 22. Testtoestellen

**Beslissing:** Dezelfde toestellen als bij Idol Academy: een recente Android-gsm, een oude
Android-tablet en een laptop-webcam. Er is geen iPhone. iOS-specifieke code wordt voorzien
maar niet getest.

**Waarom:** Zo zijn de resultaten met AI (Idol Academy) en zonder AI rechtstreeks vergelijkbaar.

**Gevolgen:** De oude tablet is de maatstaf voor prestaties. Klassieke beeldverwerking op een
klein canvas (bv. 160×120 of 320×240) is veel lichter dan een pose-model, dus verwacht wordt
dat deze app daar vlotter draait.

## 23. Uitstraling: stoer/sportief

**Beslissing:** Een strakke sport-game-look met felle accenten en dynamische lijnen. Niet
kinderachtig, zoals bij Idol Academy (#2 daar).

**Alternatieven:** cartoon/speels; kiezen uit meerdere stijlvoorbeelden.

**Waarom:** Jongere kinderen vinden een tiener-look vaak cool, oudere kinderen haken af bij een
kinderachtige look.

**Gevolgen:** Volgens #12 wordt de stijl toch eerst als voorbeeldscherm (held + obstakel)
voorgelegd voordat de games erin gebouwd worden.

## 24. Held: kiezen + kleuren aanpassen

**Beslissing:** Het kind kiest uit 3–4 ninja-helden (divers, ook genderneutraal) en kiest de
kleur van pak en hoofdband. De keuze hoort bij het profiel (#19). De held lijkt nooit op het
kind: er wordt geen foto en geen camerabeeld gebruikt.

**Alternatieven:** één vaste held; ontgrendelbare outfits.

**Waarom:** Kinderen identificeren zich sterker met een held die ze zelf kozen.

**Gevolgen:** De helden zijn eigen SVG/Canvas-tekeningen. Kleuren worden als variabelen
toegepast, zodat er geen aparte tekening per kleur nodig is. Alle helden delen dezelfde
animatieset (lopen, springen, duiken, zijstap, slag, klimmen, houding).

## 25. Beloning: sterren + ontgrendelen

**Beslissing:** Per etappe 1–3 sterren, op basis van inzet en geschaald per leeftijd (#19). De
volgende etappe gaat pas open als de vorige uitgespeeld is. Verzamelde sterren ontgrendelen
extra's, zoals outfits en een bonus-etappe.

**Alternatieven:** enkel punten en scorebord; geen score.

**Waarom:** Een duidelijk doel per etappe en een reden om terug te komen, wat goed is voor de
duurtest (#1).

**Gevolgen:** Uitspelen moet altijd mogelijk zijn (minstens 1 ster bij inzet), ook als de
detectie een slechte dag heeft. Het scorebord (#19) toont sterren en punten. De exacte
stertdrempels komen in het plan (voorlopig).

## 26. Veiligheid

**Beslissing:** Alle vier de maatregelen:
1. **Ruimte-check bij de start:** het kind staat volledig in beeld en het silhouet raakt de
   randen niet. Anders start het spel niet.
2. **Korte opwarming:** ±1 minuut rustig bewegen voor de eerste etappe van een sessie.
3. **Automatische rustpauzes:** na intensieve etappes een verplichte korte rust (met een
   herinnering om te drinken).
4. **Automatische pauze:** het spel pauzeert als het kind uit beeld loopt, of als er een tweede
   persoon in beeld komt (#7).

**Waarom:** Kinderen bewegen explosief in een woonkamer of klas. Detectie zonder AI is gevoeliger
voor storingen, dus pauzeren is veiliger dan verkeerd blijven tellen.

**Gevolgen:** "Tweede persoon" wordt herkend aan een silhouet dat veel te groot is of uit twee
losse delen bestaat. Een voorbijlopende ouder pauzeert het spel dus ook. Dat is een bewuste
keuze.

## 27. Stack

**Beslissing:** React + Vite + TypeScript (strict, geen `any`) + Vitest, zoals Idol Academy en
B-world. De detectiemotor (silhouet, beweging, kleur) en de spellogica (etappes, scores) zijn
pure TypeScript zonder React. De games tekenen op Canvas2D, en React doet enkel de app-schil
(menu's, profielen, wereldkaart, instellingen).

**Alternatieven:** Vite + TS zonder React (lichter, maar de schil moet dan bij de overname
herschreven worden).

**Waarom:** Maximaal hergebruik van Idol Academy (#6) en een zo makkelijk mogelijke overname in
B-world (#14).

**Gevolgen:** De beeldverwerking draait op een klein canvas (resolutie te bepalen in blok 1).
React mag nooit per frame opnieuw renderen.

## 28. Testdoelen

**Beslissing:** De test moet drie dingen meten:
1. **Detectie-nauwkeurigheid:** worden echte bewegingen per obstakel geteld en valse niet?
   Hiervoor komt een testlab-scherm met tellers, plus automatische tests op testopnames.
2. **Prestaties:** fps en verwerkingstijd per frame, zichtbaar in een debugpaneel, vooral op de
   oude tablet (#22).
3. **Fun + intensiteit:** vinden kinderen het leuk, en halen ze echt korte piekinspanningen?
   Hiervoor komt een intensiteitsmeter per etappe en een korte evaluatie na de sessie.

Een formele vergelijking met Idol Academy hoort er **niet** bij.

**Alternatieven:** ook een eindrapport met een vergelijking met/zonder AI.

**Waarom:** Keuze van Kristof. De app moet op zichzelf beoordeeld worden.

**Gevolgen:** Sectie 7 van de herbouwgids wordt een korte observatie in plaats van een
vergelijkend rapport. De intensiteitsmaat wordt in het plan voorgesteld (voorlopig).

## 29. Opslag lokaal + export

**Beslissing:** Profielen, voortgang, sterren en meetgegevens (herhalingen, tijden,
intensiteit, fps, valse/gemiste detecties in het testlab) worden lokaal op het toestel bewaard.
Een knop exporteert alles naar CSV/JSON. Er worden **nooit** beelden opgeslagen (#3).

**Alternatieven:** enkel lokaal, zonder export.

**Waarom:** De export is nodig om de testdoelen (#28) te analyseren.

**Gevolgen:** De export gaat als download naar het toestel, niet via het netwerk, dus het blijft
binnen de CSP (#4). Een kalibratiebeeld van de achtergrond bestaat enkel in het geheugen
tijdens een sessie.

## 30. Kalibratie: aftellen en uit beeld stappen

**Beslissing:** Bij de start van een beurt zegt de held "stap opzij!". Er volgt een aftelling
3-2-1, en de app leert de lege achtergrond in ±1 s (gemiddelde over enkele frames). Daarna komt
het kind terug en gaat het in de getekende voetstappen staan. Dat is meteen de ruimte-check
(#26), en de app meet er ook de staande hoogte mee (de basis voor hurken en springen, #16). Tijdens
het spelen past de app de achtergrond langzaam aan op de plaatsen waar het kind niet staat
(tegen geleidelijke lichtwijzigingen).

**Alternatieven:** een begeleider drukt op een knop; beide.

**Waarom:** Het kind kan dit zelfstandig doen, er is geen volwassene nodig.

**Gevolgen:** Als de achtergrond tijdens het leren niet leeg is (er beweegt iets), herhaalt de
app de aftelling. Na een plotse lichtwijziging (lamp aan) vraagt de app opnieuw te kalibreren.
In de kleurbandjes-modus volgt daarna nog de kleurkalibratie (#18).

## 31. Als de detectie faalt

**Beslissing:** Twee vangnetten tegelijk:
- **Automatisch:** als een obstakel na een vaste tijd niet gehaald is, "struikelt" de held maar
  gaat hij toch verder. Een kind blijft dus nooit vastzitten.
- **Begeleider-knop:** een volwassene kan op het scherm tikken om een obstakel als gehaald te
  tellen.

Beide worden in de meetgegevens gelogd (`auto` of `handmatig`), los van de echte detecties.

**Alternatieven:** enkel de begeleider-knop; enkel automatisch.

**Waarom:** Kinderen mogen niet gefrustreerd raken door een fout van de detectie, en de logs
tonen precies waar de detectie tekortschiet. Dat is testdoel 1 (#28).

**Gevolgen:** Een automatisch of handmatig gepasseerd obstakel telt niet mee voor de sterren
(#25), maar blokkeert het uitspelen ook niet. De tijd tot het automatisch doorgaan wordt per
obstakel in het plan voorgesteld.

## 32. Testfilmpjes

**Beslissing:** Automatische detectietests draaien op filmpjes van **volwassenen** die de
oefeningen doen:
1. Eerst gratis, vrij bruikbare filmpjes (bv. Wikimedia Commons, met een licentie die gebruik
   toelaat). Die mogen in de repo, met bronvermelding.
2. Later eigen opnames van Kristof (±1 min per oefening, met zijn gsm, in de echte testruimte).
   Die blijven **enkel lokaal** (gitignored) en gaan nooit naar de publieke repo.

Nooit beelden van kinderen (#3).

**Alternatieven:** enkel gratis filmpjes; enkel eigen opnames.

**Waarom:** De automatische controle kan meteen starten, zonder werk voor Kristof. Daarna wordt
ze realistischer met beelden uit de echte ruimte en van de echte camera.

**Gevolgen:** De tests draaien in de ontwikkelomgeving (Node/browser-test), niet in de live app.
De live app heeft geen opnamefunctie. Per filmpje hoort een bestand met het verwachte resultaat
(bv. "10 sprongen, 5 hurken"). Tests op lokale opnames worden overgeslagen als de bestanden
ontbreken (bv. op een andere pc).

## 33. Kleurbandjes: twee markers, dezelfde kleur

**Beslissing:** Het kind draagt op beide polsen hetzelfde soort fel voorwerp (bv. twee gele
sokken). Er is één kleurkalibratie (#18). De app onderscheidt links en rechts op basis van de
positie: de twee grootste kleurvlekken, gevolgd van frame tot frame.

**Alternatieven:** twee verschillende kleuren; één marker.

**Waarom:** Echt klimmen met twee handen wordt mogelijk (Muurklim, #16), met maar één
kalibratie.

**Gevolgen:** Als de handen elkaar kruisen, kunnen links en rechts verwisselen. Dat maakt voor
de games niet uit: een greep raken met "een hand" volstaat. Als één marker verdwijnt (achter
het lichaam), gaat de app verder met één.

## 34. Naam: "The Eye of the Kat"

**Beslissing:** De app heet **The Eye of the Kat**, gekozen door Kristof.

**Alternatieven:** Shadow Dash (wordt al gebruikt door enkele indie-games, waaronder een
ninja-parkourgame op iOS), Kage Run, Dojo Dash, Schaduwninja.

**Waarom:** Keuze van Kristof. Een snelle zoekopdracht op 2026-10-11 vond geen game of merk met
de spelling "Kat". Er bestaat wel een oude film *Eye of the Cat* (1969), maar die zit in een
ander domein.

**Gevolgen:** De naam verwijst naar het lied "Eye of the Tiger". Dat lied (muziek en tekst)
wordt **nooit** gebruikt, want alle muziek is zelf gesynthetiseerd (#20). De repo-naam en de
betekenis van "Kat" in het spel worden nog bevraagd. Voor commercieel gebruik later: een
officiële merkencheck (Benelux/EU).

## 35. Verhaal: het Oog van de Kat is de schat

**Beslissing:** "Het Oog van de Kat" is een legendarisch juweel (een kattenoog-edelsteen) dat
bovenaan het ninja-parcours ligt. Elke etappe op de wereldkaart (#9) brengt de held dichterbij,
en in de finale bereikt de held het Oog.

**Alternatieven:** de Kat als sensei/coach; beide; kat-ninja's als helden.

**Waarom:** Keuze van Kristof. Het geeft het avontuur een duidelijk einddoel.

**Gevolgen:** De wereldkaart loopt omhoog naar het Oog (een berg of toren), en het Oog is van
overal op de kaart zichtbaar. Wie de coach-stem is, wordt nog bevraagd. De helden blijven
ninja's (#24).

## 36. Repo en URL

**Beslissing:** Publieke repo `kristofpeeters81-lgtm/EyeOfTheKat`, live op
`https://kristofpeeters81-lgtm.github.io/EyeOfTheKat/` (#21).

**Waarom:** Korter dan de volledige naam.

**Gevolgen:** De Vite-`base` is `/EyeOfTheKat/`, en de service worker-scope volgt die base.

## 37. Taal van de namen

**Beslissing:** Obstakels en etappes krijgen Engelse namen, zoals de titel en zoals bij Idol
Academy. Alle uitleg, UI-teksten en de coach zijn in het Nederlands (Vlaams).

**Alternatieven:** Nederlandse namen.

**Waarom:** Dat past bij de tiener-look (#23). Omdat de uitleg en de coach Nederlands blijven,
begrijpen ook 6-jarigen wat ze moeten doen.

**Gevolgen:** De Engelse namen worden in het plan voorgesteld (voorlopig). In de documentatie
blijven de werknamen (Sprintbrug, ...) als verwijzing naast de Engelse naam staan.

## 38. Coach: de Geest van de Berg

**Beslissing:** De coach is "de Geest van de Berg": een mysterieuze stem met een zwevend
lichtje, die het Oog van de Kat bewaakt (#35). De geest legt uit, moedigt aan en daagt uit
("Ben jij snel genoeg voor de brug?"). De stem is de lokale Nederlandse stem van het toestel
(#20).

**Alternatieven:** een sensei-figuur; de held zelf; een kat-gids.

**Waarom:** Keuze van Kristof. Het past bij het juweel-verhaal, en er is weinig tekenwerk nodig
(een lichtje in plaats van een personage).

**Gevolgen:** Teksten van de geest staan samen in één bestand, zodat ze makkelijk aan te passen
zijn.

## 39. Zichtbaarheid van de meetgegevens

**Beslissing:** Een klein balkje met fps en Ninja Power is altijd zichtbaar. Tik je erop, dan
opent een volledig debugpaneel met het silhouetmasker, het kleurmasker, de detectorwaarden en
de verwerkingstijd per frame. Daarnaast is er een apart Testlab-scherm waarin je per beweging
de detectie los kunt testen.

**Alternatieven:** een verborgen menu; alles altijd zichtbaar.

**Waarom:** De testdoelen (#28) moeten makkelijk af te lezen zijn, zonder dat het spel er rommelig
door wordt.

**Gevolgen:** De preview toont een **masker** (een effen vorm), nooit het camerabeeld. Dat is
in lijn met #10.

## 40. Kleurbandjes-modus overal

**Beslissing:** Elke etappe is in beide modi speelbaar. In de bandjes-modus worden Wall Climb
(de hand moet echt een greep raken) en Shadow Strike (de hand moet een precies doel raken)
nauwkeuriger. De andere etappes gebruiken in beide modi het silhouet.

**Alternatieven:** de bandjes-modus enkel voor de twee hand-etappes.

**Waarom:** Zo vergelijk je beide modi op dezelfde etappes, en dat is meteen een antwoord op de
vraag uit #5.

**Gevolgen:** De meetgegevens (#29) bevatten per etappe de actieve modus.

## 41. Engelse namen *(voorlopig)*

| Werknaam | Engelse naam | Type |
|---|---|---|
| Sprintbrug | **Bridge Sprint** | sprint (intervallen) |
| Rollende stammen | **Log Roll** | sprong (golven) |
| Springstenen | **Stone Hop** | zijwaarts (golven) |
| Ninja-slagen | **Shadow Strike** | cardio (intervallen) |
| Duikbalken | **Duck Beams** | kracht (herhalingen) |
| Kikkersprongen | **Frog Leap** | kracht + explosief (herhalingen) |
| Schaduwmuur | **Shadow Wall** | statische houding (vasthouden) |
| Muurklim | **Wall Climb** | kracht (herhalingen) |
| Finale | **The Eye** | continu, mix van alles |

**Waarom:** Kort en stoer (#23), en voor 6-jarigen uit te spreken. "Shadow" verwijst naar de
silhouetdetectie.

## 42. Volgorde op de wereldkaart *(voorlopig)*

**Voorstel:** 1 Bridge Sprint → 2 Duck Beams → 3 Log Roll → 4 Frog Leap → 5 Stone Hop →
6 Shadow Wall → 7 Shadow Strike → 8 Wall Climb → 9 **The Eye** (bovenaan de berg).

**Waarom:** Cardio en kracht wisselen af (gecombineerde training, #1). Eerst wordt één nieuwe
basisbeweging per etappe aangeleerd (lopen, hurken, springen), daarna komen de combinaties
(Frog Leap = hurken + springen). Wall Climb staat vlak voor de top, omdat die het moeilijkst te
detecteren is.

**Gevolgen:** De volgende etappe gaat open na het uitspelen van de vorige (#25). Een
begeleider-optie "alles open" maakt testen makkelijker.

## 43. Parameters per etappe + leeftijdsschaling *(voorlopig)*

**Voorstel (waarden voor 12 jaar; jonger = vermenigvuldigen met de leeftijdsfactor):**

| Etappe | Opbouw | Vangnet (#31) |
|---|---|---|
| Bridge Sprint | 4 × (15 s sprint + 20 s actieve rust) | n.v.t.: de brug houdt, enkel de score daalt |
| Shadow Strike | 4 × (15 s slagen + 20 s rust) | doel verdwijnt na 1,5 s |
| Duck Beams | 3 sets × 8 balken, 20 s rust | balk passeert, held struikelt |
| Log Roll | 3 golven × 8 stammen | stam passeert, held struikelt |
| Stone Hop | 3 golven × 10 stenen | na 5 s zonder stap |
| Frog Leap | 3 sets × 6 kikkersprongen, 20 s rust | na 8 s zonder sprong |
| Shadow Wall | 4 houdingen × 15 s vasthouden | muur gaat erdoor na de tijd |
| Wall Climb | 3 klimmen × 12 grepen | na 8 s zonder greep |
| The Eye | ±3 min continu, mix, tempo stijgt | per obstakel zoals hierboven |

**Leeftijdsfactor:** lineair van 0,6 (6 jaar) tot 1,0 (12 jaar). De factor wordt toegepast op
aantallen en vasthoudtijden. Op het tempo (snelheid van stammen en balken) wordt ze maar half
toegepast, zodat het ook voor 6-jarigen spannend blijft.

**Waarom:** De sprints van 15 s vallen binnen de explosieve zone van 10–20 s (#1). Herhalingen
in sets zijn krachttraining in spelvorm.

## 44. Intensiteitsmaat "Ninja Power" *(voorlopig)*

**Voorstel:** De Ninja Power (0–100) meet de bewegingsenergie: het aandeel van de pixels dat
van frame tot frame verandert binnen het kader van het silhouet. Dat wordt gemiddeld over ±1 s
en genormaliseerd op de gekalibreerde silhouetoppervlakte, zodat afstand tot de camera en
lengte niet meetellen. Vier zones: rust (<20), matig (20–45), hoog (45–70) en piek (≥70). De
grenzen worden bijgesteld op echte metingen in het Testlab.

**Waarom:** Zonder AI is er geen gewrichtssnelheid, en bewegingsenergie is de beste klassieke
benadering. Ook Idol Academy werkte met 4 zones (#26 daar), wat herkenbaar is voor B-world.

## 45. Sterren *(voorlopig)*

**Voorstel:** ★ = uitgespeeld (altijd haalbaar, #31). ★★ = ≥60 % van de obstakels echt
gedetecteerd (niet via auto-doorgaan of de begeleider-knop). ★★★ = ≥85 % echt gedetecteerd en
minstens een derde van de inspanningstijd in de zone hoog of piek. Voor de sprint-etappes
(geen afzonderlijke obstakels) telt de tijd in hoog/piek: ★★ ≥40 %, ★★★ ≥65 %.

## 46. Beeldverwerking *(voorlopig)*

**Voorstel:** Elk camerabeeld wordt verkleind naar een analysecanvas van **160×120** (of
120×160 in staande stand). De stappen per frame:
1. Verschil met het achtergrondmodel per kleurkanaal, met schaduwonderdrukking: een pixel die
   enkel donkerder is met dezelfde kleurverhouding telt als schaduw, niet als lichaam.
2. Opruimen (erosie/dilatatie), daarna de grootste samenhangende vlek nemen = het silhouet.
3. Kenmerken: kader, zwaartepunt, oppervlakte, hoogte en breedte tegenover de kalibratie.
4. Bewegingsenergie: verschil met het vorige frame, binnen het silhouetkader.

De achtergrond wordt langzaam bijgewerkt waar geen silhouet staat. Doel: 30 fps op de oude
tablet.

**Waarom:** Dit is licht genoeg voor oude toestellen en volledig uitlegbaar (#2). De verwerking
draait buiten React (#27).

## 47. Opwarming en rustpauzes *(voorlopig)*

**Voorstel:** Een opwarming van 60 s bij de eerste etappe van een beurt: rustig ter plaatse
lopen, armen zwaaien en 3 rustige hurken. Dat test meteen of de detectie werkt. Na elke etappe
volgt 30 s rust ("drink iets!"), na Bridge Sprint en Shadow Strike 45 s. Een begeleider kan
dit inkorten via het debugpaneel (bedoeld om te testen).

## 48. Controle bij elke build: geen AI, geen netwerk *(voorlopig)*

**Voorstel:** Een script (`scripts/check-privacy.mjs`) draait bij elke test en elke build in
GitHub, en faalt als:
- er een ML-pakket in `package.json` of in de bundel zit (mediapipe, tensorflow, onnx, ml5,
  ...);
- de broncode `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` of `EventSource` gebruikt;
- de gebouwde pagina de CSP `connect-src 'none'` niet bevat.

**Waarom:** Zo zijn #2 en #4 aantoonbaar: niet alleen beloofd, maar bij elke build
gecontroleerd.

**Gevolgen:** De service worker wordt bij de build gegenereerd en mag `fetch` gebruiken voor
de eigen bestanden. Dat is de enige uitzondering, en die staat expliciet in het script.

## 49. Doorbouwen zonder tussentijdse goedkeuring

**Beslissing:** Op 2026-10-11 zei Kristof: "Je mag starten met bouwen en doorgaan zover je kan.
Ik ben nu niet meer achter de computer, dus verras me." Claude bouwt dus blok na blok door,
zonder op een test per blok te wachten.

**Waarom:** Kristof is niet beschikbaar en wil bij zijn terugkeer zoveel mogelijk zien.

**Gevolgen:** Dit is een uitzondering op #12. Alles wat normaal eerst voorgelegd wordt (stijl,
held, voorstellen #41–#48) blijft `voorlopig` tot Kristof het bekeken heeft. De stijl wordt
daarom zo gebouwd dat hij centraal aan te passen is (kleuren en tekenfuncties apart). Elk blok
wordt automatisch getest en apart gecommit, zodat terugdraaien per blok kan. De testmomenten op
het toestel staan per blok in `PLANNING.md` als 🧪.

## 50. Synthetisch testfilmpje i.p.v. Commons-filmpjes *(voorlopig)*

**Beslissing (voorstel):** Voor de automatische eind-tot-eind-tests gebruiken we een
**synthetisch filmpje**: een getekende kamer met een getekende figuur die een vast draaiboek volgt
(uit beeld stappen, terugkomen, springen, hurken, zijstappen, lopen). Het script
`scripts/make-test-video.mjs` maakt het filmpje, met dezelfde scène-code als de unit tests
(`src/vision/testing/scene.ts`). Eigen opnames van Kristof (#32, deel 2) blijven de
realistische aanvulling.

**Alternatieven:** gratis filmpjes van Wikimedia Commons (#32, deel 1).

**Waarom:** Achtergrondaftrek heeft een begin nodig waarin de kamer **leeg** is (#30). In de
gekende Commons-filmpjes (zoals het jumping-jack-filmpje van Idol Academy) staat de persoon
voortdurend in beeld. De app kan daarmee de lege kamer nooit leren. Een synthetisch filmpje lost
dat op, en het draaiboek is exact gekend. De test kan dus precies controleren "4 sprongen, 3 keer
hurken".

**Gevolgen:** De e2e-tests bewijzen dat de keten werkt (camera → motor → detectoren → scherm, met
de CSP), maar **niet** dat de drempels kloppen voor echte kinderen in een echte kamer. Dat blijft
de toesteltest (#28). Het filmpje is niet in de repo opgenomen (±85 MB), het wordt bij gebruik
gemaakt.

## 51. Stijl "Night Summit" en de vier helden *(voorlopig)*

**Beslissing (voorstel):**
- **Wereld:** nachtlucht (indigo → paars aan de horizon), twinkelende sterren, een maan, en drie
  berglagen die verschillend meeschuiven (parallax). Op de hoogste top gloeit het **Oog van de
  Kat**: een amandelvormig amber juweel met een verticale kattenpupil die "ademt" en een jade
  rand (#35).
- **Helden:** een donker ninja-silhouet met een **lichtrand in de accentkleur** (gloed), een
  accentkleurige gordel, een hoofdband met wapperende linten, en een oogspleet. Vier helden met
  hetzelfde skelet en dezelfde poses (#24): **Kage** (kap), **Riku** (stekelhaar), **Mei**
  (paardenstaart), **Neko** (kattenoortjes, een knipoog naar de naam). 6 pakkleuren × 6
  accentkleuren.
- **UI:** de lettertypes Unbounded (titels) en Outfit (tekst), amberkleurige knoppen.

**Alternatieven:** een cartoon-look met ronde vormen. Ook een "Neon Stage" zoals Idol Academy kwam
in aanmerking, maar die is te gelijkaardig, en Kristof koos voor stoer/sportief (#23).

**Waarom:** Een silhouet met een gloeiende rand past bij "schaduw-ninja" en bij de
silhouetdetectie (het kind is zelf een schaduw), oogt stoer zonder kinderachtig te zijn, en is
volledig procedureel te tekenen: geen afbeeldingen, en elke kleur aanpasbaar (#24).

**Gevolgen:** Te bekijken via **Stijl** op het startscherm. Kleuren staan centraal in
`src/render/theme.ts` (wereld) en `src/app/styles.css` (UI). Bijsturen = enkel daar.

## 52. Demomodus *(voorlopig)*

**Beslissing (voorstel):** Een "bot" (`src/game/demo.ts`) kan elke etappe spelen zonder camera. Hij
geeft dezelfde invoer als de camera (`GameInput`): springen net voor een stam, laag bij een balk,
kikkersprongen om de 2,2 s, en hoppen naar de oplichtende steen. Aan te zetten met het vinkje "demo
(zonder camera)" bij de etappes, of met `?demo=1` in de link.

**Waarom:** Kristof (of een begeleider, of ouders) kan alle etappes bekijken zonder ruimte of
kalibratie. De automatische tests maken er screenshots mee van elke etappe in enkele seconden, wat
nodig is voor de visuele controle zonder toestel (#49).

**Gevolgen:** De demo telt niet als echte sessie. In blok 11 komt ze niet in de meetgegevens.

## 53. Obstakels ±2,3 s op voorhand zichtbaar *(voorlopig)*

**Beslissing (voorstel):** Bij Log Roll en Duck Beams komt elk obstakel rechts in beeld precies 2,3 s
voor het bij de held is. De snelheid op het scherm volgt dus de schermbreedte, en niet een vaste
snelheid in meter per seconde.

**Waarom:** In de eerste versie was een balk op een liggend scherm maar ±1,1 s zichtbaar, en op een
smal staand scherm nog korter. Dat is te kort voor een 6-jarige om te zien, te begrijpen en te
hurken. Met een vaste reactietijd is het op elk toestel even eerlijk (#11).

**Gevolgen:** Na de toesteltest eventueel bijstellen (`LEAD_MS` in `src/render/stages/setA.ts`).

## 54. Ontgrendelen met sterren; bonus-etappe uitgesteld *(voorlopig)*

**Beslissing (voorstel):** Sterren ontgrendelen kleuren voor de ninja (#24, #25). De eerste 2
accentkleuren en 3 pakkleuren zijn gratis. Daarna gaan accentkleuren open bij 3, 6, 9 en 12
sterren, en pakkleuren bij 15, 18 en 21 sterren (max. 27 sterren = 9 etappes × 3). De
**bonus-etappe** uit #25 is nog niet gebouwd.

**Waarom:** Kleuren zijn een zichtbare beloning zonder extra spelinhoud, en de drempels zijn
gespreid over de hele kaart. Een bonus-etappe vraagt een tiende spelvorm, en dat is pas zinvol als
de toesteltests tonen welke bewegingen het best werken.

**Gevolgen:** De drempels staan in `ACCENT_UNLOCK`/`SUIT_UNLOCK` (`src/game/profiles.ts`). Op de
kaart verschijnt een melding bij een nieuwe kleur of etappe.

## 55. Startscherm en begeleidersmenu; demo slaat niets op *(voorlopig)*

**Beslissing (voorstel):** Op het startscherm staat voor kinderen één grote knop **Spelen**
(→ "Wie speelt?") en de geluidsknoppen. Testlab, kalibreren, cameratest, stijl, losse etappes en
de opties "korte etappes" en "demo" staan onder een uitklapbaar **Voor begeleiders**. In de
demomodus (#52) wordt geen voortgang of score in de profielen bewaard.

**Waarom:** Kinderen moeten niet per ongeluk in testschermen terechtkomen, en een demo mag het
scorebord niet vervalsen.
