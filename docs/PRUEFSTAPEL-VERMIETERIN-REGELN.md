# Lauf „Vermieterin“ – Regeln, vorab festgelegt (13.11.2026)

Klaus 13.11.: ein Lauf mit einer Rentnerin (Witwenrente), die in ihrem Haus wohnt und dort drei Wohnungen an drei Familien vermietet –
Garten, Nebenkostenabrechnung, Versicherungen, Vorbereitung der Steuer; alles erfunden. Für die Sortierung im Datei-Organizer, für
BookLedgerPro und die Familienakte. Texterkennung über den Kern von Workflow PDF (wie in der Familienakte eingebaut). Dazu
Kontoauszüge: Umsätze lesen, Überweisungen erkennen und Rechnungen samt Rechnungsnummer zuordnen. Danach weitere Stapel mit anderen
Lebensläufen derselben Frau (drei Kinder, Ehemann verstorben usw.).

Eingecheckt, bevor es den Stapel gibt. Es gelten `docs/PRUEFREGELN-GRUPPE.md` und `docs/FACHREGEL.md`. Der Lauf ist zugleich Runde E
(andere Form) der Prüfreihe.

## Eingefroren

Datei-Organizer `534cc08` (Fassung 0.2.0) · BookLedgerPro `d08c071` (0.1.15) · Familienakte `f00c91a`. Bis zur Messung wird an
Erkennung, Zuordnung und Modellen nichts geändert. Es ist eine Standmessung unter neuen Bedingungen, kein Alt-gegen-Neu-Vergleich.

## Stapel `pruefstapel-vermieterin/`

Ein Agent ohne Zugang zu Apps, Lehrdaten und früheren Stapeln schreibt ein erfundenes Jahr (2025) dieses Haushalts; er kennt nur
Fachregel, Fächerliste, Arten, Kontenliste und den Auftrag. Ungelesen eingecheckt.

- **Schriftstücke** (rund 90, Text): Rente, Kassen, Versicherungen, Finanzamt, Grundsteuer, Müll/Wasser, Handwerker, Garten, Mieter
  (Mietverträge, Mieterhöhung, Nebenkostenabrechnungen, Mahnung, Kündigung), Steuerunterlagen. Soll je Stück wie bei den Briefen:
  Bereich, Zweitfach, Schriftstück, Absender, Person, Frist.
- **Belege** (rund 45, Text) der Vermietung und des Haushalts: Soll Konto (Liste aus `pruefstapel-blp-2-kontenliste.json`), Richtung,
  Betrag, Datum, Steuersatz, Aussteller, Rechnungsnummer, dazu „umlagefähig ja/nein“ und Wohnung (wird berichtet, nicht gewertet –
  das kann noch keine App).
- **Kontoauszüge** (12 Monate, Text im Aufbau eines Auszugs): Soll je Umsatz Datum, Betrag, Soll/Haben, Gegenpartei, Art
  (Überweisung, Lastschrift, Dauerauftrag, Gutschrift, Entgelt), Rechnungsnummer falls genannt, und das zugehörige Stück des Stapels.

## Einordner

Stapel-Autor, ein zweiter Claude-Agent, Codex über den Briefkasten (sobald Klaus das Zeichen gibt). Soll = Mehrheit je Feld; ohne
Mehrheit strittig und nicht gewertet. Für die Kontoauszüge prüfen die Einordner die Zuordnung Umsatz → Stück. Solange Codex fehlt,
heißt das Ergebnis „vorläufig, zwei Einordner“.

## Zwei Formen je Stück

1. **Text** wie geschrieben.
2. **Gescannt:** dieselben Stücke als PDF-Seiten gesetzt (wechselnde Schriften, leichte Schräglage, Rauschen, einige als Handyfoto),
   gelesen mit der Texterkennung aus dem Workflow-PDF-Klon der Familienakte (`public/apps/workflow-pdf/vendor/tesseract`, deutsche
   Sprachdaten). Das ist derselbe Erkennungskern, aber im Prüflauf, nicht in der App am Gerät – so steht es im Bericht. Braucht ein
   Stück eine andere Texterkennung, wird sie benannt und getrennt ausgewiesen.

## Gemessen wird, je einmal

- **Datei-Organizer:** fünf Felder an den Schriftstücken, Text und gescannt; dazu Zeichen- und Wortfehler der Texterkennung.
- **Familienakte:** dieselben Schriftstücke über `scripts/vergleich-familienakte.mjs` (Bereich, Absender), Text und gescannt.
- **BookLedgerPro:** Konto, Richtung, Betrag, Datum, Steuersatz an den Belegen, Text und gescannt; Rechnungsnummer, soweit die App
  eine liest (sonst „liest die App nicht“).
- **Kontoauszüge:** (a) Wie viele Umsätze stehen nach der Texterkennung vollständig da (Datum, Betrag, Gegenpartei, Rechnungsnummer)?
  (b) BookLedgerPro liest heute nur MT940/CAMT: dieselben Umsätze werden als MT940 gesetzt (Werkzeug im Repo), gemessen wird der
  Zahlungsabgleich Umsatz → Rechnung. (c) Auszug als PDF: Was keine App liest, heißt „liest die App nicht“, nicht 0 %.
- Jede Zahl mit 95-%-Spanne (Wilson); Text gegen gescannt mit McNemar. „Falsch und als sicher ausgegeben“ wird je Feld genannt.

## Danach

Der Stapel ist verbraucht; an ihm darf gelernt werden. Weitere Lebensläufe derselben Frau (verheiratet mit drei Kindern, Tod des
Mannes mit Nachlass und Witwenrente-Antrag, Kinder ausgezogen, Verkauf einer Wohnung, Pflegegrad) kommen als eigene Stapel nach
denselben Regeln und messen, ob das Gelernte trägt.

## Grenzen

Ein Haushalt, erfunden, von einem KI-Agenten geschrieben; gesetzte PDF-Seiten sind keine echten Scans; nichts am Gerät.

## Nachtrag 13.11.2026 (Klaus, noch bevor der Stapel vorliegt): Folgejahre desselben Haushalts

Klaus: denselben Haushalt noch einmal mit einem anderen Jahr und geänderten Werten durchlaufen lassen und prüfen, ob die Werte beim
zweiten Mal besser werden – 2024, 2025, 2026 und notfalls Jahre, die noch nicht gekommen sind.

- **Folgestapel** `pruefstapel-vermieterin-2026/` (danach weitere Jahre): dieselbe Vermieterin, dieselben Absender und Vertragspartner,
  aber neue Schriftstücke, Belege und Kontoauszüge mit geänderten Werten: Grundsteuer und Abgaben erhöht, Kosten allgemein rund 3 %
  höher, Tankquittungen und Zahnarzt teurer, Rentenanpassung; bei den Mieterfamilien ein weiteres Kind, höheres Kindergeld,
  Arbeitslosengeld bzw. wieder Arbeit gefunden, Gehaltserhöhung, daraus Mietrückstand ausgeglichen oder Mieterhöhung.
  Geschrieben von einem neuen Agenten, der nur die Stammdaten des Haushalts (Namen, Wohnungen, Vertragspartner) kennt, nicht die
  Lösungen und nicht die Apps.
- **Ablauf:** Jahr 2025 messen (verbraucht) → daran lernen (Regeln, Wortmodell, gemerkte Zuordnungen wie ein Nutzer, der die
  Vorschläge des ersten Jahres berichtigt hat) → einfrieren → Jahr 2026 schreiben lassen → einmal messen, **mit und ohne** das
  Gelernte. Der Unterschied am Jahr 2026 ist die Antwort auf „wird es beim zweiten Mal besser?“ (McNemar).
- Getrennt ausgewiesen wird, was allgemein gelernt ist (gilt für jeden Haushalt) und was nur dieser Haushalt gelernt hat
  (wiederkehrende Absender, Daueraufträge, Rechnungsnummern-Muster). Das Zweite ist kein Nachweis für fremde Haushalte.
- Das „Merken wie ein Nutzer“ gibt es in den Apps noch nicht als Bedienung; im Lauf wird es als Werkzeug im Repo nachgestellt und
  so benannt.

## Nachtrag 13.11.2026 (Klaus, vor der Messung): Fristen bis zur Glocke, alle Werkzeuge der Gruppe

Klaus: Termine und Fristen (Finanzamt usw.) müssen eingehalten werden – auch das wird getestet, mit Erinnerung und Glocke der
Familienakte; alle Werkzeuge, die über das Mycel/SBKIM verknüpft sind, sollen im Lauf vorkommen.

Der Lauf misst deshalb zusätzlich die **Kette**, nicht nur die einzelnen Erkenner. Je Glied eine eigene Zahl, damit sichtbar bleibt,
wo ein Stück verloren geht:

1. **Texterkennung** (Workflow-PDF-Kern): Stück lesbar? (Wort-/Zeichenfehler; Datum und Betrag der Frist unversehrt?)
2. **Sortierung** (Datei-Organizer): Bereich, Art, Absender, Person, Frist.
3. **Familienakte, Eingang:** Wie viele Stücke mit Soll-Frist stehen nach dem Ablegen als Frist/Aufgabe mit dem richtigen Datum in der
   Akte (`lib/central-intake.ts`)? Wie viele ohne Soll-Frist bekommen fälschlich eine?
4. **Kalender und Glocke** (`lib/kalender.ts`, `lib/glocke.ts`): Wird für jede richtige Frist eine Erinnerung vor dem Fälligkeitstag
   geplant? Gemessen an den Planungsdaten; ob das Gerät wirklich klingelt, misst nur ein Gerät („nicht gemessen“).
5. **BookLedgerPro:** Belege und Kontoauszüge wie oben; zusätzlich fällige Rechnungen (Zahlungsziel) gegen die Umsätze: bezahlt,
   offen, überfällig.
6. **Suche über die Knoten** (Gruppenregeln 11–14): Fragen in Alltagssprache zum Stapel („Wann ist die Grundsteuer fällig?“, „Was hat
   der Dachdecker gekostet?“), geschrieben von einem Agenten, der die Suche nicht kennt; gemessen intern je Knoten. Extern über das
   Netz und die Bedeutungssuche nur mit echtem Modell und echtem Relais – sonst „nicht gemessen“.

**Ende-zu-Ende-Zahl:** Anteil der Soll-Fristen, die vom gescannten Stück bis zur geplanten Erinnerung mit richtigem Datum durchkommen.
Daneben jede verpasste Frist einzeln mit dem Glied, an dem sie verloren ging. Was ein Werkzeug heute nicht kann, heißt „kann die App
nicht“; Private Brain Pro und Workflow PDF Pro (als App) sind in dieser Sitzung nicht geklont und werden so benannt, nicht geschätzt.

## Nachtrag 13.11.2026 (Klaus, vor der Messung): Private Brain Pro dabei, Zeit je Dokument

- **Private Brain Pro** (`182e746`) und **Workflow PDF Pro** (`d37701a`) sind dazugeholt (nur lesend). Die deutschen Sprachdaten der
  Texterkennung in Workflow PDF Pro sind byte-gleich mit denen im Klon der Familienakte. Private Brain Pro wird mit seinem
  Kategorie-/Zielordner-Vorschlag an denselben Schriftstücken gemessen (Text und gescannt), soweit sich der Vorschlag ohne Gerät
  aufrufen lässt; sonst „nicht gemessen“.
- **Zeit:** Je Glied der Kette wird die Zeit je Dokument gemessen und auf 1000 Dokumente hochgerechnet – als Orientierung, nicht als
  zugesicherter Wert. Gemessen wird auf dem Rechner der Sitzung (4 Kerne); ein Tablet oder Handy ist langsamer, der Faktor ist nicht
  gemessen. Erste Orientierung an 30 verbrauchten Briefen (eine Seite je Brief): Texterkennung rund 1,5 s je Seite, Sortieren im
  Datei-Organizer rund 5 ms je Brief.

## Ergebnis Jahr 2025 – vorläufig, zwei Einordner (13.11.2026, je einmal gemessen)

Soll = wo Stapel-Autor und zweiter Claude-Agent übereinstimmen; Codex (Auftrag 009) steht aus. Stapel: 93 Schriftstücke, 45 Belege,
12 Kontoauszüge mit 223 Umsätzen. Gescannt: 150 Stücke auf 162 Seiten, 39 als Handyfoto. Zahlen: `ergebnisse/vermieterin-*.json`,
erkannter Text: `pruefstapel-vermieterin-ocr/`.

**Abweichung vom Auftrag:** Die Kontoauszüge hat der Stapel-Autor per Skript aus einer von Hand geschriebenen Umsatzliste gesetzt
(einheitliches Druckbild). **Werkzeugfehler:** `messen-bank.mjs` brach beim ersten Aufruf an einem Umsatz ohne Gegenpartei ab
(Fehler im Prüfwerkzeug, vor jeder Ausgabe); berichtigt und einmal gemessen.

| Was | Text | gescannt |
| --- | --- | --- |
| Texterkennung, Wortfehler | – | Schriftstücke 4,6 % · Belege 7,8 % · Kontoauszüge 4,5 % (Zeichenfehler gesamt 2,6 %) |
| Datei-Organizer Bereich | 74/90 = 82 % (73–89) | 74/90 = 82 % |
| Datei-Organizer Schriftstück | 74/90 = 82 % | 76/90 = 84 % |
| Datei-Organizer Absender | 74/80 = 93 % | 71/80 = 89 % |
| Datei-Organizer Frist | 75/90 = 83 % (falsch und sicher 8) | 75/90 = 83 % (8) |
| Familienakte heute: Bereich · Absender | 13/90 = 14 % · 34/90 = 38 % | 13/90 = 14 % · 32/90 = 36 % |
| BookLedgerPro Betrag | 38/45 = 84 % | 37/45 = 82 % |
| BookLedgerPro Datum | 43/45 = 96 % | 41/45 = 91 % |
| BookLedgerPro Steuersatz | 38/41 = 93 % | 38/41 = 93 % |
| BookLedgerPro Richtung | 41/45 = 91 % | 41/45 = 91 % |
| BookLedgerPro Konto (Regeln + Wortmodell, mit Namen) | 27/45 = 60 %; wo beide Einordner einig 24/37 = 65 % | 27/45 · 24/37 |
| Kontoauszug: Umsatz vollständig lesbar (Tag, Betrag, Gegenpartei, Zweck) | 223/223 (Kontrolle des Prüfwerkzeugs) | 187/223 = 84 % (78–88); Tag und Betrag 215/223, Zweck 195/223, Rechnungsnummer 43/43 |

Kein Unterschied Text gegen gescannt ist gesichert (alle Felder innerhalb der Spannen).

**Person:** 47/47, aber ohne Aussagekraft – der Haushalt hat eine Person; die Einordner sind sich hier uneins, wann ein Mieter als
Person gilt (Kappa 0,35). **Einigkeit der zwei Einordner:** Bereich, Schriftstück, Frist je 90/93, Absender 80/93, Konto 37/45.

**Kontoauszüge in BookLedgerPro:** Einen Auszug als PDF oder Bild liest die App nicht (nur MT940/CAMT). Dieselben Umsätze als MT940
gesetzt: 223/223 gelesen, Saldo in 12/12 Auszügen stimmig. Zahlungsabgleich gegen die 45 Belege als offene Posten (22 Umsätze
strittig zwischen den Einordnern, nicht gewertet): Umsatz mit genau einem Beleg 49/49 richtig; eine Zahlung für zwei Rechnungen 1/1;
von 151 Umsätzen ohne Beleg bekamen 20 fälschlich einen (wiederkehrende Zahlungen gleichen Betrags – Abschlag, Hausmeister, Telefon,
Kontoentgelt – treffen den einen Beleg eines anderen Monats). Im Prüflauf bleiben alle Posten offen; in der App wäre ein ausgeglichener
Posten weg, die Zahl ist darum eine Obergrenze. Rechnungsnummer vom Beleg: liest BookLedgerPro nicht.

**Zeit (Rechner der Sitzung, 4 Kerne):** Texterkennung 313 s für 162 Seiten = rund 1,9 s je Seite → 1000 Seiten rund 32 Minuten.
Sortieren, Belegleser und Zahlungsabgleich zusammen unter 10 ms je Stück.

**Noch nicht gemessen:** Fristen bis Kalender und Glocke in der Familienakte, Private Brain Pro, Suche über die Knoten, dritter
Einordner, Ende-zu-Ende-Zahl.
