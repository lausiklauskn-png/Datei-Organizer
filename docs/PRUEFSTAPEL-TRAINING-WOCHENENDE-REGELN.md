# Trainings-Wochenende 14.–16.11.2026 – Regeln für die Runden C, E, D, F und den Rest, vorab festgelegt

Eingecheckt am 14.11.2026, **bevor** einer der Stapel existiert. Es gelten `docs/PRUEFREGELN-GRUPPE.md` (Regeln 1–10) und
`docs/FACHREGEL.md`. Auftrag: `docs/BRIEF_SITZUNG_2026-11-14_TRAINING-WOCHENENDE.md` (Klaus 14.11.: ohne Codex, Dokumente komplexer,
mehr Personen; Freibrief zum Mergen eigener geprüfter PRs; nichts veröffentlichen; nicht in Familienakte/BookLedgerPro nachziehen).

## Für alle Runden

1. **Kerne.** Alt = Kern `534cc08` (Datei-Organizer 0.2.0; darin ist der in den Runden A/B/H nachgewiesene Stand `7ac9d4f` aufgegangen,
   die alte Kennung liegt nach dem Zusammenführen nicht mehr im Verlauf). Neu = der Kern **nach Block 1** (Tempo), eingefroren mit
   Commit-Kennung im Abschnitt „Eingefroren“ unten, bevor der erste Stapel-Auftrag vergeben wird. Bis Block 5 ändert sich am Kern nichts.
2. **Stapel-Autoren** sind Claude-Agenten ohne Zugang zum Repo, zum Kern, zu Lehrdaten und früheren Stapeln. Sie bekommen nur die
   18 Fächer, die Liste der Arten, die Fachregel und ihren Auftrag. Alles ist erfunden (Namen, Anschriften, Nummern; IBAN nur mit Nullen,
   Kennzeichen „BSP-…“, Firmen mit „Beispiel“ im Namen oder sichtbar erfunden). Der Stapel wird ungelesen eingecheckt.
3. **Drei unabhängige Einordner** (Claude-Agenten, ohne Codex; Klaus 14.11.) bekommen nur die Texte, Listen, Haushalte und Fachregel
   (`scripts/einordner-paket.mjs`) – nicht das Soll des Autors, nicht den Kern, nicht die anderen Einordner. Sie arbeiten mit
   verschiedenen Modellen (zwei Sonnet, ein Opus), damit nicht dreimal dasselbe Urteil kommt. Bei mehr als 150 Stücken teilt sich
   ein Einordner-Platz in zwei Agenten für je eine Hälfte (beide mit demselben Auftrag und Modell).
4. **Soll = Mehrheit der drei Einordner** je Feld; bei drei verschiedenen Urteilen entscheidet der Stapel-Autor, wenn er einem der drei
   folgt, sonst „strittig“ und nicht gewertet. Berichtet werden Übereinstimmung je Paar, Fleiss' Kappa und wie oft der Autor
   entscheiden musste.
5. **Felder:** Bereich (nur das Fach zählt; daneben Fach oder Zweitfach), Schriftstück, Absender (ohne Rechtsform, Groß/klein,
   Satzzeichen), Person (nur wo das Soll eine nennt), Frist (Datum oder leer).
6. **Einmal messen**, alt gegen neu am selben Stapel, je Feld mit 95-%-Spanne (Wilson) und McNemar (5 %), dazu „falsch und als sicher
   ausgegeben“. Danach ist der Stapel verbraucht. Verschlechterungen werden berichtet.
7. **Form:** Jeder Stapel wird zusätzlich mit `scripts/setzen-komplex.py` gesetzt (Briefkopf mit Logo, Spalten, Tabellen, fett/dünn,
   Fußzeilen, Stempel, Unterschrift; PDF mit Textebene, PDF nur aus Seitenbildern, Handyfoto; Güte gut/mittel/schlecht) und
   **ein zweites Mal** gemessen, mit der Texterkennung wie in der App (`scripts/leser-node.mjs`). Text-Messung und Form-Messung werden
   getrennt berichtet; Hauptergebnis ist je Runde das, was die Runde prüft (C, D, F: Text; E: gesetzt). Je Stück wird die Lesegüte
   (Wortfehler gegen den Ausgangstext) mitgeschrieben, damit klar ist, ob ein Fehler am Lesen oder am Einordnen liegt.
8. **Grenze:** erfundene Unterlagen von Claude-Agenten; die Zahlen gelten für diese Machart. Echte Unterlagen erst über Runde G (Maske).

## Runde C – Vorgänge über Jahre (`pruefstapel-runde-c/`, 300 Stücke)

- Zwei Autoren schreiben je 150 Stücke, jeder für eigene Haushalte; zusammen **vier bis sechs Haushalte über die Jahre 2021–2026**,
  größer als bisher (Großeltern, Pflegekind, Patchwork, Mehrgenerationen). Je Haushalt mindestens drei **Vorgänge**, die sich über
  mehrere Schriftstücke und meist über Jahre ziehen: Umzug (Mietvertrag, Kaution, Ummeldung, Stromwechsel, Nachsendeauftrag), Kind wird
  erwachsen (Kindergeld endet, Ausbildung oder Studium, eigene Krankenversicherung, eigene Steuer-ID, eigener Handyvertrag, Auszug),
  Heirat oder Trennung (Namenswechsel, Steuerklasse), Krankheit und Pflege, Erbfall, Kassen- oder Bankwechsel, neue Steuernummer
  nach Selbstständigkeit.
- Je Stück zusätzlich zum Soll: `vorgang` (Kurzname des Vorgangs, z. B. „Umzug 2023“, oder leer) und `datum`.
- **Fragen:** (a) Felder wie oben, alt gegen neu. (b) **Person bei Rollenwechsel:** Treffer der Person an Stücken, deren Person zum
  Zeitpunkt des Schreibens erwachsen geworden ist oder den Namen gewechselt hat (getrennt ausgewiesen). (c) **Vorgang:** Erkennt der
  Kern, was zusammengehört? Gemessen als Paare innerhalb desselben Haushalts: zwei Stücke gelten beim Kern als verbunden, wenn sie
  eine gleiche Nummer (Aktenzeichen, Kunden-, Vertrags-, Versicherten-, Steuernummer) tragen. Berichtet werden Anteil der erkannten
  Paare eines Vorgangs (Trefferquote) und Anteil der verbundenen Paare, die wirklich zu einem Vorgang gehören (Genauigkeit) – nur
  berichtet, nicht gewertet, weil der Kern keinen eigenen Vorgang ausgibt.

## Runde E – Foto, Scan, Texterkennung (`pruefstapel-runde-e/`, 200 Stücke)

- Ein Autor schreibt 200 Stücke für vier neue Haushalte, so wie sie auf Papier ankommen: mehrseitige Briefe (Anlage, Seite 2 mit
  Rechtsbehelf), Rechnungen mit Postentabellen, Kontoauszüge, Gehaltsabrechnungen, **lange Kassenbons** vom Großeinkauf, **digitale
  Kassenbons aus Supermarkt-Apps**, Mails mit Anlage, Bescheide mit Spalten. Dazu je Stück ein Hinweis zum Satz (`@spalten`, Tabellen
  mit `|`), damit der Satz der Vorlage folgt.
- **Zwei Stücke in einem Scan:** 15 Paare werden nach dem Schreiben zu einem PDF zusammengesetzt (Soll = das erste Stück; das zweite
  wird als „zweites Stück im selben Scan“ gezählt, gemessen: wie oft der Kern das erste richtig einordnet).
- Gesetzt nach Regel 7 mit fester Verteilung **pdf-scan 55 %, foto 30 %, bildschirm 5 %, pdf-text 10 %; Güte gut 30 %, mittel 40 %,
  schlecht 30 %**. Hauptergebnis: gesetzt, alt gegen neu; daneben derselbe Stapel als reiner Text (zeigt, was das Lesen kostet).
- Je Güte getrennt: Treffer je Feld und Wortfehler der Texterkennung.

## Runde D – anderer Schreiber (`pruefstapel-runde-d/`, 150 Stücke)

- Anderer Aufbau des Autors: ein Agent mit anderem Modell (Sonnet statt Opus) und anderem Auftrag – er schreibt nicht „Briefe eines
  Jahres“, sondern füllt **Vordrucke und Formularschreiben** aus, wie Verwaltungs- und Firmensoftware sie erzeugt (Felder mit
  Doppelpunkt, Kästchen, Textbausteine, Kürzel, Großbuchstaben-Köpfe, Referenzzeilen statt Fließtext), dazu kurze Mails und
  Benachrichtigungen aus Kundenportalen. Fünf neue Haushalte.
- Frage: Hängt der Kern an der Machart des Schreibers? Vergleich mit den Zahlen der Runden A/B/H (Text, Fließtext-Briefe).

## Runde F – andere Zeit (`pruefstapel-runde-f/`, 150 Stücke)

- Ein Autor schreibt Stücke aus **1998–2015 und 2027–2030**: DM-Beträge (vor 2002), alte Behörden- und Leistungsnamen (Arbeitsamt,
  Arbeitslosengeld II/„Hartz IV“, GEZ-Gebühr, Erziehungsgeld, Landesversicherungsanstalt, Bundesversicherungsanstalt für Angestellte,
  Zivildienst, Wehrbereichsverwaltung, Kfz-Steuer beim Finanzamt, Lohnsteuerkarte), alte Vordrucke und Schreibweisen (alte
  Rechtschreibung wie „daß“), sowie erfundene künftige Namen (z. B. neue Gebühren, umbenannte Kassen) für 2027–2030. Fünf Haushalte.
- Frage: Veralten die Regeln? Felder wie oben; Frist nur, wo das Soll eine nennt.

## Block 5 – Lernen und der ungesehene Rest (`pruefstapel-rest/`, 200 Stücke)

- Gelernt (neues Wortmodell über `scripts/briefmodell-abstimmen.mjs`, Regeln schärfen) wird **erst nach** den Messungen der Runden C,
  E, D, F, nur an verbrauchten Stapeln und Generator-Daten.
- Nachweis an einem **neuen, ungesehenen** Stapel `pruefstapel-rest/` (200 Stücke, ein Autor, Mischung aus den Bedingungen C, E, D, F,
  neue Haushalte), vergeben erst, nachdem der Kern nach dem Lernen eingefroren ist. Drei Einordner wie oben. Gemessen: Kern nach
  Block 1 (eingefroren) gegen Kern nach Block 5, als Text und gesetzt. Übernommen wird nur, was gesichert besser ist; was schlechter
  oder gleich ist, wird zurückgenommen und so berichtet.

## Eingefroren

- Alt: `534cc08`.
- Neu (nach Block 1): _wird vor dem ersten Stapel-Auftrag eingetragen._
