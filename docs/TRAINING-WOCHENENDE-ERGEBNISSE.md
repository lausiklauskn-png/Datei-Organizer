# Trainings-Wochenende 14.–16.11.2026 – Ergebnisse je Block

Regeln: `docs/PRUEFSTAPEL-TRAINING-WOCHENENDE-REGELN.md` (vorab). Alt = Kern `534cc08` (0.2.0), neu = Kern `05c7ef0` (lib = `b391aaa`,
0.3.4 bis 0.4.3), eingefroren vor der ersten Vergabe. Alles erfunden. Zahlen mit 95-%-Spanne (Wilson), Unterschied mit McNemar.

## Block 0 – Stapel komplexer (14.11., ohne Agenten)

Werkzeuge: `scripts/setzen-komplex.py` (Satz wie echte Post, vier Formen, drei Güten), `scripts/haushalte-bauen.mjs --komplex`
(26 Haushalte, lange Bons, App-Bons), `scripts/leser-node.mjs` (Texterkennung wie die App). Probestapel Startwert 301: 2.068 Dateien.
Kern 0.4.3 (unverändert) je Form, Bereich / Absender / Schriftstück, Wortfehler der Texterkennung:

| Form | n | Bereich | Absender | Schriftstück | Wortfehler |
|---|---|---|---|---|---|
| PDF mit Textebene (gesetzt) | 486 | 89 % | 94 % | 93 % | – |
| PDF einfach (alte Machart) | 186 | 84 % | 97 % | 92 % | – |
| Bildschirmfoto | 41 | 83 % | 100 % | 100 % | 19 % |
| Scan gut / mittel / schlecht | 199 / 225 / 142 | 90 / 86 / **49 %** | 79 / 70 / **20 %** | 93 / 87 / 61 % | 36 / 47 / 78 % |
| Handyfoto gut / mittel / schlecht | 78 / 88 / 55 | 87 / 83 / 91 % | 69 / 65 / 49 % | 92 / 95 / 91 % | 43 / 47 / 65 % |

Kassenbons Betrag 73 % (lange Bons: Zwischensumme statt Summe, als sicher). Gehaltsabrechnungen je Feld 78–88 %.
**Befund Generator:** Die alte Zufallsformel läuft nach 610 Zügen in einen Kreis von 220 Werten – die Trainingszahlen vom 12.11.
stammen aus sehr gleichförmigen Daten. Mit `--komplex` behoben; ohne bleibt der alte Stapel bytegleich.
**Befund Messwerkzeug:** Eine hängende Texterkennung hielt die Messung an, und ein Fehler auf einer Seite ließ das ganze PDF leer
zurück (und wurde zwischengespeichert). Behoben (Frist 60 s wie in der App, Seiten einzeln, Leeres nie gemerkt).

## Block 1 – Tempo, Mengenprobe bis 50.000 Dateien (14.11., ohne Agenten)

Daten: 25 Stapel `haushalte-bauen.mjs --komplex` (Startwerte 501–525), 51.770 erfundene Dateien, davon die ersten 50.000 (mit
Mail-Anhängen 50.553 Einträge). `scripts/mengenprobe.mjs` bildet den Ablauf der App nach (Datei für Datei einlesen, nach je 50 den
Stand merken, am Ende Doppelte, Sieb 2–5, Absender vereinheitlichen). Texterkennung aus (getrennt unten). Ein Kern, 4-Kern-Rechner der Sitzung.

**Engstelle 1 – Stand nach jedem Block merken (behoben):** Bis 0.4.3 wurde nach jedem Block der ganze Lauf geschrieben (alle Dateien mit
Text und alle erledigten Schlüssel) – der Aufwand wächst mit dem Quadrat der Menge. Jetzt (`src/lauf.ts` `LaufSchreiber`, in
`src/zustand.ts` und `src/arbeit.ts`): Kopf klein, Dateien und Schlüssel in Teilen zu 1.000, je Block nur der neue Teil; dazu eine
IndexedDB-Verbindung für die Sitzung statt einer neuen je Schreibvorgang.

| Menge | Merken je 1.000 Dateien vorher (IndexedDB / Arbeitsordner) | nachher | Speicherspitze vorher → nachher (IndexedDB) |
|---|---|---|---|
| 1.000 | 44 / 81 ms | 43 / 54 ms | 137 → 130 MB |
| 5.000 | 202 / 306 ms | 46 / 51 ms | 350 → 207 MB |
| 20.000 | **1.069 / 1.235 ms** | **52 / 54 ms** | **1.405 → 535 MB** |
| 50.000 | nicht gemessen (hochgerechnet ~2,7 s je 1.000, über 3 GB) | 59 / 59 ms | → 1.248 MB |

Abbruch bei 60 % (30.000 Dateien), Stand wie nach einem Neustart geladen, weitergemacht: **dasselbe Ergebnis wie in einem Zug**
(50.553 Einträge, alle Felder gleich) – mit IndexedDB und mit Arbeitsordner. Alte gemerkte Stände (bis 0.4.3) werden weiter gelesen.
UI-Probe 115 grün.

**Was sonst Zeit kostet (nachher, 50.000):** Lesen (Bytes, Fingerabdruck, PDF-Text mit pdf.js) 3,4–4,2 s je 1.000 = rund 3 Minuten;
Doppelte 0,7 s; Sieb 2–5 über alle 7,8 s; ohne Merken insgesamt 177 s, mit Merken 199–220 s. Der Kern ist **keine** Engstelle.

**Engstelle 2 – Texterkennung (nicht behoben, Vorschlag):** In Block 0 kostete eine Seite rund 5 s je Erkennungs-Worker (Seite mit viel Text
bis 5,4 s). Bei 50.000 gemischten Dateien (rund 45 % Scans und Fotos, bis 2 Seiten) sind das grob **40 Stunden mit einem Worker**, wie
die App ihn heute nutzt (Datei für Datei, eine Erkennung). Vorschläge für Klaus (sichtbares Verhalten, daher erst Vorschau):
(a) erst alles ohne Texterkennung einlesen und vorsortieren, Erkennung danach im Hintergrund nach Wichtigkeit; (b) auf starken Geräten
2–4 Erkennungen gleichzeitig (in der Probe mit 4 rund 4-fach schneller); (c) nur die erste Seite, wenn der Kopf schon reicht.

**Engstelle 3 – Speicher (nicht behoben):** 1,2 GB Heap bei 50.000 Dateien, auch ohne Merken – der volle Text jeder Datei bleibt im
Speicher. Für Handys zu viel; mit Arbeitsordner werden heute nur Texte über 20.000 Zeichen ausgelagert. Vorschlag: im Speicher nur Kopf
und die ersten Tausend Zeichen, den Rest im Arbeitsordner (Kernänderung, braucht eigene Probe).

Zahlen: `ergebnisse/training/block1-{vorher,nachher}-{idb,arbeit}.json`, `block1-ohne-merken.json`.

## Block 2 – Runde C, Vorgänge über Jahre (14.11., einmal gemessen, verbraucht)

**Wer was gemacht hat:**

| Rolle | Wer | Umfang |
|---|---|---|
| Stapel-Autor 1 | Claude-Agent (Opus), ohne Repo-Zugang | 150 Stücke, 2 Haushalte (Mehrgenerationen mit Erbfall und Umzug; Patchwork mit Heirat, Namenswechsel, Pflegekind) |
| Stapel-Autor 2 | Claude-Agent (Opus), ohne Repo-Zugang | 150 Stücke, 3 Haushalte (Selbstständiger mit neuer Steuernummer und Tochter im Studium; Alleinerziehende mit Trennung, Bankwechsel, Umzug, Sohn wird volljährig; Rentnerin mit Pflegegrad und betreutem Wohnen) |
| Paket | Claude-Agent (Haiku), nur ein Befehl | Zusammenführen, zwei Hälften zu 150 |
| Einordner E1 | 2 Claude-Agenten (Sonnet), je eine Hälfte | 300 |
| Einordner E2 | 2 Claude-Agenten (Sonnet), je eine Hälfte | 300 |
| Einordner E3 | 2 Claude-Agenten (Opus), je eine Hälfte | 300 |
| Auswertung | diese Sitzung (Skripte, kein Urteil) | Soll, Messung |

9 Agenten, rund 1,78 Mio. Token, 32 Minuten. Stapel `pruefstapel-runde-c/`: 300 Stücke, 5 Haushalte, 2021–2026, 18 Bereiche,
27 Vorgänge, 140 Stücke mit Frist, 80 mit Rollenwechsel.

**Einigkeit** (Fleiss' Kappa, vier Urteile mit Autor): Bereich 0,95 · Schriftstück 0,94 · Absender 0,86 · Person 0,91 · Frist 0,99.
Soll = Mehrheit der drei Einordner; der Autor musste einmal entscheiden (Schriftstück), nichts strittig.

**Als Text** (Hauptergebnis, n = 300, Person n = 241):

| Feld | alt 534cc08 | neu 05c7ef0 | McNemar | falsch und sicher alt → neu |
|---|---|---|---|---|
| Bereich | 81,7 % (77–86) | **85,3 % (81–89)** | p = 0,019 – **gesichert besser** | 19 → 13 |
| Schriftstück | 75,0 % (70–80) | 78,3 % (73–83) | p = 0,087 – nicht gesichert | 26 → 24 |
| Absender | 80,7 % (76–85) | 80,7 % (76–85) | gleich | 45 → 45 |
| Person | 83,4 % (78–88) | 83,4 % (78–88) | gleich | 9 → 9 |
| Frist | 91,3 % (88–94) | 93,0 % (90–95) | p = 0,125 – nicht gesichert | 12 → 6 |

Person bei Rollenwechsel (Kind wird erwachsen, Namenswechsel): 70 von 80 = 87,5 % (78–93 %), alt und neu gleich.
Vorgang (Paare im selben Haushalt, verbunden über gleiche Nummer; nur berichtet): von 807 Paaren eines Vorgangs sind 83 verbunden
(10 %); von 966 verbundenen Paaren gehören 83 zum selben Vorgang (9 %). **Der Kern erkennt Vorgänge über Nummern kaum** – gleiche
Kunden- oder Versichertennummern verbinden eher Routinepost über die Jahre als einen Vorgang wie „Umzug 2023“.

**Gesetzt** (Formen nach Regel 7: Scan 60 %, Foto 25 %, PDF mit Text 15 %; Güte 35/40/25 %), Texterkennung wie die App:
Bereich 79,0 → 80,3 % (p = 0,50), Schriftstück 73,0 → 71,3 % (p = 0,47), **Absender 40,0 %** (alt und neu gleich, 75 falsch und sicher),
Person 69,7 %, Frist 84,3 → 85,7 %. Absender je Form: PDF mit Text 86 %, Scan gut 38 %, Scan schlecht 9 %. Ursache an Stichproben:
Lesereste des Logos vor dem Namen („BB Bühlstrom …“, „ZZ Pflegekasse …“, „Zn Sparkasse …“) und Zeichen dahinter („®“, „&“) – der
Kern nimmt sie als sicheren Absender. Vorgemerkt für Block 5.

Zahlen: `ergebnisse/training/runde-c-{kern,kern-gesetzt,vorgang,einordner}.json`.

## Block 3 – Runde E, Foto, Scan, Texterkennung (14.11., einmal gemessen, verbraucht)

**Wer was gemacht hat:**

| Rolle | Wer | Umfang |
|---|---|---|
| Stapel-Autor | Claude-Agent (Opus), ohne Repo-Zugang | 200 Stücke mit Satz-Hinweisen, 4 Haushalte (Großfamilie mit Großmutter im Pflegegrad, WG mit drei Erwachsenen, selbstständige Friseurin mit Familie, Seniorenpaar); schrieb mit eigenen Hilfsdateien (Python), die Inhalte je Haushalt von Hand |
| Paket | Claude-Agent (Haiku), nur ein Befehl | Satz-Hinweise abtrennen, 15 Paare „zwei Stücke in einem Scan“, zwei Hälften zu 100 |
| Einordner E1, E2 | je 2 Claude-Agenten (Sonnet) | je 200 (reiner Text ohne Satz-Hinweise) |
| Einordner E3 | 2 Claude-Agenten (Opus) | 200 |
| Satz und Lesen | diese Sitzung (`setzen-komplex.py`, Texterkennung wie die App) | Scan 55 %, Foto 30 %, Bildschirm 5 %, PDF mit Text 10 %; Güte 30/40/30 % |

8 Agenten, rund 1,31 Mio. Token, 21 Minuten. Einigkeit (Kappa, mit Autor): Bereich 0,95 · Schriftstück 0,95 · Absender 0,98 ·
Person 0,89 · Frist 0,99; Autor entschied einmal, nichts strittig.

**Gesetzt (Hauptergebnis)** – 185 Dateien (15 Stücke stecken als zweites in einem fremden Scan und zählen nicht einzeln):

| Feld | alt 534cc08 | neu 05c7ef0 | McNemar | falsch und sicher alt → neu |
|---|---|---|---|---|
| Bereich | 77,3 % (71–83) | 79,5 % (73–85) | p = 0,29 – nicht gesichert | 21 → 16 |
| Schriftstück | 80,5 % (74–86) | 78,4 % (72–84) | p = 0,29 – nicht gesichert (schlechter) | 16 → 16 |
| Absender | 44,3 % (37–52) | 44,3 % (37–52) | gleich | 32 → 32 |
| Person | 79,7 % (72–86) | 79,7 % (72–86) | gleich | 0 → 0 |
| Frist | 90,8 % (86–94) | 91,9 % (87–95) | p = 0,50 | 3 → 1 |

**Derselbe Stapel als reiner Text** (zeigt, was das Lesen kostet): Bereich 83,0 → **87,0 %** (p = 0,021, gesichert besser),
Schriftstück 82,0 → 83,5 %, Absender 90,0 %, Person 96,2 %, Frist 97,5 → 98,5 %.

**Je Form (neu), Bereich / Absender / Person, und Lesegüte (Anteil gefundener Wörter):** PDF mit Text 95 / 89 / 84 %;
Scan gut 91 / 68 / 82 % (97 % gelesen); Scan mittel 84 / 57 / 86 % (86 %); **Scan schlecht 55 / 5 / 30 % (34 %)**; Foto gut 84 / 37 / 100 %
(91 %); Foto mittel 77 / 36 / 82 % (77 %); Foto schlecht 76 / 41 / 82 % (59 %); Bildschirmfoto 93 / **7** / 86 % (78 %);
**zwei Stücke in einem Scan** (erstes Stück) 53 / 33 / 53 %.

**Lesen oder Einordnen?** Bei gut gelesenen Stücken (≥ 80 % der Wörter gefunden, n = 102): Bereich 84 %, Absender **50 %**, Person 83 %.
Bei schlecht gelesenen (n = 64): Bereich 67 %, Absender 22 %, Person 66 %. Der Absender scheitert also auch bei gutem Lesen – das
liegt am Einordnen (Logo-Reste, Kopfzeilen der Handy-Ansicht wie „Posteingang“ oder die Uhrzeit), nicht an der Texterkennung.
Bereich und Person fallen dagegen erst mit schlechtem Lesen. Vorgemerkt für Block 5: Absender aus gelesenen Seiten säubern,
Kopfzeilen von Bildschirmfotos übergehen, zwei Stücke in einem Scan erkennen (zweiter Briefkopf, „Seite 1 von 1“).

Zahlen: `ergebnisse/training/runde-e-{kern-gesetzt,kern-text,einordner}.json`, Lesegüte je Stück `pruefstapel-runde-e/OCR-GUETE.json`.

## Block 4 – Runden D (anderer Schreiber) und F (andere Zeit) (14.11., einmal gemessen, verbraucht)

**Wer was gemacht hat:**

| Rolle | Wer | Umfang |
|---|---|---|
| Stapel-Autor D | Claude-Agent (**Sonnet**, anderer Auftrag: Vordrucke und Formularschreiben, Portal-Benachrichtigungen) | 150 Stücke, 5 Haushalte; schrieb mit eigenem Generator-Skript; meldete selbst: nur 34 Stücke mit Frist (statt ~40 %), einzelne Texte dünn |
| Stapel-Autor F | Claude-Agent (Opus) | 150 Stücke, 5 Haushalte; 23 vor 2002 (DM), 77 aus 2002–2015, 50 aus 2027–2030 |
| Pakete | Claude-Agent (Haiku), nur zwei Befehle | je ein Paket zu 150 |
| Einordner E1, E2 | je 1 Claude-Agent (Sonnet) je Runde | je 150 |
| Einordner E3 | 1 Claude-Agent (Opus) je Runde | je 150 |

9 Agenten, rund 1,25 Mio. Token, 16 Minuten. Einigkeit (Kappa, mit Autor) D: Bereich 0,94 · Schriftstück 0,88 · Absender 0,96 ·
Person 0,94 · Frist 0,90; F: 0,97 · 0,98 · 0,97 · 0,93 · 0,99. Nichts strittig. Nachtrag: zehn Dateinamen in D enthielten „?“ (Windows-
Checkout scheiterte) und wurden nach dem Einordnen in „_“ umbenannt; die Zuordnung der Urteile geht über den gesäuberten Namen.

**Runde D – Vordrucke, Portal-Mitteilungen (Text, n = 150, Person n = 101):**

| Feld | alt 534cc08 | neu 05c7ef0 | McNemar |
|---|---|---|---|
| Bereich | 77,3 % (70–83) | 81,3 % (74–87) | p = 0,18 – nicht gesichert |
| Schriftstück | 82,0 % (75–87) | **77,3 % (70–83)** | **p = 0,016 – gesichert SCHLECHTER** (7 nur alt richtig, 0 nur neu) |
| Absender | 54,0 % (46–62) | 54,0 % | gleich; 21 falsch und sicher |
| Person | 95,0 % | 95,0 % | gleich |
| Frist | 90,7 % | 90,7 % | gleich |

Hängt der Kern an der Machart? **Ja, beim Absender deutlich** (54 % gegen 88–95 % bei Fließtext-Briefen in A/B/H und F): Formularköpfe
in Großbuchstaben mit angehängtem Thema („HAUPTZOLLAMT BEISPIELSTADT KRAFTFAHRZEUGSTEUER“), Kopfzeilen wie „VORGANGS-NR. …“ oder
„NEUE NACHRICHT“ vor dem eigentlichen Absender, Absender nur in der zweiten Zeile („Kundenportal …“). Beim Schriftstück hat der neue Kern
an Vordrucken verloren (Briefe als „Kontoauszug“, „Bescheinigung“, „Mahnung“ gelesen) – das Wortmodell von 0.3.x ist an Fließtext gelernt.

**Runde F – andere Jahre (Text, n = 150, Person n = 112):** Bereich 76,0 → 77,3 % (p = 0,82), Schriftstück 82,0 → 82,7 %, Absender 88,0 %,
Person 96,4 %, Frist 98,0 → 97,3 % – **kein Unterschied** alt/neu. Veralten die Regeln? Absender, Person, Frist halten; der **Bereich liegt mit
77 % rund 8 Punkte unter C und E** (Text) – alte Namen (Arbeitsamt, LVA, GEZ, Erziehungsgeld) und erfundene künftige Namen treffen das
Wortmodell schlechter.

**Gesetzt** (Scan 60 %, Foto 25 %, PDF mit Text 15 %, Texterkennung wie die App; Nebenergebnis): D – Bereich 65,3 → 70,0 % (p = 0,14),
Schriftstück 74,0 → 68,7 % (**p = 0,008, gesichert schlechter**), Absender 28,7 %, Person 83,2 %, Frist 86,0 %; F – Bereich 75,3 → 73,3 %
(p = 0,65), Schriftstück 75,3 → 76,7 %, Absender 56,0 %, Person 80,4 %, Frist 90,0 %. Schlechte Scans je Runde: Bereich 29 % (D) und 53 % (F).

Zahlen: `ergebnisse/training/runde-{d,f}-{kern,kern-gesetzt,einordner}.json`.

## Block 5 – Lernen und ungesehener Rest (14.11., einmal gemessen, verbraucht)

**Gelernt** nur an verbrauchten Stapeln (C, D, E, F, A, B, H, Briefe-2) und Generator-Daten, erst nach allen Messungen:

1. **Wortmodell neu abgestimmt** mit den vier neuen Stapeln (`scripts/briefmodell-abstimmen.mjs`, liest jetzt auch `SOLL.json`). Reihum
   ausgelassen (je eine Runde nicht mitgelernt, an ihr gemessen): Bereich und Schriftstück je Runde ±1 Stück, nichts gesichert →
   **nicht übernommen**.
2. **Absender säubern** (`lib/erkennen.ts`): Kopfzeilen von Bildschirmfotos und Portalen übergehen (Uhrzeit, „Posteingang“, „Neue
   Nachricht“, „Vorgangs-Nr.“), „Von:“ in Mail-Ansichten, Logo-Kürzel vor dem Namen („BB Bühlstrom …“, „Zn …“, „NB Nordstrom Beispiel“;
   echte Kürzel wie „SV Talheim“ bleiben), Lesereste dahinter („®“, „Ins]“, lose Buchstaben – Rechtsformen und „e. V.“ bleiben), Kopfthema
   in Formularköpfen („… KRAFTFAHRZEUGSTEUER“, „… Terminerinnerung“, „… App“), „Kundenportal“ davor.
3. **Fehler behoben:** „Zwischensumme“ ist kein Betrag (Generator: Bon-Betrag 73 → 86 %, falsch und sicher 55 → 22); ein PDF ohne lesbaren
   Text heißt nicht mehr „eigenes Foto“ (sicher), sondern „unbekannt“ (offen).
4. „Brief statt unklar“ bei Mitteilungen ohne Anrede: am Rest nicht gesichert (2 Stücke) → **wieder herausgenommen** (Regel 7).

Kontrolle an den verbrauchten Stapeln (kein Nachweis): nirgends schlechter; D Absender 54 → 68 %, gesetzt C/E Absender 40 → 44 % / 44 → 54 %.
Eingefroren `156bd4c` (mit Punkt 4), Endstand ohne Punkt 4.

**Nachweis am ungesehenen Stapel `pruefstapel-rest/`** (vergeben nach dem Einfrieren):

| Rolle | Wer | Umfang |
|---|---|---|
| Stapel-Autor | Claude-Agent (Opus), ohne Repo-Zugang | 200 Stücke, 4 Haushalte: Landfamilie mit vier Kindern (Älteste studiert, eigene Verträge), Witwer mit Post aus 2001–2012 und 2024–2026, Paar mit fast nur Portal-Mitteilungen und Vordrucken, selbstständige Alleinerziehende mit vielen Bons. Formen: 45 Briefe, 43 Vordrucke/Portal, 31 Vorgänge, 31 alte Jahre, 15 Rechnungen, 18 Bons (5 lang, 5 App), 7 Mails, Rest |
| Paket | Claude-Agent (Haiku), nur ein Befehl | Satz-Hinweise abtrennen, 15 Paare „zwei in einem Scan“, zwei Hälften |
| Einordner E1, E2 | je 2 Claude-Agenten (Sonnet) | je 200 |
| Einordner E3 | 2 Claude-Agenten (Opus) | 200 |

8 Agenten, rund 1,14 Mio. Token, 22 Minuten. Einigkeit (Kappa): Bereich 0,93 · Schriftstück 0,95 · Absender 0,81 · Person 0,89 · Frist 0,97;
nichts strittig, Autor musste nie entscheiden. (Ein erster Start mit dem Skript von Runde E wurde nach Sekunden abgebrochen, weil er
in den falschen Ordner geschrieben hätte; es entstand nichts.)

| Feld | 05c7ef0 (eingefroren) | neu (156bd4c / Endstand) | McNemar |
|---|---|---|---|
| **Absender, gesetzt** (n = 185) | 34,1 % (28–41) | **42,7 % (36–50)** | **p = 0,0004 – gesichert besser** (18 nur neu, 2 nur alt); falsch und sicher 36 → 21 |
| Bereich, gesetzt | 75,1 % | 75,1 % | gleich |
| Schriftstück, gesetzt | 65,4 % | 66,5 % (Endstand 65,4 %) | p = 0,50 |
| Person, gesetzt | 64,9 % | 64,9 % | gleich |
| Frist, gesetzt | 83,8 % | 83,8 % | gleich |
| Absender, Text (n = 200) | 81,0 % | 80,5 % | p = 1,0 (3 nur alt, 2 nur neu) |
| Bereich / Schriftstück / Person / Frist, Text | 85,5 / 78,5 / 87,1 / 93,5 % | 85,5 / 79,5 (Endstand 78,5) / 87,1 / 93,5 % | nicht verschieden |

**Übernommen:** Punkte 2 und 3 (Endstand). Gesichert besser ist **nur der Absender aus gelesenen Seiten**; am reinen Text ändert sich
nichts. Grenzen: Absender aus Scans und Fotos bleibt schwach (43 %, schlechte Scans 12 %), zwei Stücke in einem Scan 27 % Bereich, schlechte
Scans Bereich 48 %. Zahlen: `ergebnisse/training/rest-{kern-text,kern-gesetzt,kern-gesetzt-endstand,einordner}.json`.
