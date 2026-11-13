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
