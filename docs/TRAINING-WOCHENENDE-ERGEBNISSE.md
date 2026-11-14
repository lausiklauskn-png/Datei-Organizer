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
